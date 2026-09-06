# quick play-through of the demo build
import os, pathlib, sys
from playwright.sync_api import sync_playwright
URL = pathlib.Path(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'demo', 'index.html')).as_uri()
bad = []
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2).new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate('window.__fastAds = true; S.tut={diff:1,same:1,mirror:1}; save()')
    print('levels', pg.evaluate('LEVELS.length'), 'errors', errs[:3])
    for lid in range(1, pg.evaluate('LEVELS.length') + 1):
        pg.evaluate("(id) => { for (let i = 1; i < id; i++) if (!S.levels[i]) S.levels[i] = {stars:3,best:10}; S.hearts=5; save(); }", lid)
        pg.evaluate("h => go(h)", '#/play?l=%d' % lid); pg.wait_for_timeout(500)
        if not pg.evaluate('GAME.on'): bad.append((lid, 'did not start')); continue
        n = pg.evaluate('GAME.targets.length')
        for k in range(n):
            t = pg.evaluate("(() => { const g=GAME; return g.targets.filter(x=>g.found.indexOf(x.i)<0)[0]; })()")
            if not t: break
            side = 'a' if k % 2 == 0 else 'b'
            x, y = t['x'], t['y']
            if side == 'b' and pg.evaluate('!!GAME.lvl.mirror'): x = 360 - x
            bx = pg.evaluate("(s)=>{const r=document.querySelector('#p'+s+' img.ph').getBoundingClientRect();return [r.left,r.top,r.width,r.height];}", side)
            pg.mouse.click(bx[0] + x / 360 * bx[2], bx[1] + y / 300 * bx[3]); pg.wait_for_timeout(60)
        pg.wait_for_timeout(500)
        ok = pg.evaluate('GAME.over && GAME.found.length === GAME.targets.length')
        m = pg.evaluate('GAME.misses')
        if not ok or m: bad.append((lid, 'unsolved' if not ok else 'misses %d' % m))
        if lid in (1, 3, 6): pg.screenshot(path=os.path.join('tools', 'out', 'demo_shot%d.png' % lid))
        pg.evaluate("closeModal(); GAME.on=false; clearInterval(GAME.timer);")
    # screens
    for h in ['#/home', '#/map', '#/daily?tab=card', '#/shop', '#/me']:
        pg.evaluate("h => go(h)", h); pg.wait_for_timeout(400)
        if pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1"): bad.append((h, 'overflow'))
    pg.evaluate("h => go(h)", '#/home'); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join('tools', 'out', 'demo_home.png'))
    b.close()
print('problems:', bad if bad else 'none')
sys.exit(1 if bad else 0)
