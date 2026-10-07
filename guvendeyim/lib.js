// Güvendeyim — ortak yardımcılar (API, marka, biçimlendirme)
const GV = (() => {
  const SB_URL = 'https://pmjcjfbimzndcxhcziit.supabase.co';
  const SB_KEY = 'sb_publishable_y4Jb6uL3gczF8LFGLN2XDw_VotlPXUr';

  const ERRORS = {
    unauthorized: 'Şifre hatalı.',
    org_not_found: 'Kurum bulunamadı. Linki kontrol edin.',
    invalid_floor: 'Geçersiz kat seçimi.',
    invalid_name: 'Lütfen ad ve soyadınızı yazın.',
    person_not_found: 'Kaydınız bulunamadı. Lütfen yeniden kaydolun.',
    no_active_drill: 'Tatbikat henüz başlamadı.',
    location_required: 'Konum izni gerekli. Lütfen konuma izin verip tekrar deneyin.',
    out_of_zone: 'Toplanma alanının dışındasınız gibi görünüyor.',
    weak_password: 'Şifre en az 6 karakter olmalı.',
    already_setup: 'Panel şifresi daha önce belirlenmiş.',
  };

  async function rpc(fn, args = {}) {
    let res;
    try {
      res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
    } catch {
      throw Object.assign(new Error('Bağlantı kurulamadı. İnternetinizi kontrol edin.'), { code: 'network' });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const raw = (data && data.message) || 'error';
      const code = raw.split(':')[0];
      throw Object.assign(new Error(ERRORS[code] || raw), { code, raw });
    }
    return data;
  }

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('gv_' + k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('gv_' + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem('gv_' + k); } catch {} },
  };

  function slug() {
    const q = new URLSearchParams(location.search).get('o');
    if (q) { store.set('slug', q); return q; }
    return store.get('slug') || 'sompo';
  }

  function applyBrand(org) {
    if (!org) return;
    const r = document.documentElement.style;
    r.setProperty('--brand', org.color_primary);
    r.setProperty('--brand-dark', org.color_dark);
    document.querySelectorAll('[data-logo]').forEach(el => {
      el.innerHTML = '';
      if (org.logo) {
        const img = new Image(); img.src = org.logo; img.alt = org.name; el.appendChild(img);
      } else {
        const s = document.createElement('span'); s.className = 'wordmark'; s.textContent = org.name; el.appendChild(s);
      }
    });
    document.querySelectorAll('[data-org-name]').forEach(el => el.textContent = org.name);
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = org.color_primary;
  }

  function floorLabel(f) {
    if (/^-?\d+$/.test(f)) return Number(f) < 0 ? `${f}. Bodrum` : `${f}. Kat`;
    return f;
  }

  const time = d => d ? new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
  const dateTime = d => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  function duration(from, to) {
    const s = Math.max(0, Math.round((new Date(to) - new Date(from)) / 1000));
    const m = Math.floor(s / 60), r = s % 60;
    return m ? `${m} dk ${String(r).padStart(2, '0')} sn` : `${r} sn`;
  }

  function locate(timeout = 9000) {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout, maximumAge: 15000 });
    });
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg, kind = '') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show ' + kind;
    clearTimeout(t._h); t._h = setTimeout(() => t.className = '', 3200);
  }

  // PWA: service worker + kurulum istemi
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; document.dispatchEvent(new Event('gv-installable')); });
  if ('serviceWorker' in navigator) {
    const base = location.pathname.includes('/panel') ? '../' : './';
    navigator.serviceWorker.register(base + 'sw.js').catch(() => {});
  }
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => !/android/i.test(navigator.userAgent) && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  async function install() {
    if (!installEvt) return false;
    installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null;
    return r.outcome === 'accepted';
  }
  const canInstall = () => !!installEvt;

  return { rpc, store, slug, applyBrand, floorLabel, time, dateTime, duration, locate, esc, toast, install, canInstall, isStandalone, isIOS };
})();
