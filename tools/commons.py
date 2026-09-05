# -*- coding: utf-8 -*-
"""Wikimedia Commons as a photo source (no key, no practical rate limit).
Searches inside Commons' curated "Quality images" / "Featured pictures" first,
keeps only real photographs (JPEG, big enough, no people, no diagrams) under
CC0 / public domain / CC BY / CC BY-SA, and adds them to tools/photos.json.

  python tools/commons.py            # fill every chapter + daily up to the wanted counts
  python tools/commons.py 7          # one chapter only
"""
import os, io, sys, json, re, time, urllib.request, urllib.parse, html
HERE = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(HERE, 'photos.json')
UA = {'User-Agent': 'NabuTwinStars/1.0 (spot-the-difference game; contact nabutarot@outlook.com)'}
sys.path.insert(0, HERE)
from photos import PEOPLE

QUERIES = {
    '1': ['wildflower meadow', 'sunflower field', 'poppy field', 'lavender field', 'cherry blossom', 'dandelion seed head', 'daisy flowers meadow', 'butterfly flower', 'spring blossom tree', 'field golden hour'],
    '2': ['moon night clouds', 'crescent moon', 'lake reflection night', 'lotus flower', 'water lily', 'full moon', 'moonlight water', 'pond reflection', 'night sky lake', 'swan lake evening'],
    '3': ['candle flame', 'candlelight', 'old books', 'oil lamp', 'lantern light', 'bokeh lights', 'library books', 'candle dark', 'antique clock', 'reading lamp'],
    '4': ['tea cup', 'teapot', 'green tea', 'tea ceremony', 'cherry blossom close-up', 'plum blossom', 'peony flower', 'incense smoke', 'rose bouquet', 'chamomile'],
    '5': ['amethyst', 'quartz crystal', 'geode', 'rose quartz', 'crystal cluster', 'gemstone', 'fluorite crystal', 'citrine crystal', 'agate slice', 'labradorite'],
    '6': ['lavender garden', 'rose garden', 'wisteria', 'hydrangea', 'garden path', 'tulip field', 'peony garden', 'garden lantern', 'iris flowers', 'magnolia blossom'],
    '7': ['nebula hubble', 'galaxy', 'milky way', 'saturn cassini', 'jupiter', 'star cluster', 'orion nebula', 'andromeda galaxy', 'aurora space station', 'pillars of creation'],
    '8': ['incense', 'buddhist temple candles', 'singing bowl', 'lotus', 'zen garden', 'prayer candles', 'temple lanterns', 'buddha statue', 'candle offering', 'stupa golden'],
    '9': ['sunset clouds', 'hot air balloon', 'rainbow', 'cumulus clouds', 'above clouds', 'crepuscular rays', 'pink sky', 'cloudscape', 'sunrise clouds', 'mammatus clouds'],
    '10': ['aurora borealis', 'telescope night', 'observatory night', 'star trails', 'meteor night sky', 'lighthouse night stars', 'northern lights', 'comet', 'milky way mountains', 'night sky panorama'],
    'daily': ['tarot cards', 'crystal ball', 'moon phases', 'candle crystals', 'dreamcatcher', 'sunset sea', 'fog forest light', 'lantern festival', 'starry night', 'feather macro', 'bokeh', 'sun rays forest', 'full moon rising', 'snowflake macro', 'sea shell beach'],
}
WANT = {k: (44 if k == 'daily' else 24) for k in QUERIES}
BAD = re.compile(r'\b(diagram|map|chart|illustration|drawing|painting|logo|icon|sketch|engraving|poster|cartoon|coat of arms|flag|screenshot|table|graph|stamp|banknote|coin|3d|render|scan|manuscript|text)\b', re.I)
LIC_OK = re.compile(r'^(CC0|Public domain|PD|CC BY(?: \d(\.\d)?)?|CC BY-SA(?: \d(\.\d)?)?)$', re.I)


def api(params):
    params = dict(params, format='json'); url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r: return json.loads(r.read())
        except Exception as e:
            print('  retry', e); time.sleep(4)
    return {}


def strip(s): return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()


def search(query, curated=True, limit=40):
    q = query + (' incategory:"Quality images"' if curated else '') + ' filetype:bitmap'
    d = api({'action': 'query', 'generator': 'search', 'gsrsearch': q, 'gsrnamespace': 6, 'gsrlimit': limit,
             'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mime', 'iiurlwidth': 1280, 'iiextmetadatafilter': 'LicenseShortName|Artist|ImageDescription|Categories|Credit'})
    out = []
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = (p.get('imageinfo') or [None])[0]
        if not ii or ii.get('mime') != 'image/jpeg': continue
        em = {k: strip(v.get('value')) for k, v in (ii.get('extmetadata') or {}).items()}
        lic = em.get('LicenseShortName', '')
        if not LIC_OK.match(lic): continue
        w, h = ii.get('width', 0), ii.get('height', 0)
        if w < 1200 or h < 800 or w / max(1, h) < 0.9 or w / max(1, h) > 2.3: continue
        title = p['title'].replace('File:', '')
        text = title + ' ' + em.get('ImageDescription', '')[:300] + ' ' + em.get('Categories', '')[:300]
        if PEOPLE.search(text) or BAD.search(text): continue
        key = re.sub(r'[^a-z0-9]', '', re.sub(r'\W', '', title.lower()))[:10] + str(p['pageid'])[-4:]
        artist = em.get('Artist') or em.get('Credit') or 'Wikimedia Commons'
        out.append({'id': key, 'w': w, 'h': h, 'alt': title[:80], 'query': query, 'photographer': artist[:60], 'photographer_url': ii.get('descriptionurl', ''),
                    'url': ii.get('descriptionurl', ''), 'license': lic, 'source': 'wikimedia', 'src': ii.get('thumburl') or ii.get('url'), 'tags': '', 'curated': curated})
    return out


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    chosen = json.load(io.open(LIST, encoding='utf-8')) if os.path.exists(LIST) else {}
    seen = set(p['id'] for lst in chosen.values() for p in lst)
    for key, queries in QUERIES.items():
        if only and key != only: continue
        got = chosen.get(key, [])
        for q in queries:
            if len(got) >= WANT[key]: break
            res = search(q, True)
            if len(res) < 3: res += search(q, False, 30)
            # prefer permissive licences, then bigger files
            res.sort(key=lambda p: (0 if re.match(r'^(CC0|Public|PD)', p['license'], re.I) else 1 if 'SA' not in p['license'] else 2, -p['w']))
            n = 0
            for p in res:
                if p['id'] in seen or n >= 2: continue
                seen.add(p['id']); got.append(p); n += 1
            print(key, q, '->', n, 'total', len(got), flush=True)
            time.sleep(0.5)
        chosen[key] = got
    json.dump(chosen, io.open(LIST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('saved', {k: len(v) for k, v in chosen.items()})


if __name__ == '__main__':
    main()
