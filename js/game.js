/* Rith Dearg — game loop, world simulation, rendering and screens. */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
function resizeCanvas() {
  const rect = document.getElementById('wrapper').getBoundingClientRect();
  const scale = Math.min(rect.width / VIRTUAL_W, rect.height / VIRTUAL_H);
  canvas.style.width = Math.floor(VIRTUAL_W * scale) + 'px';
  canvas.style.height = Math.floor(VIRTUAL_H * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const backdropCache = new Map();
function backdropFor(theme) { if (!backdropCache.has(theme.name)) backdropCache.set(theme.name, new Backdrop(theme)); return backdropCache.get(theme.name); }

let game = null;

class Game {
  constructor() {
    this.state = STATE.MENU; this.levelIndex = 0; this.level = null; this.backdrop = null;
    this.player = new Player(this.getSkin()); this.camX = 0; this.score = 0; this.levelScore = 0;
    this.kills = 0; this.puCount = 0; this.acornCount = 0; this.tLevel = 0; this.time = 0;
    this.pus = []; this.projectiles = []; this.particles = new Particles(); this.checkpoint = { x: 60, y: 420 };
    this.activePU = {}; this.boss = null; this.shake = 0; this.flashLost = 0; this.banner = 0; this.gateOpened = false;
  }
  getSkin() { return SKINS.find(s => s.id === getSavedSkinId()) || SKINS[0]; }
  startLevel(i) {
    this.levelIndex = i; this.level = genLevel(i); this.backdrop = backdropFor(this.level.theme);
    this.enemies = this.level.enemies.map(e => new Enemy(e.type, e.x, e.y));
    this.boss = this.level.boss ? new Boss(this.level.boss.x, this.level.boss.y, this.level.arena) : null;
    const lives = this.player ? this.player.lives : START_LIVES;
    this.player = new Player(this.getSkin()); this.player.lives = lives;
    this.player.x = this.level.start.x; this.player.y = this.level.start.y;
    this.camX = 0; this.kills = 0; this.puCount = 0; this.acornCount = 0; this.levelScore = 0; this.tLevel = 0;
    this.pus = []; this.projectiles = []; this.particles = new Particles(); this.activePU = {};
    this.checkpoint = { x: this.level.start.x + this.player.width / 2, y: 420 };
    this.banner = 2.8; this.gateOpened = false; this.bossIntro = !!this.boss;
    clearInput();
    SND.startMusic('play');
  }
  hasPU(k) { return (this.activePU[k] || 0) > 0; }
  addPU(k) {
    if (k === 'Extra Life') { this.player.lives++; SND.power(); return; }
    if (k === 'Health Restore') { this.player.health = Math.min(MAX_HEALTH, this.player.health + 35); SND.power(); return; }
    this.activePU[k] = (this.activePU[k] || 0) + (PU_DUR[k] || 0);
    if (k === 'Speed Boost') this.player.speedMul = 1.4;
    SND.power();
  }
  updatePU(dt) {
    for (const k of Object.keys(this.activePU)) {
      this.activePU[k] -= dt;
      if (this.activePU[k] <= 0) { delete this.activePU[k]; if (k === 'Speed Boost') this.player.speedMul = 1; }
    }
  }
  spawnDrop(x, y) {
    if (Math.random() > 0.32) return;
    const pool = ['Speed Boost', 'Shield', 'Extra Life', 'Time Freeze', 'Score Multiplier', 'Health Restore'];
    const weights = [1, 1.2, 0.8, 0.8, 0.7, 1.2];
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), idx = 0;
    for (; idx < pool.length; idx++) { if (r < weights[idx]) break; r -= weights[idx]; }
    this.pus.push(new PowerUp(pool[Math.min(idx, pool.length - 1)], x - 12, y));
  }
  spawnProjectile(p) { p.maxLife = p.life; p.grav = p.grav || 0; this.projectiles.push(p); }
  windAt(cx, onGround) {
    let w = 0;
    for (const z of this.level.windZones) if (cx >= z.x && cx <= z.x + z.w) w += z.force * (0.55 + 0.45 * Math.sin(this.time * 1.3 + z.x));
    return w * (onGround ? 0.5 : 1);
  }
  puff(x, y, n) { this.particles.emit(x, y, n, { col: 'rgba(220,220,200,0.8)', speed: 50, life: 0.4, size: 3, angle: -Math.PI / 2, spread: 2.4 }); }
  splash(x, y, n) { this.particles.emit(x, y, n, { col: 'rgba(200,235,255,0.9)', speed: 170, life: 0.6, size: 3, angle: -Math.PI / 2, spread: 1.6, grav: 700 }); }
  bubbles(x, y, n) { this.particles.emit(x, y, n, { col: 'rgba(230,250,255,0.7)', speed: 40, life: 0.9, size: 2.5, angle: -Math.PI / 2, spread: 0.8 }); }
  sparks(x, y, n, col) { this.particles.emit(x, y, n, { col, speed: 160, life: 0.45, size: 2.5, grav: 300 }); }

  update(dt) {
    if (this.state !== STATE.PLAYING) return;
    this.time += dt;
    const frozen = this.hasPU('Time Freeze');
    if (!frozen) this.tLevel += dt;
    this.updatePU(dt);
    if (this.banner > 0) this.banner -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.flashLost > 0) this.flashLost -= dt;
    const L = this.level, P = this.player;
    for (const m of L.movers) {
      const s = Math.sin(this.time * m.speed + m.phase) * m.range;
      const nx = m.axis === 'x' ? m.ox + s : m.ox, ny = m.axis === 'y' ? m.oy + s : m.oy;
      m.dx = nx - m.x; m.dy = ny - m.y; m.x = nx; m.y = ny;
    }
    P.carriedBy(P.standing);
    P.control(dt, L, this); P.physics(dt, L, this); P.updateAnim(dt);
    if (this.state !== STATE.PLAYING) return;
    const target = clamp(P.x - 360 + P.dir * 60, 0, L.width - VIRTUAL_W);
    this.camX += (target - this.camX) * Math.min(1, dt * 6);
    if (!frozen) for (const e of this.enemies) e.update(dt, L, P, this);
    if (this.boss && !frozen) this.boss.update(dt, L, P, this);
    if (this.boss && this.bossIntro && P.x > L.arena.x - 80) { this.bossIntro = false; SND.bossRoar(); this.shake = 0.5; }
    this.updateProjectiles(dt, frozen);
    /* wind streaks */
    for (const z of L.windZones) {
      if (z.x > this.camX + VIRTUAL_W || z.x + z.w < this.camX) continue;
      if (Math.random() < dt * 14) this.particles.emit(this.camX + Math.random() * VIRTUAL_W, Math.random() * VIRTUAL_H, 1, { col: 'rgba(255,255,255,0.45)', speed: Math.abs(z.force) * 2.2, life: 0.9, size: 1.5, angle: z.force > 0 ? 0 : Math.PI, spread: 0.1 });
    }
    const mult = this.hasPU('Score Multiplier') ? 2 : 1;
    if (P.attackActive > 0) {
      const atk = Rect(P.x + (P.dir > 0 ? P.width - 10 : -PLAYER.attackReach + 10), P.y - 6, PLAYER.attackReach, P.height + 4);
      for (const e of this.enemies) {
        if (e.hp > 0 && e.flash <= 0 && aabb(atk, e.rect())) {
          e.hp -= 1; e.flash = 0.25; e.vx = P.dir * 120; this.levelScore += 10 * mult; this.sparks(e.x + e.w / 2, e.y + e.h / 2, 6, '#fff');
          if (e.hp <= 0) { this.kills++; this.levelScore += 100 * mult; SND.enemyDown(); this.spawnDrop(e.x + e.w / 2, e.y); this.sparks(e.x + e.w / 2, e.y + e.h / 2, 12, '#ffd36b'); }
        }
      }
      if (this.boss && this.boss.alive && aabb(atk, this.boss.rect())) {
        const dmg = this.boss.state === 'stunned' ? 2 : 1;
        if (this.boss.takeHit(dmg)) { this.levelScore += 40 * dmg * mult; this.sparks(P.x + P.width / 2 + P.dir * 30, P.y + 10, 10, '#9fffb0'); }
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const e of this.enemies) if (!(e.type === 'merrow' && e.submerged && !e.leaping) && aabb(P.rect(), e.rect())) P.hurt(18);
    if (this.boss && this.boss.alive && aabb(P.rect(), this.boss.rect())) { P.hurt(25); if (P.invuln > 0.7) { P.vy = -420; P.x += this.boss.dir * 30; } }
    if (this.boss && !this.boss.alive && !this.gateOpened) {
      this.gateOpened = true; L.goalLocked = false; this.levelScore += 1000 * mult; this.kills++;
      SND.fanfare(); this.sparks(this.boss.x + this.boss.w / 2, this.boss.y + 20, 40, '#9fffb0'); this.shake = 0.6;
    }
    const pr = P.rect();
    L.acorns = L.acorns.filter(a => { if (aabb(pr, Rect(a.x - 9, a.y - 10, 18, 20))) { this.acornCount++; this.levelScore += 25 * mult; SND.acorn(); this.sparks(a.x, a.y, 5, '#ffcf7a'); return false; } return true; });
    for (const pu of this.pus) pu.update(dt, L);
    this.pus = this.pus.filter(p => {
      if (p.life <= 0) return false;
      if (aabb(pr, p.rect())) { this.addPU(p.kind); this.puCount++; this.levelScore += 50 * mult; SND.collect(); return false; }
      return true;
    });
    for (const cp of L.checkpoints) {
      if (this.checkpoint.x === cp.x) continue;
      if (aabb(pr, Rect(cp.x - 16, cp.y - 44, 32, 46))) { this.checkpoint = { x: cp.x, y: cp.y }; SND.checkpoint(); this.sparks(cp.x, cp.y - 30, 12, '#7dffb0'); }
    }
    this.particles.update(dt);
    if (!L.goalLocked && P.x + P.width >= L.goalX - 6 && P.x <= L.goalX + 40 && Math.abs(P.y + P.height - L.goalY) < 60) levelComplete();
  }
  updateProjectiles(dt, frozen) {
    const P = this.player;
    for (const p of this.projectiles) {
      if (frozen) continue;
      p.life -= dt;
      if (p.kind === 'head' && p.life < p.maxLife * 0.55 && p.returnTo) {
        const tx = p.returnTo.x + p.returnTo.w / 2, ty = p.returnTo.y - 20;
        p.vx += (tx - p.x) * 4 * dt * 2; p.vy += (ty - p.y) * 4 * dt * 2; p.grav = 0;
        if (Math.hypot(tx - p.x, ty - p.y) < 30) { p.life = 0; p.returnTo.headThrown = false; }
      }
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'ember' && solidRects(this.level).some(s => aabb(Rect(p.x - 3, p.y - 3, 6, 6), s))) { p.life = 0; this.sparks(p.x, p.y, 4, '#ff9a4a'); }
      if (p.life > 0 && aabb(P.rect(), Rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2))) { P.hurt(p.dmg); if (p.kind !== 'head') p.life = 0; }
    }
    this.projectiles = this.projectiles.filter(p => { if (p.life <= 0 && p.kind === 'head' && p.returnTo) p.returnTo.headThrown = false; return p.life > 0; });
  }

  draw() {
    const L = this.level, cam = this.camX, t = this.time;
    this.backdrop.draw(ctx, cam, t);
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 8 * this.shake, (Math.random() - 0.5) * 6 * this.shake);
    for (const w of L.water) drawWater(ctx, w, cam, t, false);
    const visible = r => r.x - cam < VIRTUAL_W + 40 && r.x + r.w - cam > -40;
    for (const p of L.platforms) if (visible(p)) drawPlatform(ctx, Math.floor(p.x - cam), Math.floor(p.y), p.w, p.h, p.tile ? Object.assign({}, L.theme, { tile: p.tile }) : L.theme);
    for (const m of L.movers) if (visible(m)) drawPlatform(ctx, Math.floor(m.x - cam), Math.floor(m.y), m.w, m.h, L.theme, m);
    for (const h of L.hazards) if (visible(h)) drawSpikes(ctx, Math.floor(h.x - cam), Math.floor(h.y), h.w, h.h);
    for (const a of L.acorns) if (a.x - cam > -20 && a.x - cam < VIRTUAL_W + 20) drawAcorn(ctx, a.x - cam, a.y, t);
    for (const cp of L.checkpoints) drawCheckpoint(ctx, cp.x - cam, cp.y, this.checkpoint.x === cp.x, t);
    drawGoal(ctx, L.goalX - cam, L.goalY, t, L.goalLocked);
    for (const p of this.pus) p.draw(ctx, cam, t);
    for (const e of this.enemies) if (visible(e)) e.draw(ctx, cam, t);
    if (this.boss) this.boss.draw(ctx, cam, t);
    for (const p of this.projectiles) drawProjectile(ctx, p, cam, t);
    this.player.draw(ctx, cam);
    this.particles.draw(ctx, cam);
    for (const w of L.water) drawWater(ctx, w, cam, t, true);
    ctx.restore();
    this.drawOverlay();
  }
  drawOverlay() {
    const P = this.player;
    if (P.water || P.breath < MAX_BREATH - 0.1) {
      const x = P.x - this.camX + P.width / 2 - 30, y = P.y - 18;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, x, y, 60, 8, 4); ctx.fill();
      ctx.fillStyle = P.breath < 2 ? '#ff6a4a' : '#7fe0ff'; roundRect(ctx, x + 1, y + 1, 58 * clamp(P.breath / MAX_BREATH, 0, 1), 6, 3); ctx.fill();
    }
    if (this.boss && this.boss.alive && !this.bossIntro) {
      const w = 360, x = (VIRTUAL_W - w) / 2, y = VIRTUAL_H - 46;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, x - 4, y - 4, w + 8, 22, 6); ctx.fill();
      ctx.fillStyle = '#5bff8a'; roundRect(ctx, x, y, w * this.boss.hp / this.boss.maxHp, 14, 5); ctx.fill();
      ctx.fillStyle = '#eef'; ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('The Dullahan', VIRTUAL_W / 2, y - 6);
    }
    if (this.hasPU('Time Freeze')) { ctx.fillStyle = 'rgba(150,220,255,0.12)'; ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H); }
    if (P.invuln > 0.5 || this.flashLost > 0) { ctx.fillStyle = `rgba(255,60,40,${0.12 + (this.flashLost > 0 ? 0.2 : 0)})`; ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H); }
    if (this.banner > 0) {
      const a = clamp(Math.min(this.banner, 2.8 - this.banner) * 1.4, 0, 1);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, VIRTUAL_W / 2 - 220, 190, 440, 92, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 34px "Trebuchet MS", system-ui, sans-serif'; ctx.fillText(this.level.theme.name, VIRTUAL_W / 2, 222);
      ctx.fillStyle = '#ffcc4d'; ctx.font = '600 15px system-ui, sans-serif'; ctx.fillText(`Level ${this.levelIndex + 1} of ${TOTAL_LEVELS}` + (LEVEL_NOTES[this.levelIndex] ? ' — ' + LEVEL_NOTES[this.levelIndex] : ''), VIRTUAL_W / 2, 258);
      ctx.restore();
    }
  }
}

