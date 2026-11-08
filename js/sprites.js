/* Rith Dearg — every sprite is drawn in code. Nothing here loads an image. */

/* ---------- small helpers ---------- */
function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

/* ---------- the squirrel ----------
   pose = { state: 'idle'|'run'|'jump'|'fall'|'attack'|'swim', phase: 0..1 run cycle, attackT: 0..1, dir: ±1, time }
   Drawn in a local space centred on the body; the caller translates to the sprite centre. */
function drawSquirrel(ctx, skin, pose) {
  const { state, phase, attackT, time } = pose;
  const run = state === 'run', air = state === 'jump' || state === 'fall', swim = state === 'swim';
  const cyc = Math.sin(phase * Math.PI * 2), cyc2 = Math.cos(phase * Math.PI * 2);
  const breathe = Math.sin(time * 3) * 1.2;
  const bob = run ? Math.abs(cyc) * -3 : (state === 'idle' ? breathe * 0.5 : 0);
  const lean = run ? 0.18 : (state === 'jump' ? -0.15 : state === 'fall' ? 0.2 : swim ? 0.45 : 0);
  const fur = skin.fur, belly = skin.belly, tip = skin.tip || shade(skin.fur, -50), dark = shade(skin.fur, -35);

  ctx.save();
  ctx.scale(pose.dir, 1);
  ctx.translate(0, bob);

  /* --- tail (behind body) --- */
  ctx.save();
  let tailAngle = run ? -0.35 + cyc * 0.18 : state === 'jump' ? -0.9 : state === 'fall' ? -0.1 : swim ? 0.3 : -0.45 + Math.sin(time * 2.2) * 0.08;
  if (state === 'attack') tailAngle = lerp(-0.4, -3.1, Math.sin(attackT * Math.PI)); /* swings over the head */
  ctx.translate(-10, 10);
  ctx.rotate(tailAngle);
  const lobes = [[-4, -8, 9, 7], [-8, -20, 11, 10], [-6, -34, 12, 11], [0, -46, 10, 9]];
  lobes.forEach(([x, y, rx, ry], i) => { ctx.fillStyle = i >= 2 ? tip : fur; ellipse(ctx, x, y, rx, ry, -0.3); });
  ctx.fillStyle = shade(fur, 28);
  lobes.forEach(([x, y, rx, ry], i) => { if (i < 3) ellipse(ctx, x - 3, y - 3, rx * 0.45, ry * 0.5, -0.3); });
  ctx.restore();

  /* accessories behind the body */
  if (skin.acc === 'cloak') {
    ctx.fillStyle = 'rgba(70,95,220,0.75)';
    ctx.beginPath(); ctx.moveTo(-2, -14); ctx.quadraticCurveTo(-22 - cyc * 4, 4, -18 - cyc * 6, 22); ctx.lineTo(2, 20); ctx.closePath(); ctx.fill();
  }
  if (skin.acc === 'wisp-aura') {
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(time * 4) * 0.1; ctx.strokeStyle = '#9ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  ctx.rotate(lean);

  /* --- hind legs --- */
  const hind = run ? cyc * 7 : air ? -4 : 0, fore = run ? -cyc * 7 : air ? 6 : 0;
  ctx.fillStyle = dark;
  ellipse(ctx, -5 + hind * 0.4, 14, 8, 7);                 /* haunch */
  ctx.fillStyle = fur;
  roundRect(ctx, -9 + hind, 16, 9, 7, 3); ctx.fill();        /* hind foot */

  /* --- body --- */
  ctx.fillStyle = fur; ellipse(ctx, 0, 2, 13, 16);
  ctx.fillStyle = belly; ellipse(ctx, 3, 6, 8, 11);

  /* --- fore legs --- */
  ctx.fillStyle = fur;
  if (state === 'attack') { roundRect(ctx, 8, -4, 12, 6, 3); ctx.fill(); }
  else if (swim) { roundRect(ctx, 6 + Math.sin(time * 9) * 4, 2, 11, 6, 3); ctx.fill(); }
  else { roundRect(ctx, 4 + fore, 10, 8, 10, 3); ctx.fill(); roundRect(ctx, 3 + fore * 0.4, 16, 10, 6, 3); ctx.fill(); }

  /* --- head --- */
  ctx.fillStyle = fur;
  ellipse(ctx, -2, -25, 5, 8, -0.2); ellipse(ctx, 8, -27, 5, 8, 0.25);   /* ears */
  ctx.fillStyle = shade(belly, -20); ellipse(ctx, -2, -24, 2.2, 4.5, -0.2); ellipse(ctx, 8, -26, 2.2, 4.5, 0.25);
  ctx.fillStyle = fur; circle(ctx, 4, -14, 11);
  ctx.fillStyle = belly; ellipse(ctx, 11, -10, 6, 4.5);                   /* muzzle */
  ctx.fillStyle = '#2a1a14'; circle(ctx, 16, -11, 1.8);                   /* nose */
  ctx.fillStyle = '#1b1b1b'; ellipse(ctx, 8, -16, 2.6, 3);                /* eye */
  ctx.fillStyle = '#fff'; circle(ctx, 9, -17, 1);
  /* cheek fluff */
  ctx.fillStyle = shade(fur, 22); ellipse(ctx, -3, -9, 4, 3);

  if (skin.acc === 'scarf') {
    ctx.fillStyle = '#e8463c'; roundRect(ctx, -4, -6, 16, 6, 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(-14 - Math.abs(cyc) * 3, 2 + cyc * 2); ctx.lineTo(-12, 6); ctx.lineTo(-2, 1); ctx.closePath(); ctx.fill();
  } else if (skin.acc === 'acorn-cap') {
    ctx.fillStyle = '#7d5a2b'; ellipse(ctx, 4, -23, 11, 4); roundRect(ctx, -4, -30, 16, 7, 3); ctx.fill();
    ctx.fillStyle = '#5a3f1b'; ctx.fillRect(3, -34, 3, 5);
  }

  /* --- attack arc --- */
  if (state === 'attack') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const a0 = -2.4 + attackT * 2.2;
    ctx.beginPath(); ctx.arc(2, -6, 30, a0, a0 + 1.1); ctx.stroke();
    ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(2, -6, 24, a0 - 0.3, a0 + 0.9); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ---------- enemies ---------- */
function drawEnemy(ctx, e, t) {
  const px = Math.floor(e.x - e.camX), py = Math.floor(e.y);
  ctx.save();
  if (e.type !== 'merrow' || !e.submerged) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(ctx, px + e.w / 2, py + e.h - 1, 14, 5);
  }
  ctx.translate(px + e.w / 2, py + e.h / 2);
  if (e.flash > 0) ctx.globalAlpha = 0.5;
  const walk = Math.sin(t * 10 + e.x * 0.05);
  switch (e.type) {
    case 'puca': drawPuca(ctx, e.dir, walk, t); break;
    case 'raven': drawRaven(ctx, e.dir, t, e); break;
    case 'cusidhe': drawCuSidhe(ctx, e.dir, walk, t); break;
    case 'wisp': drawWisp(ctx, t, e); break;
    case 'golem': drawGolem(ctx, e.dir, walk); break;
    case 'banshee': drawBanshee(ctx, e.dir, t, e); break;
    case 'merrow': drawMerrow(ctx, e.dir, t, e); break;
  }
  ctx.restore();
}
function drawPuca(ctx, dir, walk, t) {
  ctx.scale(dir, 1);
  ctx.fillStyle = '#5b2f8a'; ellipse(ctx, 0, 6, 15, 13);
  ctx.fillStyle = '#4a2473'; ellipse(ctx, -6 + walk * 3, 16, 5, 4); ellipse(ctx, 6 - walk * 3, 16, 5, 4); /* feet */
  ctx.fillStyle = '#b093ff'; ellipse(ctx, 2, 10, 8, 6);
  ctx.fillStyle = '#7e4bb8'; circle(ctx, 4, -8, 12);
  ctx.fillStyle = '#7e4bb8'; ellipse(ctx, -4, -24 + Math.sin(t * 6) * 1.5, 4, 12, -0.25); ellipse(ctx, 8, -25 - Math.sin(t * 6) * 1.5, 4, 12, 0.2);
  ctx.fillStyle = '#e4d6ff'; ellipse(ctx, -4, -22, 1.8, 7, -0.25); ellipse(ctx, 8, -23, 1.8, 7, 0.2);
  ctx.fillStyle = '#ffe9a8'; ellipse(ctx, 2, -10, 3, 3.5); ellipse(ctx, 10, -10, 3, 3.5);
  ctx.fillStyle = '#c21d1d'; circle(ctx, 2.5, -10, 1.3); circle(ctx, 10.5, -10, 1.3);
  ctx.strokeStyle = '#2b1540'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(7, -3, 4, 0.2, Math.PI - 0.2); ctx.stroke(); /* grin */
}
function drawRaven(ctx, dir, t, e) {
  ctx.scale(dir, 1);
  const flap = Math.sin(t * 14 + e.x) * 0.9;
  ctx.fillStyle = '#1d2430';
  ctx.save(); ctx.rotate(-flap * 0.6); ellipse(ctx, -8, 0, 18, 6, 0.1); ctx.restore();
  ctx.fillStyle = '#242e3d'; ellipse(ctx, 0, 6, 14, 9);
  ctx.fillStyle = '#1a1f29'; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-22, 14); ctx.lineTo(-20, 6); ctx.closePath(); ctx.fill(); /* tail */
  ctx.fillStyle = '#1a1f29'; circle(ctx, 10, -2, 7);
  ctx.fillStyle = '#d9c25a'; ctx.beginPath(); ctx.moveTo(15, -3); ctx.lineTo(26, 0); ctx.lineTo(15, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; circle(ctx, 12, -4, 1.8); ctx.fillStyle = '#000'; circle(ctx, 12.5, -4, 0.9);
  ctx.fillStyle = '#2e3a4a';
  ctx.save(); ctx.rotate(flap * 0.7); ellipse(ctx, -4, -6, 16, 5, -0.3); ctx.restore();
}
function drawCuSidhe(ctx, dir, walk, t) {
  ctx.scale(dir, 1);
  ctx.fillStyle = '#245c45';
  roundRect(ctx, -10 + walk * 4, 10, 5, 12, 2); ctx.fill(); roundRect(ctx, 4 - walk * 4, 10, 5, 12, 2); ctx.fill();
  roundRect(ctx, -6 - walk * 4, 10, 5, 12, 2); ctx.fill(); roundRect(ctx, 8 + walk * 4, 10, 5, 12, 2); ctx.fill();
  ctx.fillStyle = '#2f7a5a'; ellipse(ctx, 0, 6, 17, 9);
  ctx.save(); ctx.translate(-16, 2); ctx.rotate(-0.8 + Math.sin(t * 8) * 0.2); ellipse(ctx, 0, -6, 3.5, 9); ctx.restore(); /* tail */
  ctx.fillStyle = '#3da178'; ellipse(ctx, 12, -4, 9, 7);
  ctx.fillStyle = '#2f7a5a'; ellipse(ctx, 19, -2, 5, 3.5);
  ctx.fillStyle = '#2f7a5a'; ellipse(ctx, 8, -12, 3, 6, -0.4);
  ctx.fillStyle = '#9dfcc8'; circle(ctx, 14, -6, 2); ctx.fillStyle = '#0a2a1c'; circle(ctx, 14.5, -6, 1);
  ctx.fillStyle = '#9dfcc8'; ctx.globalAlpha = 0.5; ellipse(ctx, 20, -1, 3, 1); ctx.globalAlpha = 1; /* breath glow */
}
function drawWisp(ctx, t, e) {
  const pulse = 1 + Math.sin(t * 6 + e.x) * 0.12;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 * pulse);
  g.addColorStop(0, 'rgba(230,255,255,0.95)'); g.addColorStop(0.4, 'rgba(120,220,255,0.7)'); g.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = g; circle(ctx, 0, 0, 22 * pulse);
  ctx.fillStyle = 'rgba(120,220,255,0.6)';
  for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; circle(ctx, Math.cos(a) * 16, Math.sin(a) * 10 - 4, 2.5); }
  ctx.fillStyle = '#0b3340'; circle(ctx, -4, -2, 1.6); circle(ctx, 4, -2, 1.6);
}
function drawGolem(ctx, dir, walk) {
  ctx.scale(dir, 1);
  ctx.fillStyle = '#6f7a8a'; roundRect(ctx, -22, 4 - walk * 3, 8, 16, 3); ctx.fill(); roundRect(ctx, 14, 4 + walk * 3, 8, 16, 3); ctx.fill();
  ctx.fillStyle = '#8b94a3'; roundRect(ctx, -14, 0, 28, 20, 4); ctx.fill();
  ctx.fillStyle = '#5a6470'; roundRect(ctx, -10, 16, 8, 6, 2); ctx.fill(); roundRect(ctx, 2, 16, 8, 6, 2); ctx.fill();
  ctx.fillStyle = '#bfc7d6'; roundRect(ctx, -10, -14, 20, 14, 3); ctx.fill();
  ctx.fillStyle = '#ffd34d'; ctx.fillRect(-5, -9, 4, 4); ctx.fillRect(1, -9, 4, 4);
  ctx.strokeStyle = '#4a525c'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-3, 12); ctx.lineTo(-5, 16); ctx.moveTo(6, 8); ctx.lineTo(9, 14); ctx.stroke();
  ctx.fillStyle = '#5b8a4a'; ellipse(ctx, 6, -14, 5, 2); /* moss on the head */
}
function drawBanshee(ctx, dir, t, e) {
  ctx.scale(dir, 1);
  const sway = Math.sin(t * 2.5 + e.x * 0.02) * 3;
  ctx.globalAlpha *= 0.85;
  const g = ctx.createLinearGradient(0, -24, 0, 26);
  g.addColorStop(0, '#eef3f7'); g.addColorStop(1, 'rgba(200,215,230,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-11, -10);
  ctx.quadraticCurveTo(-18 + sway, 10, -14, 26); ctx.quadraticCurveTo(-6, 18 + sway, 0, 26);
  ctx.quadraticCurveTo(6, 18 - sway, 14, 26); ctx.quadraticCurveTo(18 + sway, 10, 11, -10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9d6e3';   /* flowing hair */
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(-26, -16 + sway, -30, 6 + sway); ctx.quadraticCurveTo(-16, -4, -10, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eef3f7'; circle(ctx, 0, -14, 10);
  ctx.fillStyle = '#1a2a3a'; ellipse(ctx, -4, -15, 2.5, 3.5); ellipse(ctx, 4, -15, 2.5, 3.5);
  const wail = e.wailT > 0 ? 1 : 0.3;
  ctx.fillStyle = '#1a2a3a'; ellipse(ctx, 0, -7, 3, 4.5 * wail);
  if (e.wailT > 0) { ctx.strokeStyle = 'rgba(190,230,255,0.7)'; ctx.lineWidth = 2; for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(2, -7, 8 * i + (e.wailT * 20) % 8, -0.8, 0.8); ctx.stroke(); } }
}
function drawMerrow(ctx, dir, t, e) {
  ctx.scale(dir, 1);
  if (e.submerged) ctx.globalAlpha *= 0.55;
  const flick = Math.sin(t * 7 + e.x) * 0.5;
  ctx.fillStyle = '#2d7f8a';
  ctx.save(); ctx.translate(-10, 10); ctx.rotate(0.4 + flick * 0.3);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-16, 10); ctx.lineTo(-10, 0); ctx.lineTo(-16, -10); ctx.closePath(); ctx.fill(); ctx.restore(); /* fluke */
  ctx.fillStyle = '#3b9ea5'; ellipse(ctx, -4, 8, 12, 7, 0.4);
  ctx.fillStyle = '#e8d9b6'; ellipse(ctx, 4, -4, 8, 11);                 /* torso */
  ctx.fillStyle = '#3b9ea5'; ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(8, 2); ctx.lineTo(3, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8d9b6'; circle(ctx, 8, -17, 8);
  ctx.fillStyle = '#1b5a4e'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(-10, -8, -8, 6 + flick * 3); ctx.quadraticCurveTo(-2, -6, 4, -24); ctx.closePath(); ctx.fill(); /* seaweed hair */
  ctx.fillStyle = '#9ff0e8'; circle(ctx, 11, -18, 2.2); ctx.fillStyle = '#062a2a'; circle(ctx, 11.5, -18, 1.1);
  ctx.fillStyle = '#b14a4a'; ellipse(ctx, 13, -13, 2, 1);
  ctx.strokeStyle = '#e8d9b6'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(18, -14 + flick * 4); ctx.stroke();   /* reaching arm */
}

/* ---------- the Dullahan (boss) ---------- */
function drawDullahan(ctx, b, t) {
  const px = Math.floor(b.x - b.camX), py = Math.floor(b.y);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ellipse(ctx, px + b.w / 2, py + b.h, 36, 8);
  ctx.translate(px + b.w / 2, py + b.h / 2);
  ctx.scale(b.dir, 1);
  if (b.flash > 0) ctx.globalAlpha = 0.55;
  const gallop = b.charging ? Math.sin(t * 22) : Math.sin(t * 5) * 0.4;
  /* horse */
  ctx.fillStyle = '#15161c';
  roundRect(ctx, -20 + gallop * 5, 14, 8, 26, 3); ctx.fill(); roundRect(ctx, 6 - gallop * 5, 14, 8, 26, 3); ctx.fill();
  roundRect(ctx, -30 - gallop * 5, 14, 8, 26, 3); ctx.fill(); roundRect(ctx, 16 + gallop * 5, 14, 8, 26, 3); ctx.fill();
  ctx.fillStyle = '#1d1e26'; ellipse(ctx, -2, 6, 34, 16);
  ctx.save(); ctx.translate(26, -6); ctx.rotate(-0.5); ellipse(ctx, 0, -8, 9, 18); ctx.restore(); /* neck */
  ctx.fillStyle = '#1d1e26'; ellipse(ctx, 40, -24, 12, 7, 0.3); /* horse head */
  ctx.fillStyle = '#ff7b2a'; circle(ctx, 42, -26, 2); /* burning eye */
  ctx.strokeStyle = 'rgba(255,120,40,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-34, 2); ctx.quadraticCurveTo(-52, 6 + gallop * 6, -58, 24); ctx.stroke(); /* tail */
  /* rider: headless, caped */
  ctx.fillStyle = '#2a1e33';
  ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-30 - gallop * 4, 12); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); /* cape */
  ctx.fillStyle = '#3b2a47'; roundRect(ctx, -10, -34, 22, 32, 6); ctx.fill();
  ctx.fillStyle = '#5a4068'; ctx.fillRect(-10, -36, 22, 5); /* collar, no head above it */
  /* arm holding the head aloft */
  ctx.strokeStyle = '#3b2a47'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, -26); ctx.lineTo(22, -48); ctx.stroke();
  if (!b.headThrown) {
    const glow = ctx.createRadialGradient(24, -56, 2, 24, -56, 22);
    glow.addColorStop(0, 'rgba(140,255,160,0.9)'); glow.addColorStop(1, 'rgba(140,255,160,0)');
    ctx.fillStyle = glow; circle(ctx, 24, -56, 22);
    drawDullahanHead(ctx, 24, -56, 1, t);
  }
  /* whip */
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, -20); ctx.quadraticCurveTo(-30, -40 + Math.sin(t * 9) * 6, -48, -30 + Math.sin(t * 7) * 10); ctx.stroke();
  ctx.restore();
}
function drawDullahanHead(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#c9d8a8'; circle(ctx, 0, 0, 10);
  ctx.fillStyle = '#1b2b1a'; ellipse(ctx, -4, -2, 2.5, 3); ellipse(ctx, 4, -2, 2.5, 3);
  ctx.fillStyle = '#5bff8a'; circle(ctx, -4, -2, 1); circle(ctx, 4, -2, 1);
  ctx.strokeStyle = '#1b2b1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 2, 6, 0.1, Math.PI - 0.1); ctx.stroke();
  for (let i = -4; i <= 4; i += 2) { ctx.beginPath(); ctx.moveTo(i, 5); ctx.lineTo(i, 8); ctx.stroke(); } /* grinning teeth */
  ctx.restore();
}

