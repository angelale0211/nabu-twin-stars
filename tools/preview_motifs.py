# Render every motif x variant to tools/out/motifs.png for a visual check.
import os, io
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
js = io.open(os.path.join(ROOT, 'src', 'motifs.js'), encoding='utf-8').read()
html = '''<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#EFE9FA;font:11px "Segoe UI",sans-serif;color:#3B2A5E}
.g{display:flex;flex-wrap:wrap;width:1200px}.c{width:110px;margin:4px;text-align:center;background:#FFF9FA;border-radius:10px;padding:4px}
svg{width:100px;height:100px;display:block;margin:0 auto}</style><div class="g" id="g"></div><script>''' + js + '''
const cols=[[PINK,GOLD],[BLUE,LILAC],[LAV,GOLD],[GOLD,PINK],[MINT,GOLD],[PEACH,BLUE]];
let h='';MOTIF_NAMES.forEach((n,k)=>{const M=MOTIFS[n];for(let v=0;v<M.vars;v++){const c=cols[(k+v)%cols.length];
h+='<div class="c"><svg viewBox="-52 -52 104 104" stroke="'+INK+'" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">'+drawObj({m:n,x:0,y:0,s:1,r:0,f:0,a:c[0],b:c[1],v:v})+'</svg>'+n+' v'+v+'</div>';}});
document.getElementById('g').innerHTML=h;</script>'''
p = os.path.join(OUT, 'motifs.html'); io.open(p, 'w', encoding='utf-8').write(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='msedge'); pg = b.new_page(viewport={'width':1220,'height':1400}, device_scale_factor=1.5)
    import pathlib
    pg.goto(pathlib.Path(p).as_uri()); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(OUT, 'motifs.png'), full_page=True)
    errs = pg.evaluate('typeof MOTIF_NAMES')
    print('ok', errs, pg.evaluate('MOTIF_NAMES.length'))
    b.close()
