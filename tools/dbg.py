import os, pathlib, sys
from playwright.sync_api import sync_playwright
URL = pathlib.Path(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')).as_uri()
lid = int(sys.argv[1]) if len(sys.argv) > 1 else 11
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge'); pg = b.new_page(viewport={'width':390,'height':844})
    pg.goto(URL); pg.wait_for_timeout(300); pg.evaluate('window.__fastAds=true')
    pg.evaluate("(id) => { for (let i = 1; i < id; i++) S.levels[i] = {stars: 3, best: 10}; S.tut={diff:1,same:1,mirror:1}; save(); }", lid)
    pg.evaluate("h => location.hash = h", '#/play?l=%d' % lid); pg.wait_for_timeout(200)
    print('on', pg.evaluate('GAME.on'), 'id', pg.evaluate('GAME.lvl.id'), 'type', pg.evaluate('GAME.lvl.type'), 'targets', pg.evaluate('JSON.stringify(GAME.targets)'))
    print('muts', pg.evaluate('JSON.stringify(GAME.lvl.muts)'))
    for k in range(pg.evaluate('GAME.targets.length')):
        tg = pg.evaluate("(() => { const g = GAME; return g.targets.filter(x => g.found.indexOf(x.i) < 0)[0]; })()")
        if not tg: break
        side = 'a' if k % 2 == 0 else 'b'
        x, y = tg['x'], tg['y']
        if side == 'b' and tg.get('x2') is not None: x, y = tg['x2'], tg['y2']
        if side == 'b' and pg.evaluate('!!GAME.lvl.mirror'): x = 360 - x
        box = pg.evaluate("(s => { const r = document.querySelector('#p' + s + ' svg').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })('%s')" % side)
        cx, cy = box[0] + x / 360 * box[2], box[1] + y / 300 * box[3]
        pt = pg.evaluate("([s,cx,cy]) => tapToPic(document.querySelector('#p'+s+' svg'), GAME.lvl, cx, cy)", [side, cx, cy])
        pg.mouse.click(cx, cy); pg.wait_for_timeout(60)
        print(k, side, tg['i'], (x, y), 'box', [round(v) for v in box], 'pic pt', {k2: round(v) for k2, v in pt.items()}, 'found', pg.evaluate('GAME.found'), 'misses', pg.evaluate('GAME.misses'), 'over', pg.evaluate('GAME.over'))
    b.close()
