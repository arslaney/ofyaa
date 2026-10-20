const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function boot({ hostname = 'studio.example', session = { access_token: 'test-token' }, probeStatus = 200, configStatus = 200, hash = '', updateError = null, resetError = null, storage = new Map() } = {}) {
  const elements = new Map();
  for (const id of ['auth-screen', 'studio-shell', 'auth-form', 'auth-email', 'auth-password', 'auth-password-login', 'auth-magic-login', 'auth-signout', 'auth-message', 'auth-submit', 'auth-reset-login', 'auth-recovery-form', 'auth-new-password', 'auth-confirm-password', 'auth-update-password', 'auth-recovery-cancel']) {
    elements.set(id, { hidden: ['studio-shell', 'auth-recovery-form'].includes(id), value: '', textContent: '', disabled: false, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, setAttribute() {}, checkValidity() { return true; }, reportValidity() { return true; }, focus() {} });
  }
  let currentSession = session, change, signOuts = 0, otp, reset, updatedPassword;
  const calls = [], events = [];
  let status = probeStatus, delay = null;
  const auth = {
    async getSession() { return { data: { session: currentSession }, error: null }; },
    onAuthStateChange(fn) { change = fn; return { data: { subscription: {} } }; },
    async signOut(opts) { assert.equal(opts.scope, 'local'); signOuts++; currentSession = null; change?.('SIGNED_OUT', null); return { error: null }; },
    async signInWithPassword({ email, password }) { assert.equal(email, 'person@example.com'); assert.equal(password, 'manual-password'); currentSession = { access_token: 'new-token' }; return { data: { session: currentSession }, error: null }; },
    async resetPasswordForEmail(email, options) { reset = { email, options }; return { error: resetError }; },
    async updateUser(args) { updatedPassword = args.password; change?.('USER_UPDATED', currentSession); return { data: { user: {} }, error: updateError }; },
    async signInWithOtp(args) { otp = args; return { error: null }; }
  };
  const origin = hostname === '::1' ? 'http://[::1]:3000' : `https://${hostname}`;
  const context = {
    document: { readyState: 'complete', getElementById: id => elements.get(id) },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    location: { hostname, origin, href: origin + '/studio/' + hash, hash },
    URL, URLSearchParams, Headers, Request, Response, Event, setTimeout, clearTimeout,
    fetch: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).includes('/api/studio/config')) return new Response(JSON.stringify({ mode: 'cloud', supabaseUrl: 'https://auth.example', anonKey: 'public-anon' }), { status: configStatus });
      if (delay) await delay;
      return new Response('{}', { status });
    },
    supabase: { createClient(url, key, options) { assert.equal(key, 'public-anon'); assert.equal(options.auth.persistSession, true); assert.equal(options.auth.autoRefreshToken, true); assert.equal(options.auth.detectSessionInUrl, true); return { auth }; } },
    dispatchEvent(e) { events.push(e.type); }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(__dirname + '/auth.js', 'utf8'), context);
  return { api: context.studioAuth, elements, calls, events, auth, get signOuts() { return signOuts; }, get otp() { return otp; }, get reset() { return reset; }, get updatedPassword() { return updatedPassword; }, setStatus(value) { status = value; }, setDelay(value) { delay = value; }, change: (...args) => change(...args) };
}
const settle = () => new Promise(r => setTimeout(r, 25));

