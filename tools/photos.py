# -*- coding: utf-8 -*-
"""Pick and download the real photos behind the levels (Openverse: CC0,
public-domain and CC BY photos from Flickr, Wikimedia, rawpixel, StockSnap,
NASA...). No API key needed (20 requests a minute).

  python tools/photos.py search     # query per chapter -> tools/photos.json (curated list)
  python tools/photos.py fetch      # download the chosen photos -> tools/cache/<id>.jpg
  python tools/photos.py sheet      # contact sheet per chapter -> tools/out/photos-chNN.png

Licences: only cc0, pdm (public domain) and by (CC BY, needs credit) are
accepted; every creator is listed in the app (Me -> Photo credits). Photos
with people are skipped (title/tag filter) so the game stays about objects,
skies and light. The curated list is committed so re-bakes stay stable."""
import os, io, sys, json, time, urllib.request, urllib.parse, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, 'cache'); OUT = os.path.join(HERE, 'out'); LIST = os.path.join(HERE, 'photos.json')
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'NabuTwinStars/1.0 (https://github.com/angelale0211/nabu-twin-stars; nabutarot@outlook.com) python-urllib'}

# per chapter: search queries (in order of preference)
CHAPTERS = [
    (1, 'meadow', ['wildflower meadow sunlight', 'dandelion seeds golden hour', 'lavender field sunset', 'butterfly on flower macro', 'daisy field sky', 'sunflower field clouds', 'cherry blossom branch sky', 'poppy field sunset']),
    (2, 'pond', ['crescent moon night sky clouds', 'full moon over lake reflection', 'lotus flower pond', 'water lily reflection', 'night lake stars reflection', 'moon behind clouds', 'fireflies night forest', 'calm lake mist sunrise']),
    (3, 'attic', ['candle flame dark background', 'old books candle light', 'fairy lights bokeh warm', 'cozy reading lamp books', 'candles vintage table', 'string lights night window', 'antique key old book', 'lit candles glass jars']),
    (4, 'tearoom', ['tea cup flowers table', 'teapot steam morning light', 'cherry blossom close up', 'matcha tea ceremony', 'dried flowers tea rustic', 'incense stick smoke', 'pink peony bouquet table', 'herbal tea cup honey']),
    (5, 'cave', ['amethyst crystal cluster', 'quartz crystal close up', 'crystal ball light', 'geode purple', 'rose quartz crystals', 'gemstones collection', 'crystals candles', 'selenite crystal glow']),
    (6, 'garden', ['lavender garden dusk', 'rose garden evening', 'garden lanterns night', 'wisteria flowers purple', 'hydrangea garden path', 'garden archway flowers', 'fairy lights garden evening', 'moonflower night garden']),
    (7, 'space', ['milky way night sky', 'nebula hubble', 'galaxy stars', 'saturn planet', 'starry sky mountains', 'aurora borealis stars', 'moon and stars night', 'deep space stars colorful']),
    (8, 'temple', ['incense smoke temple', 'singing bowl meditation', 'zen stones candles', 'buddhist temple candles', 'lotus candle water', 'sage bundle crystals', 'prayer candles church', 'meditation altar flowers']),
    (9, 'clouds', ['pink clouds sunset sky', 'hot air balloons sky', 'rainbow after rain sky', 'cotton candy clouds pastel', 'above the clouds sunrise', 'dramatic clouds golden light', 'sun rays through clouds', 'pastel sky moon clouds']),
    (10, 'tower', ['aurora borealis mountains', 'telescope night sky stars', 'observatory stars night', 'shooting star night sky', 'starry night lighthouse', 'northern lights lake', 'comet night sky', 'star trails mountain']),
]
DAILY = ['tarot cards candles', 'tarot cards crystals table', 'oracle cards flowers', 'candle and crystals dark', 'moon phases sky', 'stars bokeh purple', 'spiritual altar candles', 'crystal pendulum', 'dreamcatcher sunset', 'sunset ocean moon', 'foggy forest light rays', 'lantern festival sky', 'snow globe lights', 'rain window bokeh night', 'feather macro soft light']
PEOPLE = re.compile(r'\b(woman|women|man|men|person|people|girl|boy|face|hand|hands|portrait|model|lady|child|kid|baby|couple|selfie|bride|human|body|fingers?|nude|sexy)\b', re.I)


