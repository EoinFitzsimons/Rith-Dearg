/* Rith Dearg — level themes and level construction (20 procedural runs plus 5 handcrafted stages). */

/* Palettes for each backdrop family, keyed by time of day. */
const PALETTES = {
  forest: {
    day: { sky: ['#6fb3e8', '#cfe6f5', '#9fd0a0'], far: '#5f8f78', far2: '#4c7a62', mid: '#2f5a3a', midLeaf: '#3f7a48', near: '#1f3d26', nearLeaf: '#2d5a34', ground: '#5a4a32', tile: 'turf' },
    night: { sky: ['#0a1020', '#1c2a46', '#2a3a40'], far: '#1b2b2e', far2: '#15232a', mid: '#0f1d18', midLeaf: '#163024', near: '#08120c', nearLeaf: '#102416', ground: '#3b3328', tile: 'turf' },
  },
  cliffs: {
    day: { sky: ['#5ea4e0', '#d2e8f6', '#9fc4dc'], seaCol: '#2d6f9a', seaLight: 'rgba(255,255,255,0.45)', far: '#6d8aa3', mid: '#5b6069', strata: '#453c38', near: '#3f6a3a', ground: '#5d6066', tile: 'stone', tower: true },
    dusk: { sky: ['#2b2f5c', '#e07a4f', '#f0b070'], seaCol: '#36405f', seaLight: 'rgba(255,190,120,0.5)', far: '#4a4a66', mid: '#3a3844', strata: '#262128', near: '#2d4a2c', ground: '#4a4650', tile: 'stone', tower: false },
  },
  causeway: {
    dusk: { sky: ['#1b2440', '#d26a4a', '#f2a65a'], seaCol: '#243a55', seaLight: 'rgba(255,200,140,0.5)', far: '#3a4256', mid: '#30363f', midTop: '#5a616b', near: '#1f2329', nearTop: '#44494f', ground: '#3f4752', tile: 'basalt' },
  },
  burren: {
    day: { sky: ['#78b5e5', '#dbeaf4', '#c9d4d6'], far: '#8a9ea8', seaLight: 'rgba(255,255,255,0.6)', mid: '#9ea7a9', gryke: '#5b6466', near: '#8b9496', nearTop: '#b4bcbe', ground: '#9aa3a5', tile: 'limestone' },
    dusk: { sky: ['#3a3a66', '#d98a5a', '#c0a088'], far: '#6a6a7a', seaLight: 'rgba(255,200,150,0.5)', mid: '#8a8690', gryke: '#4a4650', near: '#6f6a72', nearTop: '#9a949c', ground: '#8a8690', tile: 'limestone' },
  },
  mountains: {
    day: { sky: ['#5f9fd8', '#cfe3f2', '#a9c6b8'], far: '#7d94b0', far2: '#5e7898', mid: '#4a6a58', near: '#3a5a3c', heather: '#7a4f7a', ground: '#5a6a4a', tile: 'turf' },
    dusk: { sky: ['#2c2f55', '#e68a5a', '#c9a07a'], far: '#5c5478', far2: '#44405f', mid: '#3c4a44', near: '#2c3a2c', heather: '#6a3f6a', ground: '#4a5a3a', tile: 'turf' },
  },
  island: {
    day: { sky: ['#4f98d8', '#c7e2f4', '#8fb8d0'], seaCol: '#245f8a', seaLight: 'rgba(255,255,255,0.45)', far: '#58708a', mid: '#4a5a62', steps: '#8a949c', hut: '#6a7076', near: '#2f3a42', ground: '#525c64', tile: 'stone' },
    dusk: { sky: ['#232a55', '#df7a55', '#eeb078'], seaCol: '#2f3a5a', seaLight: 'rgba(255,180,120,0.5)', far: '#45485f', mid: '#363a44', steps: '#6a6f78', hut: '#50545c', near: '#232630', ground: '#44484f', tile: 'stone' },
  },
  tomb: {
    night: { sky: ['#05070f', '#1a1f3a', '#2c2540'], far: '#1a1d2c', mid: '#3d4a3a', near: '#1b2a1a', grass: '#2f4a2c', ground: '#4a3f52', tile: 'stone' },
  },
  bog: {
    dusk: { sky: ['#3a3f6a', '#e3935f', '#d6b08a'], far: '#5a5a78', far2: '#48506a', mid: '#5a5a3a', midDark: '#2f2a1e', seaLight: 'rgba(255,200,150,0.45)', near: '#3f3a22', grass: '#7a7a3a', ground: '#4a4030', tile: 'turf' },
  },
  glen: {
    day: { sky: ['#64a9e0', '#d5e8f3', '#a7c8b4'], far: '#4e7a5e', far2: '#345a44', lake: '#2e5f7a', seaLight: 'rgba(255,255,255,0.5)', near: '#2a4a2e', reed: '#6a8a3a', nearLeaf: '#3f7a48', ground: '#4e5a3a', tile: 'turf', roundTower: true },
    dusk: { sky: ['#2a2d5a', '#e5885c', '#d7ad84'], far: '#3f4a55', far2: '#2d3a40', lake: '#2a3b5a', seaLight: 'rgba(255,190,130,0.5)', near: '#1f2d22', reed: '#5a6a30', nearLeaf: '#2f4a34', ground: '#4a4a3a', tile: 'jetty', roundTower: false },
  },
  castle: {
    dusk: { sky: ['#2a2550', '#d8744f', '#eab07a'], seaCol: '#2c3858', seaLight: 'rgba(255,180,120,0.5)', mid: '#3f4248', ruin: '#5a5e68', near: '#2d4a2c', ground: '#55565c', tile: 'stone' },
  },
  city: {
    night: { sky: ['#070a18', '#1a2545', '#2a3550'], far: '#1c2232', mid: '#262c3a', lake: '#101a2c', near: '#2a2f3a', ground: '#3a3f4a', tile: 'rooftop' },
    dusk: { sky: ['#1e1f4a', '#e07a52', '#f5b36b'], far: '#2b2a40', mid: '#30303f', lake: '#2a2f4a', near: '#2a2a35', ground: '#3a3a45', tile: 'rooftop' },
  },
};

