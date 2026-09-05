import os, pathlib, sys, time
from playwright.sync_api import sync_playwright
URL = pathlib.Path(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')).as_uri()
a, z = int(sys.argv[1]), int(sys.argv[2])
def goto(pg, h): pg.evaluate("h => { location.hash = h; }", h); pg.wait_for_timeout(120)
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge'); pg = b.new_page(viewport={'width':390,'height':844})
    pg.goto(URL); pg.wait_for_timeout(300); pg.evaluate('window.__fastAds=true; S.tut={diff:1,same:1,mirror:1}; save()')
    for lid in range(a, z+1):
        pg.evaluate("(id) => { for (let i = 1; i < id; i++) if (!S.levels[i]) S.levels[i] = {stars: 3, best: 10}; save(); }", lid)
        goto(pg, '#/play?l=%d' % lid)
        if pg.locator('.tut').count(): pg.click('[data-act=gTutOk]')
        pg.evaluate("S.sinceAd = 0")
        st = pg.evaluate('[GAME.on, GAME.lvl.id, GAME.over, GAME.targets.length, location.hash]')
        for k in range(pg.evaluate('GAME.targets.length')):
            tg = pg.evaluate("(() => { const g = GAME; return g.targets.filter(x => g.found.indexOf(x.i) < 0)[0]; })()")
            if not tg: break
            side = 'a' if k % 2 == 0 else 'b'
            x, y = tg['x'], tg['y']
            if side == 'b' and tg.get('x2') is not None: x, y = tg['x2'], tg['y2']
            if side == 'b' and pg.evaluate('!!GAME.lvl.mirror'): x = 360 - x
            box = pg.evaluate("(s => { const r = document.querySelector('#p' + s + ' svg').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })('%s')" % side)
            cx, cy = box[0] + x / 360 * box[2], box[1] + y / 300 * box[3]
            if lid == z: print('  tap', k, side, tg, (round(cx), round(cy)), pg.evaluate("([x,y]) => { const e = document.elementFromPoint(x,y); return e ? e.tagName + '.' + e.className + ' paused=' + GAME.paused + ' over=' + GAME.over : 'none'; }", [cx, cy]))
            pg.mouse.click(cx, cy); pg.wait_for_timeout(40)
            if lid == z: print('     ->', pg.evaluate('[GAME.found, GAME.misses]'))
        pg.wait_for_timeout(500)
        print(lid, 'start', st, 'end', pg.evaluate('[GAME.over, GAME.found.length, GAME.targets.length, GAME.misses, GAME.lvl.id]'))
        if pg.locator('[data-act=gChest]').count(): pg.click('[data-act=gChest]')
        pg.wait_for_timeout(50)
        pg.evaluate("closeModal(); GAME.on = false; clearInterval(GAME.timer);")
    b.close()
