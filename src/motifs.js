/* ============================ motif library ============================
   Every picture in the game is drawn from these little vector motifs, in the
   same idiom as the Nabu logo: soft pastel fills, a deep-purple outline,
   rounded shapes, small gold sparkles. Each motif is drawn inside a 100 x 100
   box centred on the origin. `draw(c)` gets c.a (main colour), c.b (second
   colour) and c.v (variant number) and returns SVG.

   Metadata per motif:
     r     hit radius (also used to keep objects apart)
     sym   true when a mirror image looks the same (so "flip" is never used)
     zone  where it may be placed: 'sky' | 'ground' | 'any'
     vars  number of variants (variant changes are one kind of difference)
     nocolor  true when the main colour must not be changed (would look wrong) */

const INK = '#3D2A6E', CREAM = '#FFF9FA', PINK = '#F6BBCB', BLUE = '#AFC8F0', LAV = '#B8A4E3',
      GOLD = '#E5BE5E', MINT = '#CFEBD6', PEACH = '#F8C9A8', LILAC = '#D9CDF3', PLUM = '#5B3F9E',
      ROSE = '#E48AA6', SKYB = '#7FA7E6', LEAF = '#8CC49B', SAND = '#F1E1BF', WOOD = '#C98E5B',
      WHITE = '#FFFFFF', DEEP = '#3D2A6E', NIGHT = '#4B3684', GOLD2 = '#F6E5B3', RED = '#E27A6A';

/* Colours a difference may switch to. NEAR lists look-alike pairs used on
   subtle levels; FAR is any other swatch. */
const SWATCH = [PINK, BLUE, LAV, GOLD, MINT, PEACH, LILAC, ROSE, SKYB, LEAF, SAND, CREAM];
const NEAR = {
  [PINK]: [PEACH, ROSE, LILAC], [PEACH]: [PINK, SAND, GOLD2], [ROSE]: [PINK, RED],
  [BLUE]: [SKYB, LILAC, MINT], [SKYB]: [BLUE, LAV], [LILAC]: [LAV, BLUE, PINK],
  [LAV]: [LILAC, SKYB, PLUM], [GOLD]: [SAND, PEACH, GOLD2], [SAND]: [GOLD, CREAM, PEACH],
  [MINT]: [LEAF, BLUE, CREAM], [LEAF]: [MINT], [CREAM]: [SAND, WHITE, LILAC], [WHITE]: [CREAM],
  [WOOD]: [PEACH, SAND], [PLUM]: [LAV, NIGHT], [RED]: [ROSE]
};

function pts(list) { return list.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '); }
function starPts(cx, cy, ro, ri, n, rot) {
  rot = rot === undefined ? -90 : rot;
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro, a = (rot + i * 180 / n) * Math.PI / 180;
    p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts(p);
}
function sparkle(cx, cy, r, fill) {
  return `<path d="M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z" fill="${fill || GOLD}" stroke-width="1.6"/>`;
}
function ring(cx, cy, r, fill, sw) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke-width="${sw || 2.4}"/>`; }
function blush(x, y) { return `<circle cx="${x}" cy="${y}" r="3.2" fill="${PINK}" stroke="none"/>`; }
function eyes(x1, x2, y) { return `<path d="M${x1 - 3} ${y} q3 3 6 0 M${x2 - 3} ${y} q3 3 6 0" fill="none" stroke-width="2.2"/>`; }
function smile(x, y) { return `<path d="M${x - 3} ${y} q3 3 6 0" fill="none" stroke-width="2"/>`; }
function shine(x, y, w, h) { return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${WHITE}" fill-opacity=".55" stroke="none"/>`; }