function theme(name, backdrop, time, extra = {}) {
  const pal = PALETTES[backdrop][time] || Object.values(PALETTES[backdrop])[0];
  return Object.assign({ name, backdrop, time }, pal, extra);
}

const LEVEL_THEMES = [
  theme('Killarney Forest', 'forest', 'day'),
  theme('Cliffs of Moher', 'cliffs', 'day'),
  theme('Giant’s Causeway', 'causeway', 'dusk'),
  theme('The Burren', 'burren', 'day'),
  theme('Wicklow Mountains', 'mountains', 'day'),
  theme('Skellig Michael', 'island', 'day'),
  theme('Newgrange', 'tomb', 'night'),
  theme('Connemara Bog', 'bog', 'dusk'),
  theme('Aran Islands', 'burren', 'dusk'),
  theme('Glendalough', 'glen', 'day'),
  theme('Benbulben', 'mountains', 'dusk', { tabletop: true }),
  theme('Dunluce Castle', 'castle', 'dusk'),
  theme('Slieve League', 'cliffs', 'dusk'),
  theme('Dark Hedges', 'forest', 'night'),
  theme('Dingle Peninsula', 'cliffs', 'day', { tower: false }),
  theme('Achill Island', 'island', 'dusk'),
  theme('Glenveagh', 'glen', 'day', { roundTower: false }),
  theme('Carrauntoohil', 'mountains', 'day'),
  theme('Phoenix Park', 'forest', 'day'),
  theme('Dublin Docklands', 'city', 'night'),
  /* handcrafted stages */
  theme('Lough Tay', 'glen', 'dusk'),
  theme('Burren Winds', 'burren', 'dusk'),
  theme('Moher Ledges', 'cliffs', 'day'),
  theme('Glendalough Lakes', 'glen', 'day'),
  theme('Dublin Skyline', 'city', 'dusk'),
];

/* Short descriptions for the level-select screen. */
const LEVEL_NOTES = {
  20: 'Swim the lake, mind your breath and the merrows.',
  21: 'Gusts sweep the limestone; lean into the wind.',
  22: 'Ride drifting ledges above the Atlantic.',
  23: 'Lakes, lifts and a gale through the glen.',
  24: 'The Dullahan waits on the rooftops. Defeat it to open the gate.',
};

