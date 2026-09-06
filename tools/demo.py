# -*- coding: utf-8 -*-
"""Build the demo levels from the art library.

  python tools/demo.py            compose the demo -> demo/img/, src/levels-demo.js, sheets

Every picture is composed from layers, so a difference is always a whole
object and the two pictures are identical everywhere else.
"""
import os, io, sys, json, math, random
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A
from assets import CATALOG

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out')
IMG = os.path.join(ROOT, 'demo', 'img')
os.makedirs(IMG, exist_ok=True)
W, H = 720, 600          # picture size; the game works in 360 x 300 units (scale 2)

SCENES = {
 'altar': dict(
    name={'en': 'The Moon Altar', 'vi': 'Bàn Thờ Trăng'},
    tint=(150, 124, 172),
    prompt=('an empty dark walnut wood table surface photographed from directly straight above, '
            'completely empty with nothing on it, warm candlelight falling from one side, '
            'rich wood grain, deep soft shadows towards the corners'),
    pool=['candle_jar', 'candle_pillar', 'tealight', 'amethyst', 'crystalball', 'card_moon', 'card_fan',
          'book', 'moon_charm', 'star_charm', 'key', 'bell', 'lavender', 'petals_bowl', 'bottle_violet',
          'owl', 'feather', 'mala', 'pocketwatch', 'incense', 'rose_dried', 'ring']),
 'velvet': dict(
    name={'en': 'Velvet Night', 'vi': 'Đêm Nhung'},
    tint=(138, 122, 186),
    prompt=('an empty deep indigo blue velvet cloth photographed from directly straight above, '
            'completely empty with nothing on it, soft folds in the fabric, gentle warm light from one side'),
    pool=['crystalball', 'quartzpoint', 'rosequartz', 'geode', 'pendulum', 'card_sun', 'card_moon',
          'star_charm', 'moon_charm', 'sun_charm', 'compass', 'mirror', 'coin', 'shell', 'feather',
          'tealight', 'bottle_blue', 'acorn', 'ring', 'cat']),
 'linen': dict(
    name={'en': 'Tea and Petals', 'vi': 'Trà và Cánh Hoa'},
    tint=(168, 146, 172),
    prompt=('an empty warm cream linen tablecloth photographed from directly straight above, '
            'completely empty with nothing on it, soft natural daylight, gentle fabric texture'),
    pool=['teacup', 'teapot', 'honey', 'orange_slice', 'rose_dried', 'petals_bowl', 'eucalyptus',
          'lavender', 'sage', 'envelope', 'scroll', 'card_sun', 'star_charm', 'shell', 'matchbox',
          'book', 'candle_pillar', 'bell', 'acorn', 'ring']),
}

def bg(key):
    s = SCENES[key]
    return A.background('sc_' + key, s['prompt'], seed=17, w=W, h=H).convert('RGBA').copy()

def spr(name):
    return A.sprite(name, CATALOG[name][0])

def frac(name):
    return CATALOG[name][1]

# ------------------------------------------------------------- placement ---
def scatter(seed, names, big=1.0, margin=.08, gap=1.12):
    """Objects anywhere in the frame, never touching."""
    R = random.Random(seed)
    out = []
    for n in names:
        s = spr(n)
        hgt = frac(n) * H * big * R.uniform(.94, 1.06)
        wid = s.size[0] * hgt / s.size[1]
        rad = max(wid, hgt) / 2
        got = None
        for _ in range(900):
            cx = R.uniform(W * margin + wid / 2, W * (1 - margin) - wid / 2)
            cy = R.uniform(H * margin + hgt / 2, H * (1 - margin) - hgt / 2)
            if all(math.hypot(cx - px, cy - py) > (rad + pr) * gap for px, py, pr in out):
                got = (cx, cy, rad); break
        if got is None: return None
        out.append(got)
    return [(int(cx), int(cy), int(frac(n) * H * big), rad) for (cx, cy, rad), n in zip(out, names)]

def fit(seed, names, big=1.06):
    """Try harder and harder until every object fits without touching."""
    for gap in (1.12, 1.06, 1.02):
        for shrink in (1.0, .94, .88, .82):
            for t in range(seed, seed + 25):
                sp = scatter(t, names, big=big * shrink, gap=gap)
                if sp: return sp
    return None


def put(scene, s, cx, cy, hgt, tint, rot=0, flip=False, scale=1.0):
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    h2 = max(10, int(hgt * scale))
    w2 = max(10, int(s.size[0] * h2 / s.size[1]))
    s = s.resize((w2, h2), Image.LANCZOS)
    if rot: s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
    s = A.grade(s, tint, amount=.26)
    x0, y0 = int(cx - s.size[0] / 2), int(cy - s.size[1] / 2)
    sil = Image.new('RGBA', s.size, (0, 0, 0, 255)); sil.putalpha(s.split()[3])
    sh = Image.new('RGBA', scene.size, (0, 0, 0, 0))
    sh.alpha_composite(sil, (x0 + max(2, int(h2 * .04)), y0 + max(2, int(h2 * .055))))
    sh = sh.filter(ImageFilter.GaussianBlur(max(2, h2 * .055)))
    sh.putalpha(sh.split()[3].point(lambda v: int(v * .5)))
    scene.alpha_composite(sh)
    scene.alpha_composite(s, (x0, y0))
    return max(s.size) / 2

