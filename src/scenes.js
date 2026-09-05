/* ============================ chapter scenes ============================
   Ten painted backgrounds, one per chapter, in a 360 x 300 picture. Skies are
   layered gradients with turbulence nebulae and glowing stars; surfaces have
   wood grain, velvet folds or water reflections; every picture ends with a
   vignette and film grain (sceneFinish). `draw(p)` takes an id prefix so two
   pictures on one page never share filter or gradient ids.
   Zones say where objects may stand; pools say which motifs belong. */

const PIC_W = 360, PIC_H = 300;

/* ---- paint helpers ---- */
function lin(p, id, stops, x2, y2) {
  return `<linearGradient id="${p}${id}" x1="0" y1="0" x2="${x2 === undefined ? 0 : x2}" y2="${y2 === undefined ? 1 : y2}">` + stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('') + '</linearGradient>';
}
function rad(p, id, stops, cx, cy, r) {
  return `<radialGradient id="${p}${id}" cx="${cx === undefined ? .5 : cx}" cy="${cy === undefined ? .5 : cy}" r="${r === undefined ? .6 : r}">` + stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('') + '</radialGradient>';
}
function blurF(p, id, sd) { return `<filter id="${p}${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`; }
/* cloudy noise tinted with a colour; alpha row turns the noise into soft patches */
function nebulaF(p, id, seed, rgb, freq, oct, contrast, lift) {
  return `<filter id="${p}${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct || 4}" seed="${seed}" stitchTiles="stitch"/>`
       + `<feColorMatrix type="matrix" values="0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  0 0 0 ${contrast || 1.8} ${lift === undefined ? -0.55 : lift}"/><feGaussianBlur stdDeviation="2.5"/></filter>`;
}
function nebula(p, id, x, y, w, h, opacity, blend) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${p}${id})" opacity="${opacity}"${blend ? ` style="mix-blend-mode:${blend}"` : ''}/>`;
}
function grainF(p) {
  return `<filter id="${p}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .6  0 0 0 .9 -.3"/></filter>`;
}
function rnd(seed) { let t = seed; return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; }; }
function blob(p, x, y, rx, ry, color, opacity, blend, sd) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}" filter="url(#${p}b${sd || 18})"${blend ? ` style="mix-blend-mode:${blend}"` : ''}/>`;
}
function glowDot(p, x, y, r, color, opacity) {
  return `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="${color}" opacity="${(opacity || .5) * .6}" filter="url(#${p}b6)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity || .9}"/>`;
}
function starField(p, seed, n, x0, y0, x1, y1, maxR, glowEvery) {
  const R = rnd(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const x = (x0 + R() * (x1 - x0)).toFixed(1), y = (y0 + R() * (y1 - y0)).toFixed(1), r = (0.4 + R() * R() * maxR).toFixed(2), o = (0.35 + R() * .65).toFixed(2);
    if (glowEvery && i % glowEvery === 0) s += `<circle cx="${x}" cy="${y}" r="${(+r * 4).toFixed(1)}" fill="#FFF9FA" opacity="${(+o * .35).toFixed(2)}" filter="url(#${p}b4)"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF9FA" opacity="${o}"/>`;
    if (glowEvery && i % (glowEvery * 2) === 1) s += `<path d="M${x} ${+y - 6} L${x} ${+y + 6} M${+x - 6} ${y} L${+x + 6} ${y}" stroke="#FFF9FA" stroke-width=".8" opacity="${(+o * .8).toFixed(2)}"/>`;
  }
  return `<g stroke="none">${s}</g>`;
}
function rays(p, x, y, n, len, color, opacity, spread, rot) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((rot || -90) + (i - (n - 1) / 2) * (spread || 12)) * Math.PI / 180, w = 0.05 + (i % 2) * 0.04;
    s += `<path d="M${x} ${y} L${(x + Math.cos(a - w) * len).toFixed(1)} ${(y + Math.sin(a - w) * len).toFixed(1)} L${(x + Math.cos(a + w) * len).toFixed(1)} ${(y + Math.sin(a + w) * len).toFixed(1)} Z" fill="${color}"/>`;
  }
  return `<g opacity="${opacity}" filter="url(#${p}b6)" stroke="none" style="mix-blend-mode:screen">${s}</g>`;
}
function mist(p, y, h, color, opacity) {
  return `<g stroke="none">${blob(p, 90, y, 150, h, color, opacity, null, 18)}${blob(p, 270, y + 6, 160, h * .9, color, opacity * .8, null, 18)}</g>`;
}
function woodF(p, seed) {
  return `<filter id="${p}wood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .35" numOctaves="3" seed="${seed || 4}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 .25  0 0 0 0 .12  0 0 0 0 .05  0 0 0 1.3 -.5"/></filter>`;
}
function cloudPuff(p, x, y, w, h, color, opacity) {
  return `<g stroke="none" opacity="${opacity}"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${color}" filter="url(#${p}b6)"/><ellipse cx="${x - w * .35}" cy="${y - h * .1}" rx="${w * .55}" ry="${h * .9}" fill="${color}" filter="url(#${p}b6)"/><ellipse cx="${x + w * .3}" cy="${y - h * .25}" rx="${w * .5}" ry="${h * 1.1}" fill="${color}" filter="url(#${p}b6)"/><ellipse cx="${x - w * .1}" cy="${y - h * .5}" rx="${w * .4}" ry="${h * .8}" fill="#FFFFFF" opacity=".5" filter="url(#${p}b6)"/></g>`;
}
function bigMoon(p, x, y, r, color) {
  return `<g stroke="none"><circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${color}" opacity=".18" filter="url(#${p}b18)"/><circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="${color}" opacity=".35" filter="url(#${p}b6)"/>`
       + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}moonG)"/><circle cx="${x - r * .3}" cy="${y - r * .2}" r="${r * .22}" fill="#000" opacity=".06"/><circle cx="${x + r * .35}" cy="${y + r * .3}" r="${r * .16}" fill="#000" opacity=".06"/><circle cx="${x + r * .1}" cy="${y - r * .5}" r="${r * .1}" fill="#000" opacity=".05"/></g>`;
}
const COMMON_DEFS = p => blurF(p, 'b4', 4) + blurF(p, 'b6', 6) + blurF(p, 'b18', 18) + blurF(p, 'b30', 30) + grainF(p)
  + rad(p, 'vig', [[0.55, '#2A1A50', 0], [1, '#2A1A50', .42]], .5, .5, .75)
  + rad(p, 'moonG', [[0, '#FFFBEA'], [.7, '#F6E5B3'], [1, '#E5BE5E']], .38, .34, .75);
