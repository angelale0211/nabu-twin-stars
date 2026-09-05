/* ============================ core ============================
   Saved state, language, theme, money, hearts, small UI helpers. */

const SAVE_KEY = 'nts-save';
let S = null;

function freshState() {
  return {
    v: 1, lang: (navigator.language || 'en').slice(0, 2) === 'vi' ? 'vi' : 'en', theme: 'auto', sound: true,
    stardust: CONFIG.startStardust, moon: CONFIG.startMoon, hints: CONFIG.startHints,
    hearts: CONFIG.heartsMax, heartsAt: Date.now(),
    levels: {}, chests: {}, tut: {},
    daily: { checkin: { streak: 0, last: '', cycle: 0 }, spins: { date: '', used: 0, extra: 0 }, card: { date: '', id: -1, redrawn: 0 }, challenge: { date: '', done: 0 }, ads: { date: '', hints: 0, refills: 0, spins: 0, redraws: 0, gifts: 0 } },
    blessing: { date: '', key: '', used: 0 },
    adsRemoved: false, starter: false, owned: [],
    stats: { played: 0, found: 0, misses: 0, ads: 0 }, sinceAd: 0, created: Date.now()
  };
}
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); S = raw ? Object.assign(freshState(), JSON.parse(raw)) : freshState(); }
  catch (e) { S = freshState(); }
  if (!S.daily) S.daily = freshState().daily;
  return S;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function resetAll() { const lang = S.lang, theme = S.theme; S = freshState(); S.lang = lang; S.theme = theme; save(); }

/* ---- language ---- */
function L() { return S.lang; }
function t(key, vars) {
  const parts = key.split('.');
  let v = STR[S.lang]; for (const p of parts) v = v ? v[p] : undefined;
  if (v === undefined) { v = STR.en; for (const p of parts) v = v ? v[p] : undefined; }
  if (typeof v !== 'string') return key;
  return vars ? v.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m) : v;
}
function tt(obj) { return obj ? (obj[S.lang] || obj.en || '') : ''; }
function setLang(lang) { S.lang = lang; save(); document.documentElement.lang = lang; }

/* ---- theme ---- */
const THEMES = ['auto', 'light', 'dark', 'pink'];
function applyTheme() {
  let th = S.theme;
  if (th === 'auto') th = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', th);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = th === 'dark' ? '#241A45' : th === 'pink' ? '#FBEEF2' : '#EFE9FA';
}

