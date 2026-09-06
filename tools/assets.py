# -*- coding: utf-8 -*-
"""The art library: one AI-painted object per entry, cut out with alpha.

  python tools/assets.py make          generate everything missing (slow, one at a time)
  python tools/assets.py make candle   generate just the ones whose name contains "candle"
  python tools/assets.py sheet         contact sheet of every cut-out -> tools/out/assets.png
  python tools/assets.py redo a b c    delete those and make them again with a new seed

Objects are flat-lay (seen from straight above) so they can be scattered
anywhere in a picture without perspective problems.
"""
import os, io, sys, json
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS = os.path.join(HERE, 'seeds.json')

# name -> (prompt, size as a fraction of the picture height)
CATALOG = {
 # --- light ---
 'candle_jar':   ('one lit white candle inside a short clear glass jar, seen from straight above, the flame in the middle', .19),
 'candle_pillar':('one thick lit ivory pillar candle standing, seen from straight above, small flame in the centre', .17),
 'tealight':     ('one small lit tealight candle in a metal cup, seen from straight above', .12),
 'lantern':      ('one small ornate gold metal lantern with a candle inside, seen from straight above', .20),
 'matchbox':     ('one small vintage matchbox lying flat, seen from straight above', .12),
 # --- crystals ---
 'amethyst':     ('one raw purple amethyst crystal cluster with many sharp points, lying flat, seen from directly above', .19),
 'rosequartz':   ('one smooth pink rose quartz stone, lying flat, seen from straight above', .14),
 'quartzpoint':  ('one long clear quartz crystal point lying flat and diagonal, single crystal, seen from directly above', .16),
 'crystalball':  ('one clear glass sphere resting on a small gold ring stand, seen from straight above', .17),
 'geode':        ('one round agate geode slice with blue and white bands, lying flat, seen from straight above', .16),
 'pendulum':     ('one pointed crystal pendulum on a fine silver chain, lying flat in a loose curl, seen from straight above', .21),
 # --- cards & paper ---
 'card_moon':    ('one single tarot card lying face up, seen from straight above, deep blue card with a gold crescent moon and stars printed on it', .21),
 'card_sun':     ('one single tarot card lying face up, seen from straight above, cream card with a gold sun printed on it', .21),
 'card_fan':     ('three tarot cards lying face down spread in a neat fan on a flat surface, seen from straight above, dark blue backs with gold pattern', .24),
 'book':         ('one closed dark leather antique book lying flat and shut, gold ornament stamped on the cover, seen from directly straight above', .23),
 'scroll':       ('one rolled parchment scroll tied with a red ribbon, lying flat and horizontal, seen from directly above', .19),
 'envelope':     ('one cream envelope with a red wax seal, lying flat, seen from straight above', .18),
 # --- charms & metal ---
 'moon_charm':   ('one polished gold crescent moon ornament lying flat, seen from straight above', .14),
 'star_charm':   ('one small gold five pointed star ornament lying flat, seen from straight above', .11),
 'sun_charm':    ('one gold sun medallion with a face in the middle and pointed rays around it, lying flat, seen from directly above', .13),
 'key':          ('one old fashioned brass skeleton key lying flat and diagonal, the whole key from the round handle to the teeth visible, seen from directly above', .16),
 'bell':         ('one small brass hand bell with a wooden handle, lying on its side, whole bell visible, seen from directly above', .14),
 'pocketwatch':  ('one open antique gold pocket watch lying flat, seen from straight above', .16),
 'ring':         ('one gold ring with a purple stone, lying flat, seen from straight above', .09),
 'mala':         ('one loop of wooden mala prayer beads laid in a circle, seen from straight above', .22),
 'mirror':       ('one small round hand mirror with an ornate gold frame, lying flat, seen from straight above', .18),
 'compass':      ('one antique brass compass lying open and flat, seen from straight above', .16),
 # --- plants ---
 'lavender':     ('a small bunch of dried lavender flowers with long straight stems tied with twine, lying flat, seen from directly above', .24),
 'rose_dried':   ('one dried red rose flower head lying flat, seen from straight above', .13),
 'petals_bowl':  ('one small round ceramic bowl filled with dried pink rose petals, seen from straight above', .16),
 'eucalyptus':   ('one small sprig of green eucalyptus leaves lying flat, seen from straight above', .22),
 'orange_slice': ('one dried orange slice lying flat, seen from straight above', .12),
 'sage':         ('one bundle of dried pale green sage leaves tied with string, lying flat and straight like a wand, seen from directly above', .20),
 # --- tea ---
 'teacup':       ('one white porcelain teacup filled with amber tea sitting on a matching round saucer, seen from directly straight above', .17),
 'teapot':       ('one white ceramic teapot with a curved spout and a handle, whole teapot visible, seen from above at a slight angle', .19),
 'honey':        ('one small glass jar of honey with a wooden dipper, seen from straight above', .15),
 # --- bottles ---
 'bottle_violet':('one small glass apothecary bottle with a cork, filled with violet liquid, lying flat, seen from straight above', .15),
 'bottle_blue':  ('one small glass apothecary bottle with a cork, filled with blue liquid, lying flat, seen from straight above', .15),
 'incense':      ('three thin brown incense sticks lying side by side next to a small carved wooden holder, flat, seen from directly above', .22),
 # --- creatures & keepsakes ---
 'owl':          ('one small carved wooden owl figurine standing upright, whole owl visible, seen from above at a slight angle', .15),
 'cat':          ('one small glossy black cat figurine ornament sitting upright, whole figurine visible, seen from above at a slight angle', .15),
 'feather':      ('one single soft grey and white feather lying flat, seen from straight above', .22),
 'shell':        ('one spiral nautilus seashell lying flat, seen from directly above, cream and brown stripes', .14),
 'acorn':        ('one brown acorn with its little cap, lying flat, seen from directly above', .09),
 'coin':         ('three old gold coins lying flat in a small pile, seen from straight above', .12),
}