test('exact loopback bypasses config and exposes local shell', async () => {
  for (const hostname of ['localhost', '127.0.0.1', '::1', '[::1]']) {
    const h = boot({ hostname });
    assert.equal((await h.api.ready).mode, 'local');
    assert.equal(h.elements.get('studio-shell').hidden, false);
    assert.equal(h.elements.get('auth-signout').hidden, true);
    assert.equal(h.calls.length, 0);
    await h.api.fetch('/api/studio');
    assert.equal(h.calls[0].options.headers, undefined);
  }
});
test('cloud shell waits for backend owner verification; probe body stays unconsumed', async () => {
  const h = boot();
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal((await h.api.ready).mode, 'cloud');
  assert.equal(h.elements.get('studio-shell').hidden, false);
  assert.equal(new Headers(h.calls[1].options.headers).get('Authorization'), 'Bearer test-token');
  assert.ok(h.events.includes('studio-authenticated'));
});
test('lookalike localhost stays cloud; 403 clears SDK session and never exposes shell', async () => {
  const h = boot({ hostname: 'localhost.example', probeStatus: 403 });
  await settle();
  assert.equal(h.signOuts, 1);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.match(h.elements.get('auth-message').textContent, /yetkili/i);
});
test('offline or missing config stays closed', async () => {
  const h = boot({ configStatus: 503 });
  await settle();
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.match(h.elements.get('auth-message').textContent, /bağlan|yapılandır/i);
});
test('cloud requests refresh SDK token and never leak it to another origin', async () => {
  const h = boot();
  await h.api.ready;
  await h.api.fetch('/api/studio/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(new Headers(h.calls.at(-1).options.headers).get('Authorization'), 'Bearer test-token');
  await assert.rejects(h.api.fetch('https://another.example/api/studio'));
});
test('signout immediately closes shell and signals private DOM cleanup', async () => {
  const h = boot(); await h.api.ready;
  await h.api.signOut();
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.ok(h.events.includes('studio-signed-out'));
  assert.equal(h.signOuts, 1);
});
test('magic link cannot create users and redirects to studio origin', async () => {
  const h = boot({ session: null }); await settle();
  h.elements.get('auth-email').value = 'person@example.com';
  await h.elements.get('auth-magic-login').listeners.click({ preventDefault() {} });
  assert.equal(h.otp.options.shouldCreateUser, false);
  assert.equal(h.otp.options.emailRedirectTo, 'https://studio.example/studio/');
  assert.equal(h.elements.get('studio-shell').hidden, true);
});
test('password cleared after submission; subsequent owner login emits ready event', async () => {
  const h = boot({ session: null }); await settle();
  h.elements.get('auth-email').value = 'person@example.com';
  h.elements.get('auth-password').value = 'manual-password';
  await h.elements.get('auth-form').listeners.submit({ preventDefault() {} });
  assert.equal((await h.api.ready).mode, 'cloud');
  assert.equal(h.elements.get('auth-password').value, '');
  assert.equal(h.elements.get('studio-shell').hidden, false);
});

test('401 and 403 API responses close session, while 404 preserves login', async () => {
  for (const status of [401, 403, 404]) {
    const h = boot(); await h.api.ready;
    h.setStatus(status);
    const response = await h.api.fetch('/api/studio/requests');
    assert.equal(response.status, status);
    assert.equal(h.elements.get('studio-shell').hidden, status !== 404);
    assert.equal(h.signOuts, status === 404 ? 0 : 1);
  }
});
test('a late private response is suppressed after signout', async () => {
  const h = boot(); await h.api.ready;
  let release;
  h.setDelay(new Promise(resolve => { release = resolve; }));
  const pending = h.api.fetch('/api/studio/requests');
  await settle();
  await h.api.signOut();
  release();
  assert.equal((await pending).status, 401);
  assert.equal(h.elements.get('studio-shell').hidden, true);
});
test('auth callback returns before SDK work, and late probe cannot reopen after signout', async () => {
  const h = boot(); await h.api.ready;
  let release;
  h.setDelay(new Promise(resolve => { release = resolve; }));
  const priorCalls = h.calls.length;
  h.change('TOKEN_REFRESHED');
  assert.equal(h.calls.length, priorCalls);
  await settle();
  await h.api.signOut();
  release();
  await settle();
  assert.equal(h.api.authorized, false);
  assert.equal(h.elements.get('studio-shell').hidden, true);
});

test('reset request uses studio redirect and a generic non-enumerating message', async () => {
  const h = boot({ session: null }); await settle();
  h.elements.get('auth-email').value = 'person@example.com';
  await h.elements.get('auth-reset-login').listeners.click({ preventDefault() {} });
  assert.equal(h.reset.email, 'person@example.com');
  assert.equal(h.reset.options.redirectTo, 'https://studio.example/studio/');
  assert.match(h.elements.get('auth-message').textContent, /E-posta|e-posta/);
  assert.equal(h.elements.get('studio-shell').hidden, true);
});
test('recovery hash verifies owner but never resolves ready or opens shell', async () => {
  const h = boot({ hash: '#access_token=test&type=recovery' });
  let resolved = false; h.api.ready.then(() => { resolved = true; });
  await settle();
  assert.equal(h.elements.get('auth-recovery-form').hidden, false);
  assert.equal(h.elements.get('auth-form').hidden, true);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(resolved, false);
  h.change('INITIAL_SESSION'); h.change('USER_UPDATED'); h.change('TOKEN_REFRESHED');
  await settle();
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(h.events.includes('studio-authenticated'), false);
});
test('PASSWORD_RECOVERY event transitions to verified password form', async () => {
  const h = boot(); await h.api.ready;
  h.change('PASSWORD_RECOVERY');
  assert.equal(h.elements.get('studio-shell').hidden, true);
  await settle();
  assert.equal(h.elements.get('auth-recovery-form').hidden, false);
});
test('non-owner recovery is denied, cleared and cannot update password', async () => {
  const h = boot({ hash: '#type=recovery', probeStatus: 403 }); await settle();
  assert.equal(h.elements.get('auth-recovery-form').hidden, true);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(h.signOuts, 1);
  h.elements.get('auth-new-password').value = 'New-password-123';
  h.elements.get('auth-confirm-password').value = 'New-password-123';
  await h.elements.get('auth-recovery-form').listeners.submit({ preventDefault() {} });
  assert.equal(h.updatedPassword, undefined);
});
test('recovery backend failure stays closed', async () => {
  const h = boot({ hash: '#type=recovery', probeStatus: 503 }); await settle();
  assert.equal(h.elements.get('auth-recovery-form').hidden, true);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(h.events.includes('studio-authenticated'), false);
});
test('new password changes only on matching valid submit then signs out without opening', async () => {
  const h = boot({ hash: '#type=recovery' }); await settle();
  assert.equal(h.updatedPassword, undefined);
  for (const id of ['auth-new-password', 'auth-confirm-password']) h.elements.get(id).value = 'New-password-123';
  await h.elements.get('auth-recovery-form').listeners.submit({ preventDefault() {} });
  await settle();
  assert.equal(h.updatedPassword, 'New-password-123');
  assert.equal(h.signOuts, 1);
  assert.equal(h.elements.get('auth-new-password').value, '');
  assert.equal(h.elements.get('auth-confirm-password').value, '');
  assert.equal(h.elements.get('auth-form').hidden, false);
  assert.equal(h.elements.get('auth-recovery-form').hidden, true);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.match(h.elements.get('auth-message').textContent, /güncellendi/);
  h.change('TOKEN_REFRESHED'); h.change('USER_UPDATED');
  await settle();
  assert.equal(h.events.includes('studio-authenticated'), false);
});
test('short or mismatched passwords clear fields and never call updateUser', async () => {
  for (const passwords of [['short', 'short'], ['New-password-123', 'New-password-456']]) {
    const h = boot({ hash: '#type=recovery' }); await settle();
    h.elements.get('auth-new-password').value = passwords[0];
    h.elements.get('auth-confirm-password').value = passwords[1];
    await h.elements.get('auth-recovery-form').listeners.submit({ preventDefault() {} });
    assert.equal(h.updatedPassword, undefined);
    assert.equal(h.elements.get('auth-new-password').value, '');
    assert.equal(h.elements.get('auth-confirm-password').value, '');
  }
});
test('update errors clear passwords and keep recovery closed to app', async () => {
  const h = boot({ hash: '#type=recovery', updateError: { message: 'provider-specific-detail' } }); await settle();
  for (const id of ['auth-new-password', 'auth-confirm-password']) h.elements.get(id).value = 'New-password-123';
  await h.elements.get('auth-recovery-form').listeners.submit({ preventDefault() {} });
  await settle();
  assert.equal(h.elements.get('auth-new-password').value, '');
  assert.equal(h.elements.get('auth-confirm-password').value, '');
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(h.events.includes('studio-authenticated'), false);
  assert.doesNotMatch(h.elements.get('auth-message').textContent, /provider-specific-detail/);
});
test('cancel recovery clears forms and suppresses late auth events', async () => {
  const h = boot({ hash: '#type=recovery' }); await settle();
  for (const id of ['auth-new-password', 'auth-confirm-password']) h.elements.get(id).value = 'New-password-123';
  await h.elements.get('auth-recovery-cancel').listeners.click({ preventDefault() {} });
  h.change('PASSWORD_RECOVERY'); h.change('TOKEN_REFRESHED');
  await settle();
  assert.equal(h.elements.get('auth-new-password').value, '');
  assert.equal(h.elements.get('auth-confirm-password').value, '');
  assert.equal(h.elements.get('auth-recovery-form').hidden, true);
  assert.equal(h.elements.get('studio-shell').hidden, true);
  assert.equal(h.signOuts, 1);
});

test('recovery pending boolean survives a reload after the SDK strips the hash', async () => {
  const storage = new Map();
  const first = boot({ hash: '#access_token=test&type=recovery', storage }); await settle();
  assert.deepEqual([...storage], [['ofyaa-studio-recovery-pending', '1']]);
  const reloaded = boot({ storage }); await settle();
  assert.equal(reloaded.elements.get('auth-recovery-form').hidden, false);
  assert.equal(reloaded.elements.get('studio-shell').hidden, true);
  assert.equal(reloaded.events.includes('studio-authenticated'), false);
  await reloaded.elements.get('auth-recovery-cancel').listeners.click({ preventDefault() {} });
  assert.equal(storage.size, 0);
});
test('expired recovery clears the pending marker and session', async () => {
  const storage = new Map([['ofyaa-studio-recovery-pending', '1']]);
  const h = boot({ storage, session: null }); await settle();
  assert.equal(storage.size, 0);
  assert.equal(h.signOuts, 1);
  assert.equal(h.elements.get('auth-form').hidden, false);
  assert.equal(h.elements.get('studio-shell').hidden, true);
});
test('expired update session clears recovery instead of opening the app', async () => {
  const storage = new Map();
  const h = boot({ storage, hash: '#type=recovery', updateError: { status: 401 } }); await settle();
  for (const id of ['auth-new-password', 'auth-confirm-password']) h.elements.get(id).value = 'New-password-123';
  await h.elements.get('auth-recovery-form').listeners.submit({ preventDefault() {} });
  assert.equal(storage.size, 0);
  assert.equal(h.signOuts, 1);
  assert.equal(h.elements.get('auth-form').hidden, false);
  assert.equal(h.events.includes('studio-authenticated'), false);
});
test('reset error does not reveal whether an email is registered', async () => {
  const h = boot({ session: null, resetError: { message: 'No user found' } }); await settle();
  h.elements.get('auth-email').value = 'person@example.com';
  await h.elements.get('auth-reset-login').listeners.click({ preventDefault() {} });
  assert.doesNotMatch(h.elements.get('auth-message').textContent, /No user|found|kayıtlı/);
});

test('an in-flight password update cannot be reported as cancelled', async () => {
 const h=boot({hash:'#type=recovery'});await settle();
 let finish;const gate=new Promise(resolve=>{finish=resolve;});
 h.auth.updateUser=async()=>{await gate;return {data:{user:{}},error:null};};
 h.elements.get('auth-new-password').value='manual-long-password';
 h.elements.get('auth-confirm-password').value='manual-long-password';
 const pending=h.elements.get('auth-recovery-form').listeners.submit({preventDefault(){}});
 assert.equal(h.elements.get('auth-recovery-cancel').disabled,true);
 await h.elements.get('auth-recovery-cancel').listeners.click({preventDefault(){}});
 assert.equal(h.signOuts,0);finish();await pending;
 assert.match(h.elements.get('auth-message').textContent,/güncellendi/);
 assert.equal(h.elements.get('studio-shell').hidden,true);
});
