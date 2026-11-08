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

const MAX_CLIMB_PX = (PLAYER.jumpVel * PLAYER.jumpVel) / (2 * GRAVITY);
function computeMaxGap(yFrom, yTo) {
  const dy = yFrom - yTo;
  if (dy < -MAX_CLIMB_PX) return 0;
  const disc = Math.max(0, PLAYER.jumpVel * PLAYER.jumpVel + 2 * GRAVITY * dy);
  const t = (PLAYER.jumpVel + Math.sqrt(disc)) / GRAVITY;
  return PLAYER.baseSpeed * t * 0.85;
}
/* Insert stepping platforms wherever two neighbours are too far apart to jump between. */
function ensureReachability(level) {
  const plats = level.platforms.slice().sort((a, b) => a.x - b.x);
  for (let i = 0; i < plats.length - 1; i++) {
    let p0 = plats[i], p1 = plats[i + 1], guard = 0;
    while (guard++ < 20) {
      const maxGap = computeMaxGap(p0.y, p1.y), gap = p1.x - (p0.x + p0.w);
      const tooHigh = p1.y < p0.y - MAX_CLIMB_PX + 8;
      if (gap <= maxGap && !tooHigh) break;
      const stepGap = Math.max(60, Math.min(maxGap * 0.75, gap * 0.5));
      let targetY = p0.y + (p1.y - p0.y) * 0.5;
      targetY = clamp(targetY, p0.y - MAX_CLIMB_PX + 10, p0.y + 120);
      const np = Rect(p0.x + p0.w + stepGap, Math.round(targetY), 160, 24);
      plats.splice(i + 1, 0, np); p0 = np;
    }
  }
  level.platforms = plats;
}

function emptyLevel(index, width) {
  return {
    index, theme: LEVEL_THEMES[index], width, platforms: [], movers: [], hazards: [], water: [], windZones: [],
    checkpoints: [], enemies: [], acorns: [], goalX: width - 200, goalY: 420, boss: null, gravity: GRAVITY,
    start: { x: 60, y: 300 },
  };
}
function addAcornArc(level, x, y, n = 3, spread = 26) {
  for (let i = 0; i < n; i++) level.acorns.push({ x: x + i * spread, y: y - Math.sin((i / (n - 1 || 1)) * Math.PI) * 24 });
}
function checkpointOn(level, p) { level.checkpoints.push({ x: p.x + p.w / 2, y: p.y }); }
function placeCheckpoints(level, count = 4) {
  const plats = level.platforms.filter(p => p.w >= 100).sort((a, b) => a.x - b.x);
  for (let i = 1; i <= count; i++) {
    const target = (i / (count + 1)) * level.width;
    let best = null;
    for (const p of plats) if (!best || Math.abs(p.x + p.w / 2 - target) < Math.abs(best.x + best.w / 2 - target)) best = p;
    if (best && !level.checkpoints.some(c => Math.abs(c.x - (best.x + best.w / 2)) < 200)) checkpointOn(level, best);
  }
}