def seeds():
    return json.load(io.open(SEEDS, encoding='utf-8')) if os.path.exists(SEEDS) else {}

def save_seeds(s):
    json.dump(s, io.open(SEEDS, 'w', encoding='utf-8'), indent=1, sort_keys=True)

def make(filt=None):
    sd = seeds()
    items = [(n, p, sd.get(n, 7)) for n, (p, _f) in CATALOG.items() if not filt or filt in n]
    A.sprites_parallel(items)
    save_seeds(sd)

def redo(names):
    sd = seeds()
    for n in names:
        if n not in CATALOG: print('unknown', n); continue
        sd[n] = sd.get(n, 7) + 1
        for f in os.listdir(A.SPR):
            if f == n + '.png': os.remove(os.path.join(A.SPR, f))
        for f in os.listdir(A.RAW):
            if f.startswith(n + '_'): os.remove(os.path.join(A.RAW, f))
    save_seeds(sd)
    A.sprites_parallel([(n, CATALOG[n][0], sd[n]) for n in names if n in CATALOG])

def sheet():
    """Every cut-out on a mid grey checker so alpha problems show up."""
    names = sorted(n for n in CATALOG if os.path.exists(os.path.join(A.SPR, n + '.png')))
    cols, cell = 8, 180
    rows = (len(names) + cols - 1) // cols
    bd = Image.new('RGB', (cols * cell, rows * (cell + 18)), (105, 100, 115))
    d = ImageDraw.Draw(bd)
    for i, n in enumerate(names):
        s = Image.open(os.path.join(A.SPR, n + '.png')).convert('RGBA')
        s.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
        x, y = (i % cols) * cell, (i // cols) * (cell + 18)
        bd.paste(s, (x + (cell - s.size[0]) // 2, y + (cell - s.size[1]) // 2), s)
        d.text((x + 4, y + cell + 2), n, fill=(255, 255, 255))
    out = os.path.join(HERE, 'out', 'assets.png')
    bd.save(out); print('sheet:', out, len(names), 'of', len(CATALOG))

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'make'
    if cmd == 'make': make(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == 'redo': redo(sys.argv[2:])
    elif cmd == 'sheet': sheet()