def api(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.loads(r.read())
        except Exception as e:
            print('  retry', attempt, e); time.sleep(8 + attempt * 8)
    return {'results': []}


def search(query, per_page=20):
    q = urllib.parse.urlencode({'q': query, 'page_size': per_page, 'license': 'cc0,pdm,by', 'size': 'large', 'mature': 'false',
                                'source': 'flickr,wikimedia,rawpixel,stocksnap,nasa,spacex,europeana,smithsonian,digitaltmuseum'})
    return api('https://api.openverse.org/v1/images/?' + q).get('results', [])


def normalise(p):
    """Openverse result -> our record. Prefer a ~1600 px download URL when the host lets us pick a size."""
    url = p.get('url') or ''
    if 'live.staticflickr.com' in url:
        url = re.sub(r'(_[a-z0-9])?\.(jpg|png)$', r'_h.\2', url)
    elif 'upload.wikimedia.org/wikipedia/commons/' in url and '/thumb/' not in url:
        name = url.rsplit('/', 1)[1]
        if name.lower().endswith('.svg'): return None
        url = url.replace('/wikipedia/commons/', '/wikipedia/commons/thumb/') + '/1280px-' + name
    key = re.sub(r'[^a-z0-9]', '', p['id'])[:12]
    return {'id': key, 'w': p.get('width') or 0, 'h': p.get('height') or 0, 'alt': p.get('title') or '', 'query': '',
            'photographer': p.get('creator') or p.get('source') or 'unknown', 'photographer_url': p.get('creator_url') or p.get('foreign_landing_url') or '',
            'url': p.get('foreign_landing_url') or '', 'license': ((p.get('license') or '') + ' ' + (p.get('license_version') or '')).strip(),
            'source': p.get('source'), 'src': url, 'tags': ' '.join(t.get('name', '') for t in (p.get('tags') or [])[:12])}


def curate():
    chosen, seen = {}, set()
    def take(queries, want, key):
        got = []
        for q in queries:
            if len(got) >= want: break
            print(key, 'search:', q, flush=True)
            for raw in search(q):
                if len(got) >= want: break
                p = normalise(raw)
                if not p or p['id'] in seen or not p['src']: continue
                if PEOPLE.search(p['alt'] + ' ' + p['tags']): continue
                ratio = p['w'] / max(1, p['h'])
                if p['w'] < 1000 or p['h'] < 700 or ratio < 0.85 or ratio > 2.3: continue
                if re.search(r'\.(svg|gif|tif|tiff)$', p['src'].lower()): continue
                seen.add(p['id']); p['query'] = q
                got.append(p)
                if len([g for g in got if g['query'] == q]) >= 2: break   # at most 2 per query -> variety
            time.sleep(3.2)   # 20 requests a minute
        return got
    for ch, key, queries in CHAPTERS:
        chosen[str(ch)] = take(queries, 13, key)   # 10 levels + 3 spare
    chosen['daily'] = take(DAILY, 32, 'daily')
    json.dump(chosen, io.open(LIST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('saved', LIST, {k: len(v) for k, v in chosen.items()})


EXTRA = {
    '3': ['candlelight', 'burning candle dark', 'old library books', 'vintage lantern light', 'candle bokeh', 'oil lamp night', 'warm lamp light table', 'candle wax close up'],
    '4': ['teacup', 'green tea cup', 'tea leaves', 'cup of tea window', 'flowers vase window light', 'sakura blossom', 'plum blossom branch', 'chamomile tea flowers'],
    '6': ['lavender', 'roses garden', 'garden path flowers', 'wisteria', 'lantern garden night', 'peonies garden', 'tulip field', 'cherry blossom garden'],
    '8': ['incense', 'temple candles', 'buddha statue candles', 'lotus flower', 'prayer wheel', 'zen garden', 'temple lanterns', 'candle offering'],
    '2': ['moon night clouds', 'lake reflection moon', 'lotus pond', 'water lily', 'night lake stars'],
    'daily': ['tarot', 'tarot deck', 'crystals', 'full moon', 'stars night sky', 'candle', 'sunset sky', 'bokeh lights', 'galaxy', 'lantern night', 'northern lights', 'crescent moon', 'starry night', 'sun rays forest', 'sea sunset']
}
def topup():
    """second pass for chapters that came up short"""
    chosen = json.load(io.open(LIST, encoding='utf-8'))
    seen = set(p['id'] for lst in chosen.values() for p in lst)
    for key, queries in EXTRA.items():
        want = 32 if key == 'daily' else 13
        got = chosen.get(key, [])
        for q in queries:
            if len(got) >= want: break
            print(key, 'topup:', q, flush=True)
            n0 = len(got)
            for raw in search(q):
                if len(got) >= want or len(got) - n0 >= 3: break
                p = normalise(raw)
                if not p or p['id'] in seen or not p['src']: continue
                if PEOPLE.search(p['alt'] + ' ' + p['tags']): continue
                ratio = p['w'] / max(1, p['h'])
                if p['w'] < 1000 or p['h'] < 700 or ratio < 0.85 or ratio > 2.3: continue
                if re.search(r'\.(svg|gif|tif|tiff)$', p['src'].lower()): continue
                seen.add(p['id']); p['query'] = q; got.append(p)
            time.sleep(3.2)
        chosen[key] = got
    json.dump(chosen, io.open(LIST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('saved', {k: len(v) for k, v in chosen.items()})


def fetch():
    chosen = json.load(io.open(LIST, encoding='utf-8'))
    for k, lst in chosen.items():
        for p in lst:
            path = os.path.join(CACHE, '%s.jpg' % p['id'])
            if os.path.exists(path) and os.path.getsize(path) > 10000: continue
            data = None
            urls = [p['src']]
            if '_h.' in p['src']: urls += [p['src'].replace('_h.', '_b.'), re.sub(r'_h\.(jpg|png)$', r'.\1', p['src'])]
            for url in urls:
                for attempt in range(4):
                    try:
                        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                            data = r.read()
                        break
                    except urllib.error.HTTPError as e:
                        print('  retry', p['id'], e.code, flush=True)
                        if e.code == 429: time.sleep(12 + attempt * 10); continue
                        break
                    except Exception as e:
                        print('  retry', p['id'], e, flush=True); time.sleep(3)
                if data: break
            if not data: continue
            time.sleep(1.2 if 'wikimedia' in p.get('source', '') else 0.3)
            try:
                im = Image.open(io.BytesIO(data)); im.load(); im = im.convert('RGB')
                if max(im.size) > 1800: im.thumbnail((1800, 1800), Image.LANCZOS)
                im.save(path, quality=92)
            except Exception as e:
                print('  bad image', p['id'], e, flush=True); continue
            print('fetched', k, p['id'], os.path.getsize(path) // 1024, 'KB', im.size, flush=True)
            time.sleep(0.3)


def crop_cover(im, w, h):
    """Centre crop to w:h then resize (the level picture is 6:5)."""
    iw, ih = im.size
    s = max(w / iw, h / ih)
    nw, nh = int(iw * s + 0.5), int(ih * s + 0.5)
    im = im.resize((nw, nh), Image.LANCZOS)
    x0, y0 = (nw - w) // 2, (nh - h) // 2
    return im.crop((x0, y0, x0 + w, y0 + h))


def sheet():
    from PIL import ImageDraw
    chosen = json.load(io.open(LIST, encoding='utf-8'))
    for k, lst in chosen.items():
        cols = 4; tw, th = 300, 250
        rows = (len(lst) + cols - 1) // cols
        board = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 26) + 8), '#EFE9FA')
        d = ImageDraw.Draw(board)
        for i, p in enumerate(lst):
            path = os.path.join(CACHE, '%s.jpg' % p['id'])
            if not os.path.exists(path): continue
            im = crop_cover(Image.open(path).convert('RGB'), tw, th)
            x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 26)
            board.paste(im, (x, y)); d.text((x, y + th + 4), '%d: %s %s | %s' % (i, p['id'], p['alt'][:28], p['license']), fill='#3B2A5E')
        board.save(os.path.join(OUT, 'photos-%s.png' % k)); print('sheet', k, len(lst))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'search'
    {'search': curate, 'topup': topup, 'fetch': fetch, 'sheet': sheet}[cmd]()