/* ---------- jump reach ----------
 * Measured in headless Chrome by running the real physics (jumpVel 780, gravity 2200, air speed 240):
 * the widest gap the squirrel clears with a held jump and a run-up, for a given rise to the landing ledge.
 * Negative rise is a drop. Layouts use a fraction of these so every leap has margin. */
const JUMP_REACH = [[-160, 196], [-120, 192], [-60, 180], [0, 160], [40, 148], [60, 140], [80, 136], [100, 124], [120, 108], [130, 0]];
function maxGap(rise) {
  if (rise <= JUMP_REACH[0][0]) return JUMP_REACH[0][1];
  for (let i = 1; i < JUMP_REACH.length; i++) {
    const [r0, g0] = JUMP_REACH[i - 1], [r1, g1] = JUMP_REACH[i];
    if (rise <= r1) return Math.round(lerp(g0, g1, (rise - r0) / (r1 - r0)));
  }
  return 0;
}
/* A comfortable gap for a given rise: 55 % of the maximum on level 1, 80 % on level 20. */
function designGap(rise, d, scale = 1) { return Math.round(maxGap(rise) * (0.55 + 0.25 * d) * scale); }

function emptyLevel(index, width) {
  return {
    index, theme: LEVEL_THEMES[index], width, platforms: [], movers: [], hazards: [], water: [], windZones: [],
    checkpoints: [], enemies: [], acorns: [], powerups: [], goalX: width - 200, goalY: 420, boss: null, gravity: GRAVITY,
    start: { x: 60, y: 300 },
  };
}
function addAcornArc(level, x, y, n = 3, spread = 26) {
  for (let i = 0; i < n; i++) level.acorns.push({ x: x + i * spread, y: y - Math.sin((i / (n - 1 || 1)) * Math.PI) * 24 });
}
/* Acorns traced along the jump between two ledges so the arc shows the player the leap. */
function acornsOverGap(level, fromX, fromY, toX, toY, n = 3) {
  const apex = Math.min(fromY, toY) - 72;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1), x = lerp(fromX, toX, t);
    const y = lerp(fromY, toY, t) - 48 - Math.sin(t * Math.PI) * (lerp(fromY, toY, t) - 48 - apex);
    level.acorns.push({ x, y });
  }
}
function checkpointOn(level, p, at = 0.5) {
  const x = p.x + p.w * at;
  if (level.checkpoints.some(c => Math.abs(c.x - x) < 400)) return;
  level.checkpoints.push({ x, y: p.y });
}
/* Enemies stand in the far half of a ledge so they are on screen before the squirrel lands. */
function groundEnemy(level, type, p, at = 0.65) { level.enemies.push({ type, x: p.x + p.w * at - 18, y: p.y - 40 }); }
function flyingEnemy(level, type, x, y) { level.enemies.push({ type, x, y }); }
function spikesOn(level, p, at, w = 50) { const h = Rect(Math.round(p.x + p.w * at - w / 2), p.y - 14, w, 14); level.hazards.push(h); return h; }
function powerUpAt(level, kind, x, y) { level.powerups.push({ kind, x: x - 12, y: y - 30 }); }
/* A moving ledge that shuttles between two left-edge positions. */
/* Mover speeds are capped so a platform never outruns the squirrel's air speed (peak velocity = range × speed). */
function shuttle(level, x0, x1, y, w = 120, speed = 1.2, phase = 0) {
  const range = (x1 - x0) / 2;
  const m = { x: (x0 + x1) / 2, y, w, h: 20, axis: 'x', range, speed: Math.min(speed, 100 / range), phase };
  level.movers.push(m); return m;
}
function lift(level, x, y0, y1, w = 110, speed = 1.2, phase = 0) {
  const range = (y1 - y0) / 2;
  const m = { x, y: (y0 + y1) / 2, w, h: 20, axis: 'y', range, speed: Math.min(speed, 110 / range), phase };
  level.movers.push(m); return m;
}

/* ---------- procedural levels 1–20 ----------
 * Each level is a chain of layout patterns (runs, gap sequences, staircases, hazard runs, moving-ledge
 * bridges, vertical climbs, lifts and an optional high road) parameterised by a difficulty d in 0..1.
 * Every gap is taken from the measured jump table; hard patterns are preceded by a cairn (checkpoint). */
