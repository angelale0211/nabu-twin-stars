/* ============================ level map ============================ */
function renderMap() {
  const nid = nextLevelId();
  let h = `<h1 style="margin-bottom:10px">${esc(t('mapTitle'))} <span class="chip gold">${icon('star')}${totalStars()}</span></h1>`;
  CHAPTERS.forEach(ch => {
    const open = chapterOpen(ch.id), st = chapterStars(ch.id);
    h += `<div class="card chap ${open ? '' : 'locked'}"><div class="head">${sceneThumb(ch.bg)}<div class="grow"><div class="eyebrow">${esc(t('chapter'))} ${ch.id} · ${esc(tt(ch.card))}</div><h3>${esc(tt(SCENES[ch.bg].name))}</h3>
      <span class="faint">${open ? starsHTML(Math.min(3, Math.ceil(st / 10)), 3) + ' ' + st + '/30' : '🔒 ' + esc(t('needStars', { n: ch.need }))}</span></div>${S.chests[ch.id] ? '<span class="chip gold">' + icon('chest') + '</span>' : ''}</div>`;
    h += '<div class="lvls">';
    for (let n = 1; n <= 10; n++) {
      const id = (ch.id - 1) * 10 + n, lvl = LEVELS[id - 1], st = levelStars(id), isOpen = levelOpen(id);
      const cls = 'lvl' + (isOpen ? '' : ' lock') + (id === nid ? ' next' : '') + (lvl.type === 'same' ? ' same' : lvl.mirror ? ' mirror' : '');
      const tag = lvl.type === 'same' ? '<span class="tag">=</span>' : lvl.mirror ? '<span class="tag">⇄</span>' : '';
      h += `<button class="${cls}" data-act="openLevel" data-id="${id}">${tag}${n}${st ? starsHTML(st) : ''}</button>`;
    }
    h += '</div></div>';
  });
  return h;
}
Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  openLevel(el) {
    const id = +el.dataset.id, lvl = LEVELS[id - 1];
    if (levelOpen(id)) return go('#/play?l=' + id);
    if (!chapterOpen(lvl.ch)) return toast(t('needStars', { n: CHAPTERS[lvl.ch - 1].need }));
    modal(`<h2>${esc(t('level'))} ${lvl.ch}-${lvl.n}</h2><p class="muted" style="text-align:center">${esc(t('unlocks', { n: lvl.ch + '-' + (lvl.n - 1) }))}</p>
      <div class="btns"><button class="btn gold" data-act="skipLevel" data-id="${id}">${esc(t('skipMoon', { n: CONFIG.skipMoon }))}</button><button class="btn" data-act="closeModal">${esc(t('close'))}</button></div>`, { center: true });
  },
  skipLevel(el) {
    const id = +el.dataset.id;
    if (!spendMoon(CONFIG.skipMoon)) return;
    const prev = id - 1; if (!S.levels[prev]) S.levels[prev] = { stars: 1, best: 0, skipped: 1 };
    save(); closeModal(); go('#/play?l=' + id);
  }
});
