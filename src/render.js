/* ============================ picture rendering ============================ */

/* SVG for one picture of a level. side 'a' | 'b'. marks = targets already found. */
function pictureSVG(lvl, side, marks, prefix) {
  const scene = SCENES[lvl.bg];
  const objs = side === 'b' ? applyMuts(lvl.objs, lvl.muts) : lvl.objs;
  const p = (prefix || 'p') + side;
  let body = scene.draw(p);
  objs.forEach(o => { if (!o.gone) body += drawObj(o); });
  let ringMarks = '';
  (marks || []).forEach(t => {
    const x = (side === 'b' && t.x2 !== undefined) ? t.x2 : t.x, y = (side === 'b' && t.y2 !== undefined) ? t.y2 : t.y;
    ringMarks += `<circle class="found" cx="${x}" cy="${y}" r="${(t.r + 6).toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="4"/>`
               + `<circle cx="${x}" cy="${y}" r="${(t.r + 6).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  });
  const flip = side === 'b' && lvl.mirror ? ` transform="translate(${PIC_W} 0) scale(-1 1)"` : '';
  return `<svg class="pic" viewBox="0 0 ${PIC_W} ${PIC_H}" xmlns="http://www.w3.org/2000/svg" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" data-side="${side}">`
       + `<g${flip}>${body}${ringMarks}</g></svg>`;
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