const Y_HIGH = 200, Y_LOW = 440;
function genProceduralLevel(index) {
  const rand = rng(1000 + index * 77);
  const d = index / 19;
  const L = emptyLevel(index, 0);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + rand() * (b - a);
  const groundPool = index < 4 ? ['puca'] : index < 8 ? ['puca', 'cusidhe'] : ['puca', 'cusidhe', 'golem'];
  const flyPool = index < 2 ? [] : index < 6 ? ['raven'] : index < 12 ? ['raven', 'wisp'] : ['raven', 'wisp', 'banshee'];
  let cx = 0, cy = 420, last = null, sinceCP = 0, segments = 0;
  const plat = (x, y, w, h = 30) => { const p = Rect(Math.round(x), Math.round(y), Math.round(w), h); L.platforms.push(p); last = p; cx = p.x + p.w; cy = p.y; sinceCP += p.w; return p; };
  const cairn = () => { if (last && sinceCP > 500) { checkpointOn(L, last, 0.5); sinceCP = 0; } };
  /* y drifts back toward the middle band so no pattern can run out of head room */
  const stepY = () => { if (cy <= 260) return 60; if (cy >= 400) return -60; return pick([-60, 0, 0, 60]); };

  /* start: a safe, wide ledge */
  plat(0, 420, 320);
  if (index > 0) addAcornArc(L, 150, 360, 3);

  const patterns = {
    run() {
      const rise = -stepY(); const w = between(220, 340);
      const p = plat(cx + designGap(rise, d, between(0.7, 1)), cy - rise, w);
      if (rand() < 0.5 + 0.4 * d) groundEnemy(L, pick(groundPool), p, between(0.55, 0.8));
      if (flyPool.length && rand() < 0.15 + 0.35 * d) flyingEnemy(L, pick(flyPool), p.x + p.w * 0.5, p.y - 150);
      if (index >= 3 && w >= 320 && rand() < 0.3 + 0.3 * d) { const h = spikesOn(L, p, 0.42, 46 + 16 * d); addAcornArc(L, h.x - 10, p.y - 70, 3, (h.w + 20) / 2); }
      else addAcornArc(L, p.x + 40, p.y - 56, 3);
    },
    gaps() {
      const n = 2 + Math.floor(rand() * 2) + (d > 0.5 ? 1 : 0);
      let rise = 0;
      for (let i = 0; i < n; i++) {
        rise = i === 0 ? -stepY() : pick([0, 0, 40, -40]);
        if (cy - rise < Y_HIGH) rise = 0; if (cy - rise > Y_LOW) rise = 0;
        const fromX = cx, fromY = cy, gap = designGap(rise, d);
        const p = plat(cx + gap, cy - rise, between(150 - 30 * d, 200));
        acornsOverGap(L, fromX, fromY, p.x, p.y);
        if (index >= 14 && i === 1 && rand() < 0.5) flyingEnemy(L, 'wisp', fromX + gap / 2 - 18, Math.min(fromY, p.y) - 190);
      }
      if (index >= 2 && rand() < 0.3 + 0.3 * d) groundEnemy(L, pick(groundPool), last, 0.7);
    },
    stairUp() {
      const rise = 50 + Math.round(20 * d), steps = clamp(Math.floor((cy - Y_HIGH) / rise), 2, 4);
      for (let i = 0; i < steps; i++) plat(cx + designGap(rise, d, 0.9), cy - rise, between(110, 140));
      const top = plat(cx + designGap(0, d, 0.8), cy, between(200, 240));
      addAcornArc(L, top.x + 30, top.y - 56, 4, 30);
      if (flyPool.length && rand() < 0.3 + 0.3 * d) flyingEnemy(L, pick(flyPool), top.x + top.w * 0.5, top.y - 150);
    },
    stairDown() {
      const drop = 60 + Math.round(30 * d), steps = clamp(Math.floor((Y_LOW - cy) / drop), 2, 4);
      for (let i = 0; i < steps; i++) plat(cx + designGap(-drop, d, 0.85), cy + drop, between(110, 140));
      const base = plat(cx + designGap(0, d, 0.8), cy, between(220, 260));
      if (index >= 1 && rand() < 0.5 + 0.3 * d) groundEnemy(L, pick(groundPool), base, 0.7);
      addAcornArc(L, base.x + 30, base.y - 56, 3);
    },
    hazardRun() {
      cairn();
      const rise = -stepY(), w = between(420, 480);
      const p = plat(cx + designGap(rise, d, 0.8), cy - rise, w);
      const n = d < 0.4 ? 2 : 3;
      /* spikes sit in the first half of the ledge so a hop over the last one always lands with room to spare */
      for (let i = 0; i < n; i++) { const h = spikesOn(L, p, 0.2 + i * 0.16, 46 + 18 * d); addAcornArc(L, h.x - 8, p.y - 72, 3, (h.w + 16) / 2); }
      if (index >= 10 && rand() < 0.5) flyingEnemy(L, 'wisp', p.x + p.w * 0.5, p.y - 160);
    },
    bridge() {
      cairn();
      const w = 120, travel = 160 + Math.round(120 * d), entry = designGap(0, d, 0.5), exit = designGap(0, d, 0.5);
      const m = shuttle(L, cx + entry, cx + entry + travel, cy, w, between(1.0, 1.3 + 0.3 * d), rand() * 6);
      addAcornArc(L, m.x - 20, cy - 80, 3, 30);
      const far = plat(cx + entry + travel + w + exit, cy, between(220, 260));
      if (flyPool.length && rand() < 0.2 + 0.3 * d) flyingEnemy(L, 'raven', far.x + 40, far.y - 160);
      if (index >= 9 && rand() < 0.4) { const h = spikesOn(L, far, 0.35, 46); addAcornArc(L, h.x - 8, far.y - 72, 3, 32); }
    },
    climb() {
      /* a steep vertical climb: tall narrow footholds at a near-maximum rise, then a resting top with a health restore */
      cairn();
      const rise = 100, steps = clamp(Math.floor((cy - Y_HIGH) / rise), 2, 3), fw = 90 + Math.round(20 * (1 - d));
      for (let i = 0; i < steps; i++) { const p = plat(cx + designGap(rise, d, 0.8), cy - rise, fw); addAcornArc(L, p.x + fw / 2, p.y - 50, 1, 0); }
      const top = plat(cx + designGap(0, d, 0.6), cy, between(200, 240));
      powerUpAt(L, 'Health Restore', top.x + top.w / 2, top.y);
      addAcornArc(L, top.x + 40, top.y - 56, 3);
      if (index >= 6) flyingEnemy(L, 'wisp', top.x + top.w + 60, top.y + 40);
    },
    liftUp() {
      cairn();
      const top = cy - 140, m = lift(L, cx + 50, top, cy, 110, between(1.0, 1.4), 0);
      addAcornArc(L, m.x + 55 - 30, top - 40, 3, 30);
      const far = plat(m.x + m.w + designGap(0, d, 0.5), top + 10, between(220, 260));
      if (index >= 2 && rand() < 0.5) groundEnemy(L, pick(groundPool), far, 0.7);
    },
    highRoad() {
      const low = plat(cx + designGap(0, d, 0.7), cy, 440 + 60 * d);
      groundEnemy(L, pick(groundPool), low, 0.4); groundEnemy(L, pick(groundPool), low, 0.8);
      /* the high road: three small ledges 100 px up, entered from the ledge before the low road */
      const hy = low.y - 100, hw = 100, gap = designGap(0, d, 0.9);
      const highs = [];
      let hx = low.x + 30;
      for (let i = 0; i < 3; i++) { const h = Rect(hx, hy, hw, 22); L.platforms.push(h); highs.push(h); addAcornArc(L, h.x + 10, h.y - 50, 3, 40); hx += hw + gap; }
      powerUpAt(L, index >= 12 ? 'Extra Life' : 'Score Multiplier', highs[2].x + hw / 2, hy);
      cx = low.x + low.w; cy = low.y; last = low;
    },
  };

  const available = () => {
    const list = ['run', 'gaps', 'stairUp', 'stairDown'];
    if (index >= 3) list.push('hazardRun');
    if (index >= 5) list.push('bridge');
    if (index >= 8) list.push('climb', 'highRoad');
    if (index >= 11) list.push('liftUp');
    return list.filter(n => !(n === 'stairUp' && cy < 340) && !(n === 'climb' && cy < 410) && !(n === 'liftUp' && cy < 380) && !(n === 'highRoad' && cy < 340) && !(n === 'stairDown' && cy > 300));
  };
  const total = 6 + Math.floor(index / 4), hard = new Set(['hazardRun', 'bridge', 'climb', 'liftUp']);
  let prev = 'run', prevHard = false;
  while (segments < total) {
    let name;
    if (prevHard) name = available().includes('stairDown') && cy < 320 ? 'stairDown' : 'run';
    else { const opts = available().filter(n => n !== prev); name = pick(opts); }
    patterns[name]();
    prevHard = hard.has(name); prev = name; segments++;
    if (sinceCP > 1300) cairn();
    if (index >= 6 && segments === Math.floor(total / 2)) powerUpAt(L, 'Health Restore', last.x + last.w - 40, last.y);
  }
  /* finish: come down to a calm, wide ledge with the gateway */
  while (cy < 380) plat(cx + designGap(-60, d, 0.8), cy + 60, 140);
  const end = plat(cx + designGap(0, d, 0.8), cy, 360);
  addAcornArc(L, end.x + 40, end.y - 56, 3);
  L.width = end.x + end.w; L.goalX = end.x + end.w - 120; L.goalY = end.y;
  /* every stage meets at least one foe on open ground so the tail swipe is taught early */
  if (L.enemies.length < 2) {
    const wide = L.platforms.filter(p => p.x > 400 && p.w >= 200 && p.x + p.w < L.goalX - 200).sort((a, b) => b.w - a.w);
    for (const p of wide.slice(0, 2 - L.enemies.length)) groundEnemy(L, 'puca', p, 0.65);
  }
  return L;
}

