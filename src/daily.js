/* ============================ daily: check-in, lucky draw, card, challenge ============================ */
const CHECKIN = [{ s: 50 }, { s: 75 }, { h: 1 }, { s: 100 }, { m: 3 }, { s: 150, h: 1 }, { m: 10, s: 200 }];
const WHEEL = [{ s: 20, w: 22 }, { s: 50, w: 18 }, { h: 1, w: 14 }, { s: 100, w: 12 }, { m: 1, w: 14 }, { s: 30, w: 12 }, { m: 3, w: 5 }, { s: 200, w: 3 }];
const WHEEL_COL = [PINK, BLUE, LILAC, GOLD2, MINT, PEACH, LAV, SAND];

function rewardText(r) {
  const p = []; if (r.s) p.push(r.s + ' ✦'); if (r.m) p.push(r.m + ' 🌙'); if (r.h) p.push('+' + r.h + ' ' + t('hint').toLowerCase());
  return p.join(' + ');
}
function grant(r) { if (r.s) addStardust(r.s); if (r.m) addMoon(r.m); if (r.h) addHints(r.h); SFX.chime(); toast('+ ' + rewardText(r)); }
function checkinClaimed() { return S.daily.checkin.last === todayStr(); }
function streakBroken() { const c = S.daily.checkin; return c.last && c.last !== todayStr() && c.last !== yesterdayStr() && c.streak > 0; }
function spinsLeft() { const sp = S.daily.spins; if (sp.date !== todayStr()) return 1; return Math.max(0, 1 + (sp.extra || 0) - sp.used); }
function challengeDone() { return S.daily.challenge.date === todayStr() && S.daily.challenge.done; }
function dailyHasGift() { return !checkinClaimed() || spinsLeft() > 0 || S.daily.card.date !== todayStr() || !challengeDone(); }

function cardFaceSVG(card) {
  return `<svg viewBox="0 0 100 160" stroke="#3D2A6E" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><rect width="100" height="160" rx="10" fill="#3D2A6E" stroke="none"/><rect x="5" y="5" width="90" height="150" rx="7" fill="#FBF6F1" stroke="#E5BE5E" stroke-width="2"/>
    <rect x="10" y="10" width="80" height="112" rx="5" fill="#EFE9FA" stroke="none"/>${drawObj({ m: card.sym, x: 50, y: 64, s: 1.15, r: 0, f: 0, a: LAV, b: GOLD, v: 0 })}
    <text x="50" y="142" text-anchor="middle" font-family="Georgia,serif" font-size="${tt({ en: card.en, vi: card.vi }).length > 12 ? 8.5 : 10}" fill="#3D2A6E" stroke="none">${esc(tt({ en: card.en, vi: card.vi }))}</text></svg>`;
}
function cardBackSVG() {
  return `<svg viewBox="0 0 100 160" stroke="#3D2A6E" stroke-width="2.2" stroke-linejoin="round"><rect width="100" height="160" rx="10" fill="#3D2A6E" stroke="none"/><rect x="6" y="6" width="88" height="148" rx="7" fill="#4B3684" stroke="#E5BE5E" stroke-width="1.6"/>
    <path d="M56 58 A24 24 0 1 0 56 106 A18 18 0 1 1 56 58 Z" fill="#E5BE5E" stroke-width="1.6"/><circle cx="26" cy="30" r="3.5" fill="#E5BE5E" stroke="none"/><circle cx="74" cy="130" r="3.5" fill="#E5BE5E" stroke="none"/><circle cx="26" cy="130" r="3.5" fill="#E5BE5E" stroke="none"/></svg>`;
}
function wheelSVG() {
  let s = `<svg class="wheel" id="wheel" viewBox="-110 -110 220 220" stroke="#3D2A6E" stroke-width="2.2" stroke-linejoin="round">`;
  WHEEL.forEach((r, i) => {
    const a0 = (i * 45 - 90 - 22.5) * Math.PI / 180, a1 = ((i + 1) * 45 - 90 - 22.5) * Math.PI / 180;
    const x0 = 100 * Math.cos(a0), y0 = 100 * Math.sin(a0), x1 = 100 * Math.cos(a1), y1 = 100 * Math.sin(a1);
    s += `<path d="M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A100 100 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${WHEEL_COL[i]}"/>`;
    const lab = r.s ? r.s + '✦' : r.m ? r.m + '☾' : '+1 💡';
    s += `<text transform="rotate(${i * 45}) translate(0 -68)" text-anchor="middle" font-family="Be Vietnam Pro,Segoe UI,sans-serif" font-weight="700" font-size="13" fill="#3B2A5E" stroke="none">${lab}</text>`;
  });
  s += `<circle r="18" fill="#FFF9FA"/><path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9 Z" fill="#E5BE5E" stroke-width="1.4"/></svg>`;
  return s;
}
function pickWheel() { let sum = WHEEL.reduce((a, r) => a + r.w, 0), x = Math.random() * sum; for (let i = 0; i < WHEEL.length; i++) { x -= WHEEL[i].w; if (x <= 0) return i; } return 0; }

