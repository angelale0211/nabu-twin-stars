# -*- coding: utf-8 -*-
"""The art library: one AI-painted object per entry, cut out with alpha.

  python tools/assets.py make          generate everything missing (slow, one at a time)
  python tools/assets.py make crystal  only the ones whose name contains "crystal"
  python tools/assets.py sheet         contact sheets -> tools/out/assets_NN.png
  python tools/assets.py redo a b c    delete those and make them again with a new seed
  python tools/assets.py count         how many are done

Objects are flat-lay (seen from straight above) so they can be scattered
anywhere in a picture without perspective problems. Each entry is
  name -> (prompt, size as a fraction of the picture height, theme)
The theme decides which chapters an object may appear in.
"""
import os, io, sys, json
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS = os.path.join(HERE, 'seeds.json')
FLAT = 'lying flat, seen from directly above'

CATALOG = {}

def add(name, prompt, size, theme):
    CATALOG[name] = (prompt, size, theme)

def family(theme, size, items):
    for name, prompt in items:
        add(name, prompt, size, theme)

# ------------------------------------------------------------------ light --
family('light', .18, [
 ('candle_jar',    'one lit white candle inside a short clear glass jar, seen from straight above, the flame in the middle'),
 ('candle_pillar', 'one thick lit ivory pillar candle standing, seen from straight above, small flame in the centre'),
 ('candle_black',  'one lit black pillar candle standing, seen from straight above, small flame in the centre'),
 ('candle_pink',   'one lit dusty pink pillar candle standing, seen from straight above, small flame in the centre'),
 ('candle_taper',  'one slim ivory taper candle in a small brass holder, seen from straight above'),
 ('candle_beeswax','one rolled golden beeswax candle standing, seen from straight above'),
 ('lantern',       'one small ornate gold metal lantern with a candle inside, seen from straight above'),
 ('lantern_paper', 'one small round paper lantern glowing warm, standing upright, seen from above at a slight angle'),
 ('oil_lamp',      'one small brass oil lamp with a glass chimney, seen from above at a slight angle'),
 ('snuffer',       'one brass candle snuffer, a small cone on a long straight handle, lying flat and diagonal, seen from directly above'),
 ('matchbox',      'one small vintage matchbox ' + FLAT),
 ('matches',       'three wooden matches with red tips lying side by side ' + FLAT),
])
add('tealight', 'one small lit tealight candle in a metal cup, seen from straight above', .12, 'light')

# --------------------------------------------------------------- crystals --
GEMS = [
 ('amethyst', 'a raw purple amethyst crystal cluster with many sharp points'),
 ('rosequartz', 'a smooth polished pink rose quartz stone'),
 ('quartzpoint', 'one long clear quartz crystal point, single crystal'),
 ('citrine', 'a golden yellow citrine crystal cluster'),
 ('obsidian', 'a polished round black obsidian stone'),
 ('selenite', 'one long white selenite crystal wand with a rough surface, lying flat and diagonal, seen from directly above'),
 ('fluorite', 'a green and purple banded fluorite crystal'),
 ('labradorite', 'a polished labradorite stone with blue and green flashes'),
 ('malachite', 'a polished green malachite stone with dark banding'),
 ('pyrite', 'a cube of golden pyrite fools gold'),
 ('moonstone', 'one polished oval milky white moonstone with a blue sheen, lying flat seen from directly above'),
 ('carnelian', 'one polished orange red carnelian gemstone with visible facets, lying flat seen from directly above'),
 ('lapis', 'a polished deep blue lapis lazuli stone with gold flecks'),
 ('jade', 'one smooth polished pale green jade pebble, lying flat seen from directly above'),
 ('tourmaline', 'a rough black tourmaline crystal'),
 ('opal', 'one polished oval white opal gemstone with rainbow flashes, lying flat seen from directly above'),
]
family('crystal', .16, [(n, p + ' ' + FLAT) for n, p in GEMS])
family('crystal', .17, [
 ('geode',       'one round agate geode slice with blue and white bands ' + FLAT),
 ('geode_pink',  'one round agate geode slice with pink and cream bands ' + FLAT),
 ('crystalball', 'one clear glass sphere resting on a small gold ring stand, seen from straight above'),
 ('crystal_tray','four small polished coloured stones lying together in a loose group, seen from directly above'),
 ('geode_half',  'one open amethyst geode half showing purple crystals inside ' + FLAT),
])