/* ---------- procedural levels 1–20 ---------- */
function genProceduralLevel(index) {
  const rand = rng(1000 + index * 77);
  const width = 4800 + index * 280;
  const level = emptyLevel(index, width);
  const yLevels = [420, 340, 260, 180];
  const minGap = 170 + index * 6, maxGap = 300 + index * 10;
  const minPlatW = 190 - index * 2, maxPlatW = 330 + index * 6;
  const hazardChance = 0.15 + index * 0.014, enemyChance = 0.55 + index * 0.015;
  const typePool = ['puca', 'raven', 'cusidhe', 'wisp', 'golem', 'banshee'];
  const maxType = Math.min(typePool.length - 1, 1 + Math.floor(index / 4));
  let lastY = yLevels[0], lastEnd = 140;
  level.platforms.push(Rect(0, 420, 160, 30));
  while (lastEnd < width - 420) {
    let yIdx = Math.floor(rand() * yLevels.length);
    if (yLevels[yIdx] === lastY) yIdx = (yIdx + 1) % yLevels.length;
    const y = yLevels[yIdx], w = minPlatW + rand() * (maxPlatW - minPlatW), x = lastEnd + minGap + rand() * (maxGap - minGap);
    const p = Rect(x, y, w, 30);
    level.platforms.push(p);
    lastY = y; lastEnd = x + w;
    if (w > 240 && rand() < hazardChance) level.hazards.push(Rect(x + w * 0.45, y - 14, 46 + rand() * 30, 14));
    if (rand() < enemyChance && w > 120) {
      const type = typePool[Math.floor(rand() * (maxType + 1))];
      level.enemies.push({ type, x: x + 60 + rand() * (w - 120), y: y - 40 });
    }
    if (rand() < 0.45) addAcornArc(level, x + 30 + rand() * Math.max(10, w - 110), y - 60, 3);
    else if (rand() < 0.3) addAcornArc(level, lastEnd + 40, y - 90, 3, 34);
    if (rand() < 0.35) {
      const py = yLevels[(yIdx + 1) % yLevels.length], pw = 120 + rand() * 100, px = x + 60 + rand() * Math.max(10, w - 180);
      level.platforms.push(Rect(px, py, pw, 24));
      if (rand() < 0.5) level.enemies.push({ type: 'puca', x: px + pw / 2, y: py - 40 });
      else addAcornArc(level, px + 20, py - 50, 3);
    }
  }
  level.goalX = width - 200; level.goalY = 380;
  level.platforms.push(Rect(width - 320, 380, 320, 30));
  ensureReachability(level);
  placeCheckpoints(level, 4);
  return level;
}