/* ---------- title scene (animated backdrop behind the menu) ---------- */
const titleScene = { backdrop: null, camX: 0, anim: { state: 'run', phase: 0, attackT: 0, dir: 1, time: 0 }, theme: theme('Title', 'glen', 'dusk', { roundTower: true, tile: 'turf' }) };
function drawTitleScene(dt) {
  const s = titleScene;
  if (!s.backdrop) s.backdrop = new Backdrop(s.theme);
  s.camX += 55 * dt; s.anim.time += dt; s.anim.phase = (s.anim.phase + dt * 2.2) % 1;
  s.backdrop.draw(ctx, s.camX, s.anim.time);
  drawPlatform(ctx, -10, 470, VIRTUAL_W + 20, 70, s.theme);
  for (let i = 0; i < 6; i++) { const x = ((i * 230 - s.camX * 0.9) % (VIRTUAL_W + 200) + VIRTUAL_W + 200) % (VIRTUAL_W + 200) - 100; drawAcorn(ctx, x, 440, s.anim.time); }
  const hop = Math.abs(Math.sin(s.anim.time * 2.2 * Math.PI)) * 3;
  ctx.save(); ctx.translate(180, 446 - hop);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(ctx, 0, 24 + hop, 16, 5);
  drawSquirrel(ctx, (game && game.getSkin()) || SKINS[0], s.anim); ctx.restore();
}

