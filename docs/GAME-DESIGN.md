# Nabu Twin Stars · game design

Working title for the Play listing: **Nabu Twin Stars – Spot the Difference**.
Package id `app.nabutarot.twinstars`. Portrait, one hand, offline.

## 1. The idea

Two pictures, one above the other. Something changed between them. Tap it.
The pictures are drawn in the Nabu Tarot style (soft lavender, cream, deep
purple outlines, gold sparkles) from a library of 53 motifs: moons, suns,
stars, planets, comets, tarot cards, the four suit emblems (cups, wands,
swords, pentacles), crystals, candles, incense, lotus, tea cups, potions,
zodiac badges for all 12 signs, cats, owls, moon rabbits, butterflies.
Nothing creepy: the Death card is called *Renewal*, the Devil is *The
Tempter*, and every face is smiling with closed eyes and blush.

## 2. Rules

| Stage type | How many | Rule |
|---|---|---|
| **Differences** (standard) | 77 | Tap what is different. Each change is one of: colour, detail (variant), missing, flipped, turned, size, moved, swapped for another object. |
| **Similarities** (bonus) | 15 (level 5 of every chapter, level 10 of even chapters) | Almost everything changed. Tap only what stayed exactly the same. |
| **Mirror** (special) | 8 (level 8 of chapters 3–10) | Picture B is a mirror image; the differences are still there. |

Wrong tap: −5 s on timed levels and one miss. Too many misses (8 untimed, 6
timed) or time out = the level fails and costs one heart. Chapters 1–2 have
no timer; timers start at 150 s in chapter 3 and drop to 60 s by 10-10.

**Stars.** Par = 14 s per target + 16 s. 3 stars: within par and at most 1
miss. 2 stars: within 1.8 × par or at most 3 misses. 1 star: cleared.

## 3. The 100 levels

Ten chapters of ten, each with a scene, a tarot card patron and a star gate:

| Ch | Scene | Card | Stars to open | Timer | Find | Objects |
|---|---|---|---|---|---|---|
| 1 | Fool's Meadow | The Fool | 0 | none | 3–6 | 7–10 |
| 2 | Moon Pond | The Moon | 12 | none | 3–5 | 8–11 |
| 3 | Star Attic | The Star | 30 | 150→120 s | 4–6 | 9–12 |
| 4 | Tea Room | Temperance | 50 | 150→120 s | 4–6 | 9–12 |
| 5 | Crystal Cave | The Hermit | 72 | 120→90 s | 5–7 | 10–13 |
| 6 | Zodiac Garden | Wheel of Fortune | 96 | 120→90 s | 5–7 | 11–14 |
| 7 | Planet Walk | The World | 120 | 105→75 s | 6–7 | 11–14 |
| 8 | Temple of Cups | The High Priestess | 146 | 105→75 s | 6–7 | 12–15 |
| 9 | Cloud Kingdom | The Sun | 172 | 90→60 s | 7 | 13–16 |
| 10 | Nabu's Observatory | The Magician | 200 | 90→60 s | 7 | 13–16 |

Inside a chapter: 1–3 warm up, 4 is subtle (near colours, small size and
angle changes), 5 is the similarities bonus, 6–7 harder, 8 mirror (ch 3+),
9 hard, 10 boss (7 targets) or the big similarities stage. Subtlety grows by
chapter: early chapters use missing/swapped/strong colour changes; late
chapters use look-alike colours, small moves and 22° turns.

The full table with every change per level is in [LEVELS.md](LEVELS.md).
Levels are frozen data (`src/levels.js`); re-roll one by adding a seed to
`LEVEL_SEEDS` in `gen.js` and running `python tools/bake.py`.

Clearing a whole chapter opens the **chapter chest**: 200 ✦ + 10 🌙.
A locked level can be skipped for 15 🌙.

## 4. Economy