# ---------------------------------------------------------------- zodiac ---
ZODIAC = [('aries', 'a ram head with curled horns'), ('taurus', 'a bull head'),
          ('gemini', 'two standing twin figures'), ('cancer', 'a crab'), ('leo', 'a lion head'),
          ('virgo', 'a standing maiden'), ('libra', 'a pair of balance scales'), ('scorpio', 'a scorpion'),
          ('sagittarius', 'an archer drawing a bow'), ('capricorn', 'a goat with curled horns'),
          ('aquarius', 'a figure pouring a water jug'), ('pisces', 'two fish swimming in a circle')]
ZOD_P = ('one round solid gold coin lying flat seen from directly above, the face of the coin filled edge to edge '
         'with %s carved in raised relief, solid metal disc, not a ring, not a picture frame, nothing hollow in the middle')
family('celestial', .13, [('zodiac_' + n, ZOD_P % sym) for n, sym in ZODIAC])

# ------------------------------------------------------------- celestial ---
family('celestial', .14, [
 ('moon_charm',   'one solid gold crescent moon shape, a thick curved crescent, lying flat seen from directly above, solid metal, not a ring'),
 ('moon_silver',  'one solid silver crescent moon shape, a thick curved crescent, lying flat seen from directly above, solid metal, not a ring'),
 ('star_charm',   'one small gold five pointed star ornament ' + FLAT),
 ('star_silver',  'one small silver eight pointed star ornament ' + FLAT),
 ('sun_charm',    'one gold sun medallion with a face in the middle and pointed rays around it ' + FLAT),
 ('planet_charm', 'one small brass planet ball with a flat ring tilted around it, lying flat seen from directly above'),
 ('comet_charm',  'one gold comet shape with a round head and a long swept tail, lying flat seen from directly above, solid metal'),
 ('moon_phases',  'a straight row of five separate small brass discs showing crescent, half, full, half, crescent, lying flat seen from directly above'),
 ('astrolabe',    'one small brass astrolabe disc with engraved rings ' + FLAT),
 ('star_map',     'one small round brass star chart disc ' + FLAT),
])

# ------------------------------------------------------------------ cards --
family('paper', .21, [
 ('card_moon',  'one tarot card lying face up, deep blue card with a gold crescent moon and stars printed on it, ' + FLAT),
 ('card_sun',   'one tarot card lying face up, cream card with a gold sun printed on it, ' + FLAT),
 ('card_star',  'one tarot card lying face up, indigo card with a gold eight pointed star printed on it, ' + FLAT),
 ('card_tower', 'one tarot card lying face up, dark card with a gold tower printed on it, ' + FLAT),
 ('card_wheel', 'one tarot card lying face up, deep red card with a gold wheel printed on it, ' + FLAT),
 ('card_back',  'one tarot card lying face down, dark blue back with a gold pattern, ' + FLAT),
 ('card_fan',   'three tarot cards spread in a neat fan, dark blue backs with gold pattern, ' + FLAT),
 ('card_pair',  'two tarot cards lying flat side by side face down, purple backs with a silver pattern, seen from directly above'),
 ('oracle_card','one oracle card lying face up flat, pale pink card printed with a gold butterfly and a border, seen from directly above'),
 ('card_stack', 'a neat square stack of tarot cards seen from directly above, dark blue back with a gold border'),
])