/* ---------- main loop ---------- */
let lastTime = performance.now() / 1000;
function loop() {
  const now = performance.now() / 1000; const dt = Math.min(DT_CAP, now - lastTime); lastTime = now;
  if (game && game.state === STATE.PLAYING) game.update(dt);
  render(dt); requestAnimationFrame(loop);
}
function render(dt) {
  if (game && [STATE.PLAYING, STATE.PAUSED, STATE.LEVEL_COMPLETE, STATE.GAME_OVER].includes(game.state) && game.level) game.draw();
  else drawTitleScene(dt);
  updateHUD();
}

/* ---------- screens ---------- */
const $ = id => document.getElementById(id);
const SCREENS = ['menu', 'levelSelect', 'howTo', 'pause', 'levelComplete', 'gameOver', 'customise'];
function showScreen(id) { for (const s of SCREENS) $(s).hidden = s !== id; }
function showHUD(show) { $('hud').hidden = !show; }
function refreshTitleButtons() {
  const p = getProgress();
  $('btnContinue').hidden = p.unlocked <= 1;
  $('btnContinue').textContent = `Continue (Level ${Math.min(p.unlocked, TOTAL_LEVELS)})`;
}
function toMenu() {
  game = new Game(); game.state = STATE.MENU;
  showScreen('menu'); showHUD(false); refreshTitleButtons();
  SND.startMusic('title');
}
function startGame(index = 0) {
  SND.ensure(); showScreen(null); showHUD(true);
  game = new Game(); game.state = STATE.PLAYING; game.startLevel(index); SND.ui();
}
function togglePause() {
  if (!game) return;
  if (game.state === STATE.PLAYING) { game.state = STATE.PAUSED; showScreen('pause'); clearInput(); }
  else if (game.state === STATE.PAUSED) { game.state = STATE.PLAYING; showScreen(null); lastTime = performance.now() / 1000; }
}
function onPauseKey() { if (game && (game.state === STATE.PLAYING || game.state === STATE.PAUSED)) togglePause(); }
function onEnterKey() {
  if (!game) return;
  if (game.state === STATE.MENU && !$('menu').hidden) startGame(0);
  else if (game.state === STATE.LEVEL_COMPLETE && document.activeElement !== $('lcName')) nextLevel();
  else if (game.state === STATE.GAME_OVER && document.activeElement !== $('goName')) retry();
}
function levelComplete() {
  if (!game || game.state !== STATE.PLAYING) return;
  game.state = STATE.LEVEL_COMPLETE; clearInput();
  const time = game.tLevel, timeBonus = Math.max(0, 1500 - Math.floor(time * 40));
  game.levelScore += timeBonus; game.score += game.levelScore;
  recordLevelResult(game.levelIndex, game.levelScore);
  const last = game.levelIndex + 1 >= TOTAL_LEVELS;
  $('lcTitle').textContent = last ? 'Ireland Crossed!' : 'Level Complete';
  $('levelSummary').innerHTML = `<b>Level ${game.levelIndex + 1}: ${game.level.theme.name}</b><br/>` +
    `Time ${time.toFixed(2)}s (+${timeBonus}) · Acorns ${game.acornCount} · Foes ${game.kills} · Power-ups ${game.puCount}<br/>` +
    `Level score <b>${game.levelScore}</b> · Run total <b>${game.score}</b>` +
    (last ? '<br/><br/>You have run the length of Ireland and sent the Dullahan packing. Go raibh maith agat for playing!' : '');
  $('btnNextLevel').hidden = last; $('lcSaved').textContent = ''; $('lcName').value = Store.get('rd_name', '');
  showScreen('levelComplete'); SND.fanfare(); SND.stopMusic();
}
function nextLevel() {
  if (!game || game.state !== STATE.LEVEL_COMPLETE) return;
  const next = game.levelIndex + 1;
  if (next >= TOTAL_LEVELS) { toMenu(); return; }
  showScreen(null); game.startLevel(next); game.state = STATE.PLAYING;
}
function gameOver() {
  if (!game || game.state !== STATE.PLAYING) return;
  game.state = STATE.GAME_OVER; clearInput(); SND.stopMusic(); SND.gameOverCue();
  $('goSummary').innerHTML = `You fell on level ${game.levelIndex + 1}: ${game.level.theme.name}.<br/>Final score <b>${game.score + game.levelScore}</b>`;
  $('goSaved').textContent = ''; $('goName').value = Store.get('rd_name', '');
  showScreen('gameOver');
}
function retry() { if (!game) return; const idx = game.levelIndex; startGame(idx); }
function saveScore(inputId, msgId) {
  const name = ($(inputId).value || '').trim().substring(0, 16);
  if (!name) { $(msgId).textContent = 'Type a name first.'; return; }
  Store.set('rd_name', name);
  addLB({ name, score: game.score + (game.state === STATE.GAME_OVER ? game.levelScore : 0), level: game.levelIndex + 1, date: new Date().toISOString() });
  $(msgId).textContent = 'Saved to the leaderboard.'; SND.ui(); renderLB(); showLBDock(true);
}

