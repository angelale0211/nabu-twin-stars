# -*- coding: utf-8 -*-
"""Proof of the new look: a flat-lay altar seen from above.
One differences pair and one similarities pair."""
import os, sys, random, math
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
W, H = 840, 700

FLAT = ('flat lay, photographed from directly above, top down view, the whole object flat on a plain '
        'dark surface, even soft light, sharp focus, fine detail, no text, no watermark, no people, no hands')

# name, prompt, size in fraction of picture height
OBJ = [
 ('f_candle',   'one short lit white candle in a small glass jar seen from above, flame in the centre', .20),
 ('f_amethyst', 'one raw purple amethyst crystal cluster lying on a flat surface seen from above', .19),
 ('f_teacup',   'one white porcelain teacup full of tea on a saucer seen from directly above', .18),
 ('f_cards',    'three tarot cards lying face up spread in a fan seen from directly above, ornate gold and blue backs', .26),
 ('f_moon',     'one polished gold crescent moon charm lying flat seen from above', .15),
 ('f_lavender', 'one small bundle of dried purple lavender tied with twine lying flat seen from above', .24),
 ('f_bowl',     'one small round ceramic bowl filled with dried pink rose petals seen from directly above', .17),
 ('f_bottle',   'one small glass bottle with a cork lying on its side seen from above, violet liquid', .17),
 ('f_bell',     'one small brass hand bell lying on its side seen from above', .14),
 ('f_book',     'one closed leather bound antique book lying flat seen from directly above, gold ornament on the cover', .24),
 ('f_ball',     'one clear glass crystal sphere on a flat surface seen from directly above', .16),
 ('f_owl',      'one small carved wooden owl figurine lying on a flat surface seen from directly above', .16),
 ('f_star',     'one small gold star ornament lying flat seen from above', .11),
 ('f_key',      'one ornate antique brass key lying flat seen from directly above', .15),
]
BGP = ('an empty dark walnut wood table surface photographed from directly above, completely empty, '
       'nothing on it, warm candlelight from one side, deep shadows in the corners, rich wood grain')

TINT = (152, 124, 174)

def build():
    return A.background('flatlay', BGP, seed=11, w=W, h=H).convert('RGBA').copy()

def scatter(seed, items, margin=0.09):
    """Place objects anywhere in the frame with a guaranteed gap between them."""
    R = random.Random(seed)
    spots = []
    x0, x1 = W * margin, W * (1 - margin)
    y0, y1 = H * margin, H * (1 - margin)
    for name, prompt, frac in items:
        spr = A.sprite(name, prompt)
        hgt = frac * H * R.uniform(0.95, 1.06)
        wid = spr.size[0] * hgt / spr.size[1]
        rad = max(wid, hgt) / 2
        best = None
        for _ in range(600):
            cx = R.uniform(x0 + wid / 2, x1 - wid / 2)
            cy = R.uniform(y0 + hgt / 2, y1 - hgt / 2)
            ok = all(math.hypot(cx - px, cy - py) > (rad + pr) * 1.10 for px, py, pr in spots)
            if ok: best = (cx, cy, rad); break
        if best is None:
            best = (R.uniform(x0 + wid / 2, x1 - wid / 2), R.uniform(y0 + hgt / 2, y1 - hgt / 2), rad)
        spots.append(best)
    return [(int(cx), int(cy), int(frac * H * 1.0)) for (cx, cy, _r), (_n, _p, frac) in zip(spots, items)]

