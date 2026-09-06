# -*- coding: utf-8 -*-
"""Minimal Gemini image client: text->image and image+instruction->image."""
import os, io, json, base64, urllib.request, time
SCRATCH = r'C:\Users\angel\AppData\Local\Temp\claude\C--Users-angel\bcd68c26-057e-4358-9226-e7e4387323a6\scratchpad'
KEY = io.open(os.path.join(SCRATCH, 'gk.txt')).read().strip()
EP = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=' + KEY

def call(model, parts, tries=3):
    body = json.dumps({'contents': [{'parts': parts}]}).encode()
    for a in range(tries):
        try:
            req = urllib.request.Request(EP % model, data=body, headers={'Content-Type': 'application/json'})
            d = json.loads(urllib.request.urlopen(req, timeout=180).read())
            out = []
            for c in d.get('candidates', []):
                for p in c.get('content', {}).get('parts', []):
                    if 'inlineData' in p: out.append(base64.b64decode(p['inlineData']['data']))
                    elif 'text' in p: print('  text:', p['text'][:200])
            if out: return out
            print('  no image; finish=', [c.get('finishReason') for c in d.get('candidates', [])])
        except Exception as e:
            print('  err', a, str(e)[:200]); time.sleep(5 + a * 5)
    return []

def gen(model, prompt):
    return call(model, [{'text': prompt}])

def edit(model, img_bytes, prompt):
    return call(model, [{'inlineData': {'mimeType': 'image/png', 'data': base64.b64encode(img_bytes).decode()}}, {'text': prompt}])