function renderDaily(params) {
  const tab = params.tab || 'checkin';
  const tabs = ['checkin', 'spin', 'card', 'challenge'];
  let h = `<h1 style="margin-bottom:10px">${esc(t('dailyTitle'))}</h1><div class="seg" style="margin-bottom:12px">${tabs.map(k => `<button class="${tab === k ? 'on' : ''}" data-act="dailyTab" data-tab="${k}">${esc(t(k === 'checkin' ? 'checkin' : k === 'spin' ? 'lucky' : k === 'card' ? 'todaysCard' : 'challenge'))}</button>`).join('')}</div>`;
  if (tab === 'checkin') {
    const c = S.daily.checkin, claimed = checkinClaimed(), broken = streakBroken();
    const todayIdx = claimed ? (c.streak - 1) % 7 : (broken ? 0 : c.streak % 7);
    h += `<div class="card"><div class="row between"><h2>${esc(t('checkin'))}</h2><span class="chip gold">${esc(t('streak'))} ${c.streak}</span></div><p class="muted sm">${esc(t('day'))} ${todayIdx + 1} / 7</p>
      <div class="cal">${CHECKIN.map((r, i) => `<div class="d ${i < todayIdx || (claimed && i === todayIdx) ? 'got' : ''} ${i === todayIdx ? 'today' : ''}">${i === 6 ? icon('chest') : r.m ? icon('moon') : r.h ? icon('hint') : icon('stardust')}<b>${r.m ? r.m + '🌙' : r.h && !r.s ? '+' + r.h : r.s + '✦'}</b>${esc(t('day'))} ${i + 1}</div>`).join('')}</div>
      <div style="margin-top:12px">${claimed ? `<button class="btn wide" disabled>${esc(t('claimed'))}</button>` : broken ? `<p class="muted sm" style="text-align:center">${esc(t('streakLost'))}</p><div class="btns two"><button class="btn pinkish" data-act="mendAd">${icon('ad')}${esc(t('mendAd'))}</button><button class="btn gold" data-act="mendMoon">${esc(t('mendMoon', { n: CONFIG.mendMoon }))}</button></div><button class="btn ghost wide" data-act="mendNo">${esc(t('mendNo'))}</button>` : `<button class="btn primary big wide" data-act="claimCheckin">${icon('gift')}${esc(t('claim'))} · ${esc(rewardText(CHECKIN[todayIdx]))}</button>`}</div></div>`;
  } else if (tab === 'spin') {
    const left = spinsLeft(), ads = dailyAds();
    h += `<div class="card" style="text-align:center"><h2>${esc(t('lucky'))}</h2><p class="muted sm">${esc(left ? t('spinsLeft') : t('noSpins'))}</p>
      <div class="wheelwrap"><div class="ptr"></div>${wheelSVG()}</div>
      <div class="btns">${left ? `<button class="btn primary big" id="spinbtn" data-act="spin">${esc(t('spin'))}</button>` : `${ads.spins < CONFIG.adSpinsPerDay ? `<button class="btn pinkish" data-act="spinAd">${icon('ad')}${esc(t('spinAgainAd'))}</button>` : ''}<button class="btn gold" data-act="spinMoon">${esc(t('spinAgainMoon', { n: CONFIG.spinMoon }))}</button>`}</div></div>`;
  } else if (tab === 'card') {
    const drawn = S.daily.card.date === todayStr(), card = drawn ? CARDS[S.daily.card.id] : null, ads = dailyAds();
    h += `<div class="card" style="text-align:center"><h2>${esc(t('drawCard'))}</h2><p class="muted sm">${esc(t('drawSub'))}</p>`;
    if (card) {
      h += `<div class="tcard flip pop"><div class="in"><div class="f">${cardBackSVG()}</div><div class="f back">${cardFaceSVG(card)}</div></div></div>
        <h3 style="margin-top:12px">${esc(tt({ en: card.en, vi: card.vi }))}</h3><p class="muted">${esc(S.lang === 'vi' ? card.rvi : card.ren)}</p>
        <div class="chip gold" style="margin-bottom:12px">✨ ${esc(t('blessing'))}: ${esc(t('blessings.' + card.bless))}</div>
        ${S.daily.card.redrawn ? '' : `<div class="btns two">${ads.redraws < CONFIG.adRedrawsPerDay ? `<button class="btn pinkish" data-act="redrawAd">${icon('ad')}${esc(t('redrawAd'))}</button>` : ''}<button class="btn gold" data-act="redrawMoon">${esc(t('redrawMoon', { n: CONFIG.redrawMoon }))}</button></div>`}`;
    } else {
      h += `<div class="deck">${[0, 1, 2, 3, 4].map(i => `<button data-act="drawCard" style="transform:rotate(${(i - 2) * 6}deg)">${cardBackSVG()}</button>`).join('')}</div><p class="faint">${esc(t('tapToContinue'))}</p>`;
    }
    h += '</div>';
  } else {
    const done = challengeDone(), lvl = dailyLevel(todayStr());
    h += `<div class="card"><div class="row between"><div class="grow"><h2>${esc(t('challenge'))}</h2><p class="muted sm">${esc(t('challengeSub'))}</p><span class="chip">${esc(typeLabel(lvl))} · ${lvl.find} · ${fmtTime(lvl.time)}</span></div>${sceneThumb(CHAPTERS[lvl.ch - 1].bg, 'thumb', lvl)}</div>
      <div style="margin-top:12px">${done ? `<div class="row" style="justify-content:center">${starsHTML(S.daily.challenge.stars)} <span class="muted">${esc(t('challengeDone'))}</span></div>` : `<button class="btn primary big wide" data-act="playDaily">${icon('play')}${esc(t('challengePlay'))} · +80 ✦ +2 🌙</button>`}</div></div>`;
  }
  return h;
}
function applyBlessing(card) {
  S.blessing = { date: todayStr(), key: card.bless, used: 0 };
  if (card.bless === 'hint') addHints(1);
  if (card.bless === 'heart') refillHearts();
  if (card.bless === 'spin') { if (S.daily.spins.date !== todayStr()) S.daily.spins = { date: todayStr(), used: 0, extra: 0 }; S.daily.spins.extra = (S.daily.spins.extra || 0) + 1; }
  save();
}
function doSpin() {
  const sp = S.daily.spins; if (sp.date !== todayStr()) S.daily.spins = { date: todayStr(), used: 0, extra: sp.extra && sp.date === todayStr() ? sp.extra : 0 };
  if (spinsLeft() <= 0) return;
  S.daily.spins.used++; save();
  const k = pickWheel(), wheel = document.getElementById('wheel'), btn = document.getElementById('spinbtn');
  if (btn) btn.disabled = true;
  const turns = 5 * 360 + (360 - k * 45);
  if (wheel) { wheel.style.transform = 'rotate(' + turns + 'deg)'; SFX.swoosh(); }
  let n = 0; const tk = setInterval(() => { SFX.tick(); if (++n > 30) clearInterval(tk); }, 120);
  setTimeout(() => { clearInterval(tk); grant(WHEEL[k]); route(); }, window.__fastAds ? 100 : 4300);
}
Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  dailyTab(el) { go('#/daily?tab=' + el.dataset.tab); },
  claimCheckin() {
    const c = S.daily.checkin; if (checkinClaimed()) return;
    if (streakBroken()) c.streak = 0;
    const idx = c.streak % 7; c.streak++; c.last = todayStr(); save(); grant(CHECKIN[idx]); route();
  },
  mendAd() { Monet.reward('mend', ok => { if (ok) { S.daily.checkin.last = yesterdayStr(); save(); route(); } else toast(t('adFail')); }); },
  mendMoon() { if (spendMoon(CONFIG.mendMoon)) { S.daily.checkin.last = yesterdayStr(); save(); route(); } },
  mendNo() { S.daily.checkin.streak = 0; S.daily.checkin.last = ''; save(); route(); },
  spin: doSpin,
  spinAd() { const ads = dailyAds(); Monet.reward('spin', ok => { if (ok) { ads.spins++; if (S.daily.spins.date !== todayStr()) S.daily.spins = { date: todayStr(), used: 0, extra: 0 }; S.daily.spins.extra = (S.daily.spins.extra || 0) + 1; save(); route(); } else toast(t('adFail')); }); },
  spinMoon() { if (spendMoon(CONFIG.spinMoon)) { if (S.daily.spins.date !== todayStr()) S.daily.spins = { date: todayStr(), used: 0, extra: 0 }; S.daily.spins.extra = (S.daily.spins.extra || 0) + 1; save(); route(); } },
  drawCard() {
    if (S.daily.card.date === todayStr()) return;
    const id = Math.floor(Math.random() * CARDS.length);
    S.daily.card = { date: todayStr(), id, redrawn: 0 }; applyBlessing(CARDS[id]); SFX.chime(); route();
  },
  redrawAd() { const ads = dailyAds(); Monet.reward('redraw', ok => { if (ok) { ads.redraws++; redraw(); } else toast(t('adFail')); }); },
  redrawMoon() { if (spendMoon(CONFIG.redrawMoon)) redraw(); },
  playDaily() { go('#/play?daily=1'); }
});
function redraw() {
  let id = Math.floor(Math.random() * CARDS.length); if (id === S.daily.card.id) id = (id + 1) % CARDS.length;
  S.daily.card = { date: todayStr(), id, redrawn: 1 }; applyBlessing(CARDS[id]); SFX.chime(); route();
}