# ------------------------------------------------------------------ paper --
family('paper', .20, [
 ('book',        'one closed dark leather antique book lying flat and shut, gold ornament stamped on the cover, seen from directly straight above'),
 ('book_red',    'one closed red cloth bound book lying flat and shut, seen from directly straight above'),
 ('book_open',   'one open hardback book lying flat showing two pages of printed text, seen from directly straight above'),
 ('journal',     'one small brown leather journal tied with a cord, closed, seen from directly straight above'),
 ('scroll',      'one rolled parchment scroll tied with a red ribbon, lying flat and horizontal, seen from directly above'),
 ('envelope',    'one cream envelope with a red wax seal ' + FLAT),
 ('letter',      'one folded sheet of cream paper with handwriting on it, lying flat seen from directly above'),
 ('wax_seal',    'one round red wax seal stamp with a brass handle ' + FLAT),
 ('quill',       'one white feather quill pen lying flat and diagonal, the whole feather and its nib visible, seen from directly above'),
 ('inkpot',      'one small square glass ink bottle with a brass screw lid, seen from above at a slight angle'),
 ('stamp',       'one rectangular old postage stamp with perforated edges, lying flat seen from directly above'),
 ('bookmark',    'one flat ribbon bookmark with a tassel at one end, lying straight and diagonal, seen from directly above'),
])

# ------------------------------------------------------------- botanicals --
family('botanical', .20, [
 ('lavender',    'a small bunch of dried lavender flowers with long straight stems tied with twine, ' + FLAT),
 ('sage',        'one bundle of dried pale green sage leaves tied with string, lying flat and straight like a wand, seen from directly above'),
 ('eucalyptus',  'one small sprig of green eucalyptus leaves ' + FLAT),
 ('fern',        'one green fern frond ' + FLAT),
 ('wheat',       'three stalks of golden dried wheat lying side by side ' + FLAT),
 ('thistle',     'one dried purple thistle head with a stem ' + FLAT),
 ('poppy_pod',   'three dried poppy seed pods on stems ' + FLAT),
 ('rosemary',    'one sprig of fresh rosemary ' + FLAT),
 ('pine',        'one small green pine branch sprig ' + FLAT),
 ('olive',       'one small olive branch with green leaves ' + FLAT),
 ('cotton',      'one dried cotton stem with white bolls ' + FLAT),
 ('pampas',      'one fluffy beige pampas grass plume ' + FLAT),
])
family('botanical', .13, [
 ('rose_dried',   'one dried red rose flower head ' + FLAT),
 ('rose_pink',    'one fresh pink rose flower head ' + FLAT),
 ('peony',        'one pale pink peony flower head ' + FLAT),
 ('daisy',        'one white daisy flower head ' + FLAT),
 ('sunflower',    'one small yellow sunflower head ' + FLAT),
 ('violet',       'one small purple violet flower ' + FLAT),
 ('star_anise',   'three star anise pods ' + FLAT),
 ('cinnamon',     'three cinnamon sticks lying neatly side by side tied with twine, seen from directly above'),
 ('acorn',        'one brown acorn with a textured cap, lying on its side, seen from directly above'),
 ('pinecone',     'one small brown pinecone ' + FLAT),
 ('maple_leaf',   'one red maple leaf ' + FLAT),
 ('mushroom_red', 'one red mushroom with white spots and a pale stalk, standing upright, seen from above at a slight angle' + FLAT),
 ('moss',         'one small round clump of green moss ' + FLAT),
 ('petals_bowl',  'one small round ceramic bowl filled with dried pink rose petals, seen from straight above'),
])

