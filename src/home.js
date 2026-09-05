/* ============================ home ============================ */
function sceneThumb(bg, cls, lvl) {
  const first = lvl || LEVELS.find(l => (l.bg || CHAPTERS[l.ch - 1].bg) === bg);
  if (first && first.a) return `<img class="${cls || 'thumb'}" src="${first.a}" alt="">`;
  return `<svg class="${cls || 'thumb'}" viewBox="0 0 360 300" stroke="#3D2A6E" stroke-width="2.4" stroke-linejoin="round">${SCENES[bg].draw('t' + bg)}</svg>`;
}
function renderHome() {
  const nid = nextLevelId(), lvl = LEVELS[nid - 1], ch = CHAPTERS[lvl.ch - 1];
  const cleared = Object.keys(S.levels).filter(k => k !== 'daily' && S.levels[k].stars).length;
  const b = blessingKey();
  const card = S.daily.card.date === todayStr() ? CARDS[S.daily.card.id] : null;
  return `<div class="card" style="position:relative;overflow:hidden">
      <div class="sparkles"><i style="left:8%;top:20%"></i><i style="left:88%;top:16%;animation-delay:.6s"></i><i style="left:76%;top:70%;animation-delay:1.2s"></i><i style="left:14%;top:76%;animation-delay:1.8s"></i></div>
      <div class="hero"><svg class="art" viewBox="0 0 100 100" stroke="#3D2A6E" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${drawObj({ m: 'cardfan', x: 50, y: 50, s: 1.05, r: 0, f: 0, a: LAV, b: PINK, v: 0 })}</svg>
        <div class="grow"><div class="eyebrow">${esc(t('hello'))}</div><h2>${esc(t('tagline'))}</h2>
        <p class="muted sm">${esc(t('progress', { a: cleared, b: LEVELS.length }))} · ${esc(t('starsTotal', { n: totalStars() }))}</p>
        <div class="bar"><i style="width:${Math.round(totalStars() / 3)}%"></i></div></div></div></div>
    <div class="card tint"><div class="row between"><div><div class="eyebrow">${esc(t('nextUp'))}</div><h3>${esc(t('level'))} ${lvl.ch}-${lvl.n} · ${esc(tt(SCENES[ch.bg].name))}</h3><span class="faint">${esc(t('chapter'))} ${ch.id} · ${esc(tt(ch.card))} · ${esc(typeLabel(lvl))}</span></div>${sceneThumb(ch.bg, 'thumb', lvl)}</div>
      <button class="btn primary big wide" style="margin-top:12px" data-act="playNext">${icon('play')}${esc(t('play'))}</button></div>
    ${card ? `<div class="card"><div class="row"><div class="tcard" style="width:52px;height:80px;margin:0"><div class="in"><div class="f">${cardFaceSVG(card)}</div></div></div><div class="grow"><div class="eyebrow">${esc(t('todaysCard'))}</div><b>${esc(tt({ en: card.en, vi: card.vi }))}</b><div class="sm muted">${esc(t('blessings.' + card.bless))}${S.blessing.used && card.bless === 'double' ? ' ✓' : ''}</div></div></div></div>` : ''}
    <div class="eyebrow" style="margin:4px 0 8px">${esc(t('dailyTitle'))}</div>
    <div class="grid2">
      <a class="tile ${checkinClaimed() ? 'done' : ''}" href="#/daily?tab=checkin">${checkinClaimed() ? '' : '<i class="badge"></i>'}${icon('gift')}<b>${esc(t('checkin'))}</b><span class="faint">${esc(t('streak'))} ${S.daily.checkin.streak}</span></a>
      <a class="tile ${spinsLeft() ? '' : 'done'}" href="#/daily?tab=spin">${spinsLeft() ? '<i class="badge"></i>' : ''}<svg class="ic" viewBox="0 0 100 100" stroke="#3D2A6E" stroke-width="2.4">${drawObj({ m: 'clockmoon', x: 50, y: 50, s: 1.1, r: 0, f: 0, a: PINK, b: LAV, v: 0 })}</svg><b>${esc(t('lucky'))}</b><span class="faint">${esc(spinsLeft() ? t('spinsLeft') : t('claimed'))}</span></a>
      <a class="tile ${card ? 'done' : ''}" href="#/daily?tab=card">${card ? '' : '<i class="badge"></i>'}<svg class="ic" viewBox="0 0 100 100" stroke="#3D2A6E" stroke-width="2.4">${drawObj({ m: 'tarot', x: 50, y: 50, s: 1.1, r: -8, f: 0, a: PLUM, b: GOLD, v: 0 })}</svg><b>${esc(t('drawCard'))}</b><span class="faint">${esc(card ? tt({ en: card.en, vi: card.vi }) : t('todaysCard'))}</span></a>
      <a class="tile ${challengeDone() ? 'done' : ''}" href="#/daily?tab=challenge">${challengeDone() ? '' : '<i class="badge"></i>'}<svg class="ic" viewBox="0 0 100 100" stroke="#3D2A6E" stroke-width="2.4">${drawObj({ m: 'comet', x: 50, y: 50, s: 1.1, r: 0, f: 0, a: GOLD, b: PINK, v: 0 })}</svg><b>${esc(t('challenge'))}</b><span class="faint">${esc(challengeDone() ? t('challengeDone') : '+80 ✦ +2 🌙')}</span></a>
    </div>
    <footer>Nabu Twin Stars · <a href="${CONFIG.nabuUrl}" target="_blank" rel="noopener">${esc(t('nabuApp'))}</a></footer>`;
}
Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  playNext() { go('#/play?l=' + nextLevelId()); },
  goShop() { go('#/shop'); }
});
