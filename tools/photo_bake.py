# -*- coding: utf-8 -*-
"""Make the photo levels: picture A is a real photo, picture B is the same
photo with a few changes made in the pixels (a colour shift, a mirrored
patch, a cloned or erased detail, a turned or enlarged patch, an added glow).
Bonus "similarities" levels add glowing lights to both pictures and change
all but a few.

  python tools/photo_bake.py            bake all 100 + 30 daily -> img/, src/levels.js, src/credits.js, sheets
  python tools/photo_bake.py 3          bake + sheet for chapter 3 only (and the daily pool)

Needs tools/photos.json + tools/cache (python tools/photos.py search|fetch)."""
import os, io, sys, json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, 'cache'); OUT = os.path.join(HERE, 'out'); IMG = os.path.join(ROOT, 'img')
os.makedirs(OUT, exist_ok=True); os.makedirs(IMG, exist_ok=True)
W, H = 720, 600          # baked picture size; the game works in 360 x 300 units (scale 2)
Q = 82
only = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 0

sys.path.insert(0, HERE)
from photos import crop_cover, CHAPTERS as PH_CHAPTERS

# ------------------------------------------------------------- plan ----
def plan_for(ch, n):
    typ = 'diff'
    if n == 5 or (n == 10 and ch % 2 == 0): typ = 'same'
    elif n == 8 and ch >= 3: typ = 'mirror'
    late = 1 if n >= 6 else 0; boss = 1 if n >= 9 else 0
    find = min(7, 3 + (ch - 1) // 2 + late + boss)
    if ch == 1: find = [3, 3, 4, 4, 3, 4, 5, 5, 5, 6][n - 1]
    if typ == 'same': find = min(5, 3 + (1 if ch >= 4 else 0) + (1 if n == 10 else 0))
    time = 0
    if ch >= 3: time = (150 if ch <= 4 else 120 if ch <= 6 else 105 if ch <= 8 else 90) - n * 3
    if typ == 'same' and time: time += 30
    subtle = 0 if ch <= 2 else 1 if ch <= 4 else 2 if ch <= 7 else 3
    if n == 4 or n >= 9: subtle = min(3, subtle + 1)
    return dict(ch=ch, n=n, type=typ, find=find, time=time, subtle=subtle, miss=6 if time else 8, mirror=typ == 'mirror')

# ---------------------------------------------------------- analysis ----
def to_np(im): return np.asarray(im, dtype=np.float32)
def box(a, r):
    """mean filter with a (2r+1) window via PIL box blur on a float array"""
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)); return to_np(im.filter(ImageFilter.BoxBlur(r)))
def detail_map(im):
    g = to_np(im.convert('L'))
    m = box(g, 6); v = box(g * g / 255.0, 6) * 255.0 - m * m
    return np.sqrt(np.clip(v, 0, None))          # local std dev (0..~80)
def sat_map(im): return box(to_np(im.convert('HSV').split()[1]), 8)
def lum_map(im): return box(to_np(im.convert('L')), 8)

def feather_mask(cx, cy, r, soft=0.12):
    """soft disc that stays inside the pasted square: solid to 0.8 r, gone by ~1.15 r"""
    m = Image.new('L', (W, H), 0)
    rr = r * 0.8
    ImageDraw.Draw(m).ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=255)
    return m.filter(ImageFilter.GaussianBlur(max(2, r * soft)))
def region_mean(mp, cx, cy, r):
    y0, y1, x0, x1 = max(0, cy - r), min(H, cy + r), max(0, cx - r), min(W, cx + r)
    return float(mp[y0:y1, x0:x1].mean()) if y1 > y0 and x1 > x0 else 0.0
def changed_enough(a, b, cx, cy, r, thresh):
    A, B = to_np(a), to_np(b)
    y0, y1, x0, x1 = max(0, cy - r), min(H, cy + r), max(0, cx - r), min(W, cx + r)
    d = np.abs(A[y0:y1, x0:x1] - B[y0:y1, x0:x1]).mean()
    return d >= thresh, d

# ------------------------------------------------------------ edits ----
def op_hue(im, cx, cy, r, delta):
    hsv = im.convert('HSV'); h, s, v = hsv.split()
    hn = (to_np(h) + delta) % 256
    shifted = Image.merge('HSV', (Image.fromarray(hn.astype(np.uint8)), s, v)).convert('RGB')
    return Image.composite(shifted, im, feather_mask(cx, cy, r))
