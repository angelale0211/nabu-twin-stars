# -*- coding: utf-8 -*-
"""Compose the full game: 200 campaign levels over 20 surfaces, plus a daily pool.

  python tools/levels_ai.py            build everything that is missing
  python tools/levels_ai.py 7          rebuild chapter 7 only
  python tools/levels_ai.py sheets     review sheets only, from what is already built

Every picture is layers: an AI-painted surface plus AI-painted objects cut out
with alpha. A difference is always a whole object, so the rest of the picture is
identical to the pixel and there are no accidental extra differences.
"""
import os, io, sys, json, math, random
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A
import assets as AS
from scenes_ai import SURFACES, CARDS

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out'); IMG = os.path.join(ROOT, 'img')
os.makedirs(IMG, exist_ok=True); os.makedirs(OUT, exist_ok=True)
W, H = 720, 600
Q = 84
CHAPTERS = 20
PER = 10

# ------------------------------------------------------------------ paint --
def bg(key, prompt):
    return A.background('s_' + key, prompt, seed=23, w=W, h=H).convert('RGBA').copy()

def spr(n):
    return A.sprite(n, AS.prompt_of(n))

def scatter(seed, names, big, margin=.075, gap=1.08):
    R = random.Random(seed)
    out = []
    for n in names:
        s = spr(n)
        hgt = AS.size_of(n) * H * big * R.uniform(.92, 1.08)
        wid = s.size[0] * hgt / s.size[1]
        rad = max(wid, hgt) / 2
        got = None
        for _ in range(700):
            cx = R.uniform(W * margin + wid / 2, W * (1 - margin) - wid / 2)
            cy = R.uniform(H * margin + hgt / 2, H * (1 - margin) - hgt / 2)
            if all(math.hypot(cx - px, cy - py) > (rad + pr) * gap for px, py, pr in out):
                got = (cx, cy, rad); break
        if got is None: return None
        out.append(got)
    return [(int(cx), int(cy), int(AS.size_of(n) * H * big), rad) for (cx, cy, rad), n in zip(out, names)]

def fit(seed, names, big):
    for gap in (1.10, 1.05, 1.01):
        for shrink in (1.0, .95, .90, .85, .80):
            for t in range(seed, seed + 18):
                sp = scatter(t, names, big * shrink, gap=gap)
                if sp: return sp
    return None

def put(scene, s, cx, cy, hgt, tint, rot=0, flip=False, scale=1.0):
    """Place one object: soft shadow, light colour match. Deliberately gentle so
    objects sit in the picture instead of sitting on top of it."""
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    h2 = max(10, int(hgt * scale))
    w2 = max(10, int(s.size[0] * h2 / s.size[1]))
    s = s.resize((w2, h2), Image.LANCZOS)
    if rot: s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
    s = A.grade(s, tint, amount=.17, contrast=.97)
    x0, y0 = int(cx - s.size[0] / 2), int(cy - s.size[1] / 2)
    sil = Image.new('RGBA', s.size, (0, 0, 0, 255)); sil.putalpha(s.split()[3])
    sh = Image.new('RGBA', scene.size, (0, 0, 0, 0))
    sh.alpha_composite(sil, (x0 + max(1, int(h2 * .025)), y0 + max(2, int(h2 * .035))))
    sh = sh.filter(ImageFilter.GaussianBlur(max(2, h2 * .045)))
    sh.putalpha(sh.split()[3].point(lambda v: int(v * .34)))
    scene.alpha_composite(sh)
    scene.alpha_composite(s, (x0, y0))
    return max(s.size) / 2

def finish(im):
    return A.finish(im, vignette=.20, grain=5)

# ------------------------------------------------------------------ plan ---
LABEL = {'remove': 'gone', 'hue': 'colour', 'scale': 'size', 'flip': 'mirrored',
         'rot': 'turned', 'swap': 'swapped', 'move': 'moved'}

