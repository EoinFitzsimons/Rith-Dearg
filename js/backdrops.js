/* Rith Dearg — parallax backdrops of Irish landscapes, generated procedurally into tileable offscreen canvases. */

const TILE_W = 1920;
const HORIZON = 330;

function makeLayer(draw, theme, seed) {
  const c = document.createElement('canvas');
  c.width = TILE_W; c.height = VIRTUAL_H;
  const g = c.getContext('2d');
  const rand = rng(seed);
  /* Draw three times, offset by a tile, so shapes that spill over an edge wrap seamlessly. */
  for (const off of [-TILE_W, 0, TILE_W]) {
    g.save(); g.translate(off, 0);
    draw(g, theme, rng(seed));
    g.restore();
  }
  void rand;
  return c;
}

class Backdrop {
  constructor(theme) {
    this.theme = theme;
    const fam = BACKDROP_FAMILIES[theme.backdrop] || BACKDROP_FAMILIES.forest;
    this.layers = fam.layers.map((fn, i) => ({ canvas: makeLayer(fn, theme, 500 + i * 31 + theme.name.length), speed: fam.speeds[i] }));
    this.ambient = fam.ambient || null;
    this.stars = [];
    const r = rng(77);
    for (let i = 0; i < 90; i++) this.stars.push({ x: r() * VIRTUAL_W, y: r() * HORIZON * 0.9, s: 0.6 + r() * 1.4, p: r() * 6 });
    this.clouds = [];
    for (let i = 0; i < 7; i++) this.clouds.push({ x: r() * TILE_W, y: 30 + r() * 170, w: 90 + r() * 140, h: 14 + r() * 16, a: 0.25 + r() * 0.35 });
    this.birds = [];
    for (let i = 0; i < 6; i++) this.birds.push({ x: r() * VIRTUAL_W, y: 60 + r() * 160, s: 20 + r() * 30, p: r() * 6 });
  }
  draw(ctx, camX, t) {
    const th = this.theme;
    const g = ctx.createLinearGradient(0, 0, 0, VIRTUAL_H);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.62, th.sky[1]); g.addColorStop(1, th.sky[2] || th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    if (th.time === 'night' || th.time === 'dusk') {
      ctx.fillStyle = '#fff';
      for (const s of this.stars) { ctx.globalAlpha = (th.time === 'night' ? 0.55 : 0.25) + Math.sin(t * 1.5 + s.p) * 0.2; circle(ctx, s.x, s.y, s.s); }
      ctx.globalAlpha = 1;
    }
    /* sun or moon */
    const cx = th.time === 'night' ? 760 : 700, cy = th.time === 'dusk' ? 250 : 110;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
    const col = th.time === 'night' ? '220,230,255' : th.time === 'dusk' ? '255,160,90' : '255,240,200';
    glow.addColorStop(0, `rgba(${col},0.35)`); glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow; circle(ctx, cx, cy, 140);
    ctx.fillStyle = th.time === 'night' ? '#e9eefb' : th.time === 'dusk' ? '#ffb070' : '#fff6d8'; circle(ctx, cx, cy, th.time === 'night' ? 22 : 30);
    if (th.time === 'night') { ctx.fillStyle = th.sky[0]; circle(ctx, cx + 10, cy - 6, 18); }
    /* clouds */
    ctx.fillStyle = th.time === 'night' ? 'rgba(170,185,215,0.35)' : 'rgba(255,255,255,0.75)';
    for (const c of this.clouds) {
      const x = ((c.x - camX * 0.05 - t * 6) % TILE_W + TILE_W) % TILE_W - 200;
      ctx.globalAlpha = c.a;
      ellipse(ctx, x, c.y, c.w / 2, c.h); ellipse(ctx, x - c.w * 0.25, c.y + 4, c.w / 4, c.h * 0.8); ellipse(ctx, x + c.w * 0.22, c.y + 2, c.w / 3.2, c.h * 1.1);
    }
    ctx.globalAlpha = 1;
    /* parallax layers */
    for (const L of this.layers) {
      const off = ((camX * L.speed) % TILE_W + TILE_W) % TILE_W;
      ctx.drawImage(L.canvas, -off, 0);
      if (TILE_W - off < VIRTUAL_W) ctx.drawImage(L.canvas, TILE_W - off, 0);
    }
    if (this.ambient) this.ambient(ctx, this, camX, t);
  }
}