# -------------------------------------------------------------------- tea --
family('tea', .17, [
 ('teacup',      'one white porcelain teacup filled with amber tea sitting on a matching round saucer, seen from directly straight above'),
 ('teacup_blue', 'one blue and white patterned porcelain teacup on its matching saucer, seen from above at a slight angle'),
 ('teapot',      'one white ceramic teapot with a curved spout and a handle, whole teapot visible, seen from above at a slight angle'),
 ('teapot_clay', 'one small brown clay teapot, whole teapot visible, seen from above at a slight angle'),
 ('matcha_bowl', 'one green matcha tea in a rustic ceramic bowl, seen from directly straight above'),
 ('honey',       'one small glass jar of honey with a wooden dipper, seen from straight above'),
 ('sugar_bowl',  'one small ceramic bowl of sugar cubes, seen from straight above'),
 ('tea_tin',     'one small round decorated tea tin with its lid on, standing upright, seen from above at a slight angle'),
 ('strainer',    'one small round silver mesh tea strainer with a handle, lying flat seen from directly above'),
 ('spoon',       'one ornate silver teaspoon with a decorated handle, lying flat and diagonal, seen from directly above'),
 ('biscuit',     'two round shortbread biscuits lying side by side, seen from directly above'),
 ('macaron',     'three pastel macarons stacked, seen from above at a slight angle'),
 ('teabag',      'one paper tea bag with a string and a small paper tag, lying flat seen from directly above'),
 ('lemon_slice', 'one fresh lemon slice ' + FLAT),
 ('orange_slice','one dried orange slice ' + FLAT),
])

# ------------------------------------------------------------------ shore --
family('nature', .14, [
 ('shell',        'one spiral nautilus seashell, cream and brown stripes, ' + FLAT),
 ('shell_scallop','one ridged fan shaped scallop seashell, lying flat seen from directly above'),
 ('shell_conch',  'one pink conch seashell ' + FLAT),
 ('starfish',     'one dried orange starfish ' + FLAT),
 ('sand_dollar',  'one white sand dollar ' + FLAT),
 ('coral',        'one small piece of white branching coral with several arms, lying flat seen from directly above'),
 ('pebble',       'one smooth grey river pebble ' + FLAT),
 ('pebbles',      'three smooth stacked grey pebbles, seen from straight above'),
 ('driftwood',    'one weathered piece of pale driftwood, lying flat and diagonal, seen from directly above'),
 ('feather',      'one long grey and white bird feather lying flat and diagonal seen from directly above, single feather only'),
 ('feather_gold', 'one long gold painted bird feather lying flat and diagonal seen from directly above, single feather only'),
 ('bird_egg',     'one small pale blue speckled bird egg ' + FLAT),
 ('nest',         'one small empty birds nest of twigs, seen from straight above'),
 ('butterfly',    'one blue butterfly with open wings ' + FLAT),
])

# ------------------------------------------------------------- jewellery ---
family('jewel', .11, [
 ('ring',         'one gold ring with a purple stone ' + FLAT),
 ('ring_silver',  'one silver ring with a clear stone ' + FLAT),
 ('earrings',     'a pair of small gold crescent moon drop earrings lying side by side, seen from directly above'),
 ('brooch',       'one ornate silver star brooch ' + FLAT),
 ('locket',       'one small oval gold locket on a chain ' + FLAT),
 ('bracelet',     'one beaded amethyst bracelet laid in a circle, seen from straight above'),
 ('necklace',     'one gold chain necklace with a small round pendant, laid out in a loose oval, seen from directly above'),
 ('amulet',       'one round engraved silver disc pendant on a short leather cord, lying flat seen from directly above, solid disc'),
 ('mala',         'one loop of wooden mala prayer beads laid in a circle, seen from straight above'),
 ('pendulum',     'one pointed crystal pendulum on a fine silver chain, lying in a loose curl, seen from straight above'),
 ('anklet',       'one thin silver chain with tiny star charms, laid in a loose curve, seen from directly above'),
 ('charm_bracelet','one gold chain bracelet with several small charms hanging from it, laid in a loose curve, seen from directly above'),
])