def plan(ch, n):
    typ, mirror = 'diff', False
    if n == 5: typ = 'same'
    elif n == 10 and ch % 3 == 0: typ = 'same'
    elif n == 8: mirror = True
    elif n == 3 and ch >= 6: mirror = True
    find = min(8, 3 + (ch - 1) // 3 + (1 if n >= 6 else 0) + (1 if n >= 9 else 0))
    if ch == 1: find = [3, 3, 4, 4, 3, 4, 5, 5, 5, 6][n - 1]
    if typ == 'same': find = min(6, 3 + (ch - 1) // 5 + (1 if n == 10 else 0))
    time = 0 if ch <= 2 else max(70, int(165 - (ch - 3) * 4.5) - n * 3)
    if typ == 'same' and time: time += 35
    subtle = 0 if ch <= 3 else 1 if ch <= 8 else 2 if ch <= 14 else 3
    if n == 4 or n >= 9: subtle = min(3, subtle + 1)
    objs = min(20, int(round(10 + ch * .38 + n * .3)))
    return dict(ch=ch, n=n, type=typ, mirror=mirror, find=find, time=time,
                subtle=subtle, objs=objs, miss=6 if time else 8)

HUE = [[110, 135, 160, 185], [95, 120, 150, 175], [72, 96, 120, 145], [58, 78, 100, 124]]
SCALE = [1.45, 1.38, 1.30, 1.24]
ROT = [70, 60, 48, 38]

# -------------------------------------------------------------- the build --
class Picker:
    """Hands out objects, always preferring the ones used least so far."""
    def __init__(self):
        self.used = {}
    def take(self, R, pool, k, avoid=()):
        cand = [n for n in pool if n not in avoid]
        cand.sort(key=lambda n: (self.used.get(n, 0), R.random()))
        got = cand[:k]
        for n in got: self.used[n] = self.used.get(n, 0) + 1
        return got

def build_level(lid, surf, p, seed, picker):
    key, name, tint, prompt, themes = surf
    R = random.Random(seed)
    pool = [n for n in AS.ready() if AS.theme_of(n) in themes]
    if len(pool) < p['objs'] + 4:
        pool = AS.ready()
    names = picker.take(R, pool, p['objs'])
    R.shuffle(names)
    spots = fit(seed, names, 1.0)
    if not spots:
        names = names[:max(8, len(names) - 3)]
        spots = fit(seed + 100, names, .92)
    if not spots: raise RuntimeError('layout failed ' + lid)
    rots = [R.randint(-24, 24) for _ in names]
    base = bg(key, prompt)
    A1, B1 = base.copy(), base.copy()

    if p['type'] == 'same':
        keep = set(R.sample(range(len(names)), min(p['find'], len(names))))
        targets, notes = [], []
        for i, nm in enumerate(names):
            cx, cy, hgt, _ = spots[i]
            s = spr(nm)
            r = put(A1, s, cx, cy, hgt, tint, rot=rots[i])
            if i in keep:
                put(B1, s, cx, cy, hgt, tint, rot=rots[i])
                targets.append({'x': cx, 'y': cy, 'r': r}); notes.append(nm + ': same')
            else:
                put(B1, A.recolor(s, R.choice([58, 86, 114, 142, 170, 198]), sat=1.18), cx, cy, hgt, tint, rot=rots[i])
        return A1, B1, targets, notes

    # differences: choose well spread targets, prefer bigger objects
    order = sorted(range(len(names)), key=lambda i: -spots[i][2])
    chosen, minlen = [], 170
    while len(chosen) < p['find'] and minlen > 40:
        for i in order:
            if len(chosen) >= p['find']: break
            if i in chosen: continue
            if all(math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]) > minlen for j in chosen):
                chosen.append(i)
        minlen -= 22
    kinds = ['remove', 'hue', 'scale', 'flip', 'swap', 'move', 'rot', 'hue'][:len(chosen)]
    R.shuffle(kinds)
    sub = p['subtle']
    targets, notes = [], []
    for i, nm in enumerate(names):
        cx, cy, hgt, rad = spots[i]
        s = spr(nm)
        r = put(A1, s, cx, cy, hgt, tint, rot=rots[i])
        if i not in chosen:
            put(B1, s, cx, cy, hgt, tint, rot=rots[i]); continue
        k = kinds[chosen.index(i)]
        s2, sc2, fl, ro, nx, ny = s, 1.0, False, rots[i], cx, cy
        if k == 'remove':
            targets.append({'x': cx, 'y': cy, 'r': r}); notes.append('%s: %s' % (nm, LABEL[k])); continue
        if k == 'hue':   s2 = A.recolor(s, R.choice(HUE[sub]), sat=1.12)
        elif k == 'scale': sc2 = SCALE[sub]
        elif k == 'flip':  fl = True
        elif k == 'rot':   ro = rots[i] + R.choice([-ROT[sub], ROT[sub]])
        elif k == 'swap':
            alt = [x for x in pool if x not in names and abs(AS.size_of(x) - AS.size_of(nm)) < .05]
            if alt: s2 = spr(alt[R.randrange(len(alt))])
            else: s2 = A.recolor(s, HUE[sub][-1], sat=1.2); k = 'hue'
        elif k == 'move':
            step = rad * (1.5 if sub < 2 else 1.15)
            best = None
            for _ in range(60):
                a = R.random() * math.tau
                tx, ty = cx + math.cos(a) * step, cy + math.sin(a) * step
                if not (rad < tx < W - rad and rad < ty < H - rad): continue
                if all(math.hypot(tx - spots[j][0], ty - spots[j][1]) > (rad + spots[j][3]) * 1.02
                       for j in range(len(names)) if j != i):
                    best = (int(tx), int(ty)); break
            if best: nx, ny = best
            else: s2 = A.recolor(s, HUE[sub][0], sat=1.12); k = 'hue'
        r2 = put(B1, s2, nx, ny, hgt, tint, rot=ro, flip=fl, scale=sc2)
        t = {'x': cx, 'y': cy, 'r': max(r, r2)}
        if (nx, ny) != (cx, cy): t['x2'], t['y2'] = nx, ny
        targets.append(t); notes.append('%s: %s' % (nm, LABEL[k]))
    return A1, B1, targets, notes

