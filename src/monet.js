/* ============================ monetisation adapter ============================
   One small API the game calls; three backends behind it:
     android  the Kotlin wrapper (AdMob rewarded/interstitial + Play Billing)
              exposed as window.NabuAndroid, answering through __nabuNative()
     web      AdSense "Ad Placement API" (H5 games) when CONFIG.adsense is set
     mock     a clearly labelled stand-in so the web preview and tests can run
   Purchases only ever happen on Android (Play Billing). The mock store is on
   only when the page is opened from a file or localhost (developer preview). */
const Monet = {
  backend: 'mock', prices: {}, pending: {}, ready: { rewarded: false, interstitial: false }, privacyRequired: false,
  init() {
    if (window.NabuAndroid) {
      this.backend = 'android';
      try { window.NabuAndroid.queryProducts(); } catch (e) {}
      try { this.privacyRequired = !!window.NabuAndroid.isPrivacyOptionsRequired(); } catch (e) {}
    } else if (CONFIG.adsense && window.adBreak) {
      this.backend = 'web';
    }
    this.mockStore = this.backend === 'mock' && /^(file:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href);
  },
  price(sku) { return this.prices[sku] || CONFIG.priceLabels[sku] || ''; },
  /* rewarded ad: cb(true) only when the user earned the reward */
  reward(placement, cb) {
    S.stats.ads++; save();
    if (this.backend === 'android') {
      this.pending['reward'] = cb;
      try { window.NabuAndroid.showRewarded(placement); } catch (e) { delete this.pending.reward; cb(false); }
      return;
    }
    if (this.backend === 'web') {
      let got = false;
      window.adBreak({ type: 'reward', name: placement,
        beforeReward: showAd => showAd(),
        adViewed: () => { got = true; },
        adDismissed: () => {},
        adBreakDone: () => cb(got) });
      return;
    }
    mockAd(placement, cb);
  },
  interstitial(cb) {
    cb = cb || function () {};
    if (S.adsRemoved) return cb(false);
    if (this.backend === 'android') { this.pending['interstitial'] = cb; try { window.NabuAndroid.showInterstitial(); } catch (e) { cb(false); } return; }
    if (this.backend === 'web') { window.adBreak({ type: 'next', name: 'between_levels', adBreakDone: () => cb(true) }); return; }
    mockAd('interstitial', cb, true);
  },
  buy(sku, cb) {
    if (this.backend === 'android') { this.pending['purchase:' + sku] = cb; try { window.NabuAndroid.buy(sku); } catch (e) { cb(false); } return; }
    if (this.mockStore) {
      modal(`<h2>${esc(t('mockBuy'))}</h2><p class="muted" style="text-align:center">${esc(t('mockBuySub'))}</p><div class="btns two"><button class="btn" data-act="closeModal">${esc(t('cancel'))}</button><button class="btn primary" id="mockok">${esc(t('ok'))} · ${esc(Monet.price(sku))}</button></div>`, { center: true });
      document.getElementById('mockok').onclick = () => { closeModal(); cb(true); };
      return;
    }
    toast(t('storeOff')); cb(false);
  },
  restore(cb) {
    if (this.backend === 'android') { this.pending['restore'] = cb; try { window.NabuAndroid.restore(); } catch (e) { cb([]); } return; }
    cb(S.owned || []);
  },
  showPrivacyOptions() { if (this.backend === 'android') { try { window.NabuAndroid.privacyOptions(); } catch (e) {} } },
  vibrate(ms) { try { if (window.NabuAndroid) window.NabuAndroid.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
};

/* Messages from the Android wrapper. */
window.__nabuNative = function (msg) {
  try { if (typeof msg === 'string') msg = JSON.parse(msg); } catch (e) { return; }
  if (!msg || !msg.type) return;
  if (msg.type === 'reward') { const cb = Monet.pending.reward; delete Monet.pending.reward; if (cb) cb(!!msg.ok); }
  else if (msg.type === 'interstitial') { const cb = Monet.pending.interstitial; delete Monet.pending.interstitial; if (cb) cb(!!msg.ok); }
  else if (msg.type === 'purchase') { const cb = Monet.pending['purchase:' + msg.sku]; delete Monet.pending['purchase:' + msg.sku]; if (cb) cb(!!msg.ok); else if (msg.ok) grantPurchase(msg.sku); }
  else if (msg.type === 'products') { (msg.items || []).forEach(p => { Monet.prices[p.sku] = p.price; }); if (location.hash.indexOf('#/shop') === 0) route(); }
  else if (msg.type === 'restore') { const cb = Monet.pending.restore; delete Monet.pending.restore; if (cb) cb(msg.owned || []); }
  else if (msg.type === 'adReady') { Monet.ready.rewarded = !!msg.rewarded; Monet.ready.interstitial = !!msg.interstitial; }
  else if (msg.type === 'privacy') { Monet.privacyRequired = !!msg.required; }
};

/* The stand-in ad: a labelled 5-second screen. Never shown in the Android build. */
function mockAd(placement, cb, short) {
  const secs = short ? 2 : 5;
  const box = document.createElement('div');
  box.className = 'adbox';
  box.innerHTML = `<div class="eyebrow" style="color:#E5BE5E">${esc(t('adTest'))}</div><div class="frame">${icon('ad')}</div><div class="count" id="adcount">${secs}</div><div class="sm" style="opacity:.8">${esc(t('adTestSub'))}</div>`;
  document.body.appendChild(box);
  let n = secs;
  const iv = setInterval(() => {
    n--; const c = document.getElementById('adcount'); if (c) c.textContent = n;
    if (n <= 0) { clearInterval(iv); box.remove(); cb(true); }
  }, window.__fastAds ? 20 : 1000);
}

/* What each product gives. Called after a real or mock purchase. */
function grantPurchase(sku) {
  const K = CONFIG.skus;
  if (sku === K.moon60) addMoon(60);
  else if (sku === K.moon200) addMoon(200);
  else if (sku === K.moon500) addMoon(500);
  else if (sku === K.removeAds) { if (!S.adsRemoved) { S.adsRemoved = true; addMoon(100); } }
  else if (sku === K.starter) { if (!S.starter) { S.starter = true; addMoon(120); addHints(10); } }
  if ((sku === K.removeAds || sku === K.starter) && S.owned.indexOf(sku) < 0) S.owned.push(sku);
  save(); SFX.chime(); toast(t('thanks'));
}
