/* ============================ shop ============================ */
function renderShop() {
  const K = CONFIG.skus, ads = dailyAds();
  const gem = (a, b, s) => `<svg viewBox="0 0 100 100" stroke="#3D2A6E" stroke-width="2.4" stroke-linejoin="round">${drawObj({ m: 'gem', x: 50, y: 50, s: s || 1, r: 0, f: 0, a: a, b: b, v: 0 })}${drawObj({ m: 'moon', x: 78, y: 26, s: 0.32, r: 0, f: 0, a: GOLD, b: GOLD, v: 0 })}</svg>`;
  const pack = (sku, n, art, best) => `<div class="pack">${best ? `<span class="best">${esc(t('packBest'))}</span>` : ''}${art}<b>${esc(t('packMoon', { n }))}</b><button class="btn primary" data-act="buy" data-sku="${sku}">${esc(Monet.price(sku))}</button></div>`;
  return `<h1 style="margin-bottom:4px">${esc(t('shopTitle'))}</h1><p class="muted sm">${esc(t('shopSub'))}</p>
    ${Monet.backend !== 'android' && !Monet.mockStore ? `<p class="faint">${esc(t('storeOff'))}</p>` : ''}
    <div class="eyebrow" style="margin-bottom:8px">${esc(t('moon'))}</div>
    <div class="shopgrid">${pack(K.moon60, 60, gem(LAV, GOLD, 0.9))}${pack(K.moon200, 200, gem(BLUE, GOLD, 1.05), true)}${pack(K.moon500, 500, gem(GOLD, PINK, 1.2))}</div>
    <div class="list" style="margin-top:12px">
      ${S.starter ? '' : `<div class="item">${icon('gift')}<div class="t"><b>${esc(t('packStarter'))}</b><span>${esc(t('packStarterSub'))}</span></div><button class="btn primary" data-act="buy" data-sku="${K.starter}">${esc(Monet.price(K.starter))}</button></div>`}
      <div class="item">${icon('ad')}<div class="t"><b>${esc(t('removeAds'))}</b><span>${esc(t('removeAdsSub'))}</span></div>${S.adsRemoved ? `<span class="chip mint">${esc(t('removed'))}</span>` : `<button class="btn primary" data-act="buy" data-sku="${K.removeAds}">${esc(Monet.price(K.removeAds))}</button>`}</div>
    </div>
    <div class="eyebrow" style="margin:14px 0 8px">${esc(t('hints'))} · ${S.hints}</div>
    <div class="list">
      <div class="item">${icon('hint')}<div class="t"><b>${esc(t('hintPack'))}</b><span>${CONFIG.hintPackStardust} ✦</span></div><button class="btn" data-act="hintsStardust">${esc(t('buyWith', { p: CONFIG.hintPackStardust + ' ✦' }))}</button></div>
      <div class="item">${icon('hint')}<div class="t"><b>${esc(t('hintPack'))}</b><span>${CONFIG.hintPackMoon} 🌙</span></div><button class="btn gold" data-act="hintsMoon">${esc(t('buyWith', { p: CONFIG.hintPackMoon + ' 🌙' }))}</button></div>
      <div class="item">${icon('ad')}<div class="t"><b>+1 ${esc(t('hint'))}</b><span>${esc(t('adGiftLeft', { n: Math.max(0, CONFIG.adHintsPerDay - ads.hints) }))}</span></div><button class="btn pinkish" data-act="hintAd" ${ads.hints >= CONFIG.adHintsPerDay ? 'disabled' : ''}>${esc(t('freeAd'))}</button></div>
    </div>
    <div class="eyebrow" style="margin:14px 0 8px">${esc(t('bonusAd'))}</div>
    <div class="list">
      <div class="item">${icon('stardust')}<div class="t"><b>${esc(t('adGift'))}</b><span>${esc(t('adGiftLeft', { n: Math.max(0, 5 - ads.gifts) }))}</span></div><button class="btn pinkish" data-act="giftAd" ${ads.gifts >= 5 ? 'disabled' : ''}>${esc(t('freeAd'))}</button></div>
      <div class="item">${icon('heart')}<div class="t"><b>${esc(t('hearts'))} ${S.hearts}/${CONFIG.heartsMax}</b><span>${esc(t('adGiftLeft', { n: Math.max(0, CONFIG.adRefillsPerDay - ads.refills) }))} · ${CONFIG.refillMoon} 🌙</span></div><button class="btn pinkish" data-act="heartsAd" ${ads.refills >= CONFIG.adRefillsPerDay || S.hearts >= CONFIG.heartsMax ? 'disabled' : ''}>${esc(t('freeAd'))}</button><button class="btn gold" data-act="heartsMoon" ${S.hearts >= CONFIG.heartsMax ? 'disabled' : ''}>${CONFIG.refillMoon} 🌙</button></div>
    </div>
    <p style="text-align:center;margin-top:16px"><button class="btn ghost" data-act="restore">${esc(t('restore'))}</button></p>`;
}
Object.assign(window.ACTIONS = window.ACTIONS || {}, {
  buy(el) { const sku = el.dataset.sku; Monet.buy(sku, ok => { if (ok) { grantPurchase(sku); route(); } }); },
  hintsStardust() { if (spendStardust(CONFIG.hintPackStardust)) { addHints(CONFIG.hintPack); SFX.chime(); route(); } },
  hintsMoon() { if (spendMoon(CONFIG.hintPackMoon)) { addHints(CONFIG.hintPack); SFX.chime(); route(); } },
  hintAd() { const ads = dailyAds(); if (ads.hints >= CONFIG.adHintsPerDay) return; Monet.reward('hint', ok => { if (ok) { ads.hints++; addHints(1); SFX.chime(); route(); } else toast(t('adFail')); }); },
  giftAd() { const ads = dailyAds(); if (ads.gifts >= 5) return; Monet.reward('gift', ok => { if (ok) { ads.gifts++; addStardust(20); SFX.coin(); route(); } else toast(t('adFail')); }); },
  restore() { Monet.restore(owned => { (owned || []).forEach(sku => { if (S.owned.indexOf(sku) < 0) grantPurchase(sku); }); toast(t('restored')); route(); }); }
});
