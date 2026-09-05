# Nabu Twin Stars

A cosy spot-the-difference game for Android (and the web) in the Nabu Tarot
style: two drawn pictures, tap what changed. Tarot cards, moons, planets,
crystals, tea cups and zodiac badges; nothing scary. Vietnamese and English.

- Play in the browser: https://angelale0211.github.io/nabu-twin-stars/
- Design: [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) · all 100 levels: [docs/LEVELS.md](docs/LEVELS.md) · Play release steps: [docs/RELEASE.md](docs/RELEASE.md)

## How it is built

Every picture is drawn at runtime from small vector motifs (`src/motifs.js`)
placed on a chapter background (`src/scenes.js`). A level is data: the placed
objects plus a list of changes for picture B. Because the geometry is known,
taps are checked exactly and no image files ship at all. The 100 campaign
levels are generated once by `src/gen.js` and frozen in `src/levels.js`; the
daily challenge is generated from the date.

```
src/            game source (assembled into index.html by build.py)
  motifs.js     53 drawn motifs, the art library
  scenes.js     10 chapter backgrounds + which motifs belong there
  gen.js        level generator + difficulty plan for 100 levels
  levels.js     the baked 100 levels (do not edit; re-bake)
  render.js     picture SVG, tap -> picture coordinates, hit test
  core.js       saved state, language, theme, money, hearts, UI helpers
  game.js       the play screen, results, fail/continue
  home.js map.js daily.js shop.js me.js   screens
  monet.js      ads + purchases adapter (android bridge / web / mock)
  sfx.js        synthesised sounds
  strings.js    EN + VI text, the 22 daily cards
  config.js     prices, caps, product ids, links
android/        Kotlin wrapper: WebView + AdMob + Play Billing (built by GitHub Actions)
tools/          bake.py (levels + contact sheets), preview_motifs.py, level_table.py
test/run.py     headless end-to-end test (plays all 100 levels)
```

## Everyday commands (Windows, Python only)

```
python build.py                                  # src -> index.html (+ copy into android assets)
PYTHONIOENCODING=utf-8 python test/run.py --shots  # ~3 min, screenshots in test/shots/
python tools/bake.py                             # re-bake levels + contact sheets in tools/out/
python tools/preview_motifs.py                   # sheet of every motif
python make_icons.py                             # icons for web, Play and Android
python tools/level_table.py                      # docs/LEVELS.md
```

Bump `CACHE` in `sw.js` and `versionCode` in `android/app/build.gradle.kts`
for every release.

## Android

The web page ships inside a small native app (`android/`). The native side
adds AdMob (rewarded + interstitial, with the EU consent form), Google Play
Billing and vibration, and talks to the page through `window.NabuAndroid`
and `window.__nabuNative`. GitHub Actions builds it on every push
(Actions -> Android -> Artifacts): a debug APK to sideload, and a signed
AAB once the signing secrets exist. See docs/RELEASE.md.

Ad unit ids live in `android/app/src/main/res/values/ads.xml` (Google's test
ids by default). Product ids live in `config.js` and `BillingManager.kt`.
