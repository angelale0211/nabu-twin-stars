/* ============================ the game screen ============================ */
const GAME = { on: false };

function levelTitle(lvl) {
  if (lvl.daily) return t('challenge');
  return t('level') + ' ' + lvl.ch + '-' + lvl.n + ' · ' + tt(SCENES[lvl.bg].name);
}
function typeLabel(lvl) { return lvl.type === 'same' ? t('typeSame') : lvl.mirror ? t('typeMirror') : t('typeDiff'); }

function startLevel(lvl) {
  const g = GAME;
  g.on = true; g.lvl = lvl; g.targets = levelTargets(lvl); g.found = []; g.misses = 0; g.hints = 0; g.continued = 0; g.doubled = false; g.over = false; g.hintT = null;
  g.time = lvl.time ? lvl.time + (blessingKey() === 'time' ? 20 : 0) : 0;
  g.started = Date.now(); g.elapsed = 0; g.paused = false;
  document.body.classList.add('game');
  const main = document.getElementById('main');
  main.innerHTML = `<div id="gbar"><button class="rnd" data-act="gQuit" aria-label="back">←</button>
      <div class="ttl"><b>${esc(levelTitle(lvl))}</b><span>${esc(typeLabel(lvl))}</span></div>
      ${lvl.time ? '<div id="timer">' + fmtTime(g.time) + '</div>' : '<span class="chip">' + esc(t('noTimer')) + '</span>'}
      <button class="rnd" data-act="gPause" aria-label="pause">⏸</button></div>
    <div id="status"><span class="dots" id="dots"></span><span id="missbox" class="row" style="gap:6px"><span>${esc(t('misses'))}</span><span class="miss" id="miss"></span></span></div>
    <div id="pics"><div class="picwrap" id="pa"><span class="lbl">A</span></div><div class="picwrap" id="pb"><span class="lbl">B</span></div></div>
    <div id="gtools"><button class="btn gold" data-act="gHint" id="hintbtn"></button>${lvl.time ? `<button class="btn" data-act="gTime">${esc(t('addTime', { n: CONFIG.timeCost }))}</button>` : ''}</div>`;
  drawPics(); drawStatus(); drawHintBtn();
  clearInterval(g.timer);
  g.timer = setInterval(tickTimer, 1000);
  const tutKey = lvl.type === 'same' ? 'same' : lvl.mirror ? 'mirror' : 'diff';
  if (!S.tut[tutKey]) {
    S.tut[tutKey] = 1; save(); g.paused = true;
    const tut = document.createElement('div'); tut.className = 'tut';
    tut.innerHTML = `<div>${esc(t(tutKey === 'same' ? 'tutSame' : tutKey === 'mirror' ? 'tutMirror' : 'tutDiff'))}<br><button class="btn primary" style="margin-top:10px" data-act="gTutOk">${esc(t('ok'))}</button></div>`;
    document.getElementById('pics').style.position = 'relative';
    document.getElementById('pics').appendChild(tut);
  }
}
function drawPics() {
  const g = GAME, marks = g.targets.filter(x => g.found.indexOf(x.i) >= 0);
  ['a', 'b'].forEach(side => {
    const wrap = document.getElementById('p' + side);
    wrap.querySelectorAll('svg.pic').forEach(x => x.remove());
    wrap.insertAdjacentHTML('beforeend', pictureSVG(g.lvl, side, marks, 'g'));
    if (!wrap.dataset.bound) { wrap.dataset.bound = 1; wrap.addEventListener('pointerdown', onTap); }
  });
  if (g.hintT) showHintRing(g.hintT);
}
function drawStatus() {
  const g = GAME;
  document.getElementById('dots').innerHTML = g.targets.map((x, i) => `<i class="${i < g.found.length ? 'on' : ''}"></i>`).join('');
  document.getElementById('miss').innerHTML = Array.from({ length: g.lvl.miss }, (_, i) => `<i class="${i < g.misses ? 'on' : ''}"></i>`).join('');
}
function drawHintBtn() {
  const b = document.getElementById('hintbtn'); if (!b) return;
  b.innerHTML = icon('hint') + esc(S.hints > 0 ? t('hintFree') + ' · ' + S.hints : S.stardust >= CONFIG.hintCost ? t('hintCost', { n: CONFIG.hintCost }) : t('hintAd'));
}
function tickTimer() {
  const g = GAME; if (!g.on || g.paused || g.over) return;
  g.elapsed++;
  if (g.lvl.time) {
    g.time--;
    const el = document.getElementById('timer'); if (el) { el.textContent = fmtTime(g.time); el.classList.toggle('low', g.time <= 10); }
    if (g.time <= 10 && g.time > 0) SFX.tick();
    if (g.time <= 0) fail('time');
  }
}
function onTap(e) {
  const g = GAME; if (!g.on || g.paused || g.over) return;
  e.preventDefault();
  const wrap = e.currentTarget, svg = wrap.querySelector('svg.pic'); if (!svg) return;
  const pt = tapToPic(svg, g.lvl, e.clientX, e.clientY);
  const hit = hitTarget(g.targets, g.found, pt);
  if (hit) {
    g.found.push(hit.i); S.stats.found++; SFX.found(); Monet.vibrate(20);
    if (g.hintT && g.hintT.i === hit.i) { g.hintT = null; document.querySelectorAll('.mk.hintring').forEach(x => x.remove()); }
    drawPics(); drawStatus();
    if (g.found.length >= g.targets.length) setTimeout(win, 350);
  } else {
    g.misses++; S.stats.misses++; SFX.miss(); Monet.vibrate(40);
    const box = svg.getBoundingClientRect();
    const mk = document.createElement('span'); mk.className = 'mk x'; mk.textContent = '✕';
    mk.style.left = ((e.clientX - box.left) / box.width * 100) + '%'; mk.style.top = ((e.clientY - box.top) / box.height * 100) + '%';
    wrap.appendChild(mk); setTimeout(() => mk.remove(), 600);
    if (g.lvl.time && blessingKey() !== 'calm') { g.time = Math.max(1, g.time - 5); const el = document.getElementById('timer'); if (el) el.textContent = fmtTime(g.time); toast(t('missPenalty')); }
    drawStatus();
    if (g.misses >= g.lvl.miss) fail('miss');
  }
}
function showHintRing(tg) {
  ['a', 'b'].forEach(side => {
    const wrap = document.getElementById('p' + side); if (!wrap) return;
    wrap.querySelectorAll('.mk.hintring').forEach(x => x.remove());
    let x = side === 'b' && tg.x2 !== undefined ? tg.x2 : tg.x, y = side === 'b' && tg.y2 !== undefined ? tg.y2 : tg.y;
    if (side === 'b' && GAME.lvl.mirror) x = PIC_W - x;
    const mk = document.createElement('span'); mk.className = 'mk hintring';
    mk.style.left = (x / PIC_W * 100) + '%'; mk.style.top = (y / PIC_H * 100) + '%'; mk.style.width = (tg.r * 2.4 / PIC_W * 100) + '%';
    wrap.appendChild(mk);
  });
}
function useHint() {
  const g = GAME; if (!g.on || g.over || g.paused) return;
  if (g.hintT) { showHintRing(g.hintT); return; }
  const left = g.targets.filter(x => g.found.indexOf(x.i) < 0); if (!left.length) return;
  const give = () => { g.hints++; g.hintT = left[0]; showHintRing(g.hintT); SFX.chime(); drawHintBtn(); };
  if (S.hints > 0) { addHints(-1); give(); return; }
  if (S.stardust >= CONFIG.hintCost) { spendStardust(CONFIG.hintCost); give(); return; }
  const ads = dailyAds();
  if (ads.hints >= CONFIG.adHintsPerDay) { toast(t('notEnough', { c: t('stardust') })); return; }
  g.paused = true;
  Monet.reward('hint', ok => { g.paused = false; if (ok) { ads.hints++; save(); give(); } else toast(t('adFail')); });
}
function addTime() {
  const g = GAME; if (!g.on || g.over || !g.lvl.time) return;
  if (spendStardust(CONFIG.timeCost)) { g.time += 30; const el = document.getElementById('timer'); if (el) { el.textContent = fmtTime(g.time); el.classList.remove('low'); } }
}
function pauseGame() {
  const g = GAME; if (!g.on || g.over) return;
  g.paused = true;
  modal(`<h2>${esc(t('paused'))}</h2><p class="muted" style="text-align:center">${esc(levelTitle(g.lvl))}</p><div class="btns"><button class="btn primary big" data-act="gResume">${esc(t('resume'))}</button><button class="btn" data-act="gQuit">${esc(t('quit'))}</button></div>`, { center: true, noClose: true });
}
function resumeGame() { GAME.paused = false; closeModal(); }
function quitGame() { const g = GAME; g.on = false; g.over = true; clearInterval(g.timer); closeModal(); go(g.lvl.daily ? '#/daily' : '#/map'); }