/* HUD */
function updateHUD() {
  if (!game || !game.level || game.state === STATE.MENU) return;
  $('hudLevel').textContent = game.levelIndex + 1; $('hudTotal').textContent = TOTAL_LEVELS;
  $('hudLevelName').textContent = game.level.theme.name;
  $('hudScore').textContent = game.score + game.levelScore;
  $('hudKills').textContent = game.kills; $('hudAcorns').textContent = game.acornCount;
  $('hudTime').textContent = game.tLevel.toFixed(1);
  $('healthFill').style.width = (clamp(game.player.health / MAX_HEALTH, 0, 1) * 100) + '%';
  const lives = $('hudLives'); const n = Math.max(0, game.player.lives);
  if (lives.childElementCount !== n) { lives.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'life'; lives.appendChild(d); } }
  const apu = Object.keys(game.activePU);
  $('hudActivePU').hidden = apu.length === 0;
  if (apu.length) $('hudActivePU').textContent = apu.map(k => `${k} ${Math.ceil(game.activePU[k])}s`).join(' · ');
}

/* Level select */
function renderLevelGrid() {
  const grid = $('levelGrid'); grid.innerHTML = '';
  const p = getProgress();
  LEVEL_THEMES.forEach((th, i) => {
    const b = document.createElement('button');
    const locked = i + 1 > p.unlocked;
    b.className = 'levelBtn' + (locked ? ' locked' : '') + (i >= 20 ? ' special' : '');
    b.disabled = locked;
    b.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}${locked ? ' · locked' : ''}</span><span class="nm">${th.name}</span>` + (p.best[i] ? `<span class="best">Best ${p.best[i]}</span>` : '');
    b.addEventListener('mouseenter', () => { $('levelNote').textContent = LEVEL_NOTES[i] || `${th.name} — ${th.time === 'night' ? 'a night run' : th.time === 'dusk' ? 'a run at dusk' : 'a daytime run'}.`; });
    b.addEventListener('click', () => { if (!locked) startGame(i); });
    grid.appendChild(b);
  });
}

/* Leaderboard dock */
function renderLB() {
  const list = $('lbList'); list.innerHTML = '';
  const lb = getLB();
  if (!lb.length) { const li = document.createElement('li'); li.textContent = 'No scores yet. Go and set a record!'; list.appendChild(li); return; }
  lb.slice(0, 20).forEach(e => { const li = document.createElement('li'); const d = new Date(e.date); li.textContent = `${e.name} — ${e.score} pts${e.level ? ` (level ${e.level})` : ''} · ${d.toLocaleDateString()}`; list.appendChild(li); });
}
function showLBDock(show = true) { const dock = $('lbDock'); if (show) { dock.classList.add('show'); renderLB(); } else dock.classList.remove('show'); }
function toggleLBDock() { showLBDock(!$('lbDock').classList.contains('show')); }

/* Sound button */
function setMuted(m) { $('btnMute').textContent = m ? 'Sound: off' : 'Sound: on'; $('btnMute').setAttribute('aria-pressed', m ? 'true' : 'false'); }

/* Customise */
function renderSkins() {
  const row = $('skinsRow'); row.innerHTML = '';
  const best = Math.max(0, ...getLB().map(e => e.score), ...Object.values(getProgress().best));
  const current = getSavedSkinId();
  SKINS.forEach(s => {
    const ok = best >= s.unlock;
    const card = document.createElement('button'); card.className = 'skinCard' + (s.id === current ? ' selected' : ''); card.disabled = !ok;
    const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const g = c.getContext('2d'); g.translate(48, 52); g.scale(1.3, 1.3);
    drawSquirrel(g, s, { state: 'idle', phase: 0, attackT: 0, dir: 1, time: 0 });
    card.appendChild(c);
    const label = document.createElement('span'); label.textContent = ok ? s.name : `${s.name} — unlock at ${s.unlock}`;
    card.appendChild(label);
    if (s.acc) { const acc = document.createElement('small'); acc.className = 'hint'; acc.textContent = { scarf: 'red scarf', 'acorn-cap': 'acorn cap', cloak: 'blue cloak', 'wisp-aura': 'wisp aura' }[s.acc]; card.appendChild(acc); }
    card.addEventListener('click', () => { saveSkinId(s.id); SND.ui(); renderSkins(); });
    row.appendChild(card);
  });
}

/* ---------- wiring ---------- */
$('btnPlay').addEventListener('click', () => startGame(0));
$('btnContinue').addEventListener('click', () => startGame(Math.min(getProgress().unlocked, TOTAL_LEVELS) - 1));
$('btnLevels').addEventListener('click', () => { SND.ui(); renderLevelGrid(); $('levelNote').textContent = ''; showScreen('levelSelect'); });
$('btnLevelsBack').addEventListener('click', () => { SND.ui(); showScreen('menu'); });
$('btnHow').addEventListener('click', () => { SND.ui(); showScreen('howTo'); });
$('btnHowBack').addEventListener('click', () => { SND.ui(); showScreen('menu'); });
$('btnCustomise').addEventListener('click', () => { SND.ui(); renderSkins(); showScreen('customise'); });
$('btnCustBack').addEventListener('click', () => { SND.ui(); showScreen('menu'); });
$('btnLeader').addEventListener('click', () => { SND.ui(); showLBDock(true); });
$('btnResume').addEventListener('click', togglePause);
$('btnRestartLevel').addEventListener('click', () => { SND.ui(); showScreen(null); game.startLevel(game.levelIndex); game.state = STATE.PLAYING; });
$('btnQuit').addEventListener('click', () => { SND.ui(); toMenu(); });
$('btnNextLevel').addEventListener('click', () => { SND.ui(); nextLevel(); });
$('btnQuitLC').addEventListener('click', () => { SND.ui(); toMenu(); });
$('btnRetry').addEventListener('click', () => { SND.ui(); retry(); });
$('btnQuitGO').addEventListener('click', () => { SND.ui(); toMenu(); });
$('btnSaveScore').addEventListener('click', () => saveScore('lcName', 'lcSaved'));
$('btnSaveScoreGO').addEventListener('click', () => saveScore('goName', 'goSaved'));
$('btnLBFloat').addEventListener('click', () => { SND.ui(); toggleLBDock(); });
$('btnLBHide').addEventListener('click', () => { SND.ui(); showLBDock(false); });
$('btnLBReset').addEventListener('click', () => { if (confirm('Reset the local leaderboard?')) { setLB([]); renderLB(); } });
$('btnMute').addEventListener('click', () => { SND.ensure(); setMuted(SND.toggleMuted()); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game && game.state === STATE.PLAYING) togglePause(); });
function unlockAudio() { if (SND.unlocked) return; SND.unlocked = true; SND.ensure(); if (game && game.state === STATE.MENU) SND.startMusic('title'); }
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

/* ---------- initialise ---------- */
initTouch(); window.addEventListener('resize', initTouch);
setMuted(SND.muted);
toMenu();
requestAnimationFrame(loop);