# ---------------------------------------------------------------- levels ---
KIND_LABEL = {'remove': 'object gone', 'hue': 'different colour', 'scale': 'different size',
              'flip': 'facing the other way', 'rot': 'turned around', 'swap': 'different object'}

def build_diff(lid, scene_key, seed, n_obj, n_find, mirror=False):
    sc = SCENES[scene_key]; R = random.Random(seed)
    names = R.sample(sc['pool'], n_obj)
    spots = fit(seed, names, 1.06)
    if not spots: raise SystemExit('layout failed for ' + lid)
    rots = [R.randint(-22, 22) for _ in names]
    # pick well separated targets, prefer big objects
    idx = sorted(range(len(names)), key=lambda i: -spots[i][2])
    chosen, minlen = [], 150
    while len(chosen) < n_find and minlen > 40:
        for i in idx:
            if len(chosen) >= n_find: break
            if i in chosen: continue
            if all(math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]) > minlen for j in chosen):
                chosen.append(i)
        minlen -= 20
    kinds = ['remove', 'hue', 'scale', 'flip', 'swap', 'hue', 'rot'][:n_find]
    R.shuffle(kinds)
    A1, B1 = bg(scene_key), bg(scene_key)
    targets, notes = [], []
    for i, nm in enumerate(names):
        cx, cy, hgt, _r = spots[i]
        s = spr(nm)
        r = put(A1, s, cx, cy, hgt, sc['tint'], rot=rots[i])
        if i not in chosen:
            put(B1, s, cx, cy, hgt, sc['tint'], rot=rots[i]); continue
        k = kinds[chosen.index(i)]
        if k == 'remove':
            targets.append((cx, cy, r)); notes.append(nm + ': ' + KIND_LABEL[k]); continue
        s2, sc2, fl, ro = s, 1.0, False, rots[i]
        if k == 'hue':  s2 = A.recolor(s, R.choice([96, 120, 148, 172]), sat=1.15)
        if k == 'scale': sc2 = 1.4
        if k == 'flip':  fl = True
        if k == 'rot':   ro = rots[i] + R.choice([-58, 58])
        if k == 'swap':
            alt = [x for x in sc['pool'] if x not in names and abs(frac(x) - frac(nm)) < .05 and spr(x)]
            if alt: s2 = spr(R.choice(alt))
            else: s2 = A.recolor(s, 140, sat=1.2); k = 'hue'
        r2 = put(B1, s2, cx, cy, hgt, sc['tint'], rot=ro, flip=fl, scale=sc2)
        targets.append((cx, cy, max(r, r2)))
        notes.append(nm + ': ' + KIND_LABEL[k])
    return finish_level(lid, A1, B1, targets, notes, mirror)

def build_same(lid, scene_key, seed, n_obj, n_same):
    sc = SCENES[scene_key]; R = random.Random(seed)
    names = R.sample(sc['pool'], n_obj)
    spots = fit(seed, names, 1.02)
    if not spots: raise SystemExit('layout failed for ' + lid)
    rots = [R.randint(-22, 22) for _ in names]
    keep = set(R.sample(range(len(names)), n_same))
    A2, B2 = bg(scene_key), bg(scene_key)
    targets, notes = [], []
    for i, nm in enumerate(names):
        cx, cy, hgt, _r = spots[i]
        s = spr(nm)
        r = put(A2, s, cx, cy, hgt, sc['tint'], rot=rots[i])
        if i in keep:
            put(B2, s, cx, cy, hgt, sc['tint'], rot=rots[i])
            targets.append((cx, cy, r)); notes.append(nm + ': unchanged')
        else:
            put(B2, A.recolor(s, R.choice([58, 86, 114, 142, 170, 198]), sat=1.2), cx, cy, hgt, sc['tint'], rot=rots[i])
    return finish_level(lid, A2, B2, targets, notes, False)

def finish_level(lid, A1, B1, targets, notes, mirror):
    a, b = A.finish(A1, vignette=.30, grain=6), A.finish(B1, vignette=.30, grain=6)
    a.save(os.path.join(IMG, '%sa.jpg' % lid), quality=88, optimize=True, progressive=True)
    b.save(os.path.join(IMG, '%sb.jpg' % lid), quality=88, optimize=True, progressive=True)
    return dict(a=a, b=b,
                targets=[{'i': i, 'x': round(x / 2), 'y': round(y / 2), 'r': max(22, round(r / 2))}
                         for i, (x, y, r) in enumerate(targets)],
                notes=notes)

