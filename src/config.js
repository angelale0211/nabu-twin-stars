/* __PRIVACY__ */
/* ============================ settings ============================
   Things Nabu may change without touching the rest of the code. */
const CONFIG = {
  version: 3,
  appName: 'Nabu Twin Stars',
  /* Web-only ads (AdSense "Ad Placement API" for HTML5 games). Leave empty to
     keep the web version ad-free; the Android app uses AdMob through the bridge. */
  adsense: '',                       // e.g. 'ca-pub-1234567890123456'
  /* Play Billing product ids: must match the products created in Play Console. */
  skus: {
    moon60: 'moonstones_60',
    moon200: 'moonstones_200',
    moon500: 'moonstones_500',
    removeAds: 'remove_ads',
    starter: 'starter_pack'
  },
  /* Fallback price labels until the store reports real ones. */
  priceLabels: { moonstones_60: '€0.99', moonstones_200: '€2.99', moonstones_500: '€5.99', remove_ads: '€2.99', starter_pack: '€1.99' },
  /* Economy */
  startStardust: 120, startMoon: 5, startHints: 3,
  heartsMax: 5, heartRegenMin: 20,
  hintCost: 30, timeCost: 25, refillMoon: 10, mendMoon: 5, spinMoon: 5, redrawMoon: 3, skipMoon: 15,
  hintPackStardust: 150, hintPackMoon: 8, hintPack: 5,
  adHintsPerDay: 10, adRefillsPerDay: 2, adSpinsPerDay: 1, adRedrawsPerDay: 1, adContinuesPerLevel: 1,
  interstitialEvery: 3,
  /* Links */
  privacyUrl: 'https://angelale0211.github.io/nabu-twin-stars/privacy.html',
  nabuUrl: 'https://angelale0211.github.io/nabu-tarot/',
  instagram: 'https://www.instagram.com/nabutarot'
};