def save(lid, A1, B1, targets, notes, p, key):
    a, b = finish(A1), finish(B1)
    a.save(os.path.join(IMG, '%sa.jpg' % lid), quality=Q, optimize=True, progressive=True)
    b.save(os.path.join(IMG, '%sb.jpg' % lid), quality=Q, optimize=True, progressive=True)
    tg = []
    for i, t in enumerate(targets):
        d = {'i': i, 'x': round(t['x'] / 2), 'y': round(t['y'] / 2), 'r': max(22, round(t['r'] / 2))}
        if 'x2' in t: d['x2'], d['y2'] = round(t['x2'] / 2), round(t['y2'] / 2)
        tg.append(d)
    lvl = dict(id=int(lid) if lid.isdigit() else lid, ch=p['ch'], n=p['n'], type=p['type'],
               time=p['time'], miss=p['miss'], find=len(tg),
               a='img/%sa.jpg' % lid, b='img/%sb.jpg' % lid, targets=tg, kinds=notes,
               par=len(tg) * 14 + 16, bg=key)
    if p['mirror']: lvl['mirror'] = 1
    return lvl

def sheet(levels, name):
    tw, th = 400, 333
    bd = Image.new('RGB', (tw * 2 + 24, len(levels) * (th + 24) + 8), '#EFE9FA')
    d = ImageDraw.Draw(bd)
    for k, l in enumerate(levels):
        a = Image.open(os.path.join(IMG, os.path.basename(l['a']))).resize((tw, th))
        b = Image.open(os.path.join(IMG, os.path.basename(l['b']))).resize((tw, th))
        if l.get('mirror'): b = b.transpose(Image.FLIP_LEFT_RIGHT)
        db = ImageDraw.Draw(b)
        for t in l['targets']:
            x = t.get('x2', t['x']) * tw / 360; y = t.get('y2', t['y']) * th / 300; r = t['r'] * tw / 360
            if l.get('mirror'): x = tw - x
            db.ellipse((x - r, y - r, x + r, y + r), outline=(255, 208, 80), width=4)
        y0 = 8 + k * (th + 24)
        bd.paste(a, (0, y0)); bd.paste(b, (tw + 24, y0))
        d.text((4, y0 - 11), '%s %s%s find %d  %s' % (l['id'], l['type'], ' mirror' if l.get('mirror') else '',
                                                      l['find'], ', '.join(l['kinds'])[:120]), fill=(59, 42, 94))
    bd.save(os.path.join(OUT, name))

