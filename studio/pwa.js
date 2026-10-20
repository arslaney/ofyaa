'use strict';
(() => {
 const button = document.querySelector('#pwa-install');
 const status = document.querySelector('#pwa-status');
 let installPrompt = null;
 function explain(message) { status.textContent = message; status.hidden = false; }
 window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; button.hidden = false;
 });
 button.addEventListener('click', async () => {
  if (!installPrompt) return;
  button.disabled = true;
  try {
   await installPrompt.prompt();
   const choice = await installPrompt.userChoice;
   if (choice.outcome === 'accepted') button.hidden = true;
   installPrompt = null;
   button.hidden = true;
  } catch {
   explain('Kurulum başlatılamadı. Sayfayı Chrome veya Safari’de açıp tarayıcının uygulama ekleme menüsünü kullanabilirsin.');
  } finally { button.disabled = false; }
 });
 window.addEventListener('appinstalled', () => { installPrompt = null; button.hidden = true; });
 window.addEventListener('offline', () => explain('Cihaz çevrimdışı. Özel veriler önbelleğe alınmaz; sunucuya erişilemezse görev kaydedilemez.'));
 window.addEventListener('online', () => { status.hidden = true; });
 if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
   navigator.serviceWorker.register('/studio/sw.js', {scope:'/studio/'}).catch(() => explain('Çevrimdışı uygulama kabuğu hazırlanamadı. Panel çevrimiçi kullanılabilir; tarayıcıdan yeniden yükleyebilirsin.'));
  });
 }
})();