/* ---- dates & formats ---- */
function todayStr(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); }
function fmtTime(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function fmtMin(ms) { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm'; }
function dailyAds() { if (S.daily.ads.date !== todayStr()) S.daily.ads = { date: todayStr(), hints: 0, refills: 0, spins: 0, redraws: 0, gifts: 0 }; return S.daily.ads; }

/* ---- money ---- */
function addStardust(n) { S.stardust = Math.max(0, Math.round(S.stardust + n)); save(); renderHeader(); }
function addMoon(n) { S.moon = Math.max(0, Math.round(S.moon + n)); save(); renderHeader(); }
function addHints(n) { S.hints = Math.max(0, S.hints + n); save(); }
function spendStardust(n) { if (S.stardust < n) { toast(t('notEnough', { c: t('stardust') })); return false; } addStardust(-n); SFX.coin(); return true; }
function spendMoon(n) { if (S.moon < n) { toast(t('notEnough', { c: t('moon') })); go('#/shop'); return false; } addMoon(-n); SFX.coin(); return true; }

/* ---- hearts: regenerate one every CONFIG.heartRegenMin minutes ---- */
function heartsNow() {
  const per = CONFIG.heartRegenMin * 60000;
  if (S.hearts >= CONFIG.heartsMax) { S.heartsAt = Date.now(); return S.hearts; }
  const gained = Math.floor((Date.now() - S.heartsAt) / per);
  if (gained > 0) { S.hearts = Math.min(CONFIG.heartsMax, S.hearts + gained); S.heartsAt = S.hearts >= CONFIG.heartsMax ? Date.now() : S.heartsAt + gained * per; save(); }
  return S.hearts;
}
function heartCountdown() {
  heartsNow();
  if (S.hearts >= CONFIG.heartsMax) return '';
  return fmtMin(S.heartsAt + CONFIG.heartRegenMin * 60000 - Date.now());
}
function useHeart() { heartsNow(); if (S.hearts <= 0) return false; if (S.hearts === CONFIG.heartsMax) S.heartsAt = Date.now(); S.hearts--; save(); renderHeader(); return true; }
function refillHearts() { S.hearts = CONFIG.heartsMax; S.heartsAt = Date.now(); save(); renderHeader(); }

/* ---- progress ---- */
function levelStars(id) { const r = S.levels[id]; return r ? r.stars : 0; }
function totalStars() { let n = 0; for (const k in S.levels) if (k !== 'daily') n += S.levels[k].stars || 0; return n; }
function chapterOpen(ch) { return totalStars() >= CHAPTERS[ch - 1].need; }
function levelOpen(id) {
  const lvl = LEVELS[id - 1]; if (!lvl) return false;
  if (!chapterOpen(lvl.ch)) return false;
  if (lvl.n === 1) return true;
  return levelStars(id - 1) > 0;
}
function nextLevelId() { for (let i = 1; i <= LEVELS.length; i++) if (!levelStars(i) && levelOpen(i)) return i; return LEVELS.length; }
function chapterStars(ch) { let n = 0; for (let i = 1; i <= 10; i++) n += levelStars((ch - 1) * 10 + i); return n; }
function chapterCleared(ch) { for (let i = 1; i <= 10; i++) if (!levelStars((ch - 1) * 10 + i)) return false; return true; }

/* ---- today's blessing from the daily card ---- */
function blessingKey() { return S.blessing.date === todayStr() ? S.blessing.key : ''; }
function blessingActive(k) { return blessingKey() === k && !S.blessing.used; }

/* ---- UI helpers ---- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
let toastTimer = null;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2200);
}
function modal(html, opts) {
  opts = opts || {};
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'overlay' + (opts.center ? ' center' : '');
  ov.innerHTML = '<div class="sheet' + (opts.cls ? ' ' + opts.cls : '') + '">' + (opts.noClose ? '' : '<button class="x" data-act="closeModal" aria-label="close">✕</button>') + html + '</div>';
  if (!opts.noClose) ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  document.body.appendChild(ov);
  return ov;
}
function closeModal() { document.querySelectorAll('.overlay').forEach(o => o.remove()); }
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

/* ---- icons (inline SVG, drawn in the Nabu style) ---- */
const ICONS = {
  stardust: `<svg viewBox="0 0 24 24"><path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  moon: `<svg viewBox="0 0 24 24"><path d="M14 3 A9.5 9.5 0 1 0 14 21 A7 7 0 1 1 14 3 Z" fill="#B8A4E3" stroke="#3D2A6E" stroke-width="1.4" stroke-linejoin="round"/><circle cx="17" cy="7" r="1.6" fill="#E5BE5E"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path d="M12 21 C2 13 2 4 8 5 C10.5 5.5 12 8 12 8 C12 8 13.5 5.5 16 5 C22 4 22 13 12 21 Z" fill="#F6BBCB" stroke="#3D2A6E" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  heartOff: `<svg viewBox="0 0 24 24"><path d="M12 21 C2 13 2 4 8 5 C10.5 5.5 12 8 12 8 C12 8 13.5 5.5 16 5 C22 4 22 13 12 21 Z" fill="#E9E0F7" stroke="#9C90B6" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  hint: `<svg viewBox="0 0 24 24"><path d="M12 3 A6 6 0 0 0 8 13.5 L9 16 L15 16 L16 13.5 A6 6 0 0 0 12 3 Z" fill="#F6E5B3" stroke="#3D2A6E" stroke-width="1.4" stroke-linejoin="round"/><path d="M9.5 18.5 L14.5 18.5 M10.5 21 L13.5 21" stroke="#3D2A6E" stroke-width="1.4" stroke-linecap="round"/><path d="M12 7 A3 3 0 0 0 9.5 9.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 2.5 L14.8 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.5 L12 17.2 L6.1 20.5 L7.5 13.8 L2.5 9.3 L9.2 8.6 Z" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  starOff: `<svg viewBox="0 0 24 24"><path d="M12 2.5 L14.8 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.5 L12 17.2 L6.1 20.5 L7.5 13.8 L2.5 9.3 L9.2 8.6 Z" fill="#E9E0F7" stroke="#9C90B6" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path d="M6 4 L20 12 L6 20 Z" fill="currentColor"/></svg>`,
  ad: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="13" rx="3" fill="#AFC8F0" stroke="#3D2A6E" stroke-width="1.4"/><path d="M10 9 L15 11.5 L10 14 Z" fill="#3D2A6E"/><path d="M8 21 L16 21" stroke="#3D2A6E" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  chest: `<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2" fill="#C98E5B" stroke="#3D2A6E" stroke-width="1.4"/><path d="M3 11 Q3 5 12 5 Q21 5 21 11 Z" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="1.4"/><rect x="10" y="10" width="4" height="4" rx="1" fill="#F6BBCB" stroke="#3D2A6E" stroke-width="1.2"/></svg>`,
  gift: `<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2" fill="#F6BBCB" stroke="#3D2A6E" stroke-width="1.4"/><rect x="2" y="6" width="20" height="4" rx="1.5" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="1.4"/><path d="M12 6 L12 21 M12 6 Q8 2 7 5 Q7 6 12 6 Q17 6 17 5 Q16 2 12 6" fill="#B8A4E3" stroke="#3D2A6E" stroke-width="1.4"/></svg>`,
  nav_home: `<svg viewBox="0 0 24 24"><path d="M3 11 L12 4 L21 11 L21 20 L14 20 L14 14 L10 14 L10 20 L3 20 Z"/></svg>`,
  nav_map: `<svg viewBox="0 0 24 24"><path d="M4 4 L20 4 L20 20 L4 20 Z M4 12 L20 12 M12 4 L12 20"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/></svg>`,
  nav_daily: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10 L21 10 M8 3 L8 7 M16 3 L16 7"/><path d="M12 12.5 L13 15 L15.5 15.2 L13.6 16.8 L14.2 19.3 L12 18 L9.8 19.3 L10.4 16.8 L8.5 15.2 L11 15 Z" fill="currentColor" stroke="none"/></svg>`,
  nav_shop: `<svg viewBox="0 0 24 24"><path d="M4 9 L20 9 L18.5 20 L5.5 20 Z"/><path d="M8 9 A4 4 0 0 1 16 9"/><path d="M4 9 L3 5 M20 9 L21 5"/></svg>`,
  nav_me: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20 Q4 14 12 14 Q20 14 20 20"/></svg>`
};
function icon(n) { return ICONS[n] || ''; }
function starsHTML(n, max) { let s = '<span class="stars">'; for (let i = 0; i < (max || 3); i++) s += i < n ? icon('star') : icon('starOff'); return s + '</span>'; }
function coin(kind, n) { return '<span class="coin">' + icon(kind) + esc(n) + '</span>'; }

/* ---- header ---- */
function renderHeader() {
  const h = document.getElementById('head'); if (!h) return;
  heartsNow();
  const cd = heartCountdown();
  h.innerHTML = `<img class="logo" src="${LOGO_PNG}" alt=""><div class="name">Twin Stars</div>
    <div class="pills"><button class="pill" data-act="goShop">${icon('stardust')}${S.stardust}</button><button class="pill" data-act="goShop">${icon('moon')}${S.moon}</button>
    <button class="pill" data-act="heartInfo">${icon('heart')}${S.hearts}${cd ? '<span class="sub">' + cd + '</span>' : ''}</button></div>`;
}
function renderNav(active) {
  const n = document.getElementById('nav'); if (!n) return;
  const items = [['home', '#/home'], ['map', '#/map'], ['daily', '#/daily'], ['shop', '#/shop'], ['me', '#/me']];
  n.innerHTML = items.map(([k, href]) => `<a href="${href}" class="${active === k ? 'on' : ''}">${k === 'daily' && dailyHasGift() ? '<i class="dot"></i>' : ''}${icon('nav_' + k)}<span>${esc(t('nav.' + k))}</span></a>`).join('');
}
