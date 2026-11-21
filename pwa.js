/* COMSA PWA helper: registers the service worker and shows an "Install App" button. */
(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
  if (standalone) return;
  var isAdmin = /\/admin(\.html)?$/.test(location.pathname);
  var KEY = 'comsa-pwa-dismissed', deferred = null, bar = null;
  function dismissed() { try { var t = +localStorage.getItem(KEY); return t && Date.now() - t < 7 * 864e5; } catch (e) { return false; } }
  function build(text, onClick) {
    if (bar || dismissed()) return;
    bar = document.createElement('div');
    bar.id = 'pwa-install';
    bar.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:9000;display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,#F4B400,#C99300);color:#0B1F3B;border-radius:50px;box-shadow:0 8px 24px rgba(0,0,0,.4);font:700 .82rem system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = '⬇️ ' + text;
    b.style.cssText = 'border:0;background:transparent;color:inherit;font:inherit;padding:11px 8px 11px 16px;cursor:pointer';
    b.onclick = onClick;
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '✕';
    x.style.cssText = 'border:0;background:transparent;color:inherit;font:inherit;padding:11px 14px 11px 4px;cursor:pointer;opacity:.7';
    x.onclick = function () { try { localStorage.setItem(KEY, Date.now()); } catch (e) {} hide(); };
    bar.appendChild(b); bar.appendChild(x);
    document.body.appendChild(bar);
  }
  function hide() { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    var go = function () { build(isAdmin ? 'Install Admin App' : 'Install App', function () {
      if (!deferred) return; deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; hide(); });
    }); };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  });
  window.addEventListener('appinstalled', hide);
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (ios) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        build(isAdmin ? 'Install Admin App' : 'Install App', function () {
          alert('To install: tap the Share button in Safari, then choose "Add to Home Screen".');
        });
      }, 3500);
    });
  }
})();