| Currency | Icon | Comes from | Spent on |
|---|---|---|---|
| Stardust | ✦ | levels (10 + 6 per target, ×1.3 similarities, ×1.2 mirror, +50 % for 3 stars, +20 first clear), check-in, lucky draw, ad gifts | hints (30), +30 s (25), 5-hint pack (150) |
| Moonstones | 🌙 | 1 per first clear, 2 per first 3-star, chests, check-in days 5 and 7, wheel, **purchases** | continue after fail (5), heart refill (10), streak mend (5), extra spin (5), card redraw (3), 5-hint pack (8), skip level (15) |
| Hearts | ❤ | 5 max, one back every 20 min, refill by ad (2/day) or 10 🌙 | lost when a level fails |
| Hints | 💡 | 3 to start, check-in, wheel, packs, ads (10/day) | reveal one target |

Start: 120 ✦, 5 🌙, 3 hints, 5 hearts.

## 5. Making money (Google)

**AdMob** (Android app), all through the Kotlin bridge. Rewarded ads are
always the player's choice:

| Placement | Gives | Cap |
|---|---|---|
| `double` | double the level reward | once per clear |
| `continue` | +30 s and misses forgiven after a fail | once per level |
| `hint` | +1 hint (in level or shop) | 10 / day |
| `hearts` | full refill | 2 / day |
| `spin` | extra lucky-draw spin | 1 / day |
| `redraw` | draw today's card again | 1 / day |
| `mend` | mend a broken check-in streak | when needed |
| `gift` | +20 ✦ in the shop | 5 / day |

Interstitial: after every 3rd cleared level, never for ad-free buyers. The
EU consent form (UMP) shows before any ad; "Ad privacy options" sits in Me.

**Google Play Billing** (small prices, set in Play Console):

| Product id | What | Suggested price |
|---|---|---|
| `moonstones_60` | 60 🌙 | €0.99 |
| `moonstones_200` | 200 🌙 (best value) | €2.99 |
| `moonstones_500` | 500 🌙 | €5.99 |
| `starter_pack` | 120 🌙 + 10 hints, once | €1.99 |
| `remove_ads` | no interstitials + 100 🌙 | €2.99 |

Everything purchasable can also be earned by playing (Play policy friendly,
and it keeps the game kind).

The web version on GitHub Pages has no ads and no store; set
`CONFIG.adsense` to turn on AdSense H5 game ads there if ever wanted.

## 6. Daily activities

- **Check-in** (7-day cycle, streak): 50 ✦ · 75 ✦ · 1 hint · 100 ✦ · 3 🌙 · 150 ✦ + hint · 10 🌙 + 200 ✦. Missing a day breaks the streak; mend it with an ad or 5 🌙.
- **Lucky draw**: one free spin a day; a second by ad, more for 5 🌙. Slots (weights): 20 ✦ (22), 50 ✦ (18), hint (14), 100 ✦ (12), 1 🌙 (14), 30 ✦ (12), 3 🌙 (5), 200 ✦ (3).
- **Check your luck**: draw one of 22 Major Arcana. Each has a two-line cheerful reading (EN/VI) and a blessing for the day: +25 % stardust, +1 hint, extra spin, hearts refilled, +20 s on timed levels, wrong taps cost no time, or next level pays double. One redraw by ad or 3 🌙.
- **Daily challenge**: a generated level from the date (harder, 4–7 targets, timed) for 80 ✦ + 2 🌙.

## 7. Screens

Home (next level, progress, today's card, daily tiles) · Levels (10 chapter
cards with scene thumbnails and 10 bubbles each; `=` marks similarities
stages, `⇄` mirror stages) · Play · Daily (4 tabs) · Shop · Me (language,
theme auto/light/dark/pink, sound, stats, privacy, reset).

## 8. Art rules

- 100 × 100 motif box, deep-purple outline 2.4, pastel fills from the Nabu swatch (pink, blue, lavender, gold, mint, peach, lilac, rose, sky, leaf, sand, cream).
- Faces are closed-eye smiles with blush. No fangs, skulls, blood, or spooky darkness; night skies are lavender with sparkles.
- Backgrounds carry the chapter mood; objects carry the puzzle. Objects never overlap.