# ------------------------------------------------------------------ plan ---
PLAN = [
 dict(id=1,  scene='altar',  type='diff', obj=10, find=3, time=0),
 dict(id=2,  scene='linen',  type='diff', obj=11, find=4, time=0),
 dict(id=3,  scene='velvet', type='same', obj=11, find=4, time=0),
 dict(id=4,  scene='altar',  type='diff', obj=12, find=5, time=150),
 dict(id=5,  scene='linen',  type='diff', obj=12, find=5, time=140),
 dict(id=6,  scene='velvet', type='diff', obj=13, find=5, time=130, mirror=True),
 dict(id=7,  scene='altar',  type='same', obj=13, find=5, time=170),
 dict(id=8,  scene='velvet', type='diff', obj=13, find=6, time=120),
]

def main():
    levels, sheets = [], []
    for p in PLAN:
        lid = '%03d' % p['id']
        seed = 400 + p['id'] * 17
        if p['type'] == 'same':
            r = build_same(lid, p['scene'], seed, p['obj'], p['find'])
        else:
            r = build_diff(lid, p['scene'], seed, p['obj'], p['find'], p.get('mirror', False))
        lvl = dict(id=p['id'], ch=1, n=p['id'], type=p['type'], time=p['time'],
                   miss=6 if p['time'] else 8, find=len(r['targets']),
                   a='img/%sa.jpg' % lid, b='img/%sb.jpg' % lid,
                   targets=r['targets'], kinds=r['notes'],
                   par=len(r['targets']) * 14 + 16, bg=p['scene'])
        if p.get('mirror'): lvl['mirror'] = 1
        levels.append(lvl); sheets.append((lvl, r['a'], r['b']))
        print('level %s %s find %d/%d  %s' % (lid, p['type'], len(r['targets']), p['find'], ', '.join(r['notes'])), flush=True)

    used = sorted({l['bg'] for l in levels})
    scenes_js = ', '.join(
        "%s: {name: %s, pool: [], zones: [], draw: function () { return ''; }}"
        % (k, json.dumps(SCENES[k]['name'], ensure_ascii=False)) for k in used)
    chapters = [{'id': 1, 'bg': used[0], 'card': {'en': 'The Fool', 'vi': 'Chàng Khờ'}, 'need': 0}]
    about_en = ('Demo of Nabu Twin Stars. Every picture is built from painted objects placed on a painted '
                'table, so a difference is always a whole object. Nothing here is scary.')
    about_vi = ('Bản dùng thử Nabu Twin Stars. Mỗi bức tranh được ghép từ những món đồ vẽ sẵn đặt trên mặt '
                'bàn vẽ sẵn, nên điểm khác luôn là cả một món đồ. Không có gì đáng sợ.')
    js = ('/* Demo levels, composed by tools/demo.py. Do not edit by hand. */\n'
          'const LEVELS = ' + json.dumps(levels, separators=(',', ':')) + ';\n'
          'const DAILY_POOL = [];\n'
          'Object.assign(SCENES, {' + scenes_js + '});\n'
          'CHAPTERS.length = 0; ' + json.dumps(chapters, ensure_ascii=False)
          + '.forEach(function (c) { CHAPTERS.push(c); });\n'
          'STR.en.aboutText = ' + json.dumps(about_en) + ';\n'
          'STR.vi.aboutText = ' + json.dumps(about_vi, ensure_ascii=False) + ';\n')
    io.open(os.path.join(ROOT, 'src', 'levels-demo.js'), 'w', encoding='utf-8', newline='\n').write(js)

    # review sheet
    tw, th = 480, 400
    bd = Image.new('RGB', (tw * 2 + 30, len(sheets) * (th + 26) + 10), '#EFE9FA')
    d = ImageDraw.Draw(bd)
    for k, (lvl, a, b) in enumerate(sheets):
        aa = a.resize((tw, th)); bb = b.resize((tw, th))
        if lvl.get('mirror'): bb = bb.transpose(Image.FLIP_LEFT_RIGHT)
        db = ImageDraw.Draw(bb)
        for t in lvl['targets']:
            x = (tw - t['x'] * tw / 360) if lvl.get('mirror') else t['x'] * tw / 360
            y = t['y'] * th / 300; r = t['r'] * tw / 360
            db.ellipse((x - r, y - r, x + r, y + r), outline=(255, 208, 80), width=4)
        y0 = 10 + k * (th + 26)
        bd.paste(aa, (0, y0)); bd.paste(bb, (tw + 30, y0))
        d.text((4, y0 - 12), '%d %s%s  find %d  %s' % (lvl['id'], lvl['type'], ' mirror' if lvl.get('mirror') else '',
                                                       lvl['find'], ', '.join(lvl['kinds'])[:110]), fill=(59, 42, 94))
    bd.save(os.path.join(OUT, 'demo_sheet.png'))
    total = sum(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG))
    print('demo: %d levels, %d images, %.1f MB' % (len(levels), len(os.listdir(IMG)), total / 1e6))

if __name__ == '__main__':
    main()
