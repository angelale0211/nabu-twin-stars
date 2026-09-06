# -*- coding: utf-8 -*-
"""Paint the twenty chapter surfaces, one at a time (the free service rate-limits)."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aiart as A
from scenes_ai import SURFACES
for key, name, tint, prompt, themes in SURFACES:
    p = os.path.join(A.BG, 's_%s.jpg' % key)
    if os.path.exists(p):
        print('cached', key, flush=True); continue
    im = A.background('s_' + key, prompt, seed=23, w=720, h=600)
    print('made ' if im is not None else 'FAILED ', key, flush=True)
    time.sleep(3)
print('backgrounds done')