# ------------------------------------------------------------ time, tools --
family('tool', .15, [
 ('pocketwatch',  'one open antique gold pocket watch ' + FLAT),
 ('hourglass',    'one small wooden hourglass with white sand, seen from above at a slight angle'),
 ('compass',      'one antique brass compass lying open and flat, seen from straight above'),
 ('key',          'one old fashioned brass skeleton key lying flat and diagonal, the whole key from the round handle to the teeth visible, seen from directly above'),
 ('key_silver',   'one small ornate silver key with a decorated bow and cut teeth, lying flat and diagonal, seen from directly above'),
 ('padlock',      'one small brass padlock with a shackle on top and a keyhole, lying flat seen from directly above, solid body'),
 ('scissors',     'one pair of small ornate gold scissors with two blades and two finger loops, lying flat and open, seen from directly above'),
 ('magnifier',    'one brass magnifying glass with a round lens and a long straight handle, lying flat and diagonal, seen from directly above'),
 ('thimble',      'one silver sewing thimble standing upright, seen from above at a slight angle, small metal cup shape'),
 ('spool',        'one wooden thread spool wound with cream thread, lying on its side, seen from above at a slight angle'),
 ('mirror',       'one small round hand mirror with an ornate gold frame ' + FLAT),
 ('bell',         'one small solid brass hand bell standing upright with its handle at the top, whole bell visible, seen from above at a slight angle'),
 ('singing_bowl', 'one brass singing bowl with a wooden striker beside it, seen from straight above'),
 ('coin',         'three old gold coins lying flat in a small pile, seen from straight above'),
])

# ------------------------------------------------------------- figurines ---
family('figure', .15, [
 ('owl',        'one small carved wooden owl figurine standing upright, whole owl visible, seen from above at a slight angle'),
 ('cat',        'one small glossy black cat figurine ornament sitting upright, whole figurine visible, seen from above at a slight angle'),
 ('rabbit',     'one small white ceramic rabbit figurine sitting, seen from above at a slight angle'),
 ('fox',        'one small carved wooden fox figurine, seen from above at a slight angle'),
 ('deer',       'one small brass deer figurine standing, seen from above at a slight angle'),
 ('bird',       'one small ceramic bluebird figurine, seen from above at a slight angle'),
 ('elephant',   'one small carved wooden elephant figurine, seen from above at a slight angle'),
 ('buddha',     'one small brass sitting buddha figurine, seen from above at a slight angle'),
 ('angel',      'one small white porcelain angel figurine, seen from above at a slight angle'),
 ('moon_rabbit','one small white ceramic rabbit figurine curled up asleep, seen from straight above'),
 ('turtle',     'one small jade turtle figurine, seen from straight above'),
 ('swan',       'one small white porcelain swan figurine, seen from above at a slight angle'),
])

# --------------------------------------------------------------- bottles ---
family('bottle', .15, [
 ('bottle_violet', 'one small glass apothecary bottle with a cork, filled with violet liquid ' + FLAT),
 ('bottle_blue',   'one small glass apothecary bottle with a cork, filled with blue liquid ' + FLAT),
 ('bottle_green',  'one small glass apothecary bottle with a cork, filled with green liquid ' + FLAT),
 ('bottle_amber',  'one small amber glass bottle with a cork ' + FLAT),
 ('perfume',       'one small cut glass perfume bottle with a gold cap, seen from above at a slight angle'),
 ('vial',          'one tiny glass vial of silver glitter with a cork ' + FLAT),
 ('dropper',       'one small glass dropper bottle with a black cap ' + FLAT),
 ('jar_herbs',     'one small glass jar filled with dried green herbs, seen from straight above'),
 ('jar_salt',      'one small glass jar filled with white salt, seen from straight above'),
 ('incense',       'three thin brown incense sticks lying side by side next to a small carved wooden holder, flat, seen from directly above'),
 ('incense_cone',  'three brown incense cones on a small ceramic dish, seen from straight above'),
 ('censer',        'one small pierced brass incense burner, seen from straight above'),
])

# ---------------------------------------------------------------- fabric ---
family('fabric', .19, [
 ('ribbon',      'one length of dusty pink silk ribbon lying in a loose curl, seen from straight above'),
 ('lace',        'one square piece of cream crocheted lace, lying flat seen from directly above'),
 ('pouch',       'one small purple velvet drawstring pouch pulled shut, standing, seen from above at a slight angle'),
 ('cushion',     'one small square embroidered velvet cushion, lying flat seen from directly above'),
 ('handkerchief','one folded white embroidered handkerchief ' + FLAT),
 ('yarn',        'one ball of soft grey yarn, seen from straight above'),
 ('tassel',      'one gold silk tassel with a corded loop at the top, hanging straight down, lying flat seen from directly above'),
 ('cord',        'one length of braided leather cord in a loose curl, seen from straight above'),
])