/* ---------- shared pieces ---------- */
function ridge(g, y0, amp, freq, colour, seedR, W = TILE_W) {
  g.fillStyle = colour; g.beginPath(); g.moveTo(0, VIRTUAL_H);
  for (let x = 0; x <= W; x += 16) {
    const y = y0 - Math.abs(Math.sin(x * freq * 0.01) * amp) - Math.sin(x * freq * 0.031 + seedR * 6) * amp * 0.35;
    g.lineTo(x, y);
  }
  g.lineTo(W, VIRTUAL_H); g.closePath(); g.fill();
}
function sea(g, y, colour, light) {
  g.fillStyle = colour; g.fillRect(0, y, TILE_W, VIRTUAL_H - y);
  g.fillStyle = light; for (let i = 0; i < 60; i++) { const x = (i * 97) % TILE_W, yy = y + 6 + (i * 37) % 90; g.fillRect(x, yy, 22 + (i % 4) * 8, 2); }
}
function tree(g, x, baseY, h, trunk, leaf, kind = 'pine') {
  g.fillStyle = trunk; g.fillRect(x - h * 0.05, baseY - h * 0.45, h * 0.1, h * 0.45);
  g.fillStyle = leaf;
  if (kind === 'pine') {
    for (let i = 0; i < 3; i++) { const w = h * (0.42 - i * 0.1), y = baseY - h * (0.35 + i * 0.22); g.beginPath(); g.moveTo(x, y - h * 0.28); g.lineTo(x - w, y); g.lineTo(x + w, y); g.closePath(); g.fill(); }
  } else {
    ellipse(g, x, baseY - h * 0.62, h * 0.32, h * 0.3); ellipse(g, x - h * 0.2, baseY - h * 0.5, h * 0.22, h * 0.2); ellipse(g, x + h * 0.2, baseY - h * 0.52, h * 0.22, h * 0.2);
  }
}
function stoneWall(g, y, h, colour, dark, rand) {
  g.fillStyle = colour; g.fillRect(0, y, TILE_W, h);
  g.strokeStyle = dark; g.lineWidth = 2;
  for (let row = 0; row < h; row += 12) {
    let x = row % 24 ? 10 : 0;
    while (x < TILE_W) { const w = 18 + rand() * 22; g.strokeRect(x, y + row, w, 11); x += w; }
  }
}
function grassTufts(g, y, colour, rand, n = 200) {
  g.strokeStyle = colour; g.lineWidth = 2;
  for (let i = 0; i < n; i++) { const x = rand() * TILE_W, h = 6 + rand() * 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - h); g.moveTo(x, y); g.lineTo(x + 3, y - h * 0.8); g.stroke(); }
}
function windowGrid(g, x, y, w, h, cols, rows, lit, rand) {
  const cw = w / cols, rh = h / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { if (rand() < lit) { g.fillStyle = rand() < 0.2 ? '#ffe9b0' : '#ffd36b'; g.fillRect(x + c * cw + 2, y + r * rh + 2, cw - 4, rh - 4); } }
}

