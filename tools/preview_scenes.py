# Render the ten scenes with a sample of objects, two per row, to tools/out/scenes.png
import os, io, pathlib, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SRC = lambda n: io.open(os.path.join(ROOT, 'src', n), encoding='utf-8').read()
html = '''<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#EFE9FA}.g{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px;width:1180px}svg{width:100%;height:auto;border-radius:12px;display:block}</style><div class="g" id="g"></div><script>''' + SRC('motifs.js') + SRC('scenes.js') + SRC('gen.js') + SRC('render.js') + '''
let h=''; CHAPTERS.forEach((ch,i)=>{ const plan=planFor(ch.id, 6); const lvl=genLevel(plan, 500+i); h+=pictureSVG(lvl,'a',levelTargets(lvl).slice(0,1),'s'+i); });
document.getElementById('g').innerHTML=h;</script>'''
p = os.path.join(OUT, 'scenes.html'); io.open(p, 'w', encoding='utf-8').write(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='msedge'); pg = b.new_page(viewport={'width': 1200, 'height': 900}, device_scale_factor=1.2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(pathlib.Path(p).as_uri()); pg.wait_for_timeout(600)
    pg.screenshot(path=os.path.join(OUT, 'scenes.png'), full_page=True); print('errors', errs); b.close()
