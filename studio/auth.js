/* Owner membership is checked by the server, never by browser claims or email. */
(() => {
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  let client, mode = local ? 'local' : 'cloud', authorized = false, revision = 0, busy = false;
  const recoveryKey = 'ofyaa-studio-recovery-pending';
  // Capture the recovery marker before Supabase consumes/removes the URL fragment.
  let recoveryMode = new URLSearchParams((location.hash || '').replace(/^#/, '')).get('type') === 'recovery';
  try { recoveryMode ||= window.sessionStorage?.getItem(recoveryKey) === '1'; } catch { /* Storage can be unavailable. */ }
  let recoveryVerified = false, completingRecovery = false, authBlocked = false;
  function setRecovery(value) {
    recoveryMode = value;
    recoveryVerified = false;
    try {
      if (value) window.sessionStorage?.setItem(recoveryKey, '1');
      else window.sessionStorage?.removeItem(recoveryKey);
    } catch { /* Keep this page closed even when persistence is unavailable. */ }
  }
  if (recoveryMode) setRecovery(true);
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const el = id => document.getElementById(id);
  const message = text => { if (el('auth-message')) el('auth-message').textContent = text; };
  function clearPasswords() {
    for (const id of ['auth-password', 'auth-new-password', 'auth-confirm-password']) if (el(id)) el(id).value = '';
  }
  function renderForms() {
    if (el('auth-form')) el('auth-form').hidden = recoveryMode;
    if (el('auth-recovery-form')) el('auth-recovery-form').hidden = !recoveryMode || !recoveryVerified;
  }
  function close(messageText = '') {
    revision++;
    authorized = false;
    if (el('studio-shell')) el('studio-shell').hidden = true;
    if (el('auth-screen')) el('auth-screen').hidden = false;
    clearPasswords();
    renderForms();
    message(messageText);
    window.dispatchEvent(new Event('studio-signed-out'));
  }
  function open() {
    if (!local && (recoveryMode || authBlocked || completingRecovery)) return;
    authorized = true;
    el('studio-shell').hidden = false;
    el('auth-screen').hidden = true;
    message('');
    resolveReady({ mode });
    window.dispatchEvent(new Event('studio-authenticated'));
  }
  function setBusy(value, magic = false) {
    busy = value;
    if (el('auth-recovery-cancel')) el('auth-recovery-cancel').disabled = value && completingRecovery;
    for (const id of ['auth-password-login', 'auth-magic-login', 'auth-reset-login', 'auth-update-password']) {
      if (el(id)) el(id).disabled = value || !client;
    }
    el('auth-recovery-form')?.setAttribute('aria-busy', String(value));
    if (el('auth-update-password')) el('auth-update-password').textContent = value && completingRecovery ? 'Şifre güncelleniyor…' : 'Şifreyi güncelle';
    if (el('auth-reset-login')) el('auth-reset-login').textContent = 'Şifremi unuttum';
    el('auth-form')?.setAttribute('aria-busy', String(value));
    // auth-submit may be a label span within the password button.
    const submitLabel = el('auth-submit') || el('auth-password-login');
    if (submitLabel) submitLabel.textContent = value && !magic ? 'Giriş yapılıyor…' : 'Giriş yap';
    if (el('auth-magic-login')) el('auth-magic-login').textContent = value && magic ? 'Bağlantı gönderiliyor…' : 'E-posta ile giriş bağlantısı';
  }
  async function clearSession() {
    if (!client) return;
    try { await client.auth.signOut({ scope: 'local' }); } catch { /* Stay closed even if the identity service is unavailable. */ }
  }
  async function deny(status) {
    const text = status === 403 ? 'Bu hesap stüdyoya erişmek için yetkili değil.' : 'Oturumunuz sona erdi. Yeniden giriş yapın.';
    authBlocked = true;
    setRecovery(false);
    close(text);
    await clearSession();
    // SIGNED_OUT can clear the message while signOut is in progress.
    if (!authorized) message(text);
  }
  async function sessionToken() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session?.access_token || null;
  }
  async function verify() {
    if (authBlocked || completingRecovery) return false;
    if (recoveryMode) { recoveryVerified = false; renderForms(); }
    const attempt = ++revision;
    try {
      const token = await sessionToken();
      if (attempt !== revision) return false;
      if (!token) {
        if (recoveryMode) await deny(401);
        else close('Devam etmek için giriş yapın.');
        return false;
      }
      const response = await nativeFetch('/api/studio', {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error'
      });
      if (attempt !== revision) return false;
      // This is an authorization probe only. Never retain its private response JSON.
      if (response.status === 200) {
        if (recoveryMode) {
          recoveryVerified = true;
          renderForms();
          message('Yeni şifrenizi iki alana da girin. En az 12 karakter kullanın.');
        } else open();
        return true;
      }
      if (response.status === 401 || response.status === 403) await deny(response.status);
      else close('Stüdyoya bağlanılamadı. Lütfen yeniden deneyin.');
    } catch {
      if (attempt === revision) close('Stüdyoya bağlanılamadı. İnternet bağlantınızı kontrol edip yeniden giriş yapın.');
    }
    return false;
  }
  async function authFetch(url, options = {}) {
    if (local) return nativeFetch(url, options);
    const target = new URL(url instanceof Request ? url.url : url, location.href);
    // Never attach an access token to another host, even if this wrapper is misused.
    if (target.origin !== location.origin) throw new Error('Stüdyo istekleri aynı kaynağa yapılmalıdır.');
    if (!target.pathname.startsWith('/api/')) return nativeFetch(url, options);
    if (!client || !authorized) return new Response('', { status: 401 });
    const attempt = revision;
    let token;
    try { token = await sessionToken(); } catch { await deny(401); return new Response('', { status: 401 }); }
    if (attempt !== revision || !authorized) return new Response('', { status: 401 });
    if (!token) { await deny(401); return new Response('', { status: 401 }); }
    const headers = new Headers(options.headers || (url instanceof Request ? url.headers : undefined));
    headers.set('Authorization', `Bearer ${token}`);
    const response = await nativeFetch(url, { ...options, headers, cache: 'no-store', redirect: 'error' });
    if (attempt !== revision || !authorized) return new Response('', { status: 401 });
    if (response.status === 401 || response.status === 403) await deny(response.status);
    return response;
  }
  async function signOut() {
    if (local) return;
    authBlocked = true;
    completingRecovery = false;
    setRecovery(false);
    close('Oturum kapatıldı.');
    await clearSession();
    if (!authorized) message('Oturum kapatıldı.');
  }
  async function passwordLogin(event) {
    event.preventDefault();
    if (busy || !client || recoveryMode) return;
    const email = el('auth-email');
    const password = el('auth-password');
    if (!email.value.trim() || !email.reportValidity()) return;
    if (!password.value) { message('Şifrenizi girin.'); password.focus(); return; }
    authBlocked = false;
    setBusy(true);
    message('Hesabınız doğrulanıyor…');
    try {
      const result = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      password.value = '';
      if (result.error) { close('Giriş yapılamadı. E-posta ve şifrenizi kontrol edin.'); return; }
      await verify();
    } catch { close('Giriş hizmetine bağlanılamadı. Lütfen yeniden deneyin.'); }
    finally { password.value = ''; setBusy(false); }
  }
  async function magicLogin(event) {
    event.preventDefault();
    if (busy || !client || recoveryMode) return;
    const email = el('auth-email');
    if (!email.value.trim() || !email.reportValidity()) return;
    setBusy(true, true);
    if (el('auth-password')) el('auth-password').value = '';
    message('Giriş bağlantısı isteniyor…');
    try {
      const { error } = await client.auth.signInWithOtp({ email: email.value.trim(), options: {
        shouldCreateUser: false, emailRedirectTo: location.origin + '/studio/'
      } });
      message(error ? 'Bağlantı gönderilemedi. Bilgilerinizi kontrol edip yeniden deneyin.' : 'Giriş bağlantısı için e-posta kutunuzu kontrol edin.');
    } catch { message('Giriş hizmetine bağlanılamadı. Lütfen yeniden deneyin.'); }
    finally { setBusy(false); }
  }
  async function resetPassword(event) {
    event.preventDefault();
    if (busy || !client || recoveryMode) return;
    const email = el('auth-email');
    if (!email.value.trim() || !email.reportValidity()) return;
    clearPasswords();
    setBusy(true);
    if (el('auth-reset-login')) el('auth-reset-login').textContent = 'Bağlantı gönderiliyor…';
    const submitLabel = el('auth-submit') || el('auth-password-login');
    if (submitLabel) submitLabel.textContent = 'Giriş yap';
    message('Şifre yenileme bağlantısı isteniyor…');
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + '/studio/' });
      message(error ? 'İstek tamamlanamadı. Biraz sonra yeniden deneyin.' : 'E-posta adresi uygunsa şifre yenileme bağlantısı gönderilecektir. Gelen kutunuzu kontrol edin.');
    } catch { message('Giriş hizmetine bağlanılamadı. Lütfen yeniden deneyin.'); }
    finally { clearPasswords(); setBusy(false); }
  }
  async function finishRecovery(text) {
    authBlocked = true;
    setRecovery(false);
    close(text);
    await clearSession();
    if (!authorized) message(text);
  }
  async function cancelRecovery(event) {
    event.preventDefault();
    if (completingRecovery) return;
    completingRecovery = false;
    await finishRecovery('Şifre yenileme iptal edildi. Yeniden giriş yapabilirsiniz.');
    setBusy(false);
  }
  async function updatePassword(event) {
    event.preventDefault();
    if (busy || !client || !recoveryMode || !recoveryVerified || authBlocked) { clearPasswords(); return; }
    const password = el('auth-new-password').value;
    const confirmation = el('auth-confirm-password').value;
    if (password.length < 12 || password !== confirmation) {
      clearPasswords();
      message(password.length < 12 ? 'En az 12 karakterli bir şifre girin.' : 'Şifreler eşleşmiyor. İki alanı yeniden doldurun.');
      el('auth-new-password').focus();
      return;
    }
    const attempt = revision;
    completingRecovery = true;
    setBusy(true);
    message('Şifreniz güncelleniyor…');
    try {
      const { error } = await client.auth.updateUser({ password });
      if (attempt !== revision || !recoveryMode || authBlocked) return;
      if (error) {
        if (error.status === 401 || error.status === 403) await deny(401);
        else message('Şifre güncellenemedi. Yeni bir şifreyle tekrar deneyin.');
        return;
      }
      await finishRecovery('Şifreniz güncellendi. E-posta adresiniz ve yeni şifrenizle giriş yapın.');
    } catch {
      if (attempt === revision && recoveryMode && !authBlocked) message('Şifre güncellenemedi. Bağlantınızı kontrol edip yeniden deneyin.');
    } finally { clearPasswords(); completingRecovery = false; setBusy(false); }
  }
  function scheduleVerification() {
    const scheduledRevision = revision;
    setTimeout(() => {
      if (scheduledRevision === revision && !authBlocked && !completingRecovery) void verify();
    }, 0);
  }
  window.studioAuth = { ready, fetch: authFetch, signOut, get mode() { return mode; }, get authorized() { return authorized; } };
  async function start() {
    if (local) {
      if (el('auth-signout')) el('auth-signout').hidden = true;
      open();
      return;
    }
    close('Giriş hizmetine bağlanılıyor…');
    setBusy(false);
    el('auth-form')?.addEventListener('submit', passwordLogin);
    el('auth-magic-login')?.addEventListener('click', magicLogin);
    el('auth-reset-login')?.addEventListener('click', resetPassword);
    el('auth-recovery-form')?.addEventListener('submit', updatePassword);
    el('auth-recovery-cancel')?.addEventListener('click', cancelRecovery);
    el('auth-signout')?.addEventListener('click', event => { event.preventDefault(); void signOut(); });
    try {
      const response = await nativeFetch('/api/studio/config', { cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error('Configuration unavailable');
      const config = await response.json();
      if (config.mode !== 'cloud' || typeof config.supabaseUrl !== 'string' || !config.supabaseUrl || typeof config.anonKey !== 'string' || !config.anonKey || !window.supabase?.createClient) throw new Error('Configuration incomplete');
      client = window.supabase.createClient(config.supabaseUrl, config.anonKey, { auth: {
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: true
      } });
      client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          authBlocked = true;
          setRecovery(false);
          close('Devam etmek için giriş yapın.');
          return;
        }
        if (authBlocked || completingRecovery) return;
        if (event === 'PASSWORD_RECOVERY') {
          setRecovery(true);
          close('Kurtarma bağlantısı doğrulanıyor…');
          scheduleVerification();
          return;
        }
        // Supabase holds its auth lock during this callback. Start SDK work after it returns.
        if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          scheduleVerification();
        }
      });
      setBusy(false);
      await verify();
    } catch {
      close('Giriş yapılandırmasına bağlanılamadı. Bağlantınızı kontrol edip sayfayı yenileyin.');
      setBusy(false);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void start(); }, { once: true });
  else void start();
})();
