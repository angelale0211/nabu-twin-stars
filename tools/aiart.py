# -*- coding: utf-8 -*-
"""AI art pipeline for Nabu Twin Stars.

Scenes are COMPOSED, the way hidden-object games are made: an AI-painted
background plus AI-painted objects cut out with alpha. Because every object is
its own layer, a difference is always a whole object (removed, recoloured,
swapped, resized, moved, mirrored) - never a smeared patch - and the two
pictures are pixel-identical everywhere else by construction.

Images come from Pollinations (free, no key, Flux). Cut-outs use rembg.
Everything is cached on disk, so a re-bake costs nothing.
"""
import os, io, math, time, json, hashlib, urllib.request, urllib.parse, threading
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SPR = os.path.join(HERE, 'sprites'); BG = os.path.join(HERE, 'bg'); RAW = os.path.join(HERE, 'raw')
for d in (SPR, BG, RAW): os.makedirs(d, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 NabuTwinStars/2.0'}
_lock = threading.Lock()

# ------------------------------------------------------------------ fetch ---
def fetch(prompt, w, h, seed, model='flux', tries=6):
    url = 'https://image.pollinations.ai/prompt/%s?width=%d&height=%d&model=%s&nologo=true&seed=%d' % (
        urllib.parse.quote(prompt), w, h, model, seed)
    for a in range(tries):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=240).read()
            im = Image.open(io.BytesIO(b)); im.load()
            if im.size[0] >= 600:
                im = im.convert('RGB')
                if im.size != (w, h): im = im.resize((w, h), Image.LANCZOS)
                return im
        except Exception as e:
            code = getattr(e, 'code', 0)
            wait = 30 + a * 25 if code == 429 else 6 + a * 6
            print('   retry', a, str(e)[:70], '-> wait %ds' % wait, flush=True); time.sleep(wait)
    return None

def _cache(path, make):
    if os.path.exists(path):
        try: return Image.open(path)
        except Exception: pass
    im = make()
    if im is not None: im.save(path)
    return im

# ---------------------------------------------------------------- sprites ---
SPRITE_STYLE = ('one single object alone filling most of the frame, the whole object inside the frame and '
                'not cropped, flat lay photographed from directly above, plain flat light grey seamless '
                'studio background, even soft light, soft shadow, sharp focus, fine detail, realistic '
                'product photo, no plate, no dish, no tray, no bowl under it, no ring or circular frame '
                'around it, no text, no watermark, no border, no people, no hands')

def _cutout(im):
    """rembg -> RGBA, trimmed to the object, edges cleaned."""
    from rembg import remove
    out = remove(im, post_process_mask=True)
    out = out.convert('RGBA')
    a = out.split()[3]
    # drop stray specks: keep only pixels with a decent alpha, then soften the rim
    a = a.point(lambda v: 0 if v < 40 else v)
    a = a.filter(ImageFilter.GaussianBlur(0.6))
    out.putalpha(a)
    bb = out.getbbox()
    if bb: out = out.crop(bb)
    return out

def sprite(name, prompt, seed=7, size=768):
    """Cached RGBA sprite, trimmed."""
    p = os.path.join(SPR, '%s.png' % name)
    if os.path.exists(p):
        return Image.open(p).convert('RGBA')
    raw_p = os.path.join(RAW, '%s_%d.jpg' % (name, seed))
    im = _cache(raw_p, lambda: fetch(prompt + ', ' + SPRITE_STYLE, size, size, seed))
    if im is None: return None
    out = _cutout(im.convert('RGB'))
    out.save(p)
    return out

def sprites_parallel(items, workers=1, pause=4.0):
    """One at a time: the free image service rate-limits parallel requests."""
    todo = [it for it in items if not os.path.exists(os.path.join(SPR, '%s.png' % it[0]))]
    print('sprites: %d cached, %d to make' % (len(items) - len(todo), len(todo)), flush=True)
    for i, it in enumerate(todo):
        try:
            ok = sprite(*it)
            print('   %d/%d %s %s' % (i + 1, len(todo), it[0], 'ok' if ok is not None else 'FAILED'), flush=True)
        except Exception as e:
            print('   FAIL', it[0], str(e)[:120], flush=True)
        time.sleep(pause)

