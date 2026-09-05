/* ============================ picture rendering ============================
   Pictures are painted, not stickered: every flat motif colour becomes a soft
   radial gradient (light from the top-left), objects cast a soft shadow,
   luminous things glow, and the scene adds a vignette and a little grain. */

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt > 0 ? 255 : 0, a = Math.abs(amt);
  r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/* Objects with volume: gradient fills, drop shadow, glow. Returns {defs, body}. */
function richObjects(objs, p) {
  let body = '';
  const used = {};
  objs.forEach(o => {
    if (o.gone) return;
    const M = MOTIFS[o.m]; if (!M) return;
    let s = drawObj(o);
    s = s.replace(/fill="(#[0-9A-Fa-f]{6})"/g, (m, h) => { h = h.toUpperCase(); used[h] = 1; return `fill="url(#${p}c${h.slice(1)})"`; });
    const r = radius(o);
    const glow = M.glow ? `<circle cx="${o.x}" cy="${o.y}" r="${(r * 1.15).toFixed(1)}" fill="${M.glow}" opacity=".6" filter="url(#${p}glow)"/>` : '';
    body += glow + `<g filter="url(#${p}sh)">${s}</g>`;
  });
  let defs = `<filter id="${p}sh" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="1" dy="3.5" stdDeviation="2.4" flood-color="#2A1A50" flood-opacity=".38"/></filter>`
           + `<filter id="${p}glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10"/></filter>`;
  for (const h in used) {
    defs += `<radialGradient id="${p}c${h.slice(1)}" cx=".34" cy=".28" r=".9"><stop offset="0" stop-color="${shadeColor(h, .34)}"/><stop offset=".5" stop-color="${h}"/><stop offset="1" stop-color="${shadeColor(h, -.26)}"/></radialGradient>`;
  }
  return { defs, body };
}

function marksSVG(lvl, side, marks) {
  let s = '';
  (marks || []).forEach(t => {
    const x = (side === 'b' && t.x2 !== undefined) ? t.x2 : t.x, y = (side === 'b' && t.y2 !== undefined) ? t.y2 : t.y;
    s += `<circle cx="${x}" cy="${y}" r="${(t.r + 8).toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="7" opacity=".45"/>`
       + `<circle class="found" cx="${x}" cy="${y}" r="${(t.r + 6).toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="3.5"/>`
       + `<circle cx="${x}" cy="${y}" r="${(t.r + 6).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  });
  return s;
}

/* SVG for one picture of a level. side 'a' | 'b'. marks = targets already found. */
function pictureSVG(lvl, side, marks, prefix) {
  const scene = SCENES[lvl.bg];
  const objs = side === 'b' ? applyMuts(lvl.objs, lvl.muts) : lvl.objs;
  const p = (prefix || 'p') + side;
  const rich = richObjects(objs, p);
  const body = scene.draw(p) + `<defs>${rich.defs}</defs>` + rich.body + sceneFinish(p);
  const flip = side === 'b' && lvl.mirror ? ` transform="translate(${PIC_W} 0) scale(-1 1)"` : '';
  return `<svg class="pic" viewBox="0 0 ${PIC_W} ${PIC_H}" xmlns="http://www.w3.org/2000/svg" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" data-side="${side}">`
       + `<g${flip}>${body}<g class="marks">${marksSVG(lvl, side, marks)}</g></g></svg>`;
}

/* Update only the found-rings of an already drawn picture. */
function refreshMarks(svg, lvl, side, marks) {
  const g = svg.querySelector('g.marks');
  if (g) g.innerHTML = marksSVG(lvl, side, marks);
}

/* Convert a tap on the <svg> element to picture coordinates (mirror undone). */
function tapToPic(svg, lvl, clientX, clientY) {
  const box = svg.getBoundingClientRect();
  let x = (clientX - box.left) / box.width * PIC_W, y = (clientY - box.top) / box.height * PIC_H;
  if (svg.dataset.side === 'b' && lvl.mirror) x = PIC_W - x;
  return { x, y };
}

/* Which unfound target was tapped? Nearest within its hit circle, or null. */
function hitTarget(targets, foundIdx, pt) {
  let best = null, bestD = 1e9;
  targets.forEach(t => {
    if (foundIdx.indexOf(t.i) >= 0) return;
    let d = Math.hypot(pt.x - t.x, pt.y - t.y);
    if (t.x2 !== undefined) d = Math.min(d, Math.hypot(pt.x - t.x2, pt.y - t.y2));
    if (d <= t.r + 10 && d < bestD) { best = t; bestD = d; }
  });
  return best;
}