/* ---------- projectiles ---------- */
function drawProjectile(ctx, p, camX, t) {
  const px = p.x - camX, py = p.y;
  ctx.save(); ctx.translate(px, py);
  if (p.kind === 'wail') {
    ctx.strokeStyle = `rgba(190,230,255,${0.75 * p.life / p.maxLife})`; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-p.dir * 10, 0, 8 + i * 6, p.dir > 0 ? -0.9 : Math.PI - 0.9, p.dir > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); }
  } else if (p.kind === 'head') {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    glow.addColorStop(0, 'rgba(140,255,160,0.8)'); glow.addColorStop(1, 'rgba(140,255,160,0)');
    ctx.fillStyle = glow; circle(ctx, 0, 0, 20);
    ctx.rotate(t * 8);
    drawDullahanHead(ctx, 0, 0, 1.2, t);
  } else if (p.kind === 'ember') {
    ctx.fillStyle = `rgba(255,${120 + Math.floor(Math.random() * 80)},40,0.9)`; circle(ctx, 0, 0, 5);
  }
  ctx.restore();
}

/* ---------- pickups ---------- */
function drawAcorn(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3 + x * 0.05) * 2);
  ctx.fillStyle = '#b8722f'; ellipse(ctx, 0, 4, 7, 8.5);
  ctx.fillStyle = '#8c4f1b'; ellipse(ctx, 0, -2, 8.5, 4.5);
  ctx.fillStyle = '#5e3410'; ctx.fillRect(-1.2, -9, 2.4, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(ctx, -3, 4, 1.6, 3.5);
  ctx.restore();
}
function drawPowerUpIcon(ctx, kind, x, y, t) {
  const c = PU_COLOURS[kind] || '#fff';
  ctx.save(); ctx.translate(x, y + Math.sin(t * 4) * 4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; circle(ctx, 0, 0, 14);
  ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.lineCap = 'round';
  switch (kind) {
    case 'Speed Boost':
      ctx.beginPath(); ctx.moveTo(2, -9); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 9); ctx.lineTo(5, -1); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill(); break;
    case 'Shield':
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -6); ctx.quadraticCurveTo(8, 6, 0, 9); ctx.quadraticCurveTo(-8, 6, -8, -6); ctx.closePath(); ctx.fill(); break;
    case 'Extra Life':
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-11, -1, -6, -10, 0, -4); ctx.bezierCurveTo(6, -10, 11, -1, 0, 8); ctx.fill(); break;
    case 'Time Freeze':
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.moveTo(-3, -6); ctx.lineTo(0, -3); ctx.lineTo(3, -6); ctx.moveTo(-3, 6); ctx.lineTo(0, 3); ctx.lineTo(3, 6); ctx.stroke(); ctx.restore(); } break;
    case 'Score Multiplier':
      ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×2', 0, 1); break;
    case 'Health Restore':
      ctx.fillRect(-2.5, -8, 5, 16); ctx.fillRect(-8, -2.5, 16, 5); break;
  }
  ctx.restore();
}

