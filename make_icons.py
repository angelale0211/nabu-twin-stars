# -*- coding: utf-8 -*-
"""Draw the app icon (two fanned cards under a crescent moon, in the Nabu
style) and write every size the web app, Play listing and Android launcher
need. Rendering is done by headless Edge through Playwright; no other tools.

  python make_icons.py"""
import os, io, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, 'android', 'app', 'src', 'main', 'res')

ICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke="#3D2A6E" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE9FA"/><stop offset="1" stop-color="#D9CDF3"/></linearGradient></defs>
<rect width="512" height="512" rx="__RX__" fill="url(#bg)" stroke="none"/>
<g fill="#E5BE5E" stroke="none"><path d="M96 262 Q100 288 122 292 Q100 296 96 322 Q92 296 70 292 Q92 288 96 262Z"/><path d="M420 348 Q423 366 438 370 Q423 374 420 392 Q417 374 402 370 Q417 366 420 348Z"/><path d="M416 84 Q418 96 428 98 Q418 100 416 112 Q414 100 404 98 Q414 96 416 84Z"/><path d="M76 380 Q78 392 88 394 Q78 396 76 408 Q74 396 64 394 Q74 392 76 380Z"/></g>
<path d="M150 62 A64 64 0 1 0 150 190 A48 48 0 1 1 150 62 Z" fill="#E5BE5E"/>
<g transform="translate(266 330)">
 <g transform="rotate(-18 0 90)"><rect x="-76" y="-120" width="152" height="220" rx="18" fill="#AFC8F0"/><rect x="-60" y="-104" width="120" height="188" rx="12" fill="none" stroke="#E5BE5E" stroke-width="6"/></g>
 <g transform="rotate(18 0 90)"><rect x="-76" y="-120" width="152" height="220" rx="18" fill="#F6BBCB"/><rect x="-60" y="-104" width="120" height="188" rx="12" fill="none" stroke="#E5BE5E" stroke-width="6"/></g>
 <rect x="-80" y="-130" width="160" height="230" rx="18" fill="#3D2A6E"/><rect x="-64" y="-114" width="128" height="198" rx="12" fill="none" stroke="#E5BE5E" stroke-width="6"/>
 <path d="M18 -50 Q18 -12 52 -8 Q18 -4 18 34 Q18 -4 -16 -8 Q18 -12 18 -50 Z" fill="#E5BE5E" stroke-width="7"/>
 <path d="M-30 -40 Q-30 -22 -14 -20 Q-30 -18 -30 0 Q-30 -18 -46 -20 Q-30 -22 -30 -40 Z" fill="#F6BBCB" stroke-width="5"/>
 <circle cx="-42" cy="60" r="9" fill="#E5BE5E" stroke-width="5"/><circle cx="42" cy="60" r="9" fill="#E5BE5E" stroke-width="5"/>
</g>
</svg>'''
FG = ICON.replace('<rect width="512" height="512" rx="__RX__" fill="url(#bg)" stroke="none"/>', '')  # adaptive foreground: no ground


def render(pw, svg, size, scale_box=None):
    """Render an SVG string to a PNG image of `size` px. scale_box shrinks the
    drawing into the middle (adaptive icons keep the safe zone)."""
    b = pw.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': size, 'height': size}, device_scale_factor=1)
    inner = svg if not scale_box else svg.replace('viewBox="0 0 512 512"', 'viewBox="%s"' % scale_box)
    pg.set_content('<body style="margin:0;background:transparent">' + inner.replace('<svg ', '<svg style="width:%dpx;height:%dpx;display:block" ' % (size, size), 1) + '</body>')
    pg.wait_for_timeout(100)
    path = os.path.join(HERE, '_tmp_icon.png')
    pg.screenshot(path=path, omit_background=True)
    b.close()
    im = Image.open(path).convert('RGBA'); os.remove(path)
    return im


with sync_playwright() as pw:
    full = render(pw, ICON.replace('__RX__', '96'), 1024)
    square = render(pw, ICON.replace('__RX__', '0'), 1024)
    fg = render(pw, FG, 1024, '-108 -108 728 728')   # adaptive foreground in the 66% safe zone
    for n, im in [('icon-512.png', full), ('icon-512-maskable.png', square), ('store_icon_512.png', square)]:
        im.resize((512, 512), Image.LANCZOS).save(os.path.join(HERE, n))
    full.resize((192, 192), Image.LANCZOS).save(os.path.join(HERE, 'icon-192.png'))
    full.resize((180, 180), Image.LANCZOS).save(os.path.join(HERE, 'icon-180.png'))
    # Android launcher icons
    for d, px in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        folder = os.path.join(RES, 'mipmap-' + d); os.makedirs(folder, exist_ok=True)
        full.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher.png'))
        # round: mask a circle
        m = Image.new('L', (px, px), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(m).ellipse((0, 0, px - 1, px - 1), fill=255)
        r = square.resize((px, px), Image.LANCZOS); r.putalpha(m); r.save(os.path.join(folder, 'ic_launcher_round.png'))
        fgp = px * 108 // 48
        fg.resize((fgp, fgp), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_foreground.png'))
    # feature graphic 1024x500 for the Play listing
    feat = Image.new('RGBA', (1024, 500), '#EFE9FA')
    art = full.resize((380, 380), Image.LANCZOS)
    feat.paste(art, (60, 60), art)
    feat.save(os.path.join(HERE, 'feature_graphic_1024x500.png'))
print('icons written')
