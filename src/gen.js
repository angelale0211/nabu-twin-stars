/* ============================ level generator ============================
   A level is: a scene, a list of placed objects (picture A), and a list of
   changes that turn A into picture B. The 100 campaign levels are baked once
   from LEVEL_PLAN (tools/bake.py writes src/levels.js) so they never change
   under a player's feet; the same generator makes the daily challenge from
   the date. Everything is seeded and deterministic.

   Level types
     diff    find the differences (the standard rule)
     mirror  same, but picture B is mirrored left-right
     same    bonus stage: almost everything changed, find what stayed the same */

function rng(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(R, arr) { return arr[Math.floor(R() * arr.length)]; }
function weighted(R, table) {
  let sum = 0; for (const k in table) sum += table[k];
  let x = R() * sum;
  for (const k in table) { x -= table[k]; if (x <= 0) return k; }
  return Object.keys(table)[0];
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function radius(o) { return (MOTIFS[o.m] ? MOTIFS[o.m].r : 28) * o.s; }
const NOROT = { pentacle: 1, mala: 1, sparkle: 1 };
const UNIQUE = { sun: 1, moon: 1, rainbow: 1, teapot: 1, cat: 1, owl: 1, rabbit: 1, crystalball: 1, dreamcatcher: 1 };

/* ------------------------------------------------------------ plan ---- */
/* Difficulty for level n (1..10) of chapter ch (1..10). */
function planFor(ch, n) {
  let type = 'diff';
  if (n === 5 || (n === 10 && ch % 2 === 0)) type = 'same';
  else if (n === 8 && ch >= 3) type = 'mirror';
  const late = n >= 6 ? 1 : 0, boss = n >= 9 ? 1 : 0;
  let find = Math.min(7, 3 + Math.floor((ch - 1) / 2) + late + boss);
  if (ch === 1) find = [3, 3, 4, 4, 3, 4, 5, 5, 5, 6][n - 1];
  if (type === 'same') find = Math.min(5, 3 + (ch >= 4 ? 1 : 0) + (n === 10 ? 1 : 0));
  let time = 0;
  if (ch >= 3) time = (ch <= 4 ? 150 : ch <= 6 ? 120 : ch <= 8 ? 105 : 90) - n * 3;
  if (type === 'same' && time) time += 30;
  let subtle = ch <= 2 ? 0 : ch <= 4 ? 1 : ch <= 7 ? 2 : 3;
  if (n === 4 || n >= 9) subtle = Math.min(3, subtle + 1);
  const count = Math.min(16, Math.round(6 + ch * 0.7 + n * 0.35 + (type === 'same' ? 1 : 0)));
  const smin = Math.max(0.6, 0.9 - ch * 0.03 - n * 0.01), smax = Math.max(0.9, 1.15 - ch * 0.025);
  return { ch, n, type, bg: CHAPTERS[ch - 1].bg, find, time, subtle, count, smin, smax, miss: time ? 6 : 8, mirror: type === 'mirror' };
}
function planDaily(dayIndex) {
  const R = rng(0xDA11 + dayIndex);
  const ch = 1 + Math.floor(R() * 10);
  const p = planFor(ch, 3 + Math.floor(R() * 6));
  p.type = R() < 0.25 ? 'same' : (R() < 0.3 ? 'mirror' : 'diff');
  p.mirror = p.type === 'mirror';
  p.find = p.type === 'same' ? 4 : Math.min(7, p.find + 1);
  p.time = p.type === 'same' ? 150 : 120;
  p.daily = true;
  return p;
}

/* -------------------------------------------------------- placing ---- */
function zonesFor(scene, motifZone) {
  let z = scene.zones.filter(q => q.z === motifZone);
  if (!z.length) z = scene.zones;
  return z;
}
function inside(zone, x, y, r) {
  return x - r >= zone.x - 12 && x + r <= zone.x + zone.w + 12 && y - r >= zone.y - 12 && y + r <= zone.y + zone.h + 12;
}
function overlaps(objs, cand, skip) {
  const rc = radius(cand);
  for (let i = 0; i < objs.length; i++) {
    if (i === skip || !objs[i]) continue;
    if (dist(objs[i], cand) < radius(objs[i]) + rc + 6) return true;
  }
  return false;
}
function companion(R, a) {
  const c = [GOLD, LILAC, CREAM, PINK, BLUE, PEACH, MINT].filter(x => x !== a);
  return pick(R, c);
}
function placeObjects(R, plan, scene) {
  const objs = [];
  const used = {};
  let tries = 0;
  while (objs.length < plan.count && tries < 400) {
    tries++;
    const m = pick(R, scene.pool);
    const M = MOTIFS[m];
    if (!M) continue;
    if ((used[m] || 0) >= (m === 'zodiac' ? 4 : UNIQUE[m] ? 1 : 2)) continue;
    const zone = pick(R, zonesFor(scene, M.zone));
    const s = plan.smin + R() * (plan.smax - plan.smin);
    const r = M.r * s;
    const a = pick(R, M.nocolor ? [CREAM] : SWATCH.filter(x => x !== CREAM || m === 'cloud'));
    const o = { m, x: 0, y: 0, s: +s.toFixed(3), r: 0, f: 0, a, b: companion(R, a), v: Math.floor(R() * M.vars) };
    let ok = false;
    for (let k = 0; k < 40 && !ok; k++) {
      o.x = Math.round(zone.x + r + R() * Math.max(1, zone.w - 2 * r));
      o.y = Math.round(zone.y + r + R() * Math.max(1, zone.h - 2 * r));
      if (inside(zone, o.x, o.y, r) && !overlaps(objs, o)) ok = true;
    }
    if (!ok) continue;
    if (!M.sym && R() < 0.35) o.f = 1;
    if (!NOROT[m] && R() < 0.3) o.r = Math.round((R() - 0.5) * 24);
    used[m] = (used[m] || 0) + 1;
    objs.push(o);
  }
  return objs;
}

/* ------------------------------------------------------- mutating ---- */
function farColor(R, a) {
  const near = NEAR[a] || [];
  return pick(R, SWATCH.filter(x => x !== a && near.indexOf(x) < 0 && x !== CREAM));
}
function nearColor(R, a) {
  const near = (NEAR[a] || []).filter(x => x !== a);
  return near.length ? pick(R, near) : farColor(R, a);
}
function weightsFor(subtle, strong) {
  if (strong) return { remove: 1, swap: 3, color: 3, variant: 2, scale: 2, flip: 2 };
  return [
    { remove: 3, swap: 3, color: 3, variant: 2, scale: 2, flip: 1 },
    { remove: 2, swap: 2, color: 3, variant: 3, scale: 2, flip: 2, rotate: 1, move: 1 },
    { remove: 1, swap: 1, color: 3, variant: 3, scale: 3, flip: 3, rotate: 2, move: 2 },
    { remove: 1, swap: 1, color: 3, variant: 3, scale: 3, flip: 3, rotate: 3, move: 3 }
  ][subtle];
}
/* Try to make one change to objs[i]; returns the mutation or null. */
function mutate(R, objs, i, scene, plan, kindCount, strong) {
  const o = objs[i], M = MOTIFS[o.m];
  const w = Object.assign({}, weightsFor(plan.subtle, strong));
  if (M.nocolor) delete w.color;
  if (M.vars < 2) delete w.variant;
  if (M.sym) delete w.flip;
  if (NOROT[o.m]) delete w.rotate;
  for (const k in w) if ((kindCount[k] || 0) >= (k === 'remove' ? 1 : 2) && !strong) delete w[k];
  for (let attempt = 0; attempt < 8; attempt++) {
    if (!Object.keys(w).length) return null;
    const k = weighted(R, w);
    if (k === 'color') return { i, k, a: plan.subtle >= 2 && !strong ? nearColor(R, o.a) : farColor(R, o.a) };
    if (k === 'variant') { let v = Math.floor(R() * M.vars); if (v === o.v) v = (v + 1) % M.vars; return { i, k, v }; }
    if (k === 'remove') return { i, k };
    if (k === 'flip') return { i, k };
    if (k === 'rotate') { const d = (plan.subtle >= 2 && !strong ? 22 : 38) * (R() < 0.5 ? -1 : 1); return { i, k, r: o.r + d }; }
    if (k === 'scale') {
      const up = R() < 0.5, f = plan.subtle >= 2 && !strong ? (up ? 1.25 : 0.78) : (up ? 1.4 : 0.66);
      const c = Object.assign({}, o, { s: +(o.s * f).toFixed(3) });
      const zone = zonesFor(scene, M.zone).find(z => inside(z, o.x, o.y, radius(o))) || scene.zones[0];
      if (c.s >= 0.5 && c.s <= 1.5 && inside(zone, c.x, c.y, radius(c)) && !overlaps(objs, c, i)) return { i, k, s: c.s };
      delete w.scale; continue;
    }
    if (k === 'move') {
      const zone = zonesFor(scene, M.zone).find(z => inside(z, o.x, o.y, radius(o))) || scene.zones[0];
      const d = plan.subtle >= 2 && !strong ? 26 : 44;
      let done = null;
      for (let t = 0; t < 24 && !done; t++) {
        const a = R() * Math.PI * 2, c = Object.assign({}, o, { x: Math.round(o.x + Math.cos(a) * d), y: Math.round(o.y + Math.sin(a) * d) });
        if (inside(zone, c.x, c.y, radius(c)) && !overlaps(objs, c, i)) done = { i, k, x: c.x, y: c.y };
      }
      if (done) return done;
      delete w.move; continue;
    }
    if (k === 'swap') {
      const cands = scene.pool.filter(n => n !== o.m && MOTIFS[n] && MOTIFS[n].zone === M.zone && Math.abs(MOTIFS[n].r - M.r) <= 8);
      if (!cands.length) { delete w.swap; continue; }
      const m = pick(R, cands);
      return { i, k, m, v: Math.floor(R() * MOTIFS[m].vars), f: MOTIFS[m].sym ? 0 : o.f };
    }
  }
  return null;
}
/* Picture B = A with the changes applied. */
function applyMuts(objs, muts) {
  const b = objs.map(o => Object.assign({}, o));
  muts.forEach(mu => {
    const o = b[mu.i]; if (!o) return;
    if (mu.k === 'remove') o.gone = 1;
    else if (mu.k === 'color') o.a = mu.a;
    else if (mu.k === 'variant') o.v = mu.v;
    else if (mu.k === 'flip') o.f = o.f ? 0 : 1;
    else if (mu.k === 'rotate') o.r = mu.r;
    else if (mu.k === 'scale') o.s = mu.s;
    else if (mu.k === 'move') { o.x = mu.x; o.y = mu.y; }
    else if (mu.k === 'swap') { o.m = mu.m; o.v = mu.v; o.f = mu.f; }
  });
  return b;
}

/* Choose the objects to hunt for: spread out, preferring big ones. */
function chooseTargets(R, objs, n) {
  const order = objs.map((o, i) => i).sort(() => R() - 0.5);
  const chosen = [];
  let minGap = 90;
  while (chosen.length < n && minGap >= 0) {
    for (const i of order) {
      if (chosen.length >= n) break;
      if (chosen.indexOf(i) >= 0) continue;
      if (chosen.every(j => dist(objs[i], objs[j]) >= minGap)) chosen.push(i);
    }
    minGap -= 15;
  }
  return chosen.sort((a, b) => a - b);
}

function genLevel(plan, seed) {
  const R = rng(seed);
  const scene = SCENES[plan.bg];
  const objs = placeObjects(R, plan, scene);
  const lvl = { ch: plan.ch, n: plan.n, type: plan.type, bg: plan.bg, time: plan.time, miss: plan.miss, objs, muts: [], find: 0, seed };
  if (plan.mirror) lvl.mirror = 1;
  if (plan.daily) lvl.daily = 1;
  const kindCount = {};
  if (plan.type === 'same') {
    const keep = chooseTargets(R, objs, Math.min(plan.find, Math.max(2, objs.length - 3)));
    lvl.keep = keep;
    objs.forEach((o, i) => {
      if (keep.indexOf(i) >= 0) return;
      const mu = mutate(R, objs, i, scene, plan, kindCount, true);
      if (mu) { lvl.muts.push(mu); kindCount[mu.k] = (kindCount[mu.k] || 0) + 1; }
      else { lvl.muts.push({ i, k: 'remove' }); }
    });
    lvl.find = keep.length;
  } else {
    const want = Math.min(plan.find, objs.length);
    const targets = chooseTargets(R, objs, Math.min(objs.length, want + 3));
    for (const i of targets) {
      if (lvl.muts.length >= want) break;
      const mu = mutate(R, objs, i, scene, plan, kindCount, false);
      if (mu) { lvl.muts.push(mu); kindCount[mu.k] = (kindCount[mu.k] || 0) + 1; }
    }
    lvl.find = lvl.muts.length;
  }
  lvl.par = lvl.find * 14 + 16;
  return lvl;
}

/* All hunt targets of a level as {i, x, y, r} (B position included for moves). */
function levelTargets(lvl) {
  if (lvl.targets) return lvl.targets.map(t => ({ i: t.i, x: t.x, y: t.y, r: t.r }));
  const idx = lvl.type === 'same' ? lvl.keep : lvl.muts.map(m => m.i);
  return idx.map(i => {
    const o = lvl.objs[i], mu = lvl.muts.find(m => m.i === i);
    const r = Math.max(20, radius(o));
    const t = { i, x: o.x, y: o.y, r };
    if (mu && mu.k === 'move') { t.x2 = mu.x; t.y2 = mu.y; }
    if (mu && mu.k === 'scale' && mu.s > o.s) t.r = Math.max(20, MOTIFS[o.m].r * mu.s);
    return t;
  });
}

const LEVEL_PLAN = [];
for (let ch = 1; ch <= 10; ch++) for (let n = 1; n <= 10; n++) LEVEL_PLAN.push(planFor(ch, n));

/* Seeds live here so a single level can be re-rolled without touching the others. */
const LEVEL_SEEDS = {};
function bakeAll() {
  return LEVEL_PLAN.map((p, i) => {
    const id = i + 1;
    const lvl = genLevel(p, LEVEL_SEEDS[id] || (7000 + id * 131));
    lvl.id = id;
    return lvl;
  });
}
function dailyLevel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayIndex = Math.floor(d.getTime() / 86400000);
  const pool = (typeof DAILY_POOL !== 'undefined' && DAILY_POOL.length) ? DAILY_POOL
             : (LEVELS.length && LEVELS[0].a ? LEVELS : null);
  if (pool) {
    const src = pool[((dayIndex % pool.length) + pool.length) % pool.length];
    const copy = JSON.parse(JSON.stringify(src)); copy.id = 'daily'; copy.date = dateStr; copy.daily = 1; return copy;
  }
  const lvl = genLevel(planDaily(dayIndex), 0xD0 + dayIndex * 7);
  lvl.id = 'daily'; lvl.date = dateStr;
  return lvl;
}