# ------------------------------------------------------------ backgrounds ---
BG_STYLE = ('painterly atmospheric photograph, cinematic soft light, rich depth, '
            'empty surface with nothing on it, no text, no watermark, no people')

def background(name, prompt, seed=3, w=1152, h=960):
    p = os.path.join(BG, '%s.jpg' % name)
    return _cache(p, lambda: fetch(prompt + ', ' + BG_STYLE, w, h, seed))

# ------------------------------------------------------------- compositing --
def recolor(spr, deg, sat=1.0, light=1.0):
    """Rotate hue of the object's own pixels only; alpha untouched."""
    r, g, b, a = spr.split()
    hsv = Image.merge('RGB', (r, g, b)).convert('HSV')
    H, S, V = hsv.split()
    H = H.point(lambda v: int((v + deg) % 256))
    if sat != 1.0: S = S.point(lambda v: max(0, min(255, int(v * sat))))
    if light != 1.0: V = V.point(lambda v: max(0, min(255, int(v * light))))
    rgb = Image.merge('HSV', (H, S, V)).convert('RGB')
    out = rgb.convert('RGBA'); out.putalpha(a)
    return out

def grade(spr, tint, amount=0.30, contrast=0.94):
    """Push the sprite toward the scene's ambient colour so it belongs there."""
    rgb = spr.convert('RGB')
    layer = Image.new('RGB', spr.size, tint)
    rgb = Image.blend(rgb, ImageChops.multiply(rgb, layer), amount * 0.8)
    rgb = Image.blend(rgb, layer, amount * 0.22)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    out = rgb.convert('RGBA'); out.putalpha(spr.split()[3])
    return out

def place(scene, spr, cx, ybase, height, tint, light=(-0.5, 1.0), shadow=0.55, flip=False):
    """Put a sprite on the scene: contact shadow, cast shadow, grading. Returns bbox."""
    s = spr
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    w = max(8, int(s.size[0] * height / max(1, s.size[1])))
    s = s.resize((w, int(height)), Image.LANCZOS)
    s = grade(s, tint)
    x0, y0 = int(cx - w / 2), int(ybase - height)
    a = s.split()[3]
    # contact shadow: squashed silhouette under the base
    cs = Image.new('RGBA', scene.size, (0, 0, 0, 0))
    sil = Image.new('RGBA', s.size, (0, 0, 0, 255)); sil.putalpha(a)
    sq = sil.resize((int(w * 1.05), max(4, int(height * 0.13))), Image.LANCZOS)
    cs.alpha_composite(sq, (int(cx - sq.size[0] / 2), int(ybase - sq.size[1] * 0.55)))
    cs = cs.filter(ImageFilter.GaussianBlur(height * 0.045))
    cs.putalpha(cs.split()[3].point(lambda v: int(v * shadow)))
    scene.alpha_composite(cs)
    # cast shadow along the light direction
    ds = Image.new('RGBA', scene.size, (0, 0, 0, 0))
    ds.alpha_composite(sil, (x0 + int(-light[0] * height * 0.10), y0 + int(height * 0.045)))
    ds = ds.filter(ImageFilter.GaussianBlur(height * 0.05))
    ds.putalpha(ds.split()[3].point(lambda v: int(v * shadow * 0.5)))
    scene.alpha_composite(ds)
    scene.alpha_composite(s, (x0, y0))
    return (x0, y0, x0 + w, y0 + int(height))

def finish(scene, vignette=0.34, grain=7.0, warm=None):
    """One grade over the whole picture so background and objects share air."""
    im = scene.convert('RGB')
    w, h = im.size
    if warm:
        im = Image.blend(im, Image.new('RGB', (w, h), warm), 0.05)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = np.clip(1 - vignette * np.clip((d - 0.55) / 0.75, 0, 1) ** 1.5, 0, 1)
    arr = np.asarray(im, np.float32) * v[..., None]
    if grain:
        rng = np.random.default_rng(5)
        arr += rng.normal(0, grain, arr.shape)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