def op_flip(im, cx, cy, r):
    R = int(r * 1.3); bb = (cx - R, cy - R, cx + R, cy + R)
    patch = im.crop(bb).transpose(Image.FLIP_LEFT_RIGHT)
    out = im.copy(); out.paste(patch, bb); return Image.composite(out, im, feather_mask(cx, cy, r))
def op_rotate(im, cx, cy, r, ang):
    R = int(r * 1.6); bb = (cx - R, cy - R, cx + R, cy + R)
    patch = im.crop(bb).rotate(ang, resample=Image.BICUBIC)
    out = im.copy(); out.paste(patch, bb); return Image.composite(out, im, feather_mask(cx, cy, r))
def op_scale(im, cx, cy, r, f):
    R = int(r * 1.4); bb = (cx - R, cy - R, cx + R, cy + R)
    patch = im.crop(bb); nw = int(2 * R * f)
    patch = patch.resize((nw, nw), Image.LANCZOS)
    o = (nw - 2 * R) // 2; patch = patch.crop((o, o, o + 2 * R, o + 2 * R))
    out = im.copy(); out.paste(patch, bb); return Image.composite(out, im, feather_mask(cx, cy, r))
def op_clone(im, sx, sy, dx, dy, r):
    R = int(r * 1.3)
    patch = im.crop((sx - R, sy - R, sx + R, sy + R))
    out = im.copy(); out.paste(patch, (dx - R, dy - R)); return Image.composite(out, im, feather_mask(dx, dy, r))
def op_erase(im, cx, cy, r, det):
    best, bd = None, 1e9
    for k in range(12):
        a = k * math.pi / 6; sx, sy = int(cx + math.cos(a) * r * 1.9), int(cy + math.sin(a) * r * 1.9)
        if r < sx < W - r and r < sy < H - r:
            d = region_mean(det, sx, sy, r)
            if d < bd: bd, best = d, (sx, sy)
    if not best: return None
    return op_clone(im, best[0], best[1], cx, cy, r)
def op_bright(im, cx, cy, r, f):
    return Image.composite(ImageEnhance.Brightness(im).enhance(f), im, feather_mask(cx, cy, r))