def seeds():
    return json.load(io.open(SEEDS, encoding='utf-8')) if os.path.exists(SEEDS) else {}

def save_seeds(s):
    json.dump(s, io.open(SEEDS, 'w', encoding='utf-8'), indent=1, sort_keys=True)

def prompt_of(n): return CATALOG[n][0]
def size_of(n):   return CATALOG[n][1]
def theme_of(n):  return CATALOG[n][2]
# Objects that came out wrong twice and are not worth more attempts. They stay
# in the catalogue (so a later re-run can try again) but are never placed.
EXCLUDE = {
 'zodiac_aries', 'zodiac_taurus', 'zodiac_gemini', 'zodiac_cancer', 'zodiac_virgo', 'zodiac_libra',
 'zodiac_scorpio', 'zodiac_sagittarius', 'zodiac_capricorn', 'zodiac_aquarius', 'zodiac_pisces',
 'comet_charm', 'charm_bracelet', 'earrings', 'amulet', 'bookmark', 'feather', 'moon_phases',
 'astrolabe', 'star_map', 'tea_tin', 'spool', 'anklet', 'necklace',
}
def done(n):      return os.path.exists(os.path.join(A.SPR, n + '.png'))
def ready():      return [n for n in CATALOG if done(n) and n not in EXCLUDE]

def make(filt=None):
    sd = seeds()
    items = [(n, prompt_of(n), sd.get(n, 7)) for n in CATALOG if not filt or filt in n or filt == theme_of(n)]
    A.sprites_parallel(items)
    save_seeds(sd)

def redo(names):
    sd = seeds()
    for n in names:
        if n not in CATALOG: print('unknown', n); continue
        sd[n] = sd.get(n, 7) + 1
        p = os.path.join(A.SPR, n + '.png')
        if os.path.exists(p): os.remove(p)
        for f in os.listdir(A.RAW):
            if f.startswith(n + '_'): os.remove(os.path.join(A.RAW, f))
    save_seeds(sd)
    A.sprites_parallel([(n, prompt_of(n), sd[n]) for n in names if n in CATALOG])

def sheet():
    names = sorted(ready())
    cols, cell, per = 8, 170, 64
    for page in range(0, len(names), per):
        chunk = names[page:page + per]
        rows = (len(chunk) + cols - 1) // cols
        bd = Image.new('RGB', (cols * cell, rows * (cell + 18)), (105, 100, 115))
        d = ImageDraw.Draw(bd)
        for i, n in enumerate(chunk):
            s = Image.open(os.path.join(A.SPR, n + '.png')).convert('RGBA')
            s.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
            x, y = (i % cols) * cell, (i // cols) * (cell + 18)
            bd.paste(s, (x + (cell - s.size[0]) // 2, y + (cell - s.size[1]) // 2), s)
            d.text((x + 4, y + cell + 2), n, fill=(255, 255, 255))
        out = os.path.join(HERE, 'out', 'assets_%02d.png' % (page // per + 1))
        bd.save(out); print('sheet:', out, len(chunk))
    print('%d of %d objects ready' % (len(names), len(CATALOG)))

def count():
    miss = sorted(n for n in CATALOG if not done(n))
    print('%d of %d ready; missing %d' % (len(ready()), len(CATALOG), len(miss)))
    if miss: print('  ' + ' '.join(miss[:40]) + (' ...' if len(miss) > 40 else ''))
    from collections import Counter
    print('themes:', dict(Counter(theme_of(n) for n in ready())))

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'make'
    if cmd == 'make': make(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == 'redo': redo(sys.argv[2:])
    elif cmd == 'sheet': sheet()
    elif cmd == 'count': count()