/* ---------- handcrafted stages 21–25 ---------- */
function buildLoughTay() {
  const L = emptyLevel(20, 4600);
  const S = 440; /* water surface */
  L.water.push(Rect(0, S, L.width, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 400, 220, 30));                      /* shore */
  const jetties = [[380, 400, 160], [720, 390, 140], [1000, 330, 120], [1240, 400, 180], [1600, 380, 150], [1900, 300, 120], [2140, 400, 200], [2560, 390, 140], [2860, 320, 130], [3140, 400, 160], [3500, 380, 170], [3850, 400, 150], [4160, 400, 440]];
  for (const [x, y, w] of jetties) L.platforms.push(Rect(x, y, w, 22));
  L.platforms.push(Rect(0, 524, L.width, 16)); L.platforms[L.platforms.length - 1].tile = 'sand';
  for (const [x, y, w] of jetties) if (w >= 150) addAcornArc(L, x + 20, y - 50, 3, 30);
  for (const x of [560, 1480, 2400, 3300, 4000]) addAcornArc(L, x, 500, 3, 30); /* underwater acorns reward a dive */
  for (const x of [600, 1420, 2380, 3020, 3700]) L.enemies.push({ type: 'merrow', x, y: 470 });
  for (const x of [1300, 2200, 3550]) L.enemies.push({ type: 'raven', x, y: 220 });
  L.enemies.push({ type: 'puca', x: 4300, y: 360 });
  for (const i of [3, 6, 9, 11]) checkpointOn(L, L.platforms[i + 1]);
  L.goalX = 4480; L.goalY = 400;
  return L;
}
function buildBurrenWinds() {
  const L = emptyLevel(21, 4800);
  const plats = [[0, 420, 200], [340, 400, 180], [660, 360, 220], [1020, 300, 160], [1300, 380, 260], [1700, 420, 200], [2020, 340, 180], [2320, 260, 160], [2600, 360, 240], [2980, 420, 220], [3340, 320, 180], [3660, 400, 200], [3980, 340, 160], [4260, 400, 540]];
  for (const [x, y, w] of plats) L.platforms.push(Rect(x, y, w, 28));
  L.windZones.push({ x: 300, w: 1100, force: -130 }, { x: 1600, w: 1000, force: 160 }, { x: 2900, w: 1200, force: -190 });
  L.hazards.push(Rect(1400, 366, 50, 14), Rect(2680, 346, 50, 14), Rect(4400, 386, 40, 14));
  L.enemies.push({ type: 'puca', x: 760, y: 320 }, { type: 'banshee', x: 1460, y: 250 }, { type: 'golem', x: 2690, y: 300 }, { type: 'banshee', x: 3400, y: 200 }, { type: 'cusidhe', x: 4500, y: 350 });
  for (const [x, y, w] of plats) if (w >= 180) addAcornArc(L, x + 30, y - 56, 3);
  addAcornArc(L, 1120, 180, 4, 30); addAcornArc(L, 2400, 150, 4, 30);
  for (const i of [3, 6, 9, 12]) checkpointOn(L, L.platforms[i]);
  L.goalX = 4680; L.goalY = 400;
  ensureReachability(L);
  return L;
}
function buildMoherLedges() {
  const L = emptyLevel(22, 5000);
  const S = 470;
  L.water.push(Rect(0, S, L.width, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 400, 240, 30), Rect(0, 524, L.width, 16));
  L.platforms[1].tile = 'sand';
  const ledges = [[520, 360, 140], [1240, 300, 160], [1700, 400, 200], [2500, 260, 150], [3000, 380, 180], [3800, 320, 160], [4400, 400, 600]];
  for (const [x, y, w] of ledges) L.platforms.push(Rect(x, y, w, 28));
  L.movers.push(
    { x: 300, y: 390, w: 120, h: 20, axis: 'x', range: 120, speed: 1.2, phase: 0 },
    { x: 760, y: 340, w: 110, h: 20, axis: 'x', range: 180, speed: 1.0, phase: 1 },
    { x: 1100, y: 420, w: 100, h: 20, axis: 'y', range: 90, speed: 1.4, phase: 0 },
    { x: 1960, y: 380, w: 120, h: 20, axis: 'x', range: 200, speed: 1.3, phase: 2 },
    { x: 2300, y: 400, w: 100, h: 20, axis: 'y', range: 110, speed: 1.1, phase: 1 },
    { x: 2720, y: 320, w: 120, h: 20, axis: 'x', range: 140, speed: 1.6, phase: 0 },
    { x: 3250, y: 360, w: 110, h: 20, axis: 'x', range: 220, speed: 1.2, phase: 3 },
    { x: 3620, y: 420, w: 100, h: 20, axis: 'y', range: 100, speed: 1.5, phase: 2 },
    { x: 4020, y: 360, w: 110, h: 20, axis: 'x', range: 200, speed: 1.4, phase: 1 },
  );
  L.enemies.push({ type: 'raven', x: 900, y: 200 }, { type: 'banshee', x: 1750, y: 260 }, { type: 'raven', x: 2600, y: 180 }, { type: 'merrow', x: 1500, y: 500 }, { type: 'merrow', x: 3450, y: 500 }, { type: 'golem', x: 4600, y: 350 }, { type: 'banshee', x: 3850, y: 220 });
  for (const [x, y, w] of ledges) addAcornArc(L, x + 20, y - 54, 3, Math.min(30, (w - 40) / 2));
  addAcornArc(L, 1120, 300, 3, 30); addAcornArc(L, 2320, 280, 3, 30); addAcornArc(L, 3640, 300, 3, 30);
  for (const i of [3, 4, 6, 7]) checkpointOn(L, L.platforms[i]);
  L.goalX = 4880; L.goalY = 400;
  return L;
}
function buildGlendaloughLakes() {
  const L = emptyLevel(23, 5200);
  const S = 450;
  L.water.push(Rect(600, S, 1000, VIRTUAL_H - S), Rect(3300, S, 1100, VIRTUAL_H - S));
  L.platforms.push(Rect(0, 420, 620, 30), Rect(600, 524, 1000, 16), Rect(3300, 524, 1100, 16));
  L.platforms[1].tile = 'sand'; L.platforms[2].tile = 'sand';
  const plats = [[800, 400, 140], [1120, 330, 140], [1400, 400, 200], [1600, 420, 500], [2200, 360, 180], [2520, 280, 160], [2820, 360, 200], [3100, 420, 220], [3550, 400, 140], [3900, 330, 150], [4200, 400, 200], [4400, 420, 800]];
  for (const [x, y, w] of plats) L.platforms.push(Rect(x, y, w, 28));
  L.movers.push({ x: 980, y: 380, w: 110, h: 20, axis: 'y', range: 80, speed: 1.2, phase: 0 }, { x: 2050, y: 340, w: 120, h: 20, axis: 'x', range: 140, speed: 1.1, phase: 1 }, { x: 3720, y: 380, w: 110, h: 20, axis: 'x', range: 160, speed: 1.3, phase: 2 }, { x: 4080, y: 360, w: 100, h: 20, axis: 'y', range: 90, speed: 1.4, phase: 0 });
  L.windZones.push({ x: 2100, w: 1200, force: 150 });
  L.hazards.push(Rect(1800, 406, 60, 14), Rect(2900, 346, 50, 14), Rect(4700, 406, 60, 14));
  L.enemies.push({ type: 'cusidhe', x: 400, y: 380 }, { type: 'merrow', x: 1000, y: 480 }, { type: 'golem', x: 1850, y: 380 }, { type: 'banshee', x: 2600, y: 200 }, { type: 'raven', x: 2300, y: 220 }, { type: 'merrow', x: 3450, y: 480 }, { type: 'merrow', x: 4100, y: 480 }, { type: 'cusidhe', x: 4600, y: 380 }, { type: 'banshee', x: 4900, y: 300 });
  for (const [x, y, w] of plats) if (w >= 140) addAcornArc(L, x + 24, y - 54, 3);
  addAcornArc(L, 1200, 500, 3, 30); addAcornArc(L, 3800, 500, 3, 30);
  for (const i of [5, 6, 9, 12]) checkpointOn(L, L.platforms[i]);
  L.goalX = 5080; L.goalY = 420;
  return L;
}
function buildDublinSkyline() {
  const L = emptyLevel(24, 5000);
  const roofs = [[0, 420, 300], [440, 380, 200], [780, 320, 180], [1100, 400, 260], [1500, 340, 200], [1860, 420, 220], [2220, 360, 200], [2560, 300, 180], [2900, 380, 240]];
  for (const [x, y, w] of roofs) L.platforms.push(Rect(x, y, w, 30));
  L.movers.push({ x: 1360, y: 360, w: 100, h: 20, axis: 'x', range: 90, speed: 1.3, phase: 0 }, { x: 2800, y: 340, w: 100, h: 20, axis: 'y', range: 80, speed: 1.2, phase: 1 });
  L.hazards.push(Rect(1200, 386, 50, 14), Rect(3000, 366, 50, 14));
  L.enemies.push({ type: 'raven', x: 600, y: 220 }, { type: 'puca', x: 1180, y: 360 }, { type: 'banshee', x: 1700, y: 240 }, { type: 'golem', x: 2300, y: 320 }, { type: 'cusidhe', x: 3000, y: 340 });
  for (const [x, y, w] of roofs) if (w >= 200) addAcornArc(L, x + 30, y - 54, 3);
  /* the arena: a long rooftop walled at both ends */
  const AX = 3400, AW = 1200;
  L.platforms.push(Rect(AX, 420, AW, 30));
  /* a step up to a low lip on the way in; the far wall is full height */
  L.platforms.push(Rect(AX - 200, 400, 130, 24), Rect(AX - 40, 350, 40, 70), Rect(AX + AW, 240, 40, 180));
  L.platforms.push(Rect(AX + 300, 320, 140, 22), Rect(AX + 760, 320, 140, 22));
  L.arena = Rect(AX, 0, AW, VIRTUAL_H);
  L.boss = { x: AX + AW - 300, y: 330 };
  for (const i of [2, 4, 7]) checkpointOn(L, L.platforms[i]);
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
