# -*- coding: utf-8 -*-
"""Bake the 100 campaign levels into src/levels.js and draw contact sheets.

  python tools/bake.py            bake + validate + sheets for every chapter
  python tools/bake.py 3          sheets for chapter 3 only (still re-bakes)

Runs the generator inside a headless browser (no Node on this PC)."""
import os, io, sys, json, pathlib
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SRC = lambda n: io.open(os.path.join(ROOT, 'src', n), encoding='utf-8').read()
only = int(sys.argv[1]) if len(sys.argv) > 1 else 0

page_html = '''<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#EFE9FA;font:12px "Segoe UI",sans-serif;color:#3B2A5E}
.l{display:inline-block;width:560px;margin:6px;background:#FFF9FA;border-radius:12px;padding:6px;vertical-align:top}
.l h4{margin:2px 4px 4px;font-weight:600}.pair{display:flex;gap:4px}svg{width:270px;height:225px;border-radius:8px;display:block}
</style><div id="g"></div><script>''' + SRC('motifs.js') + SRC('scenes.js') + SRC('gen.js') + SRC('render.js') + '''
window.LEVELS = bakeAll();
window.sheet = function(ch){ let h=''; LEVELS.filter(l=>l.ch===ch).forEach(l=>{ const t=levelTargets(l);
  h+='<div class="l"><h4>'+l.id+' &middot; '+l.ch+'-'+l.n+' &middot; '+l.type+(l.mirror?' (mirror)':'')+' &middot; find '+l.find+' &middot; objs '+l.objs.length+' &middot; time '+l.time+' &middot; '+l.muts.map(m=>m.k).join(',')+'</h4><div class="pair">'+pictureSVG(l,'a',t,'s'+l.id)+pictureSVG(l,'b',t,'s'+l.id)+'</div></div>'; });
  document.getElementById('g').innerHTML=h; };
window.validate = function(){ const bad=[]; LEVELS.forEach(l=>{ const t=levelTargets(l); const plan=LEVEL_PLAN[l.id-1];
  if(l.find<3) bad.push([l.id,'find<3',l.find]); if(l.find<plan.find) bad.push([l.id,'short of plan',l.find,plan.find]);
  if(l.objs.length<plan.count-2) bad.push([l.id,'few objects',l.objs.length,plan.count]);
  for(let i=0;i<t.length;i++) for(let j=i+1;j<t.length;j++){ const d=Math.hypot(t[i].x-t[j].x,t[i].y-t[j].y); if(d<t[i].r+t[j].r) bad.push([l.id,'targets overlap',t[i].i,t[j].i]); }
  if(l.type==='same'){ const others=l.objs.length-l.keep.length; if(others<3) bad.push([l.id,'same: too few changed',others]); }
  }); return bad; };
</script>'''
p = os.path.join(OUT, 'bake.html'); io.open(p, 'w', encoding='utf-8').write(page_html)
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='msedge'); pg = b.new_page(viewport={'width': 1160, 'height': 900}, device_scale_factor=1)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(pathlib.Path(p).as_uri()); pg.wait_for_timeout(300)
    if errs: print('JS errors:', errs); sys.exit(1)
    levels = pg.evaluate('LEVELS')
    bad = pg.evaluate('validate()')
    print('levels', len(levels), 'problems', len(bad)); [print('  ', x) for x in bad[:40]]
    js = '/* Baked by tools/bake.py from gen.js: the 100 campaign levels. Do not edit by hand. */\nconst LEVELS = ' + json.dumps(levels, separators=(',', ':')) + ';\n'
    io.open(os.path.join(ROOT, 'src', 'levels.js'), 'w', encoding='utf-8', newline='\n').write(js)
    print('src/levels.js', len(js), 'bytes')
    from collections import Counter
    print('types', Counter(l['type'] for l in levels)); print('find', Counter(l['find'] for l in levels)); print('kinds', Counter(m['k'] for l in levels for m in l['muts']))
    for ch in ([only] if only else range(1, 11)):
        pg.evaluate('sheet(%d)' % ch); pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(OUT, 'ch%02d.png' % ch), full_page=True)
    b.close()
print('sheets in', OUT)
