# -*- coding: utf-8 -*-
"""Assemble index.html from src/ and copy it into the Android app's assets.
Run:  python build.py
Order matters: config and strings first, art before the generator, baked
levels before the game code, screens before main.js."""
import io, os, re, sys, json, html as htmlmod, shutil

DEMO = len(sys.argv) > 1 and sys.argv[1] == 'demo'

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
SCRIPTS = ['config.js', 'logo-data.js', 'strings.js', 'motifs.js', 'scenes.js', 'gen.js', ('levels-demo.js' if DEMO else 'levels.js'), 'credits.js', 'render.js',
           'core.js', 'sfx.js', 'monet.js', 'game.js', 'home.js', 'map.js', 'daily.js', 'shop.js', 'me.js', 'main.js']


def read(name):
    if DEMO and name == 'credits.js':
        return 'const CREDITS = [];'   # demo art is generated, not photographed
    return io.open(os.path.join(SRC, name), encoding='utf-8').read()


shell = read('shell.html')
shell = shell.replace('/* __FONTS__ */', read('fonts.css').rstrip())
js = '\n\n'.join(read(s).rstrip() for s in SCRIPTS)
js = js.replace('/* __PRIVACY__ */', 'const PRIVACY = ' + json.dumps(json.load(io.open(os.path.join(HERE, 'privacy.json'), encoding='utf-8')), ensure_ascii=False) + ';')
assert 'const PRIVACY' in js
assert '</script' not in js.lower(), 'a script source contains a closing script tag'
page = shell.replace('<!-- __SCRIPTS__ -->', '<script>\n' + js + '\n</script>')
ext = re.findall(r'<(?:script|link|img)[^>]+(?:src|href)="(https?:[^"]+)"', page)
assert not ext, 'external resources: %s' % ext
outdir = os.path.join(HERE, 'demo') if DEMO else HERE
os.makedirs(outdir, exist_ok=True)
io.open(os.path.join(outdir, 'index.html'), 'w', encoding='utf-8', newline='\n').write(page)
print(('demo/' if DEMO else '') + 'index.html: %d bytes' % len(page.encode('utf-8')))
if DEMO:
    for f in ('manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'icon-180.png', 'sw.js'):
        if os.path.exists(os.path.join(HERE, f)): shutil.copy(os.path.join(HERE, f), os.path.join(outdir, f))
    raise SystemExit(0)

# Android: the same page ships inside the APK so the game works offline.
assets = os.path.join(HERE, 'android', 'app', 'src', 'main', 'assets', 'www')
os.makedirs(assets, exist_ok=True)
shutil.copy(os.path.join(HERE, 'index.html'), os.path.join(assets, 'index.html'))
img_src = os.path.join(HERE, 'img')
if os.path.isdir(img_src):
    shutil.copytree(img_src, os.path.join(assets, 'img'), dirs_exist_ok=True)
print('copied to', assets)

# privacy.html for the store listing (built from privacy.json, VI + EN).
P = json.load(io.open(os.path.join(HERE, 'privacy.json'), encoding='utf-8'))
def block(lg):
    return '<h1>' + htmlmod.escape(P['title'][lg]) + '</h1><p class="d">' + htmlmod.escape(P['updated']) + '</p><p class="lead">' + htmlmod.escape(P['intro'][lg]) + '</p>' + ''.join('<h2>' + htmlmod.escape(s['h'][lg]) + '</h2><p>' + htmlmod.escape(s['p'][lg]) + '</p>' for s in P['sections'])
priv = ('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nabu Twin Stars: ' + htmlmod.escape(P['title']['vi']) + ' / ' + htmlmod.escape(P['title']['en']) + '</title>'
        '<style>body{margin:0;background:#EFE9FA;color:#3B2A5E;font-family:"Be Vietnam Pro","Segoe UI",Roboto,Arial,sans-serif;font-size:16px;line-height:1.6}main{max-width:680px;margin:0 auto;padding:28px 20px 48px}h1{font-family:Georgia,serif;font-weight:500;font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:22px 0 6px}p{margin:0 0 10px}.d{color:#9C90B6;font-size:13px}.lead{color:#6B5C8A}hr{border:0;border-top:1px solid #DCD2EE;margin:36px 0}a{color:#3D2A6E}</style></head><body><main>'
        '<p><a href="./">← Nabu Twin Stars</a></p>' + block('vi') + '<hr>' + block('en') + '</main></body></html>')
io.open(os.path.join(HERE, 'privacy.html'), 'w', encoding='utf-8', newline='\n').write(priv)
print('privacy.html: %d bytes' % len(priv.encode('utf-8')))
