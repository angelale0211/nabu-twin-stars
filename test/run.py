# -*- coding: utf-8 -*-
"""Headless end-to-end checks for Nabu Twin Stars.

  python build.py && PYTHONIOENCODING=utf-8 python test/run.py [--shots]

Opens index.html in headless Edge (Playwright), plays real levels by tapping
where the targets are, and exercises the daily, shop and settings flows.
Ads are the mock backend sped up (window.__fastAds)."""
import os, sys, io, json, pathlib, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
URL = pathlib.Path(os.path.join(ROOT, 'index.html')).as_uri()
SHOTS = '--shots' in sys.argv
OUT = os.path.join(HERE, 'shots'); os.makedirs(OUT, exist_ok=True)
results = []


def check(name, cond, info=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else '  ' + str(info)))


def shot(pg, name):
    if SHOTS: pg.screenshot(path=os.path.join(OUT, name + '.png'))


def goto(pg, hash_):
    pg.evaluate("h => go(h)", hash_); pg.wait_for_timeout(120)


def solve_level(pg, wrong_first=False):
    """Tap every target in picture A (and B for variety). Returns misses."""
    n = pg.evaluate('GAME.targets.length')
    if wrong_first:
        # a corner that holds no target
        box = pg.evaluate("(() => { const r = document.querySelector('#pa svg').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
        pg.mouse.click(box[0] + 3, box[1] + box[3] - 3)
        pg.wait_for_timeout(60)
    for k in range(n):
        tg = pg.evaluate("(() => { const g = GAME; const left = g.targets.filter(x => g.found.indexOf(x.i) < 0); return left[0]; })()")
        if not tg: break
        side = 'a' if k % 2 == 0 else 'b'
        x, y = tg['x'], tg['y']
        if side == 'b' and tg.get('x2') is not None: x, y = tg['x2'], tg['y2']
        if side == 'b' and pg.evaluate('!!GAME.lvl.mirror'): x = 360 - x
        box = pg.evaluate("(s => { const r = document.querySelector('#p' + s + ' svg').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })('%s')" % side)
        pg.mouse.click(box[0] + x / 360 * box[2], box[1] + y / 300 * box[3])
        pg.wait_for_timeout(40)
    pg.wait_for_timeout(500)
    return pg.evaluate('GAME.misses')


with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)
    pg.evaluate('window.__fastAds = true')
    check('boots without JS errors', not errors, errors)
    check('100 baked levels', pg.evaluate('LEVELS.length') == 100)
    check('home renders play button', pg.locator('[data-act=playNext]').count() == 1)
    shot(pg, 'home')

    # language + theme
    goto(pg, '#/me'); shot(pg, 'me')
    pg.click('[data-act=set][data-k=lang][data-v=vi]'); pg.wait_for_timeout(100)
    check('switches to Vietnamese', pg.evaluate("document.documentElement.lang") == 'vi' and 'Cài đặt' in pg.inner_text('#main'))
    pg.click('[data-act=set][data-k=theme][data-v=dark]'); pg.wait_for_timeout(100)
    check('dark theme applies', pg.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark')
    shot(pg, 'me-dark-vi')
    pg.click('[data-act=set][data-k=theme][data-v=light]'); pg.click('[data-act=set][data-k=lang][data-v=en]'); pg.wait_for_timeout(100)

    # map
    goto(pg, '#/map'); shot(pg, 'map')
    check('map shows 100 level buttons', pg.locator('.lvl').count() == 100)
    check('only level 1 open at start', pg.locator('.lvl:not(.lock)').count() == 1)
    check('chapter 2 locked by stars', pg.evaluate('chapterOpen(2)') is False)

    # play level 1 with the tutorial
    goto(pg, '#/play?l=1'); pg.wait_for_timeout(300)
    check('game screen shows two pictures', pg.locator('svg.pic').count() == 2)
    check('tutorial shown on first level', pg.locator('.tut').count() == 1)
    shot(pg, 'play-tutorial')
    pg.click('[data-act=gTutOk]'); pg.wait_for_timeout(100)
    star0 = pg.evaluate('S.stardust')
    misses = solve_level(pg, wrong_first=True)
    check('wrong tap counted as a miss', misses == 1, misses)
    check('result overlay after all found', pg.locator('.result').count() == 1)
    check('level 1 saved with stars', pg.evaluate('levelStars(1)') >= 1)
    check('stardust paid out', pg.evaluate('S.stardust') > star0)
    shot(pg, 'result')
    # double reward via (mock) ad
    pg.click('[data-act=gDouble]'); pg.wait_for_timeout(400)
    check('double reward ad grants', pg.evaluate('GAME.doubled') is True)
    pg.click('[data-act=gNext]'); pg.wait_for_timeout(400)
    check('next goes to level 2', pg.evaluate('GAME.lvl && GAME.lvl.id') == 2)
    shot(pg, 'play-level2')

    # hint on level 2: uses a free hint, then rings the first target
    hints0 = pg.evaluate('S.hints')
    pg.click('[data-act=gHint]'); pg.wait_for_timeout(100)
    check('hint consumes a hint token', pg.evaluate('S.hints') == hints0 - 1)
    check('hint ring shown on both pictures', pg.locator('.mk.hintring').count() == 2)
    # pause / resume
    pg.click('[data-act=gPause]'); pg.wait_for_timeout(100)
    check('pause overlay', pg.locator('[data-act=gResume]').count() == 1)
    pg.click('[data-act=gResume]'); pg.wait_for_timeout(100)
    solve_level(pg)
    check('level 2 cleared', pg.evaluate('levelStars(2)') >= 1)
    pg.click('[data-act=gNext]'); pg.wait_for_timeout(300)

    # play every remaining level straight through (exercises every baked level + mirror hit mapping)
    pg.evaluate("S.hearts = 5; save()")
    bad = []
    t0 = time.time()
    for lid in range(3, 101):
        pg.evaluate("(id) => { for (let i = 1; i < id; i++) if (!S.levels[i]) S.levels[i] = {stars: 3, best: 10}; save(); }", lid)
        goto(pg, '#/play?l=%d' % lid); pg.wait_for_timeout(120)
        if pg.locator('.tut').count(): pg.click('[data-act=gTutOk]')
        pg.evaluate("S.sinceAd = 0")   # keep interstitials out of the loop
        if pg.evaluate('!GAME.on || GAME.lvl.id !== %d' % lid): bad.append((lid, 'did not start')); continue
        m = solve_level(pg)
        ok = pg.evaluate('GAME.over && GAME.found.length === GAME.targets.length')
        if not ok or m: bad.append((lid, 'unsolved' if not ok else 'misses %d' % m))
        if lid in (15, 28, 50, 100): shot(pg, 'play-%d' % lid)
        pg.click('[data-act=gChest]') if pg.locator('[data-act=gChest]').count() else None
        pg.wait_for_timeout(50)
        pg.evaluate("closeModal(); GAME.on = false; clearInterval(GAME.timer);")
    check('all 100 levels solvable by tapping targets (%.0fs)' % (time.time() - t0), not bad, bad[:10])
    check('mirror level target mapping works', not [x for x in bad if x[0] % 10 == 8])
    check('chapter chests collected', pg.evaluate('Object.keys(S.chests).length') >= 9, pg.evaluate('Object.keys(S.chests).length'))
    check('300 stars possible', pg.evaluate('totalStars()') >= 100)

    # fail path: time runs out -> lose heart -> continue with moon
    goto(pg, '#/play?l=30'); pg.wait_for_timeout(150)
    hearts0 = pg.evaluate('S.hearts')
    pg.evaluate("GAME.time = 1; tickTimer(); tickTimer();"); pg.wait_for_timeout(100)
    check('time out shows fail overlay', pg.locator('[data-act=gRetry]').count() == 1)
    check('fail costs a heart', pg.evaluate('S.hearts') == hearts0 - 1)
    pg.evaluate("S.moon = 50; save()")
    pg.click('[data-act=gContinueMoon]'); pg.wait_for_timeout(100)
    check('continue with moonstones resumes', pg.evaluate('!GAME.over && GAME.time >= 30'))
    pg.evaluate("GAME.on=false; clearInterval(GAME.timer)")
    # no hearts -> modal
    pg.evaluate("S.hearts = 0; S.heartsAt = Date.now(); save()")
    goto(pg, '#/play?l=5'); pg.wait_for_timeout(150)
    check('no hearts blocks play with refill offer', pg.locator('[data-act=heartsMoon]').count() == 1)
    pg.click('[data-act=heartsMoon]'); pg.wait_for_timeout(300)
    check('moon refill starts the level', pg.evaluate('S.hearts') == 5 and pg.evaluate('GAME.on'))
    pg.evaluate("GAME.on=false; clearInterval(GAME.timer)")
    check('heart regen countdown text', pg.evaluate("S.hearts = 3; S.heartsAt = Date.now(); heartCountdown()") != '')
    pg.evaluate("S.hearts = 3; S.heartsAt = Date.now() - 21*60000; heartsNow()")
    check('hearts regenerate over time', pg.evaluate('S.hearts') == 4)

    # daily: check-in
    goto(pg, '#/daily?tab=checkin'); shot(pg, 'daily-checkin')
    s0 = pg.evaluate('S.stardust')
    pg.click('[data-act=claimCheckin]'); pg.wait_for_timeout(100)
    check('check-in day 1 gives 50 stardust', pg.evaluate('S.stardust') == s0 + 50 and pg.evaluate('S.daily.checkin.streak') == 1)
    check('check-in cannot be claimed twice', pg.locator('[data-act=claimCheckin]').count() == 0)
    pg.evaluate("S.daily.checkin = {streak: 3, last: '2020-01-01'}; save()"); goto(pg, '#/daily?tab=checkin')
    check('broken streak offers mend', pg.locator('[data-act=mendMoon]').count() == 1)
    pg.evaluate("S.moon = 20; save()"); pg.click('[data-act=mendMoon]'); pg.wait_for_timeout(100)
    check('mend keeps the streak', pg.evaluate('S.daily.checkin.streak') == 3 and pg.locator('[data-act=claimCheckin]').count() == 1)
    pg.click('[data-act=claimCheckin]'); pg.wait_for_timeout(100)
    check('claim after mend continues streak', pg.evaluate('S.daily.checkin.streak') == 4)
    # lucky draw
    goto(pg, '#/daily?tab=spin'); shot(pg, 'daily-spin')
    check('free spin available', pg.locator('[data-act=spin]').count() == 1)
    before = pg.evaluate('[S.stardust, S.moon, S.hints]')
    pg.click('[data-act=spin]'); pg.wait_for_timeout(600)
    after = pg.evaluate('[S.stardust, S.moon, S.hints]')
    check('spin grants a prize', after != before, (before, after))
    check('second spin needs ad or moon', pg.locator('[data-act=spin]').count() == 0 and pg.locator('[data-act=spinAd]').count() == 1)
    pg.click('[data-act=spinAd]'); pg.wait_for_timeout(400)
    check('ad grants an extra spin', pg.locator('[data-act=spin]').count() == 1)
    # card
    goto(pg, '#/daily?tab=card'); shot(pg, 'daily-card-deck')
    pg.click('.deck button >> nth=2'); pg.wait_for_timeout(300)
    check('card drawn and blessing set', pg.evaluate("S.daily.card.date === todayStr() && S.blessing.key.length > 0"))
    shot(pg, 'daily-card')
    check('redraw offered once', pg.locator('[data-act=redrawMoon]').count() == 1)
    pg.click('[data-act=redrawMoon]'); pg.wait_for_timeout(200)
    check('redraw replaces the card once', pg.evaluate('S.daily.card.redrawn') == 1 and pg.locator('[data-act=redrawMoon]').count() == 0)
    # challenge
    goto(pg, '#/daily?tab=challenge'); shot(pg, 'daily-challenge')
    pg.click('[data-act=playDaily]'); pg.wait_for_timeout(200)
    if pg.locator('.tut').count(): pg.click('[data-act=gTutOk]')
    check('daily challenge starts', pg.evaluate("GAME.on && GAME.lvl.daily === 1"))
    m0 = pg.evaluate('S.moon')
    solve_level(pg)
    check('daily challenge pays 2 moonstones', pg.evaluate('S.moon') == m0 + 2)
    pg.click('[data-act=gNext]'); pg.wait_for_timeout(200)
    check('challenge marked done', pg.evaluate('challengeDone()'))
    check('daily level deterministic per date', pg.evaluate("(() => { const k = l => JSON.stringify(l.a || l.objs); return k(dailyLevel('2026-09-05')) === k(dailyLevel('2026-09-05')) && k(dailyLevel('2026-09-05')) !== k(dailyLevel('2026-09-06')); })()"))

    # shop
    goto(pg, '#/shop'); shot(pg, 'shop')
    check('mock store on for file preview', pg.evaluate('Monet.mockStore') is True)
    m0 = pg.evaluate('S.moon')
    pg.click('[data-sku=moonstones_60]'); pg.wait_for_timeout(100); pg.click('#mockok'); pg.wait_for_timeout(150)
    check('buying 60 moonstones grants 60', pg.evaluate('S.moon') == m0 + 60)
    pg.click('[data-sku=remove_ads]'); pg.wait_for_timeout(100); pg.click('#mockok'); pg.wait_for_timeout(150)
    check('remove ads sets flag + bonus', pg.evaluate('S.adsRemoved && S.owned.indexOf("remove_ads") >= 0'))
    check('interstitial skipped when ads removed', pg.evaluate("(() => { let r = 'none'; Monet.interstitial(ok => { r = ok; }); return r; })()") is False)
    h0 = pg.evaluate('S.hints')
    pg.click('[data-act=hintsStardust]'); pg.wait_for_timeout(100)
    check('hint pack for stardust', pg.evaluate('S.hints') == h0 + 5)
    pg.click('[data-act=giftAd]'); pg.wait_for_timeout(400)
    check('ad gift grants stardust and counts', pg.evaluate('S.daily.ads.gifts') == 1)
    pg.evaluate("S.stardust = 0; save()"); goto(pg, '#/shop')
    pg.click('[data-act=hintsStardust]'); pg.wait_for_timeout(100)
    check('cannot buy without stardust', pg.evaluate('S.hints') == h0 + 5)
    # native bridge message handling
    pg.evaluate("__nabuNative(JSON.stringify({type:'products', items:[{sku:'moonstones_60', price:'0,99 €'}]}))")
    check('native product prices applied', pg.evaluate("Monet.price('moonstones_60')") == '0,99 €')
    pg.evaluate("__nabuNative({type:'purchase', sku:'starter_pack', ok:true})")
    check('native purchase without callback still grants', pg.evaluate('S.starter') is True)
    # privacy + reset
    goto(pg, '#/privacy'); check('privacy screen renders', 'AdMob' in pg.inner_text('#main'))
    goto(pg, '#/me'); pg.click('[data-act=resetAsk]'); pg.wait_for_timeout(100); pg.click('[data-act=resetDo]'); pg.wait_for_timeout(200)
    check('reset clears progress', pg.evaluate('totalStars()') == 0 and pg.evaluate('S.stardust') == 120)
    check('no JS errors during run', not errors, errors[:5])

    # layout: nothing wider than the viewport on the game screen and the home
    for h in ['#/home', '#/play?l=1', '#/map', '#/daily?tab=spin']:
        goto(pg, h); pg.wait_for_timeout(200)
        if pg.locator('.tut').count(): pg.click('[data-act=gTutOk]')
        over = pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
        check('no horizontal overflow on ' + h, over)
    # small phone
    pg.set_viewport_size({'width': 360, 'height': 640}); goto(pg, '#/play?l=1'); pg.wait_for_timeout(200)
    if pg.locator('.tut').count(): pg.click('[data-act=gTutOk]')
    fits = pg.evaluate("(() => { const r = document.querySelector('#gtools').getBoundingClientRect(); return r.bottom <= window.innerHeight; })()")
    check('game fits a 360x640 phone without scrolling', fits)
    shot(pg, 'play-small')
    b.close()

fails = [n for n, ok in results if not ok]
print('\n%d checks, %d failed' % (len(results), len(fails)))
sys.exit(1 if fails else 0)