def put(scene, spr, cx, cy, hgt, rot=0, flip=False, scale=1.0):
    s = spr
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    h2 = int(hgt * scale)
    w2 = max(6, int(s.size[0] * h2 / s.size[1]))
    s = s.resize((w2, h2), Image.LANCZOS)
    if rot: s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
    s = A.grade(s, TINT)
    x0, y0 = int(cx - s.size[0] / 2), int(cy - s.size[1] / 2)
    # soft drop shadow under the flat object
    from PIL import ImageFilter
    sil = Image.new('RGBA', s.size, (0, 0, 0, 255)); sil.putalpha(s.split()[3])
    sh = Image.new('RGBA', scene.size, (0, 0, 0, 0))
    sh.alpha_composite(sil, (x0 + int(h2 * .035), y0 + int(h2 * .05)))
    sh = sh.filter(ImageFilter.GaussianBlur(h2 * 0.05))
    sh.putalpha(sh.split()[3].point(lambda v: int(v * 0.55)))
    scene.alpha_composite(sh)
    scene.alpha_composite(s, (x0, y0))
    return max(s.size) / 2

def marked(img, tg):
    m = img.copy(); d = ImageDraw.Draw(m)
    for x, y, r in tg: d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 208, 80), width=5)
    return m

def board(a, b, path):
    bd = Image.new('RGB', (a.size[0] * 2 + 20, a.size[1]), '#EFE9FA')
    bd.paste(a, (0, 0)); bd.paste(b, (a.size[0] + 20, 0)); bd.save(path)

def main():
    A.sprites_parallel([(n, p, 7) for n, p, _ in OBJ])
    have = [(n, p, f) for n, p, f in OBJ if A.sprite(n, p) is not None]
    print('sprites ready:', len(have))

    # ---------------- differences ----------------
    items = have[:10]
    spots = scatter(6, items)
    rots = [random.Random(30 + i).randint(-25, 25) for i in range(len(items))]
    changes = {0: 'remove', 2: 'hue', 4: 'scale', 6: 'flip', 8: 'hue'}
    A1, B1 = build(), build()
    tg = []
    for i, ((n, p, f), (x, y, hh)) in enumerate(zip(items, spots)):
        spr = A.sprite(n, p)
        r = put(A1, spr, x, y, hh, rot=rots[i])
        ch = changes.get(i)
        if ch == 'remove':
            tg.append((x, y, r)); continue
        s2, sc, fl = spr, 1.0, False
        if ch == 'hue': s2 = A.recolor(spr, 112, sat=1.12)
        if ch == 'scale': sc = 1.38
        if ch == 'flip': fl = True
        r2 = put(B1, s2, x, y, hh, rot=rots[i], flip=fl, scale=sc)
        if ch: tg.append((x, y, max(r, r2)))
    a, b = A.finish(A1), A.finish(B1)
    a.save(os.path.join(OUT, 'proof_diff_a.jpg'), quality=90)
    b.save(os.path.join(OUT, 'proof_diff_b.jpg'), quality=90)
    board(a, marked(b, tg), os.path.join(OUT, 'proof_diff.png'))

    # ------------- similarities: everything differs except a few -------------
    items2 = have[:12]
    spots2 = scatter(15, items2)
    rots2 = [random.Random(70 + i).randint(-25, 25) for i in range(len(items2))]
    same = {1, 4, 7, 10}
    A2, B2 = build(), build()
    tg2 = []
    R = random.Random(21)
    for i, ((n, p, f), (x, y, hh)) in enumerate(zip(items2, spots2)):
        spr = A.sprite(n, p)
        r = put(A2, spr, x, y, hh, rot=rots2[i])
        if i in same:
            put(B2, spr, x, y, hh, rot=rots2[i]); tg2.append((x, y, r))
        else:
            put(B2, A.recolor(spr, R.choice([60, 92, 124, 156, 190]), sat=1.18), x, y, hh, rot=rots2[i])
    a2, b2 = A.finish(A2), A.finish(B2)
    a2.save(os.path.join(OUT, 'proof_same_a.jpg'), quality=90)
    b2.save(os.path.join(OUT, 'proof_same_b.jpg'), quality=90)
    board(a2, marked(b2, tg2), os.path.join(OUT, 'proof_same.png'))
    print('proof written')

main()