/* zodiac glyphs, each drawn in a 40 x 40 box around the origin */
const GLYPHS = [
  'M-13 12 C-13 -6 -4 -14 0 -2 C4 -14 13 -6 13 12',                          // Aries
  'M-12 -14 Q-8 -4 0 -2 Q8 -4 12 -14 M0 -2 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0', // Taurus
  'M-14 -14 Q0 -8 14 -14 M-14 14 Q0 8 14 14 M-7 -11 L-7 11 M7 -11 L7 11',      // Gemini
  'M-14 -4 Q-14 -14 -2 -12 M-8 -6 a4 4 0 1 0 0.1 0 M14 4 Q14 14 2 12 M8 6 a4 4 0 1 0 0.1 0', // Cancer
  'M-12 8 a5 5 0 1 0 0.1 0 M-8 6 Q-8 -12 2 -12 Q12 -12 10 0 Q6 10 12 14',     // Leo
  'M-14 -8 Q-10 -12 -8 -8 L-8 8 M-8 -8 Q-2 -12 0 -8 L0 8 M0 -8 Q6 -12 8 -8 L8 8 Q14 12 8 14', // Virgo
  'M-14 12 L14 12 M-14 4 L-6 4 Q-8 -10 0 -10 Q8 -10 6 4 L14 4',                // Libra
  'M-14 -8 Q-10 -12 -8 -8 L-8 8 M-8 -8 Q-2 -12 0 -8 L0 8 M0 -8 Q6 -12 8 -8 L8 8 Q10 12 14 10 M10 6 L14 10 L10 13', // Scorpio
  'M-12 12 L12 -12 M2 -12 L12 -12 L12 -2 M-8 -2 L2 8',                          // Sagittarius
  'M-14 -6 Q-10 -12 -6 -6 L-2 8 Q2 -10 10 -4 Q14 4 6 10 Q0 12 2 4',            // Capricorn
  'M-14 -4 L-8 -10 L-2 -4 L4 -10 L10 -4 L14 -8 M-14 8 L-8 2 L-2 8 L4 2 L10 8 L14 4', // Aquarius
  'M-12 -12 Q-2 0 -12 12 M12 -12 Q2 0 12 12 M-12 0 L12 0'                       // Pisces
];
const GLYPH_NAMES = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const MOTIFS = {

  /* ---------------------------------------------------------- sky ---- */
  moon: { r: 30, sym: false, zone: 'sky', vars: 3, draw(c) {
    if (c.v === 1) return ring(0, 0, 26, c.a) + `<circle cx="-8" cy="-6" r="5" fill="${c.b}" fill-opacity=".5" stroke="none"/><circle cx="8" cy="8" r="7" fill="${c.b}" fill-opacity=".5" stroke="none"/><circle cx="-4" cy="12" r="3" fill="${c.b}" fill-opacity=".5" stroke="none"/>`;
    if (c.v === 2) return `<path d="M0 -26 A26 26 0 0 0 0 26 Z" fill="${c.a}"/>` + `<path d="M0 -26 A26 26 0 0 1 0 26" fill="${c.b}" fill-opacity=".35"/>`;
    return `<path d="M6 -27 A27 27 0 1 0 6 27 A19 19 0 1 1 6 -27 Z" fill="${c.a}"/>` + sparkle(20, -6, 6);
  } },
  sun: { r: 34, sym: true, zone: 'sky', vars: 2, draw(c) {
    let rays = '';
    const n = c.v === 1 ? 8 : 12;
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, a1 = a - 0.16, a2 = a + 0.16;
      rays += `<path d="M${(26 * Math.cos(a1)).toFixed(1)} ${(26 * Math.sin(a1)).toFixed(1)} L${(38 * Math.cos(a)).toFixed(1)} ${(38 * Math.sin(a)).toFixed(1)} L${(26 * Math.cos(a2)).toFixed(1)} ${(26 * Math.sin(a2)).toFixed(1)} Z" fill="${c.b}"/>`;
    }
    return rays + ring(0, 0, 24, c.a) + eyes(-8, 8, -2) + smile(0, 8) + blush(-14, 5) + blush(14, 5);
  } },
  star: { r: 26, sym: true, zone: 'sky', vars: 3, draw(c) {
    if (c.v === 1) return `<polygon points="${starPts(0, 0, 28, 12, 6)}" fill="${c.a}" stroke-linejoin="round"/>`;
    if (c.v === 2) return `<polygon points="${starPts(0, 0, 28, 12, 4)}" fill="${c.a}" stroke-linejoin="round"/>`;
    return `<polygon points="${starPts(0, 0, 28, 13, 5)}" fill="${c.a}" stroke-linejoin="round"/>` + eyes(-7, 7, 0) + smile(0, 7);
  } },
  sparkle: { r: 22, sym: true, zone: 'any', vars: 2, draw(c) {
    return sparkle(0, 0, 24, c.a) + (c.v === 1 ? sparkle(18, -16, 8, c.b) + sparkle(-16, 16, 6, c.b) : '');
  } },
  planet: { r: 34, sym: false, zone: 'sky', vars: 3, draw(c) {
    const body = ring(0, 0, 22, c.a);
    if (c.v === 1) return body + `<path d="M-21 -6 Q0 -14 21 -6 M-22 4 Q0 -2 22 4 M-18 12 Q0 8 18 12" fill="none" stroke-width="2"/>`;
    if (c.v === 2) return body + `<circle cx="-7" cy="-6" r="5" fill="${c.b}" stroke-width="1.6"/><circle cx="9" cy="6" r="6" fill="${c.b}" stroke-width="1.6"/><circle cx="-6" cy="11" r="3" fill="${c.b}" stroke-width="1.4"/>`;
    return `<path d="M-40 6 Q-36 -6 0 -8 Q36 -6 40 6" fill="none" stroke-width="0"/>` + body
         + `<path d="M-38 2 Q-40 14 0 16 Q40 14 38 2" fill="none" stroke="${INK}" stroke-width="7"/>`
         + `<path d="M-38 2 Q-40 14 0 16 Q40 14 38 2" fill="none" stroke="${c.b}" stroke-width="4"/>`
         + shine(-8, -9, 6, 3.5);
  } },
  comet: { r: 30, sym: false, zone: 'sky', vars: 2, draw(c) {
    return `<path d="M-2 0 L-44 -18 L-14 -4 L-42 6 Z" fill="${c.b}" stroke-width="1.8"/>`
         + (c.v === 1 ? `<path d="M-6 8 L-30 22 L-10 10 Z" fill="${c.b}" stroke-width="1.6"/>` : '')
         + ring(10, 0, 15, c.a) + sparkle(24, -14, 6);
  } },
  cloud: { r: 30, sym: false, zone: 'sky', vars: 2, draw(c) {
    const base = `<path d="M-30 14 Q-42 14 -40 2 Q-38 -10 -26 -8 Q-24 -24 -8 -22 Q6 -22 10 -12 Q26 -16 28 -2 Q40 0 38 12 Q36 20 26 20 L-26 20 Q-32 20 -30 14 Z" fill="${c.a}"/>`;
    return base + (c.v === 1 ? `<path d="M-14 -2 L-8 6 L2 -8" fill="none" stroke="${INK}" stroke-width="3"/>` + sparkle(18, -4, 6, c.b) : eyes(-8, 6, 4) + blush(-16, 9) + blush(14, 9));
  } },
  rainbow: { r: 36, sym: true, zone: 'sky', vars: 1, nocolor: true, draw(c) {
    return `<path d="M-38 18 A38 38 0 0 1 38 18" fill="none" stroke="${INK}" stroke-width="20"/>`
         + `<path d="M-33 18 A33 33 0 0 1 33 18" fill="none" stroke="${PINK}" stroke-width="7"/>`
         + `<path d="M-26 18 A26 26 0 0 1 26 18" fill="none" stroke="${GOLD}" stroke-width="7"/>`
         + `<path d="M-19 18 A19 19 0 0 1 19 18" fill="none" stroke="${BLUE}" stroke-width="7"/>`
         + `<path d="M-46 22 Q-52 10 -40 10 Q-38 0 -28 6 Q-20 8 -22 20 Z" fill="${c.a}"/>`
         + `<path d="M46 22 Q52 10 40 10 Q38 0 28 6 Q20 8 22 20 Z" fill="${c.a}"/>`;
  } },
  constellation: { r: 32, sym: false, zone: 'sky', vars: 3, draw(c) {
    const sets = [[[-30, 14], [-8, -8], [14, -18], [30, 6]], [[-26, -14], [-6, 2], [12, -10], [26, 14], [0, 22]], [[-24, 18], [-18, -12], [8, -20], [22, 0], [12, 20]]];
    const s = sets[c.v] || sets[0];
    let d = 'M' + s.map(p => p.join(' ')).join(' L');
    return `<path d="${d}" fill="none" stroke="${c.b}" stroke-width="2" stroke-dasharray="4 3"/>` + s.map(p => sparkle(p[0], p[1], 8, c.a)).join('');
  } },
  balloon: { r: 34, sym: true, zone: 'sky', vars: 2, draw(c) {
    return `<path d="M0 -40 Q30 -40 30 -8 Q30 12 8 22 L-8 22 Q-30 12 -30 -8 Q-30 -40 0 -40 Z" fill="${c.a}"/>`
         + `<path d="M0 -40 Q12 -40 12 -8 Q12 12 4 22 M0 -40 Q-12 -40 -12 -8 Q-12 12 -4 22" fill="none" stroke="${c.b}" stroke-width="5"/>`
         + `<path d="M0 -40 Q12 -40 12 -8 Q12 12 4 22 M0 -40 Q-12 -40 -12 -8 Q-12 12 -4 22" fill="none" stroke-width="1.6"/>`
         + `<path d="M-8 22 L-10 34 M8 22 L10 34" stroke-width="2"/>`
         + `<rect x="-12" y="32" width="24" height="12" rx="3" fill="${WOOD}"/>` + (c.v === 1 ? sparkle(0, -12, 8, GOLD2) : '');
  } },
  bird: { r: 28, sym: false, zone: 'sky', vars: 2, draw(c) {
    return `<path d="M-30 4 Q-18 -18 -2 -4 Q4 -22 24 -12 Q34 -6 26 6 Q12 22 -8 12 Q-22 8 -30 4 Z" fill="${c.a}"/>`
         + `<path d="M-8 -2 Q-2 -24 18 -22 Q8 -14 6 -2 Z" fill="${c.b}" stroke-width="2"/>`
         + `<path d="M26 -8 L36 -6 L26 -2 Z" fill="${GOLD}" stroke-width="1.6"/>`
         + `<circle cx="18" cy="-9" r="1.8" fill="${INK}" stroke="none"/>` + (c.v === 1 ? `<path d="M-30 4 L-42 -2 L-34 8 Z" fill="${c.b}" stroke-width="1.8"/>` : '');
  } },

  /* ------------------------------------------------------ tarot ---- */
  tarot: { r: 30, sym: false, zone: 'any', vars: 3, draw(c) {
    const back = `<rect x="-20" y="-30" width="40" height="60" rx="5" fill="${c.a}"/><rect x="-15" y="-25" width="30" height="50" rx="3" fill="none" stroke="${c.b}" stroke-width="1.8"/>`;
    if (c.v === 1) return back + `<circle cx="0" cy="-2" r="9" fill="${c.b}" stroke-width="1.6"/>` + `<path d="M0 -17 L0 -13 M0 9 L0 13 M-15 -2 L-11 -2 M11 -2 L15 -2" stroke="${c.b}" stroke-width="2"/>`;
    if (c.v === 2) return back + `<polygon points="${starPts(0, -2, 10, 4.5, 5)}" fill="${c.b}" stroke-width="1.4"/>` + `<circle cx="-9" cy="14" r="2" fill="${c.b}" stroke="none"/><circle cx="9" cy="14" r="2" fill="${c.b}" stroke="none"/>`;
    return back + `<path d="M5 -13 A10 10 0 1 0 5 7 A7.5 7.5 0 1 1 5 -13 Z" fill="${c.b}" stroke-width="1.6"/>` + `<circle cx="-9" cy="-18" r="2" fill="${c.b}" stroke="none"/><circle cx="9" cy="18" r="2" fill="${c.b}" stroke="none"/><circle cx="-9" cy="18" r="2" fill="${c.b}" stroke="none"/>`;
  } },
  cardfan: { r: 34, sym: false, zone: 'any', vars: 2, draw(c) {
    const card = (rot, fill) => `<g transform="rotate(${rot} 0 30)"><rect x="-16" y="-30" width="32" height="50" rx="4" fill="${fill}"/><rect x="-12" y="-26" width="24" height="42" rx="3" fill="none" stroke="${GOLD}" stroke-width="1.5"/></g>`;
    return card(-22, c.v === 1 ? c.b : BLUE) + card(22, c.v === 1 ? c.b : PINK) + card(0, c.a)
         + `<path d="M4 -16 A8 8 0 1 0 4 0 A6 6 0 1 1 4 -16 Z" fill="${GOLD}" stroke-width="1.4"/>`;
  } },
  cup: { r: 28, sym: true, zone: 'ground', vars: 3, draw(c) {
    return `<path d="M-22 -26 L22 -26 L18 -4 Q10 8 0 8 Q-10 8 -18 -4 Z" fill="${c.a}"/>`
         + `<rect x="-4" y="8" width="8" height="12" fill="${c.b}"/>`
         + `<path d="M-16 30 L16 30 L10 20 L-10 20 Z" fill="${c.b}"/>`
         + (c.v === 1 ? `<path d="M0 -6 C-9 -14 -12 -20 0 -18 C12 -20 9 -14 0 -6 Z" fill="${PINK}" stroke-width="1.6"/>` : c.v === 2 ? sparkle(0, -14, 8) : `<ellipse cx="0" cy="-26" rx="22" ry="4" fill="${c.b}"/>`);
  } },
  wand: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<rect x="-4" y="-34" width="8" height="70" rx="3" fill="${WOOD}" transform="rotate(18)"/>`
         + `<path d="M-6 -20 C-22 -22 -26 -34 -18 -38 C-10 -30 -6 -28 -6 -20 Z" fill="${c.a}" transform="rotate(18)"/>`
         + `<path d="M6 -4 C22 -6 26 -18 18 -22 C10 -14 6 -12 6 -4 Z" fill="${c.a}" transform="rotate(18)"/>`
         + (c.v === 1 ? sparkle(12, -36, 9, c.b) : `<path d="M-6 12 C-20 10 -24 0 -16 -4 C-8 4 -6 4 -6 12 Z" fill="${c.a}" transform="rotate(18)"/>`);
  } },
  sword: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M0 -40 L7 -30 L7 6 L-7 6 L-7 -30 Z" fill="${c.b}"/>`
         + `<line x1="0" y1="-28" x2="0" y2="2" stroke="${WHITE}" stroke-opacity=".6" stroke-width="2"/>`
         + `<rect x="-18" y="6" width="36" height="7" rx="3" fill="${GOLD}"/>`
         + `<rect x="-4" y="13" width="8" height="16" fill="${c.a}"/>`
         + (c.v === 1 ? `<polygon points="${starPts(0, 34, 7, 3, 5)}" fill="${GOLD}" stroke-width="1.4"/>` : ring(0, 33, 5, GOLD, 2));
  } },
  pentacle: { r: 28, sym: true, zone: 'any', vars: 2, draw(c) {
    const p = [];
    for (let i = 0; i < 5; i++) { const a = (-90 + i * 72) * Math.PI / 180; p.push([20 * Math.cos(a), 20 * Math.sin(a)]); }
    const o = [0, 2, 4, 1, 3];
    return ring(0, 0, 27, c.a) + ring(0, 0, 22, c.a, 1.4)
         + (c.v === 1 ? `<polygon points="${starPts(0, 0, 18, 8, 5)}" fill="${c.b}" stroke-width="1.6"/>`
                      : `<polygon points="${pts(o.map(i => p[i]))}" fill="none" stroke-width="2"/>`);
  } },

  /* ------------------------------------------------- spiritual ---- */
  crystal: { r: 32, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-30 30 L-26 -4 L-16 -20 L-6 0 L-4 30 Z" fill="${c.b}"/>`
         + `<path d="M6 30 L10 -2 L18 -14 L28 4 L30 30 Z" fill="${c.b}"/>`
         + `<path d="M-14 30 L-12 -18 L0 -40 L12 -18 L14 30 Z" fill="${c.a}"/>`
         + `<path d="M-12 -18 L0 -40 L0 30" fill="none" stroke="${WHITE}" stroke-opacity=".5" stroke-width="2"/>`
         + `<rect x="-34" y="28" width="68" height="8" rx="4" fill="${SAND}"/>` + (c.v === 1 ? sparkle(20, -30, 8) : '');
  } },
  gem: { r: 26, sym: true, zone: 'any', vars: 2, draw(c) {
    return (c.v === 1 ? `<polygon points="0,-30 22,-12 14,30 -14,30 -22,-12" fill="${c.a}"/><path d="M-22 -12 L22 -12 M0 -30 L-8 -12 L0 30 L8 -12 Z" fill="none" stroke-width="1.6"/>`
                      : `<polygon points="-26,-10 -14,-26 14,-26 26,-10 0,28" fill="${c.a}"/><path d="M-26 -10 L26 -10 M-14 -26 L-6 -10 L0 28 L6 -10 L14 -26" fill="none" stroke-width="1.6"/>`)
         + shine(-8, -18, 5, 2.5);
  } },
  crystalball: { r: 32, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-24 34 L24 34 L18 20 L-18 20 Z" fill="${GOLD}"/>`
         + ring(0, -6, 27, c.a) + shine(-10, -18, 7, 4)
         + (c.v === 1 ? sparkle(4, -6, 10, c.b) + sparkle(-10, 4, 5, c.b) : `<path d="M-14 -2 Q-4 -18 12 -6" fill="none" stroke="${c.b}" stroke-width="3" stroke-linecap="round"/>`);
  } },
  candle: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<rect x="-12" y="-14" width="24" height="46" rx="4" fill="${c.a}"/>`
         + `<path d="M-12 -6 Q-6 2 -12 8 M12 -2 Q6 4 12 12" fill="none" stroke="${c.b}" stroke-width="3" stroke-linecap="round"/>`
         + `<ellipse cx="0" cy="-14" rx="12" ry="4" fill="${c.b}"/>`
         + `<line x1="0" y1="-16" x2="0" y2="-22" stroke-width="2"/>`
         + (c.v === 1 ? '' : `<path d="M0 -40 Q10 -28 0 -20 Q-10 -28 0 -40 Z" fill="${GOLD}"/><path d="M0 -32 Q4 -27 0 -22 Q-4 -27 0 -32 Z" fill="${WHITE}" stroke="none"/>`)
         + `<ellipse cx="0" cy="32" rx="18" ry="5" fill="${SAND}"/>`;
  } },
  incense: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-26 20 Q-30 34 -12 34 L24 34 Q30 34 30 26 L30 20 Z" fill="${c.a}"/>`
         + `<line x1="-14" y1="24" x2="18" y2="-34" stroke="${WOOD}" stroke-width="3"/>`
         + `<circle cx="18" cy="-34" r="3" fill="${RED}" stroke-width="1.4"/>`
         + `<path d="M20 -40 Q30 -48 22 -54 Q14 -60 24 -66" fill="none" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round"/>`
         + (c.v === 1 ? `<path d="M12 -44 Q6 -50 12 -56" fill="none" stroke="${c.b}" stroke-width="2" stroke-linecap="round"/>` : '');
  } },
  lotus: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    const petal = (rot, fill, len) => `<path d="M0 12 Q-14 -6 0 ${-len} Q14 -6 0 12 Z" fill="${fill}" transform="rotate(${rot} 0 12)"/>`;
    return `<path d="M-40 18 Q0 34 40 18 Q0 26 -40 18 Z" fill="${LEAF}"/>`
         + petal(-60, c.b, 26) + petal(60, c.b, 26) + petal(-30, c.a, 30) + petal(30, c.a, 30) + petal(0, c.a, 34)
         + (c.v === 1 ? sparkle(0, -18, 7) : `<circle cx="0" cy="4" r="4" fill="${GOLD}" stroke-width="1.4"/>`);
  } },
  flower: { r: 26, sym: true, zone: 'any', vars: 3, draw(c) {
    const n = c.v === 1 ? 6 : c.v === 2 ? 4 : 5;
    let s = '';
    for (let i = 0; i < n; i++) s += `<circle cx="0" cy="-16" r="11" fill="${c.a}" transform="rotate(${i * 360 / n})"/>`;
    return s + ring(0, 0, 8, GOLD, 2);
  } },
  bell: { r: 28, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<path d="M0 -36 Q22 -34 22 -4 L28 12 L-28 12 L-22 -4 Q-22 -34 0 -36 Z" fill="${c.a}"/>`
         + `<circle cx="0" cy="-38" r="4" fill="${c.b}" stroke-width="1.6"/>`
         + `<rect x="-30" y="12" width="60" height="8" rx="4" fill="${c.b}"/>`
         + `<circle cx="0" cy="26" r="6" fill="${c.b}" stroke-width="1.8"/>`
         + (c.v === 1 ? `<path d="M-40 -6 Q-46 4 -40 12 M40 -6 Q46 4 40 12" fill="none" stroke-width="2"/>` : '');
  } },
  bowl: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-30 -6 L30 -6 Q30 24 0 24 Q-30 24 -30 -6 Z" fill="${c.a}"/>`
         + `<ellipse cx="0" cy="-6" rx="30" ry="6" fill="${c.b}"/>`
         + `<path d="M-30 4 Q-32 12 -22 14" fill="none" stroke="${c.b}" stroke-width="2.4"/>`
         + `<line x1="30" y1="-30" x2="14" y2="10" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>`
         + `<circle cx="32" cy="-32" r="6" fill="${c.b}" stroke-width="1.8"/>`
         + (c.v === 1 ? `<path d="M-40 -20 Q-44 -12 -40 -4" fill="none" stroke-width="2"/>` : '');
  } },
  feather: { r: 30, sym: false, zone: 'any', vars: 2, draw(c) {
    return `<path d="M-24 34 Q-26 -4 8 -32 Q30 -46 24 -20 Q18 4 -18 30 Z" fill="${c.a}"/>`
         + `<path d="M-24 34 Q0 8 22 -30" fill="none" stroke-width="2"/>`
         + `<path d="M-8 18 Q-2 8 -12 10 M0 8 Q6 -2 -4 0 M8 -2 Q14 -12 4 -10" fill="none" stroke="${c.b}" stroke-width="2"/>`
         + (c.v === 1 ? sparkle(26, -36, 7) : '');
  } },
  key: { r: 30, sym: false, zone: 'any', vars: 2, draw(c) {
    return `<circle cx="-20" cy="-14" r="14" fill="${c.a}"/><circle cx="-20" cy="-14" r="5" fill="${c.b}" stroke-width="1.6"/>`
         + `<path d="M-10 -4 L22 28 L30 20 L26 16 L22 20 L18 16 L24 10 L20 6 L14 12 Z" fill="${c.a}"/>`
         + (c.v === 1 ? `<path d="M-30 -22 L-24 -16 L-16 -26" fill="none" stroke="${c.b}" stroke-width="2"/>` : '');
  } },
  hourglass: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    const top = c.v === 1 ? '' : `<path d="M-14 -24 L14 -24 L4 -8 L-4 -8 Z" fill="${c.a}" stroke="none"/>`;
    const bot = c.v === 1 ? `<path d="M-16 30 L16 30 L6 16 L-6 16 Z" fill="${c.a}" stroke="none"/>` : `<path d="M-10 30 L10 30 L4 24 L-4 24 Z" fill="${c.a}" stroke="none"/>`;
    return `<rect x="-24" y="-38" width="48" height="8" rx="3" fill="${c.b}"/><rect x="-24" y="30" width="48" height="8" rx="3" fill="${c.b}"/>`
         + `<path d="M-18 -30 L18 -30 L4 0 L18 30 L-18 30 L-4 0 Z" fill="${WHITE}" fill-opacity=".45"/>` + top + bot
         + `<path d="M-18 -30 L18 -30 L4 0 L18 30 L-18 30 L-4 0 Z" fill="none"/>`
         + `<line x1="-24" y1="-30" x2="-24" y2="30" stroke-width="3"/><line x1="24" y1="-30" x2="24" y2="30" stroke-width="3"/>`;
  } },
  book: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    if (c.v === 1) return `<path d="M-36 -18 Q-18 -26 0 -14 Q18 -26 36 -18 L36 20 Q18 12 0 24 Q-18 12 -36 20 Z" fill="${CREAM}"/>`
         + `<path d="M0 -14 L0 24" stroke-width="2"/><path d="M-28 -8 Q-16 -14 -6 -6 M-28 0 Q-16 -6 -6 2 M6 -6 Q16 -14 28 -8 M6 2 Q16 -6 28 0" fill="none" stroke="${c.b}" stroke-width="2"/>`
         + sparkle(18, 10, 5, GOLD);
    return `<path d="M-26 -34 L26 -34 Q30 -34 30 -30 L30 28 Q30 32 26 32 L-26 32 Z" fill="${c.a}"/>`
         + `<path d="M-26 -34 Q-32 -34 -32 -28 L-32 26 Q-32 32 -26 32 Z" fill="${c.b}"/>`
         + `<rect x="-14" y="-20" width="34" height="38" rx="3" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`
         + `<polygon points="${starPts(3, -1, 9, 4, 5)}" fill="${GOLD}" stroke-width="1.4"/>`;
  } },
  scroll: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<rect x="-26" y="-22" width="52" height="44" fill="${CREAM}"/>`
         + `<rect x="-34" y="-30" width="68" height="14" rx="7" fill="${c.a}"/><rect x="-34" y="16" width="68" height="14" rx="7" fill="${c.a}"/>`
         + `<path d="M-16 -8 L16 -8 M-16 0 L10 0 M-16 8 L14 8" fill="none" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round"/>`
         + (c.v === 1 ? `<circle cx="18" cy="8" r="6" fill="${RED}" stroke-width="1.6"/>` : '');
  } },
  potion: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<rect x="-8" y="-40" width="16" height="10" rx="2" fill="${WOOD}"/>`
         + `<path d="M-8 -30 L8 -30 L8 -14 Q30 -4 30 16 Q30 34 0 34 Q-30 34 -30 16 Q-30 -4 -8 -14 Z" fill="${LILAC}" fill-opacity=".7"/>`
         + `<path d="M-28 12 Q-30 34 0 34 Q30 34 28 12 Q20 4 0 6 Q-20 4 -28 12 Z" fill="${c.a}" stroke="none"/>`
         + `<path d="M-8 -30 L8 -30 L8 -14 Q30 -4 30 16 Q30 34 0 34 Q-30 34 -30 16 Q-30 -4 -8 -14 Z" fill="none"/>`
         + (c.v === 1 ? `<circle cx="-8" cy="18" r="3" fill="${WHITE}" stroke="none"/><circle cx="8" cy="24" r="2" fill="${WHITE}" stroke="none"/>` : sparkle(0, 20, 7, c.b))
         + shine(-18, 0, 3, 8);
  } },
  teacup: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<ellipse cx="0" cy="26" rx="34" ry="7" fill="${c.b}"/>`
         + `<path d="M-24 -10 L24 -10 Q24 22 0 22 Q-24 22 -24 -10 Z" fill="${c.a}"/>`
         + `<path d="M24 -2 Q40 -2 38 10 Q36 18 22 16" fill="none" stroke-width="2.4"/>`
         + `<ellipse cx="0" cy="-10" rx="24" ry="6" fill="${WOOD}" fill-opacity=".6"/>`
         + (c.v === 1 ? `<path d="M-6 -20 Q-2 -30 -6 -38 M6 -20 Q10 -30 6 -38" fill="none" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M-8 -12 Q-4 -18 2 -14 Q6 -18 8 -12" fill="${LEAF}" stroke-width="1.4"/>`);
  } },
  teapot: { r: 34, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<ellipse cx="0" cy="8" rx="28" ry="24" fill="${c.a}"/>`
         + `<path d="M24 -2 Q44 -12 42 -22 L38 -22 Q34 -10 22 2 Z" fill="${c.a}"/>`
         + `<path d="M-26 -2 Q-46 -2 -42 18 Q-40 26 -26 24" fill="none" stroke-width="2.4"/>`
         + `<ellipse cx="0" cy="-16" rx="14" ry="5" fill="${c.b}"/><circle cx="0" cy="-22" r="4" fill="${c.b}" stroke-width="1.6"/>`
         + (c.v === 1 ? `<circle cx="-6" cy="8" r="6" fill="${c.b}" stroke-width="1.6"/><circle cx="10" cy="14" r="4" fill="${c.b}" stroke-width="1.4"/>` : `<path d="M-16 10 Q0 18 16 10" fill="none" stroke="${c.b}" stroke-width="3"/>`);
  } },
  lantern: { r: 30, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<line x1="0" y1="-44" x2="0" y2="-34" stroke-width="2.4"/>`
         + `<rect x="-14" y="-36" width="28" height="8" rx="3" fill="${c.b}"/>`
         + `<path d="M-14 -28 Q-30 -28 -30 -2 Q-30 22 -14 22 L14 22 Q30 22 30 -2 Q30 -28 14 -28 Z" fill="${c.a}"/>`
         + `<path d="M-8 -28 Q-12 -2 -8 22 M8 -28 Q12 -2 8 22" fill="none" stroke-width="1.6"/>`
         + `<rect x="-14" y="22" width="28" height="8" rx="3" fill="${c.b}"/>`
         + (c.v === 1 ? sparkle(0, -4, 8, GOLD2) : `<line x1="0" y1="30" x2="0" y2="42" stroke="${GOLD}" stroke-width="3"/>`);
  } },
  ring: { r: 26, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<circle cx="0" cy="8" r="20" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="0" cy="8" r="20" fill="none" stroke="${GOLD}" stroke-width="5"/>`
         + (c.v === 1 ? `<circle cx="0" cy="-16" r="9" fill="${c.a}"/>` : `<polygon points="0,-30 12,-20 8,-6 -8,-6 -12,-20" fill="${c.a}"/>`) + shine(-3, -19, 3, 2);
  } },
  heart: { r: 26, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<path d="M0 26 C-30 4 -30 -26 -8 -22 C-2 -20 0 -14 0 -12 C0 -14 2 -20 8 -22 C30 -26 30 4 0 26 Z" fill="${c.a}"/>`
         + (c.v === 1 ? `<path d="M0 26 C-30 4 -30 -26 -8 -22 C-2 -20 0 -14 0 -12 C0 -14 2 -20 8 -22 C30 -26 30 4 0 26 Z" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="3 3" transform="scale(.7) translate(0 2)"/>` : shine(-10, -12, 4, 3));
  } },
  butterfly: { r: 30, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<path d="M-2 0 Q-40 -34 -34 -6 Q-32 6 -14 4 Q-40 8 -30 26 Q-22 34 -2 10 Z" fill="${c.a}"/>`
         + `<path d="M2 0 Q40 -34 34 -6 Q32 6 14 4 Q40 8 30 26 Q22 34 2 10 Z" fill="${c.a}"/>`
         + `<circle cx="-22" cy="-8" r="5" fill="${c.b}" stroke-width="1.4"/><circle cx="22" cy="-8" r="5" fill="${c.b}" stroke-width="1.4"/>`
         + (c.v === 1 ? `<circle cx="-18" cy="16" r="3" fill="${c.b}" stroke-width="1.2"/><circle cx="18" cy="16" r="3" fill="${c.b}" stroke-width="1.2"/>` : '')
         + `<rect x="-3" y="-10" width="6" height="26" rx="3" fill="${INK}"/><path d="M-2 -10 Q-8 -22 -10 -24 M2 -10 Q8 -22 10 -24" fill="none" stroke-width="2"/>`;
  } },
  cat: { r: 32, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M22 20 Q44 24 40 6 Q36 -4 30 8" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M22 20 Q44 24 40 6 Q36 -4 30 8" fill="none" stroke="${c.a}" stroke-width="4" stroke-linecap="round"/>`
         + `<path d="M-22 30 Q-30 4 -12 -6 L12 -6 Q30 4 22 30 Z" fill="${c.a}"/>`
         + `<path d="M-20 -8 L-18 -32 L-6 -20 L6 -20 L18 -32 L20 -8 Q20 6 0 6 Q-20 6 -20 -8 Z" fill="${c.a}"/>`
         + `<path d="M-15 -25 L-14 -16 L-8 -19 Z M15 -25 L14 -16 L8 -19 Z" fill="${PINK}" stroke="none"/>`
         + (c.v === 1 ? `<circle cx="-7" cy="-8" r="2" fill="${INK}" stroke="none"/><circle cx="7" cy="-8" r="2" fill="${INK}" stroke="none"/>` : eyes(-7, 7, -9))
         + `<path d="M-2 -2 L2 -2 L0 0 Z" fill="${PINK}" stroke-width="1"/>` + blush(-12, -3) + blush(12, -3)
         + `<path d="M-22 30 L22 30" stroke-width="2.4"/>`;
  } },
  owl: { r: 32, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<path d="M-40 34 L40 34" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>`
         + `<path d="M-24 -20 L-26 -34 L-12 -26 L12 -26 L26 -34 L24 -20 Q30 4 22 24 Q0 36 -22 24 Q-30 4 -24 -20 Z" fill="${c.a}"/>`
         + `<circle cx="-11" cy="-8" r="10" fill="${CREAM}" stroke-width="2"/><circle cx="11" cy="-8" r="10" fill="${CREAM}" stroke-width="2"/>`
         + (c.v === 1 ? `<circle cx="-11" cy="-8" r="4" fill="${INK}" stroke="none"/><circle cx="11" cy="-8" r="4" fill="${INK}" stroke="none"/>` : eyes(-11, 11, -8))
         + `<path d="M-4 2 L4 2 L0 8 Z" fill="${GOLD}" stroke-width="1.4"/>`
         + `<path d="M-14 12 Q-8 18 -2 12 M2 12 Q8 18 14 12 M-8 20 Q-2 26 4 20" fill="none" stroke="${c.b}" stroke-width="2"/>`;
  } },
  rabbit: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-14 -10 Q-22 -46 -8 -42 Q-2 -40 -2 -10 Z" fill="${c.a}"/><path d="M14 -10 Q22 -46 8 -42 Q2 -40 2 -10 Z" fill="${c.a}"/>`
         + `<path d="M-12 -12 Q-16 -36 -8 -34 Q-6 -32 -5 -12 Z M12 -12 Q16 -36 8 -34 Q6 -32 5 -12 Z" fill="${PINK}" stroke="none"/>`
         + `<ellipse cx="0" cy="10" rx="24" ry="22" fill="${c.a}"/>`
         + eyes(-8, 8, 4) + `<path d="M-2 12 L2 12 L0 14 Z" fill="${PINK}" stroke-width="1"/>` + blush(-14, 12) + blush(14, 12)
         + (c.v === 1 ? `<path d="M-8 24 L8 24" stroke="${c.b}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="24" r="5" fill="${GOLD}" stroke-width="1.4"/>` : '');
  } },
  mushroom: { r: 28, sym: true, zone: 'ground', vars: 3, draw(c) {
    const dots = c.v === 2 ? '' : `<circle cx="-12" cy="-16" r="4" fill="${CREAM}" stroke="none"/><circle cx="8" cy="-22" r="3" fill="${CREAM}" stroke="none"/>` + (c.v === 1 ? `<circle cx="14" cy="-10" r="3" fill="${CREAM}" stroke="none"/>` : '');
    return `<path d="M-14 -4 L-10 30 L10 30 L14 -4 Z" fill="${SAND}"/>`
         + `<path d="M-30 -2 Q-30 -34 0 -34 Q30 -34 30 -2 Z" fill="${c.a}"/>` + dots;
  } },
  sprig: { r: 28, sym: false, zone: 'any', vars: 2, draw(c) {
    const leaf = (x, y, rot) => `<path d="M0 0 Q-10 -12 0 -24 Q10 -12 0 0 Z" fill="${c.a}" transform="translate(${x} ${y}) rotate(${rot})"/>`;
    return `<path d="M-26 30 Q0 10 26 -30" fill="none" stroke="${LEAF}" stroke-width="3"/>`
         + leaf(-14, 20, -60) + leaf(-4, 12, 40) + leaf(8, 0, -60) + leaf(16, -10, 40)
         + (c.v === 1 ? `<circle cx="26" cy="-30" r="5" fill="${c.b}" stroke-width="1.6"/>` : '');
  } },
  zodiac: { r: 28, sym: false, zone: 'any', vars: 12, draw(c) {
    return ring(0, 0, 27, c.a) + ring(0, 0, 22, c.a, 1.4)
         + `<path d="${GLYPHS[c.v % 12]}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="scale(.95)"/>`;
  } },
  dreamcatcher: { r: 32, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<line x1="0" y1="-44" x2="0" y2="-30" stroke-width="2.4"/>`
         + `<circle cx="0" cy="-6" r="24" fill="${c.b}" fill-opacity=".35" stroke-width="3"/>`
         + `<path d="M0 -30 L20 -18 L20 6 L0 18 L-20 6 L-20 -18 Z M0 -30 L0 18 M-20 -18 L20 6 M20 -18 L-20 6" fill="none" stroke="${INK}" stroke-width="1.4"/>`
         + ring(0, -6, 5, c.a, 1.6)
         + [-14, 0, 14].map((x, i) => `<path d="M${x} 18 L${x} 26 Q${x - 5} 36 ${x} 44 Q${x + 5} 36 ${x} 26" fill="${i === 1 ? c.a : c.b}" stroke-width="1.6"/>`).join('')
         + (c.v === 1 ? `<circle cx="-14" cy="24" r="2.4" fill="${GOLD}" stroke="none"/><circle cx="14" cy="24" r="2.4" fill="${GOLD}" stroke="none"/>` : '');
  } },
  pillow: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M-30 -20 Q0 -14 30 -20 Q36 0 30 20 Q0 14 -30 20 Q-36 0 -30 -20 Z" fill="${c.a}"/>`
         + (c.v === 1 ? `<polygon points="${starPts(0, 0, 9, 4, 5)}" fill="${c.b}" stroke-width="1.4"/>` : `<path d="M-14 -8 L14 8 M-14 8 L14 -8" fill="none" stroke="${c.b}" stroke-width="2"/>`)
         + `<circle cx="-30" cy="-20" r="3" fill="${GOLD}" stroke-width="1.2"/><circle cx="30" cy="-20" r="3" fill="${GOLD}" stroke-width="1.2"/><circle cx="-30" cy="20" r="3" fill="${GOLD}" stroke-width="1.2"/><circle cx="30" cy="20" r="3" fill="${GOLD}" stroke-width="1.2"/>`;
  } },
  letter: { r: 30, sym: true, zone: 'any', vars: 2, draw(c) {
    return `<rect x="-32" y="-20" width="64" height="42" rx="4" fill="${CREAM}"/>`
         + `<path d="M-32 -18 L0 6 L32 -18" fill="none" stroke-width="2.4"/>`
         + (c.v === 1 ? `<circle cx="0" cy="4" r="7" fill="${c.a}" stroke-width="1.6"/>` : `<path d="M0 12 C-10 4 -10 -6 -3 -4 C-1 -3 0 -1 0 0 C0 -1 1 -3 3 -4 C10 -6 10 4 0 12 Z" fill="${c.a}" stroke-width="1.6"/>`);
  } },
  mirror: { r: 30, sym: false, zone: 'ground', vars: 2, draw(c) {
    return `<rect x="-5" y="18" width="10" height="26" rx="4" fill="${c.b}" transform="rotate(-20 0 18)"/>`
         + ring(0, -8, 26, c.b, 3) + ring(0, -8, 20, c.a, 1.6)
         + `<path d="M-10 -22 Q-16 -14 -12 -2" fill="none" stroke="${WHITE}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`
         + (c.v === 1 ? sparkle(6, -6, 7, GOLD2) : '');
  } },
  shell: { r: 28, sym: true, zone: 'ground', vars: 2, draw(c) {
    return `<path d="M0 26 L-30 -6 Q-30 -34 0 -34 Q30 -34 30 -6 Z" fill="${c.a}"/>`
         + `<path d="M0 26 L-18 -26 M0 26 L-6 -32 M0 26 L6 -32 M0 26 L18 -26" fill="none" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round"/>`
         + `<rect x="-8" y="22" width="16" height="10" rx="3" fill="${c.b}"/>`
         + (c.v === 1 ? `<circle cx="0" cy="0" r="6" fill="${WHITE}" stroke-width="1.6"/>` : '');
  } },
  compass: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    return ring(0, 0, 28, c.b) + ring(0, 0, 22, CREAM, 1.6)
         + `<path d="M0 -18 L6 0 L0 18 L-6 0 Z" fill="${c.a}"/><path d="M-18 0 L0 -6 L18 0 L0 6 Z" fill="${c.a}" fill-opacity=".6"/>`
         + (c.v === 1 ? `<path d="M0 -18 L6 0 L0 18 L-6 0 Z" fill="${RED}" stroke="none" transform="scale(.5)"/>` : ring(0, 0, 3, GOLD, 1.4));
  } },
  coins: { r: 28, sym: false, zone: 'ground', vars: 2, draw(c) {
    const coin = (y) => `<ellipse cx="0" cy="${y}" rx="26" ry="8" fill="${c.a}"/>`;
    return coin(20) + coin(10) + coin(0) + (c.v === 1 ? coin(-10) : '') + `<polygon points="${starPts(0, c.v === 1 ? -10 : 0, 5, 2, 5)}" fill="${c.b}" stroke-width="1"/>`;
  } },
  mala: { r: 30, sym: true, zone: 'ground', vars: 2, draw(c) {
    let s = '';
    for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14; s += ring((24 * Math.cos(a)).toFixed(1), (-6 + 22 * Math.sin(a)).toFixed(1), 5, i % 2 ? c.a : c.b, 1.6); }
    return s + `<path d="M0 16 L0 28" stroke-width="2"/><path d="M0 28 Q-6 40 0 44 Q6 40 0 28 Z" fill="${c.v === 1 ? GOLD : c.a}" stroke-width="1.6"/>`;
  } },
  clockmoon: { r: 30, sym: true, zone: 'any', vars: 2, draw(c) {
    return ring(0, 0, 28, c.b) + ring(0, 0, 22, CREAM, 1.6)
         + [0, 90, 180, 270].map(a => `<circle cx="0" cy="-17" r="2" fill="${INK}" stroke="none" transform="rotate(${a})"/>`).join('')
         + (c.v === 1 ? '' : `<path d="M0 0 L0 -12 M0 0 L9 5" stroke-width="2.6"/>`)
         + (c.v === 1 ? `<path d="M0 0 L0 -12 M0 0 L-9 5" stroke="${c.a}" stroke-width="2.6"/>` + ring(0, 0, 3, c.a, 1.4) : ring(0, 0, 3, c.a, 1.4));
  } }
};

const MOTIF_NAMES = Object.keys(MOTIFS);

/* Draw one placed object: {m, x, y, s, r, f, a, b, v}. */
function drawObj(o) {
  const M = MOTIFS[o.m];
  if (!M) return '';
  const sx = (o.f ? -1 : 1) * o.s;
  return `<g transform="translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) rotate(${(o.r || 0).toFixed(1)}) scale(${sx.toFixed(3)} ${o.s.toFixed(3)})">${M.draw({ a: o.a, b: o.b, v: o.v || 0 })}</g>`;
}