def load_existing():
    p = os.path.join(ROOT, 'src', 'levels.js')
    if not os.path.exists(p): return {}, {}
    import re
    s = io.open(p, encoding='utf-8').read()
    try:
        L = json.loads(re.search(r'const LEVELS = (\[.*?\]);\s*\n', s, re.S).group(1))
        D = json.loads(re.search(r'const DAILY_POOL = (\[.*?\]);\s*\n', s, re.S).group(1))
        return {l['id']: l for l in L}, {l['id']: l for l in D}
    except Exception:
        return {}, {}

def write_js(levels, daily):
    scenes_js = ', '.join("%s: {name: %s, pool: [], zones: [], draw: function () { return ''; }}"
                          % (k, json.dumps(nm, ensure_ascii=False)) for k, nm, _t, _p, _th in SURFACES)
    # A chapter can award at most 30 stars, so the gate for chapter i+1 must stay
    # well under 30*i or the game becomes impossible. About 55 per cent of the maximum.
    need = [round(16.5 * i) for i in range(CHAPTERS)]
    chs = [{'id': i + 1, 'bg': SURFACES[i][0], 'card': CARDS[i], 'need': need[i]} for i in range(CHAPTERS)]
    js = ('/* Built by tools/levels_ai.py: %d levels on composed scenes. Do not edit by hand. */\n' % len(levels)
          + 'const LEVELS = ' + json.dumps(levels, separators=(',', ':')) + ';\n'
          + 'const DAILY_POOL = ' + json.dumps(daily, separators=(',', ':')) + ';\n'
          + 'Object.assign(SCENES, {' + scenes_js + '});\n'
          + 'CHAPTERS.length = 0; ' + json.dumps(chs, ensure_ascii=False) + '.forEach(function (c) { CHAPTERS.push(c); });\n')
    io.open(os.path.join(ROOT, 'src', 'levels.js'), 'w', encoding='utf-8', newline='\n').write(js)

def main():
    only = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 0
    haveL, haveD = load_existing()
    picker = Picker()
    ready = AS.ready()
    print('objects available: %d' % len(ready))
    levels = []
    for ch in range(1, CHAPTERS + 1):
        surf = SURFACES[ch - 1]
        for n in range(1, PER + 1):
            lid = '%03d' % ((ch - 1) * PER + n)
            p = plan(ch, n)
            if only and ch != only and int(lid) in haveL:
                levels.append(haveL[int(lid)]); continue
            A1, B1, tg, notes = build_level(lid, surf, p, 5000 + int(lid) * 13, picker)
            levels.append(save(lid, A1, B1, tg, notes, p, surf[0]))
            print('  %s %s%s find %d/%d' % (lid, p['type'], ' mirror' if p['mirror'] else '', len(tg), p['find']), flush=True)
        if not only or ch == only:
            sheet([l for l in levels if l['ch'] == ch], 'lv_ch%02d.png' % ch)
    daily = []
    for i in range(30):
        lid = 'd%02d' % (i + 1)
        surf = SURFACES[i % CHAPTERS]
        p = plan(1 + i % 12, 6)
        p['type'] = 'same' if i % 4 == 3 else 'diff'
        p['mirror'] = (i % 5 == 2)
        p['find'] = 4 if p['type'] == 'same' else 5 + i % 3
        p['time'] = 150 if p['type'] == 'same' else 120
        if lid in haveD and only:
            daily.append(haveD[lid]); continue
        A1, B1, tg, notes = build_level(lid, surf, p, 8800 + i * 7, picker)
        lv = save(lid, A1, B1, tg, notes, p, surf[0]); lv['daily'] = 1
        daily.append(lv)
        print('  %s daily find %d' % (lid, len(tg)), flush=True)
    write_js(levels, daily)
    total = sum(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG))
    print('%d levels, %d daily, %d images, %.1f MB' % (len(levels), len(daily), len(os.listdir(IMG)), total / 1e6))
    from collections import Counter
    print('types', Counter(l['type'] + ('+mirror' if l.get('mirror') else '') for l in levels))
    print('most used objects:', Counter({k: v for k, v in picker.used.items()}).most_common(6))

if __name__ == '__main__':
    main()