/* ---------- level furniture ---------- */
function drawCheckpoint(ctx, x, y, active, t) {
  ctx.save(); ctx.translate(x, y);
  const glow = active ? '#7dffb0' : '#8fb3ff';
  if (active) { const g = ctx.createRadialGradient(0, -20, 2, 0, -20, 40); g.addColorStop(0, 'rgba(125,255,176,0.35)'); g.addColorStop(1, 'rgba(125,255,176,0)'); ctx.fillStyle = g; circle(ctx, 0, -20, 40); }
  /* a small cairn of stacked stones */
  ctx.fillStyle = '#6b7684'; ellipse(ctx, 0, -5, 16, 6); ctx.fillStyle = '#7f8a98'; ellipse(ctx, -2, -13, 12, 5.5); ctx.fillStyle = '#929dab'; ellipse(ctx, 1, -20, 9, 4.5); ctx.fillStyle = '#a7b2c0'; ellipse(ctx, 0, -26, 6, 3.5);
  ctx.fillStyle = glow; ctx.globalAlpha = 0.7 + Math.sin(t * 4) * 0.3; circle(ctx, 0, -33, 3.5); ctx.globalAlpha = 1;
  ctx.restore();
}
function drawGoal(ctx, x, y, t, locked) {
  ctx.save(); ctx.translate(x, y);
  /* standing-stone gateway with ogham strokes */
  ctx.fillStyle = '#5c6670'; roundRect(ctx, -34, -78, 18, 78, 5); ctx.fill(); roundRect(ctx, 16, -78, 18, 78, 5); ctx.fill();
  ctx.fillStyle = '#6f7a86'; roundRect(ctx, -40, -90, 80, 16, 5); ctx.fill();
  ctx.strokeStyle = '#2f353c'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-30, -66 + i * 12); ctx.lineTo(-20, -66 + i * 12); ctx.moveTo(20, -60 + i * 12); ctx.lineTo(30, -60 + i * 12); ctx.stroke(); }
  if (locked) {
    ctx.strokeStyle = 'rgba(255,80,60,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-16, -72); ctx.lineTo(16, -8); ctx.moveTo(16, -72); ctx.lineTo(-16, -8); ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -74, 0, 0);
    g.addColorStop(0, 'rgba(255,220,120,0.0)'); g.addColorStop(0.5, `rgba(255,220,120,${0.25 + Math.sin(t * 3) * 0.1})`); g.addColorStop(1, 'rgba(255,220,120,0.05)');
    ctx.fillStyle = g; ctx.fillRect(-16, -74, 32, 74);
    ctx.fillStyle = '#ffe28a';
    for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.6; circle(ctx, Math.sin(a) * 12, -40 + Math.cos(a * 1.3) * 26, 2); }
  }
  ctx.restore();
}
function drawSpikes(ctx, x, y, w, h) {
  ctx.save(); ctx.translate(x, y);
  const n = Math.max(2, Math.floor(w / 14));
  for (let i = 0; i < n; i++) {
    const sx = i * w / n, sw = w / n;
    ctx.fillStyle = i % 2 ? '#c7d3e3' : '#aebbcd';
    ctx.beginPath(); ctx.moveTo(sx, h); ctx.lineTo(sx + sw / 2, 0); ctx.lineTo(sx + sw, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(sx + sw / 2, 0); ctx.lineTo(sx + sw / 2 + 2, h * 0.5); ctx.lineTo(sx + sw / 2, h * 0.5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* Platforms are tiled per theme: turf, stone, limestone, basalt, jetty, rooftop, sand. */
function drawPlatform(ctx, x, y, w, h, theme, mover) {
  ctx.save();
  const tile = theme.tile || 'turf';
  const base = theme.ground;
  switch (tile) {
    case 'turf':
      ctx.fillStyle = shade(base, -30); roundRect(ctx, x, y + 6, w, h - 6, 4); ctx.fill();
      ctx.fillStyle = '#4f9a4a'; roundRect(ctx, x, y, w, 10, 4); ctx.fill();
      ctx.fillStyle = '#6ab75c'; for (let i = 4; i < w - 4; i += 11) ctx.fillRect(x + i, y, 4, 4);
      ctx.fillStyle = shade(base, -50); for (let i = 10; i < w - 10; i += 37) ellipse(ctx, x + i, y + 18, 5, 3);
      break;
    case 'stone':
      ctx.fillStyle = shade(base, -20); roundRect(ctx, x, y, w, h, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(x + i + (Math.floor(y) % 2) * 20, y + 2); ctx.lineTo(x + i + 20, y + h - 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 2, y + 2, w - 4, 3);
      break;
    case 'limestone':
      ctx.fillStyle = '#b9bfc0'; roundRect(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = '#d6dadb'; ctx.fillRect(x + 2, y + 2, w - 4, 4);
      ctx.strokeStyle = '#6d7577'; ctx.lineWidth = 2;
      for (let i = 18; i < w - 10; i += 46) { ctx.beginPath(); ctx.moveTo(x + i, y + 4); ctx.lineTo(x + i + 6, y + h - 4); ctx.stroke(); }
      ctx.fillStyle = '#6f9a5a'; for (let i = 30; i < w - 10; i += 70) ellipse(ctx, x + i, y + h - 8, 6, 3); /* tufts in the grykes */
      break;
    case 'basalt':
      ctx.fillStyle = '#3c4654'; roundRect(ctx, x, y, w, h, 2); ctx.fill();
      ctx.strokeStyle = '#1f252e'; ctx.lineWidth = 2;
      for (let i = 0; i < w; i += 26) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke(); }
      ctx.fillStyle = '#596574'; for (let i = 0; i < w - 4; i += 26) ctx.fillRect(x + i + 3, y + 2, 20, 4);
      break;
    case 'jetty':
      ctx.fillStyle = '#5a3d22'; for (let i = 20; i < w - 10; i += 90) ctx.fillRect(x + i, y + h, 8, 90);
      ctx.fillStyle = '#8a5f33'; roundRect(ctx, x, y, w, h, 2); ctx.fill();
      ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 1.5;
      for (let i = 0; i < w; i += 22) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, y + 2, w, 3);
      break;
    case 'rooftop':
      ctx.fillStyle = '#596274'; roundRect(ctx, x, y, w, h, 2); ctx.fill();
      ctx.fillStyle = '#8b96a8'; ctx.fillRect(x, y, w, 7);
      ctx.fillStyle = '#b9c3d2'; ctx.fillRect(x, y, w, 2);
      ctx.fillStyle = '#434b5a'; for (let i = 10; i < w - 10; i += 60) ctx.fillRect(x + i, y + 10, 30, h - 14);
      ctx.fillStyle = '#ffd36b'; for (let i = 16; i < w - 10; i += 60) ctx.fillRect(x + i, y + 13, 6, 5);
      break;
    case 'sand':
      ctx.fillStyle = '#b89c6a'; roundRect(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = '#d6bb86'; ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#7f6a44'; for (let i = 14; i < w - 10; i += 50) ellipse(ctx, x + i, y + 14, 4, 2);
      break;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + h - 4, w, 4);
  if (mover) {
    ctx.strokeStyle = 'rgba(255,230,140,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,230,140,0.9)';
    const cx = x + w / 2;
    if (mover.axis === 'x') { ctx.beginPath(); ctx.moveTo(cx - 14, y + h / 2); ctx.lineTo(cx - 8, y + h / 2 - 5); ctx.lineTo(cx - 8, y + h / 2 + 5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 14, y + h / 2); ctx.lineTo(cx + 8, y + h / 2 - 5); ctx.lineTo(cx + 8, y + h / 2 + 5); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(cx, y + 3); ctx.lineTo(cx - 5, y + 9); ctx.lineTo(cx + 5, y + 9); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, y + h - 3); ctx.lineTo(cx - 5, y + h - 9); ctx.lineTo(cx + 5, y + h - 9); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore();
}

/* Water: a translucent body with an animated surface line. */
function drawWater(ctx, wtr, camX, t, front) {
  const x = wtr.x - camX, y = wtr.y, w = wtr.w, h = wtr.h;
  if (x + w < 0 || x > VIRTUAL_W) return;
  ctx.save();
  if (!front) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(60,150,200,0.55)'); g.addColorStop(1, 'rgba(10,40,80,0.9)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = 'rgba(60,140,200,0.28)'; ctx.fillRect(x, y + 4, w, h - 4);
    ctx.strokeStyle = 'rgba(220,245,255,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = Math.max(0, x); i <= Math.min(VIRTUAL_W, x + w); i += 6) {
      const yy = y + Math.sin((i + camX) * 0.05 + t * 2.4) * 2.2 + Math.sin((i + camX) * 0.013 - t * 1.1) * 1.5;
      if (i === Math.max(0, x)) ctx.moveTo(i, yy); else ctx.lineTo(i, yy);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = Math.max(0, x) + 20; i < Math.min(VIRTUAL_W, x + w); i += 90) ellipse(ctx, i + Math.sin(t + i) * 6, y + 14 + Math.sin(t * 1.7 + i) * 4, 14, 2);
  }
  ctx.restore();
}