/* ---- results ---- */
function starsFor(g) {
  const par = g.lvl.par;
  if (g.elapsed <= par && g.misses <= 1) return 3;
  if (g.elapsed <= par * 1.8 || g.misses <= 3) return 2;
  return 1;
}
function win() {
  const g = GAME; if (g.over) return;
  g.over = true; clearInterval(g.timer); SFX.win(); Monet.vibrate(60);
  const lvl = g.lvl, id = lvl.daily ? 'daily' : lvl.id;
  const stars = starsFor(g);
  const prev = lvl.daily ? null : S.levels[id];
  const first = !prev;
  let base = 10 + 6 * g.targets.length;
  if (lvl.type === 'same') base = Math.round(base * 1.3);
  if (lvl.mirror) base = Math.round(base * 1.2);
  const lines = [[t('reward'), base]];
  let total = base;
  if (stars === 3) { lines.push([t('threeStar'), Math.round(base * 0.5)]); total += Math.round(base * 0.5); }
  if (first && !lvl.daily) { lines.push([t('firstClear'), 20]); total += 20; }
  if (blessingKey() === 'stardust') { const b = Math.round(total * 0.25); lines.push([t('blessingBonus'), b]); total += b; }
  if (blessingActive('double')) { lines.push([t('blessingBonus') + ' ×2', total]); total *= 2; S.blessing.used = 1; }
  let moon = 0;
  if (!lvl.daily) { if (first) moon += 1; if (stars === 3 && (!prev || prev.stars < 3)) moon += 2; }
  if (lvl.daily) { if (S.daily.challenge.date !== todayStr() || !S.daily.challenge.done) { total += 80; moon += 2; lines.push([t('challenge'), 80]); } }
  g.reward = total; g.rewardMoon = moon; g.stars = stars;
  S.stats.played++;
  if (lvl.daily) { S.daily.challenge = { date: todayStr(), done: 1, stars }; }
  else {
    const rec = prev || { stars: 0, best: 0 };
    rec.stars = Math.max(rec.stars, stars);
    g.newBest = !rec.best || g.elapsed < rec.best;
    rec.best = rec.best ? Math.min(rec.best, g.elapsed) : g.elapsed;
    S.levels[id] = rec;
  }
  addStardust(total); if (moon) addMoon(moon);
  S.sinceAd++; save();
  g.chest = !lvl.daily && chapterCleared(lvl.ch) && !S.chests[lvl.ch];
  showResult();
}
function showResult() {
  const g = GAME, lvl = g.lvl;
  const html = `<div class="result"><div class="big">✨</div><h2>${esc(t('win'))}</h2>
    <div class="rs">${[1, 2, 3].map(i => i <= g.stars ? icon('star') : icon('starOff')).join('')}</div>
    <p class="muted" style="text-align:center">${esc(t('stars' + g.stars))} · ${esc(t('time'))} ${fmtTime(g.elapsed)}${g.newBest ? ' · ' + esc(t('newBest')) : ''}<br><span class="faint">${esc(t('par', { t: fmtTime(lvl.par) }))} · ${esc(t('misses'))} ${g.misses}</span></p>
    <div class="card tint" style="margin:8px 0"><div class="kv"><span>${esc(t('reward'))}</span><b>${coin('stardust', g.reward)}${g.rewardMoon ? ' ' + coin('moon', '+' + g.rewardMoon) : ''}</b></div>${g.doubled ? `<div class="kv"><span>${esc(t('doubleAd'))}</span><b>×2</b></div>` : ''}</div>
    ${g.chest ? `<button class="btn gold wide" data-act="gChest">${icon('chest')}${esc(t('chapterDone'))} · ${esc(t('chestGet'))}</button>` : ''}
    <div class="btns" style="margin-top:8px">${!g.doubled ? `<button class="btn pinkish" data-act="gDouble">${icon('ad')}${esc(t('doubleAd'))}</button>` : ''}
    <button class="btn primary big" data-act="gNext">${esc(lvl.daily ? t('back') : t('next'))}</button></div></div>`;
  modal(html, { center: true, noClose: true });
}
function doubleReward() {
  const g = GAME; if (g.doubled) return;
  Monet.reward('double', ok => { if (ok) { g.doubled = true; addStardust(g.reward); SFX.coin(); showResult(); } else toast(t('adFail')); });
}
function openChest() {
  const g = GAME; if (!g.chest) return;
  S.chests[g.lvl.ch] = 1; g.chest = false; addStardust(200); addMoon(10); SFX.chime();
  toast(t('chest') + ': +200 ✦ +10 🌙'); showResult();
}
function nextLevel() {
  const g = GAME; closeModal(); g.on = false;
  const after = () => {
    if (g.lvl.daily) return go('#/daily');
    const nid = g.lvl.id + 1;
    if (nid <= LEVELS.length && levelOpen(nid)) go('#/play?l=' + nid); else go('#/map');
  };
  if (S.sinceAd >= CONFIG.interstitialEvery && !S.adsRemoved) { S.sinceAd = 0; save(); Monet.interstitial(after); } else after();
}
function fail(why) {
  const g = GAME; if (g.over) return;
  g.over = true; clearInterval(g.timer); SFX.fail();
  useHeart();
  const canAd = g.continued < CONFIG.adContinuesPerLevel;
  modal(`<div class="result"><div class="big">🌙</div><h2>${esc(t('fail'))}</h2><p class="muted" style="text-align:center">${esc(why === 'time' ? t('failTime') : t('failMiss'))} ${esc(t('loseHeart'))}.</p>
    <p class="faint" style="text-align:center">${esc(t('continueNote'))}</p>
    <div class="btns">${canAd ? `<button class="btn pinkish" data-act="gContinueAd">${icon('ad')}${esc(t('continueAd'))}</button>` : ''}
    <button class="btn gold" data-act="gContinueMoon">${esc(t('continueMoon', { n: CONFIG.refillMoon / 2 }))}</button>
    <button class="btn" data-act="gRetry">${esc(t('retry'))}</button><button class="btn ghost" data-act="gQuit">${esc(t('quit'))}</button></div></div>`, { center: true, noClose: true });
}
function continueLevel() {
  const g = GAME; closeModal(); g.over = false; g.continued++; g.misses = 0;
  if (g.lvl.time) g.time = Math.max(g.time, 0) + 30;
  const el = document.getElementById('timer'); if (el) { el.textContent = fmtTime(g.time); el.classList.remove('low'); }
  drawStatus(); clearInterval(g.timer); g.timer = setInterval(tickTimer, 1000);
}
function retryLevel() {
  heartsNow();
  if (S.hearts <= 0) { closeModal(); heartsModal(() => startLevel(GAME.lvl)); return; }
  closeModal(); startLevel(GAME.lvl);
}
function heartsModal(then) {
  const ads = dailyAds();
  modal(`<h2>${esc(t('noHearts'))}</h2><p class="muted" style="text-align:center">${esc(t('heartIn', { t: heartCountdown() || '—' }))}</p><div class="btns">
    ${ads.refills < CONFIG.adRefillsPerDay ? `<button class="btn pinkish" data-act="heartsAd">${icon('ad')}${esc(t('heartsRefillAd'))}</button>` : ''}
    <button class="btn gold" data-act="heartsMoon">${esc(t('heartsRefillMoon', { n: CONFIG.refillMoon }))}</button>
    <button class="btn" data-act="closeModal">${esc(t('close'))}</button></div>`, { center: true });
  GAME.afterHearts = then;
}
function playLevel(id) {
  const lvl = id === 'daily' ? dailyLevel(todayStr()) : LEVELS[id - 1];
  if (!lvl) return go('#/map');
  if (id !== 'daily' && !levelOpen(id)) return go('#/map');
  heartsNow();
  if (S.hearts <= 0) { GAME.pendingHearts = () => go('#/play?' + (id === 'daily' ? 'daily=1' : 'l=' + id)); return go(id === 'daily' ? '#/daily' : '#/map'); }
  startLevel(lvl);
}

Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  gHint: useHint, gTime: addTime, gPause: pauseGame, gResume: resumeGame, gQuit: quitGame, gNext: nextLevel, gRetry: retryLevel,
  gDouble: doubleReward, gChest: openChest, gContinueAd() { Monet.reward('continue', ok => { if (ok) continueLevel(); else toast(t('adFail')); }); },
  gContinueMoon() { if (spendMoon(CONFIG.refillMoon / 2)) continueLevel(); },
  gTutOk() { GAME.paused = false; document.querySelectorAll('.tut').forEach(x => x.remove()); GAME.started = Date.now(); },
  heartsAd() { const ads = dailyAds(); Monet.reward('hearts', ok => { if (ok) { ads.refills++; refillHearts(); closeModal(); SFX.chime(); if (GAME.afterHearts) { const f = GAME.afterHearts; GAME.afterHearts = null; f(); } } else toast(t('adFail')); }); },
  heartsMoon() { if (spendMoon(CONFIG.refillMoon)) { refillHearts(); closeModal(); SFX.chime(); if (GAME.afterHearts) { const f = GAME.afterHearts; GAME.afterHearts = null; f(); } } },
  heartInfo() { heartsNow(); if (S.hearts < CONFIG.heartsMax) heartsModal(null); else toast(t('hearts') + ' ' + S.hearts + '/' + CONFIG.heartsMax); }
});