/* ---------- families ---------- */
const BACKDROP_FAMILIES = {
  forest: {
    speeds: [0.12, 0.3, 0.55],
    layers: [
      (g, th, r) => { ridge(g, HORIZON + 10, 70, 0.9, th.far, 1); ridge(g, HORIZON + 50, 40, 1.4, th.far2 || th.far, 2); g.fillStyle = 'rgba(200,220,230,0.18)'; g.fillRect(0, HORIZON + 20, TILE_W, 60); },
      (g, th, r) => { g.fillStyle = th.mid; g.fillRect(0, 470, TILE_W, 70); for (let x = 20; x < TILE_W; x += 70 + r() * 60) tree(g, x, 480 + r() * 20, 80 + r() * 70, th.mid, th.midLeaf, r() < 0.7 ? 'pine' : 'oak'); },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 505, TILE_W, 35); for (let x = 60; x < TILE_W; x += 420 + r() * 300) tree(g, x, 545, 150 + r() * 60, th.near, th.nearLeaf, r() < 0.6 ? 'oak' : 'pine'); for (let i = 0; i < 80; i++) { g.fillStyle = th.nearLeaf; const x = r() * TILE_W; ellipse(g, x, 508 - r() * 8, 10, 5); } },
    ],
    ambient: (ctx, bd, camX, t) => { ctx.fillStyle = 'rgba(210,230,235,0.08)'; for (let i = 0; i < 3; i++) ellipse(ctx, ((i * 400 - camX * 0.4 + t * 15) % 1300 + 1300) % 1300 - 150, 380 + i * 40, 220, 26); },
  },
  cliffs: {
    speeds: [0.1, 0.3, 0.55],
    layers: [
      (g, th, r) => { sea(g, HORIZON + 20, th.seaCol, th.seaLight); ridge(g, HORIZON + 30, 50, 0.6, th.far, 3, 700); },
      (g, th, r) => {
        /* layered cliff face with sandstone and shale strata, rising to the right of each tile */
        g.fillStyle = th.mid; g.beginPath(); g.moveTo(600, VIRTUAL_H); g.lineTo(640, 330); g.lineTo(760, 260); g.lineTo(1500, 240); g.lineTo(1560, 400); g.lineTo(1600, VIRTUAL_H); g.closePath(); g.fill();
        g.strokeStyle = th.strata; g.lineWidth = 3; for (let y = 280; y < 530; y += 22) { g.beginPath(); g.moveTo(650 + (y - 280) * 0.3, y); g.lineTo(1520, y + 6); g.stroke(); }
        g.fillStyle = '#5a7a4a'; g.fillRect(760, 254, 740, 10);
        if (th.tower) { g.fillStyle = '#3a3f48'; g.fillRect(1000, 196, 36, 60); g.fillRect(996, 190, 44, 8); for (let i = 0; i < 4; i++) g.fillRect(996 + i * 12, 184, 6, 8); }
      },
      (g, th, r) => { g.fillStyle = th.near; g.beginPath(); g.moveTo(0, 540); g.lineTo(0, 470); for (let x = 0; x <= TILE_W; x += 40) g.lineTo(x, 470 + Math.sin(x * 0.02) * 10); g.lineTo(TILE_W, 540); g.fill(); grassTufts(g, 476, '#6ea35a', r, 260); },
    ],
    ambient: (ctx, bd, camX, t) => { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; for (const b of bd.birds) { const x = ((b.x + t * b.s - camX * 0.2) % 1100 + 1100) % 1100 - 70, y = b.y + Math.sin(t * 2 + b.p) * 8, f = Math.sin(t * 9 + b.p) * 4; ctx.beginPath(); ctx.moveTo(x - 7, y + f); ctx.lineTo(x, y); ctx.lineTo(x + 7, y + f); ctx.stroke(); } },
  },
  causeway: {
    speeds: [0.1, 0.3, 0.55],
    layers: [
      (g, th, r) => { sea(g, HORIZON + 10, th.seaCol, th.seaLight); ridge(g, HORIZON + 40, 60, 0.7, th.far, 4, 900); },
      (g, th, r) => { for (let x = 0; x < TILE_W; x += 28) { const h = 60 + Math.abs(Math.sin(x * 0.004) * 150) + r() * 20; g.fillStyle = th.mid; g.fillRect(x, 540 - h, 26, h); g.fillStyle = th.midTop; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const px = x + 13 + Math.cos(a) * 13, py = 540 - h + Math.sin(a) * 5; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); } },
      (g, th, r) => { for (let x = 0; x < TILE_W; x += 44) { const h = 30 + Math.abs(Math.sin(x * 0.006 + 2) * 70); g.fillStyle = th.near; g.fillRect(x, 540 - h, 42, h); g.fillStyle = th.nearTop; g.fillRect(x + 2, 540 - h, 38, 6); } },
    ],
  },
  burren: {
    speeds: [0.1, 0.3, 0.55],
    layers: [
      (g, th, r) => { ridge(g, HORIZON + 20, 45, 0.5, th.far, 5); g.fillStyle = th.seaLight; g.fillRect(0, HORIZON + 30, TILE_W, 3); },
      (g, th, r) => {
        /* limestone pavement terraces with grykes */
        for (let step = 0; step < 3; step++) { const y = 380 + step * 45; g.fillStyle = shade(th.mid, step * 12); g.fillRect(0, y, TILE_W, 60); g.strokeStyle = th.gryke; g.lineWidth = 3; for (let x = r() * 60; x < TILE_W; x += 50 + r() * 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 - r() * 20, y + 45); g.stroke(); } g.fillStyle = '#7f9a68'; for (let x = r() * 90; x < TILE_W; x += 110 + r() * 120) ellipse(g, x, y + 20, 8, 4); }
        /* Poulnabrone dolmen */
        g.fillStyle = th.mid; g.fillRect(900, 320, 16, 70); g.fillRect(990, 326, 16, 64); g.fillRect(950, 336, 14, 54);
        g.beginPath(); g.moveTo(870, 326); g.lineTo(1040, 310); g.lineTo(1046, 324); g.lineTo(880, 342); g.closePath(); g.fill();
      },
      (g, th, r) => { stoneWall(g, 492, 48, th.near, th.gryke, r); g.fillStyle = th.nearTop; for (let x = 0; x < TILE_W; x += 14) g.fillRect(x, 488, 12, 6); for (let x = 100; x < TILE_W; x += 300 + r() * 200) tree(g, x, 492, 60 + r() * 30, '#4a3a2a', '#6b8a4a', 'oak'); },
    ],
  },
  mountains: {
    speeds: [0.08, 0.22, 0.5],
    layers: [
      (g, th, r) => { ridge(g, HORIZON - 20, 120, 0.5, th.far, 6); ridge(g, HORIZON + 30, 90, 0.8, th.far2, 7); if (th.tabletop) { g.fillStyle = th.far2; g.beginPath(); g.moveTo(500, 400); g.lineTo(640, 190); g.lineTo(1100, 190); g.lineTo(1240, 400); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; for (let x = 660; x < 1090; x += 34) { g.beginPath(); g.moveTo(x, 196); g.lineTo(x - 40, 400); g.stroke(); } } },
      (g, th, r) => { ridge(g, HORIZON + 90, 80, 1.1, th.mid, 8); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) ellipse(g, r() * TILE_W, 440 + r() * 90, 6 + r() * 20, 3); },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 500, TILE_W, 40); g.fillStyle = th.heather; for (let i = 0; i < 160; i++) ellipse(g, r() * TILE_W, 498 + r() * 10, 8 + r() * 12, 5 + r() * 4); g.fillStyle = '#9ba3ad'; for (let i = 0; i < 30; i++) ellipse(g, r() * TILE_W, 505 + r() * 20, 10 + r() * 14, 5 + r() * 5); },
    ],
  },
  island: {
    speeds: [0.1, 0.28, 0.55],
    layers: [
      (g, th, r) => { sea(g, HORIZON + 30, th.seaCol, th.seaLight); g.fillStyle = th.far; g.beginPath(); g.moveTo(300, 360); g.lineTo(380, 230); g.lineTo(430, 260); g.lineTo(480, 200); g.lineTo(600, 360); g.closePath(); g.fill(); g.beginPath(); g.moveTo(1200, 362); g.lineTo(1280, 280); g.lineTo(1360, 362); g.closePath(); g.fill(); },
      (g, th, r) => { g.fillStyle = th.mid; g.beginPath(); g.moveTo(700, 540); g.lineTo(760, 300); g.lineTo(900, 250); g.lineTo(1100, 320); g.lineTo(1200, 540); g.closePath(); g.fill(); g.strokeStyle = th.steps; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(780 + i * 14, 520 - i * 18); g.lineTo(800 + i * 14, 520 - i * 18); g.stroke(); } g.fillStyle = th.hut; for (let i = 0; i < 3; i++) ellipse(g, 930 + i * 46, 290 + i * 10, 20, 16); },
      (g, th, r) => { g.fillStyle = th.near; for (let x = 0; x < TILE_W; x += 120) ellipse(g, x + r() * 60, 540, 60 + r() * 40, 30 + r() * 20); g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 40; i++) ellipse(g, r() * TILE_W, 525 + r() * 15, 10, 2); },
    ],
    ambient: BACKDROP_AMBIENT_BIRDS,
  },
  tomb: {
    speeds: [0.1, 0.3, 0.55],
    layers: [
      (g, th, r) => { ridge(g, HORIZON + 30, 30, 0.5, th.far, 9); },
      (g, th, r) => { g.fillStyle = th.mid; ellipse(g, 960, 440, 420, 120); g.fillStyle = '#e8ecef'; g.beginPath(); g.moveTo(640, 440); g.quadraticCurveTo(960, 400, 1280, 440); g.lineTo(1280, 470); g.lineTo(640, 470); g.closePath(); g.fill(); g.fillStyle = '#5c6670'; for (let x = 650; x < 1280; x += 36) g.fillRect(x, 452, 24, 20); g.fillStyle = '#1b1f26'; g.fillRect(944, 430, 32, 40); g.strokeStyle = '#8fa0b0'; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < Math.PI * 6; a += 0.2) { const rr = a * 1.3; g.lineTo(960 + Math.cos(a) * rr, 410 + Math.sin(a) * rr * 0.6); } g.stroke(); for (let x = 200; x < TILE_W; x += 400 + r() * 300) { g.fillStyle = th.mid; g.fillRect(x, 400 + r() * 20, 18, 70); } },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 505, TILE_W, 35); grassTufts(g, 506, th.grass, r, 300); },
    ],
  },
  bog: {
    speeds: [0.08, 0.25, 0.55],
    layers: [
      (g, th, r) => { ridge(g, HORIZON, 110, 0.7, th.far, 10); ridge(g, HORIZON + 40, 60, 1.0, th.far2, 11); },
      (g, th, r) => { g.fillStyle = th.mid; g.fillRect(0, 400, TILE_W, 140); g.fillStyle = th.seaLight; ellipse(g, 700, 440, 260, 14); ellipse(g, 1500, 455, 180, 10); g.fillStyle = th.midDark; for (let x = 60; x < TILE_W; x += 380 + r() * 200) { for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - row; k++) g.fillRect(x + k * 14 + row * 7, 400 - row * 9, 12, 8); } },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 500, TILE_W, 40); grassTufts(g, 502, th.grass, r, 240); g.fillStyle = '#f2f4e8'; for (let i = 0; i < 70; i++) ellipse(g, r() * TILE_W, 490 + r() * 10, 3, 3); },
    ],
  },
  glen: {
    speeds: [0.1, 0.28, 0.55],
    layers: [
      (g, th, r) => { g.fillStyle = th.far; g.beginPath(); g.moveTo(0, 540); g.lineTo(0, 200); for (let x = 0; x <= TILE_W; x += 24) { const v = Math.abs(x - 960) / 960; g.lineTo(x, 390 - v * v * 190 - Math.abs(Math.sin(x * 0.02)) * 14 - Math.sin(x * 0.007) * 10); } g.lineTo(TILE_W, 540); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(0, 540); g.lineTo(0, 300); for (let x = 0; x <= TILE_W; x += 24) { const v = Math.abs(x - 960) / 960; g.lineTo(x, 420 - v * v * 120 - Math.abs(Math.sin(x * 0.03 + 1)) * 10); } g.lineTo(TILE_W, 540); g.closePath(); g.fill(); g.fillStyle = th.far2; for (let i = 0; i < 160; i++) { const x = r() * TILE_W; const y = Math.abs(x - 960) * 0.33 + 220 + r() * 120; if (y < 440) tree(g, x, y, 14 + r() * 10, th.far2, th.far2, 'pine'); } },
      (g, th, r) => { g.fillStyle = th.lake; g.fillRect(0, 420, TILE_W, 120); g.fillStyle = th.seaLight; for (let i = 0; i < 50; i++) g.fillRect(r() * TILE_W, 430 + r() * 90, 20 + r() * 40, 2); if (th.roundTower) { g.fillStyle = '#4b5460'; g.beginPath(); g.moveTo(1180, 420); g.lineTo(1186, 240); g.lineTo(1210, 240); g.lineTo(1216, 420); g.closePath(); g.fill(); g.beginPath(); g.moveTo(1180, 244); g.lineTo(1198, 210); g.lineTo(1216, 244); g.closePath(); g.fill(); g.fillStyle = '#1b2028'; g.fillRect(1194, 300, 8, 14); g.fillRect(1194, 260, 8, 12); g.fillStyle = '#4b5460'; g.fillRect(1120, 380, 50, 40); g.fillRect(1230, 370, 70, 50); g.fillStyle = '#1b2028'; g.fillRect(1250, 390, 14, 30); } },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 505, TILE_W, 35); g.strokeStyle = th.reed; g.lineWidth = 2; for (let i = 0; i < 180; i++) { const x = r() * TILE_W, h = 24 + r() * 36; g.beginPath(); g.moveTo(x, 508); g.lineTo(x + 3, 508 - h); g.stroke(); g.fillStyle = '#5a4a2a'; ellipse(g, x + 3, 508 - h, 2, 6); } for (let x = 180; x < TILE_W; x += 520 + r() * 260) tree(g, x, 520, 200 + r() * 60, '#3a2a1a', th.nearLeaf, 'oak'); },
    ],
  },
  castle: {
    speeds: [0.1, 0.3, 0.55],
    layers: [
      (g, th, r) => { sea(g, HORIZON + 20, th.seaCol, th.seaLight); },
      (g, th, r) => { g.fillStyle = th.mid; g.beginPath(); g.moveTo(560, 540); g.lineTo(620, 380); g.lineTo(1300, 370); g.lineTo(1380, 540); g.closePath(); g.fill(); g.fillStyle = th.ruin; g.fillRect(700, 290, 60, 90); g.fillRect(900, 300, 40, 80); g.fillRect(1100, 270, 70, 110); g.fillRect(760, 340, 140, 40); g.fillRect(940, 330, 160, 50); for (let i = 0; i < 4; i++) g.fillRect(700 + i * 16, 280, 8, 12); for (let i = 0; i < 5; i++) g.fillRect(1100 + i * 15, 260, 8, 12); g.fillStyle = th.sky[1]; g.beginPath(); g.arc(1135, 310, 10, Math.PI, 0); g.lineTo(1145, 340); g.lineTo(1125, 340); g.closePath(); g.fill(); g.beginPath(); g.arc(730, 320, 8, Math.PI, 0); g.lineTo(738, 345); g.lineTo(722, 345); g.closePath(); g.fill(); },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 500, TILE_W, 40); grassTufts(g, 502, '#6a9a55', r, 260); },
    ],
    ambient: BACKDROP_AMBIENT_BIRDS,
  },
  city: {
    speeds: [0.08, 0.25, 0.5],
    layers: [
      (g, th, r) => {
        /* Dublin skyline silhouette */
        g.fillStyle = th.far;
        for (let x = 0; x < TILE_W; x += 30 + r() * 40) { const h = 40 + r() * 70; g.fillRect(x, 380 - h, 26 + r() * 30, h + 200); }
        /* Poolbeg chimneys */
        for (const cx of [300, 340]) { g.fillStyle = '#c94f4f'; g.beginPath(); g.moveTo(cx - 9, 380); g.lineTo(cx - 5, 150); g.lineTo(cx + 5, 150); g.lineTo(cx + 9, 380); g.closePath(); g.fill(); g.fillStyle = '#f2f2f2'; for (let y = 160; y < 380; y += 44) g.fillRect(cx - 8, y, 16, 20); }
        /* the Spire */
        g.fillStyle = '#c8ccd3'; g.beginPath(); g.moveTo(900, 380); g.lineTo(902, 90); g.lineTo(904, 90); g.lineTo(906, 380); g.closePath(); g.fill();
        /* Liberty Hall and the Custom House dome */
        g.fillStyle = th.far; g.fillRect(1060, 230, 54, 150); g.fillStyle = '#4b5666'; g.fillRect(1056, 222, 62, 10);
        g.fillStyle = th.far; g.fillRect(1240, 320, 180, 60); g.beginPath(); g.arc(1330, 320, 34, Math.PI, 0); g.fill(); g.fillRect(1326, 270, 8, 20);
        /* cranes */
        g.strokeStyle = '#8a93a0'; g.lineWidth = 3; g.beginPath(); g.moveTo(1600, 380); g.lineTo(1600, 200); g.lineTo(1720, 200); g.moveTo(1600, 200); g.lineTo(1560, 220); g.stroke();
      },
      (g, th, r) => {
        /* Convention Centre tilted drum, Georgian terraces and the Samuel Beckett Bridge over the Liffey */
        g.fillStyle = th.mid; g.fillRect(0, 440, TILE_W, 100);
        g.fillStyle = '#3b4454'; g.fillRect(560, 340, 150, 100); g.fillStyle = '#6a8db5'; g.save(); g.translate(635, 380); g.rotate(-0.25); ellipse(g, 0, 0, 44, 60); g.restore(); g.fillStyle = '#3b4454'; g.fillRect(560, 400, 150, 40);
        for (let x = 0; x < TILE_W; x += 70) { if (x > 540 && x < 720) continue; if (x > 1240 && x < 1660) continue; g.fillStyle = r() < 0.5 ? '#3a3230' : '#302e38'; g.fillRect(x, 370, 68, 70); g.globalAlpha = 0.55; windowGrid(g, x + 6, 376, 56, 58, 3, 3, 0.6, r); g.globalAlpha = 1; g.fillStyle = '#c93c3c'; g.fillRect(x + 26, 420, 16, 20); }
        g.strokeStyle = '#d8dde3'; g.lineWidth = 4; g.beginPath(); g.moveTo(1260, 440); g.quadraticCurveTo(1300, 280, 1540, 300); g.stroke(); g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(1290 + i * 18, 436); g.lineTo(1300 + i * 16, 290 + i * 1.5); g.stroke(); } g.fillStyle = '#9aa3ad'; g.fillRect(1240, 436, 420, 8);
        g.fillStyle = th.lake; g.fillRect(0, 444, TILE_W, 96); g.fillStyle = 'rgba(255,211,107,0.35)'; for (let i = 0; i < 90; i++) g.fillRect(r() * TILE_W, 450 + r() * 80, 14 + r() * 30, 2);
      },
      (g, th, r) => { g.fillStyle = th.near; g.fillRect(0, 512, TILE_W, 28); g.fillStyle = '#5d6673'; g.fillRect(0, 506, TILE_W, 6); g.strokeStyle = '#2a2f38'; g.lineWidth = 3; for (let x = 0; x < TILE_W; x += 24) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x, 486); g.stroke(); } g.lineWidth = 4; g.beginPath(); g.moveTo(0, 486); g.lineTo(TILE_W, 486); g.stroke(); for (let x = 200; x < TILE_W; x += 480) { g.fillStyle = '#2a2f38'; g.fillRect(x, 400, 6, 112); g.fillStyle = '#ffe9a8'; ellipse(g, x + 3, 396, 8, 10); g.fillStyle = 'rgba(255,233,168,0.18)'; circle(g, x + 3, 396, 40); } },
    ],
  },
};

function BACKDROP_AMBIENT_BIRDS(ctx, bd, camX, t) { BACKDROP_FAMILIES.cliffs.ambient(ctx, bd, camX, t); }
