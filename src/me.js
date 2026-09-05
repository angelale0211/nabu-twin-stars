/* ============================ me: settings ============================ */
function renderMe() {
  const seg = (name, opts, cur) => `<div class="seg">${opts.map(([v, label]) => `<button class="${cur === v ? 'on' : ''}" data-act="set" data-k="${name}" data-v="${v}">${esc(label)}</button>`).join('')}</div>`;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone || !!window.NabuAndroid;
  return `<h1 style="margin-bottom:10px">${esc(t('meTitle'))}</h1>
    <div class="card"><h2>${esc(t('stats'))}</h2>
      <div class="kv"><span>${esc(t('starsTotal', { n: '' }))}</span><b>${starsHTML(3)} ${totalStars()} / ${LEVELS.length * 3}</b></div>
      <div class="kv"><span>${esc(t('statsPlayed'))}</span><b>${S.stats.played}</b></div>
      <div class="kv"><span>${esc(t('statsFound'))}</span><b>${S.stats.found}</b></div>
      <div class="kv"><span>${esc(t('streak'))}</span><b>${S.daily.checkin.streak}</b></div>
      <div class="kv"><span>${esc(t('hints'))}</span><b>${S.hints}</b></div></div>
    <div class="card"><h2>${esc(t('settings'))}</h2>
      <p class="sm muted" style="margin:10px 0 4px">${esc(t('language'))}</p>${seg('lang', [['en', 'English'], ['vi', 'Tiếng Việt']], S.lang)}
      <p class="sm muted" style="margin:10px 0 4px">${esc(t('theme'))}</p>${seg('theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')], ['pink', t('themePink')]], S.theme)}
      <p class="sm muted" style="margin:10px 0 4px">${esc(t('sound'))}</p>${seg('sound', [['1', t('on')], ['0', t('off')]], S.sound ? '1' : '0')}</div>
    <div class="card"><h2>${esc(t('about'))}</h2><p class="muted sm" style="margin-top:6px">${esc(t('aboutText'))}</p>
      <div class="list">
        <a class="btn" href="${CONFIG.nabuUrl}" target="_blank" rel="noopener">${esc(t('nabuApp'))}</a>
        <a class="btn" href="#/privacy">${esc(t('privacy'))}</a>
        ${Monet.backend === 'android' ? `<button class="btn" data-act="privacyOptions">${esc(t('privacyOptions'))}</button>` : ''}
        ${standalone ? '' : `<p class="faint" style="text-align:center;margin:4px 0 0">${esc(t('install'))}: Chrome ⋮ → Add to Home screen</p>`}
        <button class="btn ghost" data-act="resetAsk" style="color:var(--err)">${esc(t('reset'))}</button></div>
      <p class="faint" style="text-align:center;margin-top:10px">${esc(t('version'))} ${CONFIG.version} · ${Monet.backend}</p></div>`;
}
Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  set(el) {
    const k = el.dataset.k, v = el.dataset.v;
    if (k === 'lang') setLang(v);
    else if (k === 'theme') { S.theme = v; save(); applyTheme(); }
    else if (k === 'sound') { S.sound = v === '1'; save(); if (S.sound) SFX.tap(); }
    route();
  },
  privacyOptions() { Monet.showPrivacyOptions(); },
  resetAsk() { modal(`<h2>${esc(t('reset'))}</h2><p class="muted" style="text-align:center">${esc(t('resetSure'))}</p><div class="btns two"><button class="btn" data-act="closeModal">${esc(t('cancel'))}</button><button class="btn primary" data-act="resetDo">${esc(t('ok'))}</button></div>`, { center: true }); },
  resetDo() { resetAll(); closeModal(); go('#/home'); }
});
function renderPrivacy() {
  const P = PRIVACY, lg = S.lang;
  return `<a class="btn ghost" href="#/me">← ${esc(t('back'))}</a><h1 style="margin:8px 0">${esc(P.title[lg])}</h1><p class="faint">${esc(P.updated)}</p><p class="muted">${esc(P.intro[lg])}</p>` + P.sections.map(s => `<div class="card"><h3>${esc(s.h[lg])}</h3><p class="sm" style="margin-top:6px">${esc(s.p[lg])}</p></div>`).join('');
}