/* ---------- handcrafted stages 21–25 ---------- */
function buildLoughTay() {
  const L = emptyLevel(20, 4600);
  const S = 440; /* water surface */
  L.water.push(Rect(0, S, L.width, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 400, 240, 30));                      /* shore */
  /* jetties in three jumpable groups separated by swims; every swim ends at a jetty you can climb */
  const jetties = [[340, 400, 160], [600, 400, 140], [1000, 400, 200], [1300, 360, 140], [1520, 400, 160], [1760, 340, 120], [1960, 400, 220], [2600, 400, 180], [2880, 380, 140], [3100, 400, 160], [3340, 340, 120], [3540, 400, 200], [4160, 400, 440]];
  for (const [x, y, w] of jetties) L.platforms.push(Rect(x, y, w, 22));
  L.platforms.push(Rect(0, 524, L.width, 16)); L.platforms[L.platforms.length - 1].tile = 'sand';
  for (const [x, y, w] of jetties) if (w >= 160) addAcornArc(L, x + 20, y - 50, 3, 30);
  addAcornArc(L, 1780, 290, 3, 30); addAcornArc(L, 3360, 290, 3, 30);
  for (const x of [820, 2400, 4000]) addAcornArc(L, x, 500, 3, 30); /* underwater acorns reward a dive */
  for (const x of [850, 2300, 2480, 3950]) L.enemies.push({ type: 'merrow', x, y: 470 });
  for (const x of [1400, 3200]) L.enemies.push({ type: 'raven', x, y: 220 });
  L.enemies.push({ type: 'puca', x: 4400, y: 360 });
  powerUpAt(L, 'Health Restore', 2060, 400);
  for (const i of [3, 7, 8, 12]) checkpointOn(L, L.platforms[i]);
  L.goalX = 4480; L.goalY = 400;
  return L;
}
function buildBurrenWinds() {
  const L = emptyLevel(21, 4800);
  /* tailwinds carry you over wide gaps; headwinds shorten every leap, so those stretches use short hops */
  const plats = [[0, 420, 240], [320, 420, 200], [640, 400, 160], [920, 380, 160], [1150, 420, 200], [1460, 420, 260],
    [1770, 400, 180], [2000, 380, 160], [2210, 360, 200], [2460, 400, 180], [2690, 420, 260],
    [3050, 380, 160], [3290, 320, 140], [3510, 400, 220], [3860, 400, 160], [4140, 380, 160], [4390, 400, 410]];
  for (const [x, y, w] of plats) L.platforms.push(Rect(x, y, w, 28));
  L.windZones.push({ x: 520, w: 1000, force: 150 }, { x: 1720, w: 1000, force: -130 }, { x: 3700, w: 800, force: 170 });
  L.hazards.push(Rect(1580, 406, 50, 14), Rect(2300, 346, 44, 14), Rect(4560, 386, 50, 14));
  L.enemies.push({ type: 'puca', x: 740, y: 360 }, { type: 'banshee', x: 1100, y: 240 }, { type: 'golem', x: 2350, y: 320 }, { type: 'banshee', x: 3300, y: 200 }, { type: 'cusidhe', x: 4650, y: 360 });
  for (const [x, y, w] of plats) if (w >= 200) addAcornArc(L, x + 30, y - 56, 3);
  acornsOverGap(L, 520, 420, 640, 400); acornsOverGap(L, 3730, 400, 3860, 400); acornsOverGap(L, 4300, 380, 4390, 400);
  addAcornArc(L, 3310, 260, 4, 30);
  powerUpAt(L, 'Shield', 2770, 420);
  for (const i of [5, 10, 13]) checkpointOn(L, L.platforms[i]);
  L.goalX = 4700; L.goalY = 400;
  return L;
}
function buildMoherLedges() {
  const L = emptyLevel(22, 4800);
  const S = 470;
  L.water.push(Rect(0, S, L.width, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 400, 240, 30), Rect(0, 524, L.width, 16));
  L.platforms[1].tile = 'sand';
  /* every ledge after a bridge has a low rock on its left so a fall into the sea is a swim, not a dead end */
  const ledges = [[620, 400, 200], [1040, 320, 160], [1280, 380, 140], [1500, 400, 220], [2160, 400, 180], [2720, 380, 160], [2960, 400, 200], [3680, 400, 180], [3940, 360, 140], [4160, 400, 640]];
  for (const [x, y, w] of ledges) L.platforms.push(Rect(x, y, w, 28));
  for (const x of [560, 2100, 2660, 3620]) L.platforms.push(Rect(x, 440, 60, 30));
  shuttle(L, 290, 450, 400, 120, 1.2, 0);
  lift(L, 880, 320, 440, 100, 1.1, 0);
  shuttle(L, 1770, 1990, 400, 120, 1.0, 1);
  shuttle(L, 2390, 2550, 380, 120, 1.3, 2);
  shuttle(L, 3210, 3510, 400, 120, 1.5, 0);
  L.enemies.push({ type: 'banshee', x: 1600, y: 260 }, { type: 'merrow', x: 1900, y: 500 }, { type: 'raven', x: 3000, y: 220 }, { type: 'merrow', x: 3400, y: 500 }, { type: 'golem', x: 4500, y: 350 });
  for (const [x, y, w] of ledges) if (w >= 160) addAcornArc(L, x + 20, y - 54, 3, 30);
  addAcornArc(L, 340, 320, 3, 30); addAcornArc(L, 1850, 320, 3, 30); addAcornArc(L, 2440, 300, 3, 30); addAcornArc(L, 3330, 320, 3, 30);
  addAcornArc(L, 1200, 500, 3, 30); addAcornArc(L, 3400, 500, 3, 30);
  powerUpAt(L, 'Health Restore', 3060, 400);
  for (const i of [2, 5, 8, 11]) checkpointOn(L, L.platforms[i]);
  L.goalX = 4680; L.goalY = 400;
  return L;
}
function buildGlendaloughLakes() {
  const L = emptyLevel(23, 5200);
  const S = 450;
  L.water.push(Rect(620, S, 1000, VIRTUAL_H - S), Rect(3300, S, 1130, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 420, 620, 30), Rect(620, 524, 1000, 16), Rect(3300, 524, 1130, 16));
  L.platforms[1].tile = 'sand'; L.platforms[2].tile = 'sand';
  const plats = [[760, 400, 140], [1170, 330, 140], [1390, 400, 200], [1620, 420, 500], [2200, 360, 180], [2460, 300, 160], [2700, 360, 200], [2990, 420, 220], [3330, 400, 140], [3800, 330, 150], [4230, 400, 200], [4430, 420, 770]];
  for (const [x, y, w] of plats) L.platforms.push(Rect(x, y, w, 28));
  lift(L, 980, 320, 440, 110, 1.2, 0);
  shuttle(L, 3480, 3640, 380, 110, 1.1, 1);
  lift(L, 4040, 270, 450, 100, 1.3, 0);
  L.windZones.push({ x: 2100, w: 1200, force: 150 });
  L.hazards.push(Rect(1800, 406, 60, 14), Rect(3080, 406, 50, 14), Rect(4700, 406, 60, 14));
  L.enemies.push({ type: 'cusidhe', x: 400, y: 380 }, { type: 'merrow', x: 1000, y: 480 }, { type: 'golem', x: 1950, y: 380 }, { type: 'raven', x: 2300, y: 220 }, { type: 'banshee', x: 2600, y: 200 }, { type: 'merrow', x: 3450, y: 480 }, { type: 'merrow', x: 4100, y: 480 }, { type: 'cusidhe', x: 4900, y: 380 }, { type: 'banshee', x: 5000, y: 300 });
  for (const [x, y, w] of plats) if (w >= 150) addAcornArc(L, x + 24, y - 54, 3);
  acornsOverGap(L, 2120, 420, 2200, 360); acornsOverGap(L, 2380, 360, 2460, 300);
  addAcornArc(L, 1200, 500, 3, 30); addAcornArc(L, 3800, 500, 3, 30);
  powerUpAt(L, 'Health Restore', 3060, 420); powerUpAt(L, 'Shield', 1700, 420);
  for (const i of [6, 10, 14]) checkpointOn(L, L.platforms[i]);
  L.goalX = 5080; L.goalY = 420;
  return L;
}
function buildDublinSkyline() {
  const L = emptyLevel(24, 5000);
  const roofs = [[0, 420, 300], [400, 380, 200], [700, 320, 180], [980, 400, 260], [1560, 340, 200], [1860, 420, 220], [2100, 360, 200], [2400, 300, 180], [2880, 380, 240], [3200, 400, 130]];
  for (const [x, y, w] of roofs) L.platforms.push(Rect(x, y, w, 30));
  shuttle(L, 1260, 1380, 380, 100, 1.3, 0);
  lift(L, 2680, 240, 400, 100, 1.2, 1);
  L.hazards.push(Rect(1100, 386, 50, 14), Rect(2960, 366, 50, 14));
  L.enemies.push({ type: 'raven', x: 600, y: 220 }, { type: 'puca', x: 1180, y: 360 }, { type: 'banshee', x: 1700, y: 200 }, { type: 'golem', x: 2200, y: 320 }, { type: 'cusidhe', x: 3020, y: 340 });
  for (const [x, y, w] of roofs) if (w >= 200) addAcornArc(L, x + 30, y - 54, 3);
  acornsOverGap(L, 300, 420, 400, 380); acornsOverGap(L, 580, 380, 700, 320);
  powerUpAt(L, 'Health Restore', 3265, 400);
  /* the arena: a long rooftop walled at both ends */
  const AX = 3400, AW = 1200;
  L.platforms.push(Rect(AX, 420, AW, 30));
  /* a low lip on the way in; the far wall is full height */
  L.platforms.push(Rect(AX - 40, 350, 40, 70), Rect(AX + AW, 240, 40, 180));
  L.platforms.push(Rect(AX + 300, 320, 140, 22), Rect(AX + 760, 320, 140, 22));
  L.arena = Rect(AX, 0, AW, VIRTUAL_H);
  L.boss = { x: AX + AW - 300, y: 330 };
  for (const i of [3, 5, 8]) checkpointOn(L, L.platforms[i]);
  L.checkpoints.push({ x: AX + 80, y: 420 });
  L.goalX = AX + AW - 110; L.goalY = 420; L.goalLocked = true;
  return L;
}

function genLevel(index) {
  let level;
  switch (index) {
    case 20: level = buildLoughTay(); break;
    case 21: level = buildBurrenWinds(); break;
    case 22: level = buildMoherLedges(); break;
    case 23: level = buildGlendaloughLakes(); break;
    case 24: level = buildDublinSkyline(); break;
    default: level = genProceduralLevel(index);
  }
  level.movers.forEach(m => { m.ox = m.x; m.oy = m.y; m.dx = 0; m.dy = 0; });
  return level;
}