LIGHT_COLORS = [(255, 233, 160), (255, 190, 215), (175, 200, 255), (215, 190, 255), (200, 255, 225), (255, 255, 240)]
def light_layer(shape, cx, cy, r, color, rot=0):
    """an additive light: orb, 4-point star, bokeh ring or crescent, as an RGB layer for screen blending"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    if shape == 'orb':
        a = np.clip(1 - d / r, 0, 1) ** 1.6
        a = np.maximum(a, np.clip(1 - d / (r * 0.45), 0, 1))
    elif shape == 'star':
        c, s = math.cos(rot), math.sin(rot)
        u = (xx - cx) * c + (yy - cy) * s; v = -(xx - cx) * s + (yy - cy) * c
        arm = np.clip(1 - np.abs(v) / (r * .08), 0, 1) * np.clip(1 - np.abs(u) / (r * 1.4), 0, 1) ** 2 + np.clip(1 - np.abs(u) / (r * .08), 0, 1) * np.clip(1 - np.abs(v) / (r * 1.4), 0, 1) ** 2
        a = np.clip(arm + np.clip(1 - d / (r * .5), 0, 1) ** 1.2, 0, 1)
    elif shape == 'ring':
        a = np.clip(1 - np.abs(d - r * .8) / (r * .2), 0, 1) * .9 + np.clip(1 - d / r, 0, 1) * .25
    else:  # crescent
        d2 = np.sqrt((xx - (cx + r * .45)) ** 2 + (yy - (cy - r * .2)) ** 2)
        a = np.clip((d <= r * .8).astype(np.float32) - (d2 <= r * .7).astype(np.float32), 0, 1)
        a = to_np(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))) / 255.0
        a = np.maximum(a, np.clip(1 - d / (r * 1.3), 0, 1) * .35)
    layer = np.zeros((H, W, 3), np.float32)
    for i in range(3): layer[..., i] = a * color[i]
    return layer
def screen(im, layer):
    A = to_np(im); B = 255 - (255 - A) * (255 - layer) / 255.0
    return Image.fromarray(np.clip(B, 0, 255).astype(np.uint8))

# ---------------------------------------------------------- picking ----
def candidates(det, sat, lum, R, margin):
    pts = []
    for y in range(margin, H - margin, 16):
        for x in range(margin, W - margin, 16):
            pts.append((x, y, region_mean(det, x, y, R), region_mean(sat, x, y, R), region_mean(lum, x, y, R)))
    return pts
def _xy(c): return (c['x'], c['y']) if isinstance(c, dict) else (c[0], c[1])
def far(p, chosen, dmin): return all(math.hypot(_xy(p)[0] - _xy(c)[0], _xy(p)[1] - _xy(c)[1]) >= dmin for c in chosen)

KIND_W = [
    {'light': 3, 'clone': 3, 'erase': 3, 'hue': 3, 'flip': 2, 'scale': 1},
    {'light': 2, 'clone': 2, 'erase': 3, 'hue': 3, 'flip': 3, 'scale': 2, 'rotate': 1, 'bright': 1},
    {'light': 1, 'clone': 2, 'erase': 2, 'hue': 3, 'flip': 3, 'scale': 3, 'rotate': 3, 'bright': 2},
    {'light': 1, 'clone': 1, 'erase': 2, 'hue': 3, 'flip': 3, 'scale': 3, 'rotate': 3, 'bright': 3},
]
def weighted(rng, table):
    tot = sum(table.values()); x = rng.random() * tot
    for k, v in table.items():
        x -= v
        if x <= 0: return k
    return next(iter(table))

def make_diff_level(rng, base, plan):
    """returns (B image, targets[{x,y,r} in 720-space], kinds)"""
    R = [46, 40, 34, 29][plan['subtle']]
    det, sat, lum = detail_map(base), sat_map(base), lum_map(base)
    pts = candidates(det, sat, lum, R, R + 24)
    pts.sort(key=lambda p: -p[2])
    detailed = pts[:max(30, len(pts) // 3)]
    plain = sorted(pts, key=lambda p: p[2])[:max(30, len(pts) // 3)]
    B = base.copy(); targets = []; kinds = []; used = {}
    tries = 0
    while len(targets) < plan['find'] and tries < 120:
        tries += 1
        table = dict(KIND_W[plan['subtle']])
        for k in list(table):
            if used.get(k, 0) >= (1 if k in ('erase', 'clone', 'light') else 2): del table[k]
        if not table: table = dict(KIND_W[plan['subtle']])
        kind = weighted(rng, table)
        dmin = 120 if plan['subtle'] < 2 else 105
        if kind == 'light':
            pool = [p for p in plain if far(p, targets, dmin) and p[4] < 175] or [p for p in plain if far(p, targets, dmin)]
            if not pool: continue
            p = rng.choice(pool[:40]); color = rng.choice(LIGHT_COLORS)
            shape = rng.choice(['orb', 'star', 'orb', 'crescent'])
            cand = screen(B, light_layer(shape, p[0], p[1], R * (1.0 if shape != 'star' else 1.1), color, rng.random() * 3.14))
            ok, d = changed_enough(B, cand, p[0], p[1], R, 10)
            if not ok: continue
            B = cand; targets.append({'x': p[0], 'y': p[1], 'r': R}); kinds.append('light'); used['light'] = used.get('light', 0) + 1
            continue
        if kind == 'clone':
            srcs = [p for p in detailed if far(p, targets, dmin)]
            dsts = [p for p in plain if far(p, targets, dmin)]
            if not srcs or not dsts: continue
            s = rng.choice(srcs[:40])
            dd = [p for p in dsts if math.hypot(p[0] - s[0], p[1] - s[1]) > R * 2.6]
            if not dd: continue
            d = rng.choice(dd[:40])
            cand = op_clone(B, s[0], s[1], d[0], d[1], R)
            ok, diff = changed_enough(B, cand, d[0], d[1], R, 14)
            if not ok: continue
            B = cand; targets.append({'x': d[0], 'y': d[1], 'r': R}); kinds.append('clone'); used['clone'] = used.get('clone', 0) + 1
            continue
        pool = [p for p in detailed if far(p, targets, dmin)]
        if kind == 'hue': pool = [p for p in pool if p[3] > 90]
        if kind == 'bright': pool = [p for p in pool if 60 < p[4] < 200]
        if not pool: continue
        p = rng.choice(pool[:50]); cx, cy = p[0], p[1]
        if kind == 'hue':
            delta = rng.choice([110, 128, 150, 170]) if plan['subtle'] < 2 else rng.choice([60, 80, 100])
            cand = op_hue(B, cx, cy, R, delta); thresh = 14
        elif kind == 'flip': cand = op_flip(B, cx, cy, R); thresh = 16
        elif kind == 'rotate': cand = op_rotate(B, cx, cy, R, rng.choice([-1, 1]) * (38 if plan['subtle'] < 2 else 24)); thresh = 14
        elif kind == 'scale': cand = op_scale(B, cx, cy, R, 1.38 if plan['subtle'] < 2 else 1.24); thresh = 12
        elif kind == 'erase': cand = op_erase(B, cx, cy, R, det); thresh = 14
        elif kind == 'bright': cand = op_bright(B, cx, cy, R, rng.choice([1.45, 0.6])); thresh = 14
        else: continue
        if cand is None: continue
        ok, d = changed_enough(B, cand, cx, cy, R, thresh)
        if not ok: continue
        B = cand; targets.append({'x': cx, 'y': cy, 'r': R}); kinds.append(kind); used[kind] = used.get(kind, 0) + 1
    return B, targets, kinds

def make_same_level(rng, base, plan):
    """both pictures get N glowing lights; in B all but `find` of them are moved or recoloured"""
    n = 8 + plan['find'] + (2 if plan['subtle'] >= 2 else 0)
    R = [30, 27, 24, 22][plan['subtle']]
    dim = ImageEnhance.Brightness(base).enhance(0.72)
    spots = []
    tries = 0
    while len(spots) < n and tries < 500:
        tries += 1
        p = (rng.randint(R + 30, W - R - 30), rng.randint(R + 30, H - R - 30))
        if far(p, spots, 96): spots.append(p)
    lights = [dict(x=p[0], y=p[1], shape=rng.choice(['orb', 'star', 'ring', 'crescent']), color=rng.choice(LIGHT_COLORS), rot=rng.random() * 3.14) for p in spots]
    keep = set(rng.sample(range(len(lights)), min(plan['find'], len(lights))))
    A = dim
    for l in lights: A = screen(A, light_layer(l['shape'], l['x'], l['y'], R, l['color'], l['rot']))
    B = dim; blights = []
    for i, l in enumerate(lights):
        if i in keep: blights.append(l); continue
        m = dict(l)
        if rng.random() < 0.5:   # move somewhere free
            for t in range(60):
                p = (rng.randint(R + 30, W - R - 30), rng.randint(R + 30, H - R - 30))
                if far(p, [(q['x'], q['y']) for q in blights] + spots, 90): m['x'], m['y'] = p; break
        else:                    # new colour + shape
            m['color'] = rng.choice([c for c in LIGHT_COLORS if c != l['color']])
            m['shape'] = rng.choice([s for s in ['orb', 'star', 'ring', 'crescent'] if s != l['shape']])
        blights.append(m)
    for l in blights: B = screen(B, light_layer(l['shape'], l['x'], l['y'], R, l['color'], l['rot']))
    targets = [{'x': lights[i]['x'], 'y': lights[i]['y'], 'r': R + 8} for i in sorted(keep)]
    return A, B, targets

# ------------------------------------------------------------- bake ----
def bake_one(lid, photo, plan, seed):
    rng = random.Random(seed)
    base = crop_cover(Image.open(os.path.join(CACHE, '%s.jpg' % photo['id'])).convert('RGB'), W, H)
    if plan['type'] == 'same':
        A, B, targets = make_same_level(rng, base, plan); kinds = ['same'] * len(targets)
    else:
        A = base; B, targets, kinds = make_diff_level(rng, base, plan)
    A.save(os.path.join(IMG, '%sa.jpg' % lid), quality=Q, optimize=True, progressive=True)
    B.save(os.path.join(IMG, '%sb.jpg' % lid), quality=Q, optimize=True, progressive=True)
    lvl = dict(id=int(lid) if lid.isdigit() else lid, ch=plan['ch'], n=plan['n'], type=plan['type'], time=plan['time'], miss=plan['miss'], find=len(targets),
               a='img/%sa.jpg' % lid, b='img/%sb.jpg' % lid,
               targets=[{'i': i, 'x': round(t['x'] / 2), 'y': round(t['y'] / 2), 'r': round(t['r'] / 2 + 4)} for i, t in enumerate(targets)],
               kinds=kinds, par=len(targets) * 14 + 16, photo=photo['id'])
    if plan['mirror']: lvl['mirror'] = 1
    return lvl, A, B

def sheet(levels, name):
    tw, th = 360, 300
    board = Image.new('RGB', (2 * tw + 24, len(levels) * (th + 30) + 8), '#EFE9FA'); d = ImageDraw.Draw(board)
    for k, l in enumerate(levels):
        A = Image.open(os.path.join(ROOT, l['a'])).resize((tw, th)); B = Image.open(os.path.join(ROOT, l['b'])).resize((tw, th))
        if l.get('mirror'): B = B.transpose(Image.FLIP_LEFT_RIGHT)
        db = ImageDraw.Draw(B)
        for t in l['targets']:
            x = (tw - t['x']) if l.get('mirror') else t['x']
            db.ellipse((x - t['r'], t['y'] - t['r'], x + t['r'], t['y'] + t['r']), outline=(229, 190, 94), width=3)
        y = 8 + k * (th + 30)
        board.paste(A, (8, y + 22)); board.paste(B, (16 + tw, y + 22))
        d.text((8, y + 4), '%s  %d-%d  %s%s  find %d  time %d  %s' % (l['id'], l['ch'], l['n'], l['type'], ' mirror' if l.get('mirror') else '', l['find'], l['time'], ','.join(l['kinds'])), fill=(59, 42, 94))
    board.save(os.path.join(OUT, name))

def main():
    photos = json.load(io.open(os.path.join(HERE, 'photos.json'), encoding='utf-8'))
    levels_path = os.path.join(ROOT, 'src', 'levels.js')
    existing = {}
    if os.path.exists(levels_path):
        try:
            txt = io.open(levels_path, encoding='utf-8').read()
            import re
            existing = {('%03d' % l['id']) if isinstance(l['id'], int) else l['id']: l for l in json.loads(re.search(r'const LEVELS = (\[.*?\]);', txt, re.S).group(1))}
            existing.update({l['id']: l for l in json.loads(re.search(r'const DAILY_POOL = (\[.*?\]);', txt, re.S).group(1))})
        except Exception: existing = {}
    levels = []; credits = {}
    picks_path = os.path.join(HERE, 'picks.json')
    picks = json.load(io.open(picks_path, encoding='utf-8')) if os.path.exists(picks_path) else {}
    byid = {p['id']: p for lst in photos.values() for p in lst}
    def pool_for(key):
        cached = lambda p: os.path.exists(os.path.join(CACHE, '%s.jpg' % p['id']))
        if picks.get(key): return [byid[i] for i in picks[key] if i in byid and cached(byid[i])]
        lst = [p for p in photos[key] if cached(p)]
        lst.sort(key=lambda p: (0 if p.get('curated') else 1))
        return lst
    for ch in range(1, 11):
        pool = pool_for(str(ch))
        for n in range(1, 11):
            lid = '%03d' % ((ch - 1) * 10 + n)
            plan = plan_for(ch, n)
            photo = pool[(n - 1) % len(pool)]
            if only and ch != only and lid in existing:
                levels.append(existing[lid]); continue
            lvl, A, B = bake_one(lid, photo, plan, 9000 + int(lid))
            levels.append(lvl); print('baked', lid, plan['type'], lvl['find'], lvl['kinds'])
            credits[photo['id']] = photo
        if not only or ch == only: sheet([l for l in levels if l['ch'] == ch], 'photo-ch%02d.png' % ch)
    daily = []
    dpool = pool_for('daily')
    for i in range(30):
        lid = 'd%02d' % (i + 1)
        plan = dict(ch=1 + i % 10, n=6, type='same' if i % 4 == 3 else 'diff', find=4 if i % 4 == 3 else 5 + (i % 3), time=150 if i % 4 == 3 else 120, subtle=2, miss=6, mirror=False)
        photo = dpool[i % len(dpool)]
        if only and lid in existing and existing[lid].get('photo') == photo['id']:
            daily.append(existing[lid]); continue
        lvl, A, B = bake_one(lid, photo, plan, 7700 + i)
        lvl['daily'] = 1; daily.append(lvl); credits[photo['id']] = photo; print('baked', lid, lvl['find'], lvl['kinds'])
    if not only: sheet(daily[:10], 'photo-daily.png')
    for l in levels + daily:
        p = next((x for x in sum(photos.values(), []) if x['id'] == l['photo']), None)
        if p: credits[p['id']] = p
    js = ('/* Baked by tools/photo_bake.py: 100 campaign levels + 30 daily levels on real photos (Pexels). Do not edit by hand. */\n'
          'const LEVELS = ' + json.dumps(levels, separators=(',', ':')) + ';\nconst DAILY_POOL = ' + json.dumps(daily, separators=(',', ':')) + ';\n')
    io.open(levels_path, 'w', encoding='utf-8', newline='\n').write(js)
    cj = 'const CREDITS = ' + json.dumps([{'id': p['id'], 'by': p['photographer'], 'url': p['url'], 'by_url': p['photographer_url'], 'lic': p.get('license', '')} for p in credits.values()], ensure_ascii=False, separators=(',', ':')) + ';\n'
    io.open(os.path.join(ROOT, 'src', 'credits.js'), 'w', encoding='utf-8', newline='\n').write(cj)
    total = sum(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG))
    print('levels', len(levels), 'daily', len(daily), 'images', len(os.listdir(IMG)), '%.1f MB' % (total / 1e6))

if __name__ == '__main__':
    main()
