/* ============================ boot & routing ============================ */
function parseHash() {
  const h = location.hash || '#/home';
  const [path, q] = h.slice(2).split('?');
  const params = {};
  (q || '').split('&').forEach(kv => { if (!kv) return; const [k, v] = kv.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  return { screen: path || 'home', params };
}
function route() {
  const { screen, params } = parseHash();
  closeModal();
  if (GAME.on && screen !== 'play') { GAME.on = false; clearInterval(GAME.timer); }
  document.body.classList.toggle('game', screen === 'play');
  renderHeader();
  const main = document.getElementById('main');
  if (screen === 'play') { playLevel(params.daily ? 'daily' : +params.l || nextLevelId()); return; }
  let html = '';
  if (screen === 'map') html = renderMap();
  else if (screen === 'daily') html = renderDaily(params);
  else if (screen === 'shop') html = renderShop();
  else if (screen === 'me') html = renderMe();
  else if (screen === 'privacy') html = renderPrivacy();
  else html = renderHome();
  main.innerHTML = html;
  renderNav(screen === 'privacy' ? 'me' : screen);
  window.scrollTo(0, 0);
  if (GAME.pendingHearts) { const f = GAME.pendingHearts; GAME.pendingHearts = null; heartsModal(f); }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = window.ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); SFX.tap(); fn(el, e); }
});
window.ACTIONS.closeModal = closeModal;
/* No pinch zoom or double-tap zoom while playing. */
document.addEventListener('gesturestart', e => e.preventDefault());
let lastTouch = 0;
document.addEventListener('touchend', e => { const now = Date.now(); if (now - lastTouch < 300) e.preventDefault(); lastTouch = now; }, { passive: false });

(function boot() {
  load(); applyTheme(); document.documentElement.lang = S.lang; Monet.init();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  window.addEventListener('hashchange', route);
  setInterval(() => { if (!GAME.on) renderHeader(); }, 30000);
  route();
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