/* drawn after the objects: vignette + grain */
function sceneFinish(p) {
  return `<rect width="360" height="300" fill="url(#${p}vig)" stroke="none"/><rect width="360" height="300" filter="url(#${p}grain)" opacity=".16" stroke="none" style="mix-blend-mode:overlay"/>`;
}

const SCENES = {
  meadow: {
    name: { en: "Fool's Meadow", vi: 'Đồng cỏ Chàng Khờ' },
    tint: '#DCEBFF',
    zones: [{ z: 'sky', x: 26, y: 24, w: 308, h: 112 }, { z: 'ground', x: 26, y: 150, w: 308, h: 124 }],
    pool: ['sun', 'cloud', 'star', 'sparkle', 'bird', 'balloon', 'rainbow', 'flower', 'mushroom', 'sprig', 'butterfly', 'rabbit', 'cat', 'tarot', 'cardfan', 'heart', 'letter', 'wand', 'pentacle', 'book'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#7FA7E6'], [.45, '#BFD4F6'], [.8, '#FBE3EC'], [1, '#FFF1E0']])}${lin(p, 'far', [[0, '#BFE0C8'], [1, '#8CC49B']])}${lin(p, 'near', [[0, '#A9DDB5'], [1, '#5FA271']])}${nebulaF(p, 'cl', 3, [1, 1, 1], '0.02 0.04', 3, 1.6, -0.5)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>`
           + nebula(p, 'cl', 0, 0, 360, 170, .8)
           + `<g stroke="none"><circle cx="292" cy="58" r="60" fill="#FFF1C0" opacity=".45" filter="url(#${p}b30)"/><circle cx="292" cy="58" r="22" fill="#FFF6D8" opacity=".9" filter="url(#${p}b6)"/></g>`
           + rays(p, 292, 58, 7, 260, '#FFF6D8', .35, 10, 120)
           + cloudPuff(p, 70, 60, 46, 14, '#FFFFFF', .8) + cloudPuff(p, 200, 96, 34, 10, '#FFFFFF', .55)
           + `<g stroke="none"><path d="M0 178 Q100 138 200 172 Q280 196 360 160 L360 300 L0 300 Z" fill="url(#${p}far)"/>`
           + `<path d="M0 205 Q120 168 230 208 Q300 232 360 200 L360 300 L0 300 Z" fill="url(#${p}near)"/>`
           + `<path d="M0 205 Q120 168 230 208 Q300 232 360 200" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".35" filter="url(#${p}b4)"/></g>`
           + mist(p, 200, 16, '#FFFFFF', .35)
           + `<g stroke="none">${(() => { const R = rnd(21); let s = ''; for (let i = 0; i < 46; i++) { const x = R() * 360, y = 212 + R() * 88, c = ['#F6BBCB', '#FFFFFF', '#F6E5B3', '#E48AA6'][i % 4]; s += glowDot(p, x.toFixed(1), y.toFixed(1), 1.6 + R() * 1.4, c, .85); } return s; })()}</g>`;
    }
  },
  pond: {
    name: { en: 'Moon Pond', vi: 'Ao Trăng' },
    tint: '#E4D6F5',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 104 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['moon', 'star', 'sparkle', 'cloud', 'constellation', 'lotus', 'candle', 'lantern', 'rabbit', 'shell', 'feather', 'crystalball', 'teacup', 'cup', 'heart', 'butterfly', 'tarot', 'sprig', 'mala', 'potion'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#3B2A6E'], [.4, '#7A63B8'], [.75, '#C9A8DC'], [1, '#F6C9D9']])}${lin(p, 'wat', [[0, '#8FB4EA'], [.5, '#5D86C9'], [1, '#3D5EA0']])}${nebulaF(p, 'nb', 7, [1, .6, .85], '0.012 0.02', 4, 2.4, -1)}${lin(p, 'bank', [[0, '#7FB98F'], [1, '#3E7A52']])}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>`
           + nebula(p, 'nb', 0, 0, 360, 150, .7, 'screen')
           + starField(p, 5, 70, 4, 4, 356, 120, 1.6, 9)
           + bigMoon(p, 262, 62, 26, '#F6E5B3')
           + `<g stroke="none"><path d="M0 150 Q90 118 180 146 Q270 170 360 138 L360 300 L0 300 Z" fill="url(#${p}bank)"/></g>`
           + `<g stroke="none"><ellipse cx="180" cy="224" rx="200" ry="76" fill="url(#${p}wat)"/>`
           + `<ellipse cx="262" cy="230" rx="34" ry="52" fill="#F6E5B3" opacity=".35" filter="url(#${p}b18)"/>`
           + `<path d="M232 214 q30 -4 60 0 M222 232 q40 -5 80 0 M238 250 q26 -4 52 0 M60 214 q20 -4 40 0 M110 262 q18 -3 36 0" fill="none" stroke="#FFF9FA" stroke-width="2" opacity=".55" filter="url(#${p}b4)"/>`
           + `<ellipse cx="180" cy="224" rx="200" ry="76" fill="none" stroke="#2F4E86" stroke-width="2" opacity=".5"/></g>`
           + `<g stroke="#2F6B44" stroke-width="1"><ellipse cx="52" cy="204" rx="20" ry="8" fill="#8CC49B"/><ellipse cx="318" cy="258" rx="22" ry="9" fill="#8CC49B"/><ellipse cx="90" cy="276" rx="16" ry="6" fill="#7FB98F"/></g>`
           + `<path d="M16 150 q6 -44 -2 -76 M28 150 q-8 -40 4 -66 M344 142 q6 -50 -4 -72 M334 146 q-4 -40 8 -60" fill="none" stroke="#3E7A52" stroke-width="2.6" stroke-linecap="round"/>`
           + mist(p, 258, 14, '#D9CDF3', .3)
           + `<g stroke="none">${[[60, 172], [300, 176], [140, 286], [330, 210], [24, 240]].map(([x, y], i) => glowDot(p, x, y, 1.6, '#F6E5B3', .9)).join('')}</g>`;
    }
  },
  attic: {
    name: { en: 'Star Attic', vi: 'Gác Sao' },
    tint: '#EADFF7',
    zones: [{ z: 'sky', x: 108, y: 26, w: 144, h: 96 }, { z: 'ground', x: 24, y: 132, w: 312, h: 142 }],
    pool: ['star', 'sparkle', 'moon', 'constellation', 'book', 'candle', 'cat', 'owl', 'tarot', 'cardfan', 'crystalball', 'potion', 'scroll', 'key', 'hourglass', 'pillow', 'letter', 'teacup', 'lantern', 'clockmoon', 'mirror', 'gem'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'wall', [[0, '#D8C9F0'], [1, '#B9A6E0']])}${lin(p, 'win', [[0, '#241A45'], [.6, '#4B3684'], [1, '#7A63B8']])}${lin(p, 'floor', [[0, '#C98E5B'], [1, '#8E5B33']])}${lin(p, 'rug', [[0, '#F6BBCB'], [1, '#D98BA5']])}${woodF(p, 3)}${nebulaF(p, 'nb', 11, [.7, .55, .95], '0.02 0.03', 4, 1.8, -0.6)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}wall)" stroke="none"/>`
           + `<g stroke="none"><path d="M0 128 L180 -10 L360 128 L360 140 L180 8 L0 140 Z" fill="#8E5B33"/><path d="M0 128 L180 -10 L360 128 L360 140 L180 8 L0 140 Z" fill="#000" opacity=".15" filter="url(#${p}b4)"/></g>`
           + `<g stroke="none"><path d="M100 136 L100 62 Q180 -14 260 62 L260 136 Z" fill="url(#${p}win)"/>`
           + nebula(p, 'nb', 100, 0, 160, 136, .7, 'screen')
           + starField(p, 8, 40, 106, 8, 254, 130, 1.5, 6)
           + `<circle cx="222" cy="52" r="34" fill="#F6E5B3" opacity=".25" filter="url(#${p}b18)"/><circle cx="222" cy="52" r="11" fill="url(#${p}moonG)"/>`
           + `<path d="M100 136 L100 62 Q180 -14 260 62 L260 136" fill="none" stroke="#3D2A6E" stroke-width="5"/><path d="M180 136 L180 20 M100 100 L260 100" stroke="#3D2A6E" stroke-width="3"/></g>`
           + `<rect x="92" y="134" width="176" height="10" rx="2" fill="#C98E5B" stroke="none"/><rect x="92" y="144" width="176" height="4" fill="#000" opacity=".2" stroke="none" filter="url(#${p}b4)"/>`
           + `<g stroke="none"><ellipse cx="180" cy="150" rx="150" ry="40" fill="#FFF1C0" opacity=".35" filter="url(#${p}b30)"/></g>`
           + `<g stroke="none"><rect y="148" width="360" height="152" fill="url(#${p}floor)"/><rect y="148" width="360" height="152" filter="url(#${p}wood)" opacity=".55"/><path d="M0 190 L360 190 M0 232 L360 232 M0 272 L360 272" stroke="#5C3A1E" stroke-width="1.2" opacity=".5"/></g>`
           + `<g stroke="none"><rect x="40" y="206" width="280" height="76" rx="18" fill="#000" opacity=".25" filter="url(#${p}b6)" transform="translate(0 6)"/><rect x="40" y="200" width="280" height="76" rx="18" fill="url(#${p}rug)"/><rect x="52" y="212" width="256" height="52" rx="12" fill="none" stroke="#FFF9FA" stroke-width="2" opacity=".6" stroke-dasharray="6 5"/></g>`;
    }
  },
  tearoom: {
    name: { en: 'Tea Room', vi: 'Phòng Trà' },
    tint: '#FBEAD6',
    zones: [{ z: 'sky', x: 40, y: 24, w: 280, h: 96 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['teacup', 'teapot', 'scroll', 'book', 'letter', 'flower', 'sprig', 'candle', 'incense', 'bell', 'bowl', 'coins', 'cardfan', 'tarot', 'heart', 'lantern', 'cat', 'rabbit', 'sparkle', 'butterfly', 'ring', 'mala'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'wall', [[0, '#F9DCC4'], [1, '#EBC3A6']])}${lin(p, 'tab', [[0, '#B87A48'], [1, '#7A4A25']])}${lin(p, 'cloth', [[0, '#FFF9FA'], [1, '#F1E1D6']])}${lin(p, 'cur', [[0, '#E48AA6'], [1, '#B8496D']], 1, 0)}${woodF(p, 6)}${rad(p, 'lamp', [[0, '#FFF1C0', .9], [1, '#FFF1C0', 0]])}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}wall)" stroke="none"/>`
           + `<rect width="360" height="300" fill="url(#${p}lamp)" stroke="none" opacity=".8" transform="translate(0 -60) scale(1 1.4)"/>`
           + `<g stroke="none"><rect x="70" y="18" width="220" height="112" rx="10" fill="#FFF9FA" opacity=".9"/><rect x="78" y="26" width="204" height="96" rx="6" fill="#DDE9F8"/>${cloudPuff(p, 130, 60, 30, 9, '#FFFFFF', .8)}${cloudPuff(p, 230, 90, 26, 8, '#FFFFFF', .6)}<circle cx="238" cy="48" r="28" fill="#FFF1C0" opacity=".7" filter="url(#${p}b18)"/><path d="M180 26 L180 122 M78 74 L282 74" stroke="#FFF9FA" stroke-width="5"/><rect x="78" y="26" width="204" height="96" rx="6" fill="none" stroke="#3D2A6E" stroke-width="2.4"/></g>`
           + `<g stroke="none"><path d="M0 0 L58 0 Q38 70 58 140 L0 140 Z" fill="url(#${p}cur)"/><path d="M360 0 L302 0 Q322 70 302 140 L360 140 Z" fill="url(#${p}cur)"/><path d="M14 0 Q8 70 14 140 M30 0 Q22 70 30 140 M346 0 Q352 70 346 140 M330 0 Q338 70 330 140" stroke="#8C3A5B" stroke-width="2" opacity=".5"/></g>`
           + `<g stroke="none"><rect y="140" width="360" height="160" fill="url(#${p}tab)"/><rect y="140" width="360" height="160" filter="url(#${p}wood)" opacity=".6"/><rect y="140" width="360" height="8" fill="#000" opacity=".25" filter="url(#${p}b4)"/></g>`
           + `<g stroke="none"><rect x="26" y="152" width="308" height="130" rx="20" fill="#000" opacity=".28" filter="url(#${p}b6)" transform="translate(2 6)"/><rect x="26" y="152" width="308" height="130" rx="20" fill="url(#${p}cloth)"/>`
           + `${(() => { let s = ''; for (let x = 40; x < 330; x += 14) for (let y = 164; y < 276; y += 14) s += `<circle cx="${x}" cy="${y}" r="1.2" fill="#E48AA6" opacity=".35"/>`; return s; })()}`
           + `<rect x="38" y="164" width="284" height="106" rx="14" fill="none" stroke="#F6BBCB" stroke-width="2.4" stroke-dasharray="9 6"/></g>`
           + mist(p, 150, 10, '#FFFFFF', .35);
    }
  },
  cave: {
    name: { en: 'Crystal Cave', vi: 'Hang Pha Lê' },
    tint: '#DDD3F2',
    zones: [{ z: 'sky', x: 40, y: 26, w: 280, h: 100 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['crystal', 'gem', 'sparkle', 'lantern', 'candle', 'potion', 'key', 'coins', 'shell', 'mushroom', 'owl', 'cat', 'compass', 'hourglass', 'crystalball', 'ring', 'pentacle', 'star', 'constellation', 'bowl'],
    draw(p) {
      const crystal = (x, y, h, w, c) => `<path d="M${x - w} ${y} L${x - w * .6} ${y - h * .7} L${x} ${y - h} L${x + w * .6} ${y - h * .7} L${x + w} ${y} Z" fill="${c}" opacity=".85"/><path d="M${x - w * .6} ${y - h * .7} L${x} ${y - h} L${x} ${y}" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity=".6"/>`;
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'rock', [[0, '#3B2A6E'], [.5, '#6B56A8'], [1, '#9B86D2']])}${lin(p, 'floor', [[0, '#C9BCEA'], [1, '#8F7CC8']])}${nebulaF(p, 'nb', 17, [.6, .5, 1], '0.03 0.03', 4, 1.6, -0.55)}${nebulaF(p, 'rk', 23, [.15, .08, .3], '0.05 0.05', 3, 1.4, -0.5)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}rock)" stroke="none"/>`
           + nebula(p, 'rk', 0, 0, 360, 300, .5, 'multiply')
           + `<g stroke="none" style="mix-blend-mode:screen"><circle cx="70" cy="90" r="80" fill="#5B9BFF" opacity=".5" filter="url(#${p}b30)"/><circle cx="300" cy="110" r="80" fill="#FF7AB6" opacity=".45" filter="url(#${p}b30)"/><circle cx="180" cy="30" r="60" fill="#E5BE5E" opacity=".3" filter="url(#${p}b30)"/></g>`
           + nebula(p, 'nb', 0, 0, 360, 200, .35, 'screen')
           + `<g stroke="#241A45" stroke-width="1.2"><path d="M0 0 L70 0 L48 62 L0 96 Z M360 0 L290 0 L312 60 L360 100 Z M120 0 L156 0 L142 48 Z M212 0 L246 0 L230 54 Z" fill="#4B3684"/><path d="M0 0 L70 0 L48 62 L0 96 Z M360 0 L290 0 L312 60 L360 100 Z M120 0 L156 0 L142 48 Z M212 0 L246 0 L230 54 Z" fill="#000" opacity=".2" filter="url(#${p}b4)"/></g>`
           + starField(p, 12, 40, 10, 10, 350, 150, 1.2, 5)
           + `<g stroke="none"><path d="M0 162 Q90 132 180 158 Q270 184 360 152 L360 300 L0 300 Z" fill="url(#${p}floor)"/><path d="M0 162 Q90 132 180 158 Q270 184 360 152" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".35" filter="url(#${p}b4)"/></g>`
           + `<g stroke="#3D2A6E" stroke-width="1.2">${crystal(24, 300, 70, 22, '#AFC8F0')}${crystal(340, 300, 82, 20, '#D9CDF3')}${crystal(6, 300, 42, 12, '#F6BBCB')}${crystal(356, 300, 40, 10, '#AFC8F0')}</g>`
           + `<g stroke="none"><ellipse cx="24" cy="262" rx="40" ry="26" fill="#AFC8F0" opacity=".45" filter="url(#${p}b18)"/><ellipse cx="340" cy="256" rx="42" ry="28" fill="#D9CDF3" opacity=".45" filter="url(#${p}b18)"/></g>`
           + mist(p, 250, 18, '#B8A4E3', .35)
           + `<g stroke="none">${[[120, 110], [250, 70], [60, 40], [300, 44], [190, 130]].map(([x, y]) => glowDot(p, x, y, 1.5, '#F6E5B3', .9)).join('')}</g>`;
    }
  },
  garden: {
    name: { en: 'Zodiac Garden', vi: 'Vườn Hoàng Đạo' },
    tint: '#D9D9F5',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 104 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['zodiac', 'zodiac', 'zodiac', 'star', 'moon', 'sparkle', 'flower', 'sprig', 'butterfly', 'lotus', 'mushroom', 'rabbit', 'owl', 'lantern', 'bell', 'heart', 'planet', 'constellation', 'dreamcatcher', 'gem'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#4B3684'], [.45, '#8C7BC9'], [.8, '#E7A8C9'], [1, '#FBD2C4']])}${lin(p, 'g', [[0, '#8FCB9E'], [1, '#3F7F55']])}${lin(p, 'path', [[0, '#F1E1BF'], [1, '#C9A97A']])}${nebulaF(p, 'nb', 31, [1, .75, .9], '0.014 0.02', 4, 1.8, -0.65)}${lin(p, 'arch', [[0, '#FFF9FA'], [1, '#D9CDF3']], 1, 0)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>`
           + nebula(p, 'nb', 0, 0, 360, 150, .6, 'screen')
           + starField(p, 14, 60, 4, 4, 356, 110, 1.4, 8)
           + `<g stroke="none"><circle cx="60" cy="70" r="46" fill="#F6E5B3" opacity=".3" filter="url(#${p}b30)"/></g>`
           + `<g stroke="none"><path d="M0 150 L360 150 L360 300 L0 300 Z" fill="url(#${p}g)"/><path d="M120 300 Q140 220 180 160 Q220 220 240 300 Z" fill="url(#${p}path)"/><path d="M120 300 Q140 220 180 160 Q220 220 240 300" fill="none" stroke="#7A5A30" stroke-width="1" opacity=".4"/></g>`
           + `<g stroke="#3D2A6E" stroke-width="2"><path d="M40 150 L40 62 Q180 -34 320 62 L320 150" fill="none" stroke="#3D2A6E" stroke-width="12"/><path d="M40 150 L40 62 Q180 -34 320 62 L320 150" fill="none" stroke="url(#${p}arch)" stroke-width="7"/></g>`
           + `<g stroke="none" fill="#5FA271">${[[40, 70], [50, 40], [70, 22], [120, 4], [200, 0], [260, 10], [300, 30], [316, 60], [318, 100], [42, 110]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" transform="rotate(${(x * 7) % 90} ${x} ${y})"/>`).join('')}</g>`
           + `<g stroke="none">${[[46, 56], [88, 14], [180, -4], [276, 16], [314, 54], [316, 96], [44, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#F6BBCB"/><circle cx="${x}" cy="${y}" r="8" fill="#F6BBCB" opacity=".4" filter="url(#${p}b4)"/>`).join('')}</g>`
           + `<g stroke="none">${(() => { const R = rnd(33); let s = ''; for (let i = 0; i < 40; i++) { const left = i % 2 === 0, x = left ? R() * 108 : 252 + R() * 108, y = 162 + R() * 130, c = left ? ['#F6BBCB', '#E48AA6', '#FFF9FA'][i % 3] : ['#AFC8F0', '#D9CDF3', '#FFF9FA'][i % 3]; s += glowDot(p, x.toFixed(1), y.toFixed(1), 1.6 + R() * 1.6, c, .9); } return s; })()}</g>`
           + mist(p, 156, 12, '#E7A8C9', .3);
    }
  },
  space: {
    name: { en: 'Planet Walk', vi: 'Dạo Bước Hành Tinh' },
    tint: '#CFC4EE',
    zones: [{ z: 'sky', x: 30, y: 26, w: 300, h: 250 }],
    pool: ['planet', 'planet', 'comet', 'star', 'sparkle', 'moon', 'constellation', 'balloon', 'zodiac', 'gem', 'sun', 'clockmoon', 'rabbit', 'cat', 'tarot', 'cardfan', 'heart', 'key', 'hourglass', 'compass'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 's', [[0, '#1E1440'], [.5, '#3B2A6E'], [1, '#5B4A9C']])}${nebulaF(p, 'n1', 41, [1, .45, .8], '0.012 0.016', 5, 2.8, -1.25)}${nebulaF(p, 'n2', 43, [.4, .72, 1], '0.016 0.012', 5, 2.8, -1.3)}${rad(p, 'big', [[0, '#F6C9D9'], [.6, '#B8A4E3'], [1, '#5B4A9C']], .35, .3, .8)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}s)" stroke="none"/>`
           + `<g stroke="none"><ellipse cx="110" cy="80" rx="120" ry="70" fill="#E84D8A" opacity=".45" filter="url(#${p}b30)" style="mix-blend-mode:screen"/><ellipse cx="270" cy="200" rx="130" ry="80" fill="#3F7FE8" opacity=".5" filter="url(#${p}b30)" style="mix-blend-mode:screen"/><ellipse cx="200" cy="120" rx="60" ry="40" fill="#FFB0D0" opacity=".35" filter="url(#${p}b30)" style="mix-blend-mode:screen"/></g>`
           + nebula(p, 'n1', 0, 0, 360, 300, 1, 'screen') + nebula(p, 'n2', 0, 0, 360, 300, 1, 'screen')
           + `<g stroke="none"><ellipse cx="200" cy="150" rx="160" ry="24" fill="#FFF9FA" opacity=".12" filter="url(#${p}b18)" transform="rotate(-24 200 150)"/></g>`
           + starField(p, 19, 140, 2, 2, 358, 298, 1.8, 7)
           + `<g stroke="none"><circle cx="330" cy="290" r="150" fill="#3D2A6E" opacity=".5" filter="url(#${p}b18)"/><circle cx="330" cy="290" r="120" fill="url(#${p}big)"/><path d="M212 290 A118 118 0 0 1 330 172" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".25" filter="url(#${p}b4)"/></g>`;
    }
  },
  temple: {
    name: { en: 'Temple of Cups', vi: 'Đền Chén Thánh' },
    tint: '#FCE3E6',
    zones: [{ z: 'sky', x: 60, y: 22, w: 240, h: 90 }, { z: 'ground', x: 26, y: 136, w: 308, h: 138 }],
    pool: ['cup', 'wand', 'sword', 'pentacle', 'cup', 'wand', 'sword', 'pentacle', 'candle', 'incense', 'bowl', 'lotus', 'mala', 'scroll', 'bell', 'sun', 'star', 'cloud', 'bird', 'sparkle', 'tarot'],
    draw(p) {
      const col = (x) => `<rect x="${x}" y="30" width="30" height="120" rx="4" fill="url(#${p}marble)"/><rect x="${x + 22}" y="30" width="8" height="120" fill="#000" opacity=".12"/><rect x="${x - 6}" y="24" width="42" height="12" rx="3" fill="#E5BE5E"/><rect x="${x - 6}" y="146" width="42" height="10" rx="3" fill="#E5BE5E"/>`;
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#E48AA6'], [.5, '#F8D2DA'], [1, '#FFF1DD']])}${lin(p, 'marble', [[0, '#FFF9FA'], [1, '#D9CDF3']], 1, 0)}${lin(p, 'velvet', [[0, '#8C3A5B'], [.5, '#B8496D'], [1, '#6E2F49']])}${lin(p, 'step', [[0, '#E9E0F7'], [1, '#B8A4E3']])}${lin(p, 'fl', [[0, '#F1E1BF'], [1, '#C9A97A']])}${nebulaF(p, 'cl', 47, [1, 1, 1], '0.02 0.05', 3, 1.5, -0.5)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>` + nebula(p, 'cl', 0, 0, 360, 150, .7)
           + `<g stroke="none"><circle cx="180" cy="30" r="70" fill="#FFF1C0" opacity=".55" filter="url(#${p}b30)"/></g>` + rays(p, 180, 26, 9, 320, '#FFF6D8', .35, 9, 90)
           + `<g stroke="#3D2A6E" stroke-width="1.6">${col(20)}${col(310)}<path d="M-10 26 L180 -16 L370 26 L370 34 L180 -6 L-10 34 Z" fill="#E5BE5E"/></g>`
           + `<g stroke="none"><rect y="150" width="360" height="150" fill="url(#${p}fl)"/><rect x="0" y="150" width="360" height="30" fill="url(#${p}step)"/><rect x="40" y="180" width="280" height="30" fill="#D9CDF3"/><rect x="0" y="178" width="360" height="6" fill="#000" opacity=".2" filter="url(#${p}b4)"/><rect x="40" y="208" width="280" height="6" fill="#000" opacity=".2" filter="url(#${p}b4)"/></g>`
           + `<g stroke="none"><rect x="30" y="214" width="300" height="70" rx="6" fill="#000" opacity=".3" filter="url(#${p}b6)" transform="translate(0 6)"/><rect x="30" y="212" width="300" height="72" rx="6" fill="url(#${p}velvet)"/><path d="M70 212 Q78 250 70 284 M150 212 Q160 250 150 284 M230 212 Q240 250 230 284 M300 212 Q292 250 300 284" fill="none" stroke="#5B2340" stroke-width="6" opacity=".35" filter="url(#${p}b4)"/><path d="M30 212 L330 212" stroke="#E5BE5E" stroke-width="3"/></g>`
           + `<rect x="60" y="118" width="240" height="12" rx="4" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="1.6"/>`
           + mist(p, 130, 14, '#FFFFFF', .4)
           + `<g stroke="none">${[[80, 70], [280, 64], [120, 40], [240, 100], [180, 80]].map(([x, y]) => glowDot(p, x, y, 1.4, '#FFF6D8', .9)).join('')}</g>`;
    }
  },
  clouds: {
    name: { en: 'Cloud Kingdom', vi: 'Vương Quốc Mây' },
    tint: '#D8E8FF',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 124 }, { z: 'ground', x: 26, y: 160, w: 308, h: 114 }],
    pool: ['cloud', 'rainbow', 'sun', 'bird', 'balloon', 'star', 'sparkle', 'heart', 'butterfly', 'letter', 'feather', 'bell', 'key', 'ring', 'flower', 'dreamcatcher', 'cup', 'rabbit', 'owl', 'pillow', 'tarot'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#5D8FE0'], [.5, '#A9C6F5'], [1, '#E4EEFF']])}${lin(p, 'cf', [[0, '#FFFFFF'], [1, '#D9E4F7']])}${lin(p, 'cf2', [[0, '#F4F0FF'], [1, '#C4B8EA']])}${nebulaF(p, 'cl', 53, [1, 1, 1], '0.018 0.04', 4, 1.7, -0.6)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>` + nebula(p, 'cl', 0, 0, 360, 200, .7)
           + `<g stroke="none"><circle cx="300" cy="40" r="70" fill="#FFF1C0" opacity=".55" filter="url(#${p}b30)"/><circle cx="300" cy="40" r="18" fill="#FFF6D8" opacity=".95" filter="url(#${p}b4)"/></g>` + rays(p, 300, 40, 8, 300, '#FFF6D8', .3, 11, 125)
           + `<g stroke="none" opacity=".9" filter="url(#${p}b4)"><path d="M-20 200 A200 200 0 0 1 380 200" fill="none" stroke="#F6BBCB" stroke-width="10"/><path d="M-6 200 A186 186 0 0 1 366 200" fill="none" stroke="#F6E5B3" stroke-width="10"/><path d="M8 200 A172 172 0 0 1 352 200" fill="none" stroke="#CFEBD6" stroke-width="10"/><path d="M22 200 A158 158 0 0 1 338 200" fill="none" stroke="#AFC8F0" stroke-width="10"/></g>`
           + cloudPuff(p, 60, 120, 40, 12, '#FFFFFF', .7) + cloudPuff(p, 250, 140, 34, 10, '#FFFFFF', .5)
           + `<g stroke="none"><path d="M0 214 Q30 170 74 196 Q104 150 154 190 Q184 146 234 186 Q272 154 304 190 Q334 164 360 200 L360 300 L0 300 Z" fill="#000" opacity=".18" filter="url(#${p}b6)" transform="translate(0 8)"/><path d="M0 214 Q30 170 74 196 Q104 150 154 190 Q184 146 234 186 Q272 154 304 190 Q334 164 360 200 L360 300 L0 300 Z" fill="url(#${p}cf)"/>`
           + `<path d="M0 262 Q60 236 120 258 Q200 282 260 252 Q320 230 360 258 L360 300 L0 300 Z" fill="url(#${p}cf2)"/><path d="M0 262 Q60 236 120 258 Q200 282 260 252 Q320 230 360 258" fill="none" stroke="#FFFFFF" stroke-width="4" opacity=".7" filter="url(#${p}b4)"/></g>`
           + mist(p, 214, 14, '#FFFFFF', .5);
    }
  },
  tower: {
    name: { en: "Nabu's Observatory", vi: 'Đài Quan Sát của Nabu' },
    tint: '#D6CBF0',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 122 }, { z: 'ground', x: 26, y: 158, w: 308, h: 116 }],
    pool: ['moon', 'star', 'planet', 'comet', 'constellation', 'sparkle', 'zodiac', 'crystalball', 'book', 'candle', 'cardfan', 'tarot', 'hourglass', 'compass', 'clockmoon', 'owl', 'cat', 'potion', 'key', 'crystal', 'lantern', 'dreamcatcher', 'gem', 'mala'],
    draw(p) {
      return `<defs>${COMMON_DEFS(p)}${lin(p, 'sky', [[0, '#150E30'], [.5, '#3B2A6E'], [1, '#8C7BC9']])}${lin(p, 'stone', [[0, '#8F7CC8'], [1, '#5B4A9C']])}${lin(p, 'rail', [[0, '#D9CDF3'], [1, '#9B86D2']])}${nebulaF(p, 'n1', 61, [.4, .95, .8], '0.012 0.02', 5, 2.8, -1.3)}${nebulaF(p, 'n2', 67, [1, .5, .9], '0.02 0.012', 5, 2.8, -1.3)}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)" stroke="none"/>`
           + `<g stroke="none"><ellipse cx="240" cy="60" rx="120" ry="50" fill="#E84D8A" opacity=".35" filter="url(#${p}b30)" style="mix-blend-mode:screen"/><ellipse cx="100" cy="110" rx="110" ry="50" fill="#3F7FE8" opacity=".4" filter="url(#${p}b30)" style="mix-blend-mode:screen"/></g>`
           + nebula(p, 'n1', 0, 0, 360, 170, 1, 'screen') + nebula(p, 'n2', 0, 0, 360, 170, .9, 'screen')
           + `<g stroke="none" style="mix-blend-mode:screen"><path d="M-20 120 Q80 40 180 90 Q280 140 380 60" fill="none" stroke="#8CD79A" stroke-width="26" opacity=".35" filter="url(#${p}b18)"/><path d="M-20 100 Q100 20 220 70 Q300 100 380 40" fill="none" stroke="#AFC8F0" stroke-width="18" opacity=".35" filter="url(#${p}b18)"/></g>`
           + starField(p, 29, 120, 2, 2, 358, 160, 1.8, 6)
           + bigMoon(p, 68, 50, 22, '#F6E5B3')
           + `<g stroke="none"><path d="M-30 300 L44 122 L118 300 Z" fill="#241A45" opacity=".8"/><path d="M242 300 L310 130 L400 300 Z" fill="#241A45" opacity=".8"/><rect x="292" y="86" width="14" height="60" rx="3" fill="#241A45" transform="rotate(-30 299 116)"/><circle cx="288" cy="90" r="6" fill="#3D2A6E"/></g>`
           + `<g stroke="none"><rect y="158" width="360" height="142" fill="url(#${p}stone)"/><path d="M0 200 L360 200 M0 236 L360 236 M0 272 L360 272 M60 200 L60 236 M180 200 L180 236 M300 200 L300 236 M120 236 L120 272 M240 236 L240 272" stroke="#3D2A6E" stroke-width="1.2" opacity=".35"/></g>`
           + `<g stroke="#3D2A6E" stroke-width="1.6"><path d="M0 158 L0 122 L22 122 L22 140 L44 140 L44 122 L66 122 L66 158 M294 158 L294 122 L316 122 L316 140 L338 140 L338 122 L360 122 L360 158" fill="url(#${p}rail)"/><rect x="0" y="154" width="360" height="8" fill="url(#${p}rail)"/></g>`
           + `<g stroke="none"><rect x="28" y="176" width="304" height="100" rx="16" fill="#E5BE5E" opacity=".08"/><rect x="28" y="176" width="304" height="100" rx="16" fill="none" stroke="#F6E5B3" stroke-width="1.6" stroke-dasharray="8 6" opacity=".7"/><ellipse cx="180" cy="226" rx="120" ry="40" fill="#F6E5B3" opacity=".12" filter="url(#${p}b18)"/></g>`
           + `<g stroke="none">${[[40, 168], [320, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" fill="#F6E5B3" opacity=".35" filter="url(#${p}b18)"/><circle cx="${x}" cy="${y}" r="4" fill="#FFF6D8"/>`).join('')}</g>`;
    }
  }
};

const CHAPTERS = [
  { id: 1, bg: 'meadow', card: { en: 'The Fool', vi: 'Chàng Khờ' }, need: 0 },
  { id: 2, bg: 'pond', card: { en: 'The Moon', vi: 'Mặt Trăng' }, need: 12 },
  { id: 3, bg: 'attic', card: { en: 'The Star', vi: 'Ngôi Sao' }, need: 30 },
  { id: 4, bg: 'tearoom', card: { en: 'Temperance', vi: 'Điều Độ' }, need: 50 },
  { id: 5, bg: 'cave', card: { en: 'The Hermit', vi: 'Ẩn Sĩ' }, need: 72 },
  { id: 6, bg: 'garden', card: { en: 'Wheel of Fortune', vi: 'Bánh Xe Số Phận' }, need: 96 },
  { id: 7, bg: 'space', card: { en: 'The World', vi: 'Thế Giới' }, need: 120 },
  { id: 8, bg: 'temple', card: { en: 'The High Priestess', vi: 'Nữ Tư Tế' }, need: 146 },
  { id: 9, bg: 'clouds', card: { en: 'The Sun', vi: 'Mặt Trời' }, need: 172 },
  { id: 10, bg: 'tower', card: { en: 'The Magician', vi: 'Pháp Sư' }, need: 200 }
];
