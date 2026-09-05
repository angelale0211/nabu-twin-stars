# Releasing on Google Play

Everything below is done on websites; nothing needs installing on the PC.

## 1. Get a build

Every push to `main` runs **Actions → Android** on GitHub. Open the run,
scroll to *Artifacts*, download `NabuTwinStars-debug-apk`, copy the APK to
the phone and open it (allow "install unknown apps"). The debug build shows
Google's **test ads** and lets you try the whole game for free.

## 2. Upload key (once, keep forever)

Run **Actions → Make upload keystore → Run workflow**. It creates a keystore
with random passwords and uploads `upload.keystore`, `upload.keystore.b64`
and `passwords.txt` as an artifact. Download it, back it up (Play needs the
same key for every future update), then add four repository secrets
(Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `KEYSTORE_B64` | contents of `upload.keystore.b64` |
| `KEYSTORE_PASS` | store password from `passwords.txt` |
| `KEY_ALIAS` | `upload` |
| `KEY_PASS` | key password from `passwords.txt` |

From then on every push also produces `NabuTwinStars-release` with the
signed `app-release.aab` for Play.

## 3. AdMob

1. https://admob.google.com → Apps → Add app → Android, "Nabu Twin Stars",
   not yet on Play (link it later).
2. Ad units: one **Rewarded**, one **Interstitial**.
3. Paste the three ids into `android/app/src/main/res/values/ads.xml`
   (`admob_app_id`, `admob_rewarded`, `admob_interstitial`), commit, push.
4. Payments: add the payout details in AdMob once earnings reach the
   threshold notice.
5. `app-ads.txt`: AdMob shows a line to publish at the developer website
   root. Put it at `https://angelale0211.github.io/app-ads.txt` (the
   `angelale0211.github.io` repository) and use that domain as the
   developer website in the Play listing.

Until the real ids are pasted the app uses Google's test ids, which show
"Test Ad" and earn nothing. Never click your own real ads.

## 4. Play Console

- Account: https://play.google.com/console ($25 once, identity check).
- Create app: "Nabu Twin Stars", game, free. Package id is fixed by the
  build: `app.nabutarot.twinstars`.
- **Monetise → Products → In-app products**: create these five, all *managed*:
  `moonstones_60` (€0.99), `moonstones_200` (€2.99), `moonstones_500`
  (€5.99), `starter_pack` (€1.99), `remove_ads` (€2.99). Names and
  descriptions can be copied from docs/GAME-DESIGN.md §5.
- Store listing: `store_icon_512.png`, `feature_graphic_1024x500.png`,
  2–8 real phone screenshots (take them from the debug APK), short and
  full description (VI + EN). Privacy policy URL:
  `https://angelale0211.github.io/nabu-twin-stars/privacy.html`.
- App content: Ads = **yes**; Data safety: collects *Device or other IDs*
  (advertising ID) for advertising, by the AdMob SDK, not shared by you;
  no account, no personal data. Content rating: puzzle game, no violence
  → Everyone. Target audience: 13+ is simplest (a "families" listing would
  need AdMob's child-directed setup).
- Testing: personal accounts must run a closed test with **12 testers for
  14 days** before production. Upload the AAB to *Closed testing*, add the
  testers' Gmail addresses, share the opt-in link.
- Licence testers (Setup → Licence testing) can buy the products for free
  to check the store flow; purchases then show "test" in Play.

## 5. Each update

1. Edit, `python build.py`, `PYTHONIOENCODING=utf-8 python test/run.py`.
2. Bump `versionCode` (+1) and `versionName` in
   `android/app/build.gradle.kts`, `CACHE` in `sw.js`, `CONFIG.version`.
3. Commit + push. Download the new AAB from Actions, upload to Play.

## 6. Where the money settings live

| Thing | File |
|---|---|
| Ad unit ids | `android/app/src/main/res/values/ads.xml` |
| Product ids | `src/config.js` (`skus`) and `BillingManager.kt` |
| Fallback price labels | `src/config.js` (`priceLabels`), replaced by Play's real prices at runtime |
| Daily caps, costs | `src/config.js` |
| Interstitial cadence | `CONFIG.interstitialEvery` |
