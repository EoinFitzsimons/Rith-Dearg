/* Rith Dearg — the squirrel, enemies, the Dullahan, projectiles, pickups and particles. */

function solidRects(level) { return level.movers.length ? level.platforms.concat(level.movers) : level.platforms; }

/* Resolve an axis-aligned body against every solid; returns the mover it stands on, if any. */
function collideBody(body, level, onHitWall) {
  body.onGround = false;
  let standing = null;
  const me = Rect(body.x, body.y, body.w !== undefined ? body.w : body.width, body.h !== undefined ? body.h : body.height);
  for (const p of solidRects(level)) {
    if (!aabb(me, p)) continue;
    const ox1 = me.x + me.w - p.x, ox2 = p.x + p.w - me.x, oy1 = me.y + me.h - p.y, oy2 = p.y + p.h - me.y;
    const minX = Math.min(ox1, ox2), minY = Math.min(oy1, oy2);
    if (minX < minY) { body.x += ox1 < ox2 ? -ox1 : ox2; body.vx = 0; if (onHitWall) onHitWall(); }
    else if (oy1 < oy2) { body.y -= oy1; if (body.vy > 0) body.vy = 0; body.onGround = true; if (p.axis) standing = p; }
    else { body.y += oy2; body.vy = Math.max(body.vy, 10); }
    me.x = body.x; me.y = body.y;
  }
  return standing;
}
function waterAt(level, cx, cy) { for (const w of level.water) if (cx >= w.x && cx <= w.x + w.w && cy >= w.y && cy <= w.y + w.h) return w; return null; }

class Player {
  constructor(skin) {
    this.x = 60; this.y = 0; this.vx = 0; this.vy = 0; this.onGround = false; this.dir = 1;
    this.width = PLAYER.width; this.height = PLAYER.height;
    this.health = MAX_HEALTH; this.lives = START_LIVES; this.invuln = 0;
    this.attackCD = 0; this.attackActive = 0; this.skin = skin; this.speedMul = 1;
    this.water = null; this.breath = MAX_BREATH; this.swimCD = 0; this.coyote = 0; this.wasGround = false;
    this.anim = { state: 'idle', phase: 0, attackT: 0, dir: 1, time: 0 };
    this.standing = null;
  }
  rect() { return Rect(this.x, this.y, this.width, this.height); }
  get w() { return this.width; } get h() { return this.height; }
  control(dt, level, game) {
    const base = PLAYER.baseSpeed * this.speedMul * (this.water ? 0.6 : 1);
    let ax = 0;
    if (input.left) { ax -= base; this.dir = -1; }
    if (input.right) { ax += base; this.dir = 1; }
    this.vx = ax;
    if (this.onGround) this.vx *= FRICTION_GROUND;
    if (this.swimCD > 0) this.swimCD -= dt;
    if (this.coyote > 0) this.coyote -= dt;
    const pressed = consumeJumpPress();
    if (pressed) {
      if (this.onGround || this.coyote > 0) { this.vy = -PLAYER.jumpVel; this.onGround = false; this.coyote = 0; SND.jump(); game.puff(this.x + this.width / 2, this.y + this.height, 6); }
      else if (this.water && this.swimCD <= 0) {
        const headAbove = this.y + 12 < this.water.y;
        this.vy = headAbove ? -PLAYER.jumpVel * 0.82 : -PLAYER.swimStroke;
        this.swimCD = headAbove ? 0.1 : PLAYER.swimCD;
        if (headAbove) SND.jump(); else SND.swim();
        game.bubbles(this.x + this.width / 2, this.y + this.height / 2, 3);
      }
    }
    /* short hops when the jump key is released early */
    if (!input.jump && this.vy < -200 && !this.water) this.vy += GRAVITY * 1.4 * dt;
    if (this.attackCD > 0) this.attackCD -= dt;
    if (this.attackActive > 0) this.attackActive -= dt;
    const wantsAttack = consumeAttackPress() || input.attack;
    if (wantsAttack && this.attackCD <= 0) { this.attackActive = PLAYER.attackTime; this.attackCD = PLAYER.attackCD; SND.attack(); }
    if (this.invuln > 0) this.invuln -= dt;
  }
  physics(dt, level, game) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const wasWater = this.water;
    /* probe near the feet so a floating squirrel keeps its head above the surface */
    this.water = waterAt(level, cx, this.y + this.height - 8);
    if (this.water && !wasWater && this.vy > 150) { SND.splash(); game.splash(cx, this.water.y, 14); }
    if (!this.water && wasWater) game.splash(cx, wasWater.y, 6);
    if (this.water) {
      const depth = this.y + this.height - this.water.y;
      const buoy = input.down ? 0 : clamp(depth / 40, 0, 1) * 2000;
      this.vy += (level.gravity * 0.45 - buoy) * dt;
      this.vy *= Math.pow(0.08, dt);
      this.vy = clamp(this.vy, -420, input.down ? 260 : 170);
      const headUnder = this.y + 10 > this.water.y;
      if (headUnder) { this.breath -= dt; if (this.breath <= 0) { this.breath = 1.2; this.hurt(15, true); } }
      else this.breath = Math.min(MAX_BREATH, this.breath + dt * 2.5);
    } else {
      this.vy += level.gravity * dt;
      this.breath = Math.min(MAX_BREATH, this.breath + dt * 2.5);
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x += game.windAt(cx, this.onGround) * dt;
    this.x = clamp(this.x, 0, level.width - this.width);
    if (level.arena && game.boss && game.boss.alive && this.x + this.width > level.arena.x + 20) this.x = Math.max(this.x, level.arena.x + 20);
    const wasGround = this.onGround;
    this.standing = collideBody(this, level);
    if (wasGround && !this.onGround) this.coyote = 0.08;
    if (!wasGround && this.onGround && this.vy >= 0) { SND.land(); game.puff(this.x + this.width / 2, this.y + this.height, 4); }
    const me = this.rect();
    for (const h of level.hazards) if (aabb(me, h)) { this.hurt(22); if (this.onGround) this.vy = -380; }
    if (this.y > VIRTUAL_H + 160) this.loseLife(true);
  }
  carriedBy(mover) { if (mover) { this.x += mover.dx; this.y += mover.dy; } }
  updateAnim(dt) {
    const a = this.anim;
    a.time += dt;
    if (this.attackActive > 0) { a.state = 'attack'; a.attackT = 1 - this.attackActive / PLAYER.attackTime; }
    else if (this.water) a.state = 'swim';
    else if (!this.onGround) a.state = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 20) a.state = 'run';
    else a.state = 'idle';
    a.phase = (a.phase + Math.abs(this.vx) * dt / 110) % 1;
    a.dir = this.dir;
  }
  hurt(amount, ignoreShield = false) {
    if (!ignoreShield && game && game.hasPU('Shield')) return;
    if (this.invuln > 0) return;
    this.health -= amount; this.invuln = PLAYER.invulnTime; SND.hit();
    if (game) game.shake = 0.25;
    if (this.health <= 0) this.loseLife();
  }
  loseLife(fell = false) {
    this.lives--; this.health = MAX_HEALTH; this.invuln = 1.2; this.breath = MAX_BREATH;
    const cp = (game && game.checkpoint) ? game.checkpoint : { x: 60, y: 420 };
    this.x = cp.x - this.width / 2; this.y = cp.y - this.height - 4; this.vx = 0; this.vy = 0; this.water = null;
    if (fell) SND.hit();
    SND.lifeLost();
    if (this.lives < 0) gameOver(); else if (game) game.flashLost = 0.6;
  }
  draw(ctx, camX) {
    const px = Math.floor(this.x - camX), py = Math.floor(this.y);
    if (!this.water) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(ctx, px + this.width / 2, py + this.height, 16, 5); }
    if (this.invuln > 0 && Math.floor(this.anim.time * 20) % 2 === 0) return;
    ctx.save(); ctx.translate(px + this.width / 2, py + this.height / 2 - 2);
    if (game && game.hasPU('Shield')) { ctx.strokeStyle = COLOURS.shield; ctx.lineWidth = 2; ctx.globalAlpha = 0.6 + Math.sin(this.anim.time * 8) * 0.25; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    drawSquirrel(ctx, this.skin, this.anim);
    ctx.restore();
  }
}

class Enemy {
  constructor(type, x, y) {
    this.type = type; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = 36; this.h = 36;
    this.dir = Math.random() < 0.5 ? -1 : 1; this.onGround = false; this.cd = 1 + Math.random(); this.flash = 0; this.wailT = 0;
    this.home = { x, y }; this.submerged = false; this.leaping = false; this.camX = 0;
    this.hp = { golem: 4, cusidhe: 3, banshee: 3, merrow: 3 }[type] || 2;
    if (type === 'banshee') this.h = 44;
  }
  rect() { return Rect(this.x, this.y, this.w, this.h); }
  get flying() { return this.type === 'raven' || this.type === 'wisp' || this.type === 'banshee'; }
  hasGroundAhead(level) {
    const probe = Rect(this.x + (this.dir > 0 ? this.w + 6 : -8), this.y + this.h + 2, 2, 12);
    return solidRects(level).some(p => aabb(probe, p));
  }
  update(dt, level, player, game) {
    const t = game.time;
    if (this.flash > 0) this.flash -= dt;
    if (this.cd > 0) this.cd -= dt;
    const dx = player.x - this.x, dist = Math.abs(dx);
    switch (this.type) {
      case 'puca': this.vx = 90 * this.dir; if (this.onGround && Math.random() < dt * 0.6) this.vy = -420; break;
      case 'cusidhe': if (dist < 340 && Math.abs(player.y - this.y) < 80) { this.dir = dx < 0 ? -1 : 1; this.vx = 190 * this.dir; } else this.vx = 80 * this.dir; break;
      case 'golem': this.vx = 50 * this.dir; break;
      case 'raven': {
        const targetY = player.y - 130 + Math.sin(t * 2 + this.home.x * 0.01) * 30;
        this.y += (targetY - this.y) * Math.min(1, dt * 1.5);
        if (dist < 150 && this.cd <= 0) { this.vy = 520; this.cd = 1.6; } else if (this.vy > 0) this.vy -= 900 * dt;
        if (this.vy < 0) this.vy = 0;
        this.vx = dx < 0 ? -70 : 70; this.dir = this.vx < 0 ? -1 : 1; break;
      }
      case 'wisp': this.vx = Math.sin(t + this.home.x * 0.01) * 50; this.y = this.home.y + Math.sin(t * 1.8 + this.home.x * 0.008) * 40; break;
      case 'banshee': {
        this.vx = clamp(dx * 0.4, -60, 60); this.dir = dx < 0 ? -1 : 1;
        this.y = this.home.y + Math.sin(t * 1.6 + this.home.x) * 18;
        if (this.wailT > 0) this.wailT -= dt;
        if (dist < 460 && this.cd <= 0) { this.cd = 3.2; this.wailT = 0.6; game.spawnProjectile({ kind: 'wail', x: this.x + this.w / 2 + this.dir * 20, y: this.y + 22, vx: this.dir * 170, vy: 0, life: 2.6, dir: this.dir, r: 16, dmg: 16 }); SND.tone(620, 0.5, 'sine', 0.05, { slideTo: 320 }); }
        break;
      }
      case 'merrow': {
        const wtr = waterAt(level, this.x + this.w / 2, this.y + this.h / 2) || waterAt(level, this.home.x + 18, this.home.y + 18);
        this.submerged = !!waterAt(level, this.x + this.w / 2, this.y + this.h / 2);
        if (this.submerged && !this.leaping) {
          this.vy = 0; this.y += (this.home.y - this.y) * Math.min(1, dt * 2);
          this.vx = Math.sin(t * 1.3 + this.home.x) * 60; this.dir = this.vx < 0 ? -1 : 1;
          if (dist < 220 && this.cd <= 0 && wtr) { this.leaping = true; this.vy = -760; this.vx = clamp(dx, -140, 140); this.dir = dx < 0 ? -1 : 1; this.cd = 3; SND.splash(); game.splash(this.x + this.w / 2, wtr.y, 10); }
        } else {
          this.vy += level.gravity * 0.9 * dt;
          if (this.submerged && this.vy > 0) { this.leaping = false; game.splash(this.x + this.w / 2, wtr ? wtr.y : this.y, 8); }
        }
        break;
      }
    }
    if (!this.flying && this.type !== 'merrow') this.vy += level.gravity * 0.9 * dt;
    if (this.type === 'raven') this.y += this.vy * dt;
    this.x += this.vx * dt;
    if (this.type !== 'raven' && this.type !== 'wisp' && this.type !== 'banshee') this.y += this.vy * dt;
    if (!this.flying) collideBody(this, level, () => { this.dir *= -1; });
    if ((this.type === 'puca' || this.type === 'cusidhe' || this.type === 'golem') && this.onGround && !this.hasGroundAhead(level)) this.dir *= -1;
    if (this.x < 0) { this.x = 0; this.dir = 1; }
    if (this.x + this.w > level.width) { this.x = level.width - this.w; this.dir = -1; }
    if (this.y > VIRTUAL_H + 200) this.hp = 0;
  }
  draw(ctx, camX, t) { this.camX = camX; drawEnemy(ctx, this, t); }
}

/* The Dullahan: a headless rider that paces its rooftop arena, charges, and throws its own head. */
class Boss {
  constructor(x, y, arena) {
    this.x = x; this.y = y; this.w = 90; this.h = 80; this.vx = 0; this.vy = 0; this.dir = -1; this.onGround = false;
    this.maxHp = 14; this.hp = this.maxHp; this.alive = true; this.flash = 0; this.hitCD = 0;
    this.state = 'intro'; this.timer = 1.6; this.charging = false; this.headThrown = false; this.arena = arena; this.camX = 0; this.emberT = 0;
  }
  rect() { return Rect(this.x + 10, this.y + 8, this.w - 20, this.h - 8); }
  get phase2() { return this.hp <= this.maxHp / 2; }
  update(dt, level, player, game) {
    if (!this.alive) return;
    if (this.flash > 0) this.flash -= dt;
    if (this.hitCD > 0) this.hitCD -= dt;
    this.timer -= dt;
    const dx = player.x - this.x;
    const speed = this.phase2 ? 1.3 : 1;
    switch (this.state) {
      case 'intro': this.vx = 0; if (this.timer <= 0) { this.state = 'pace'; this.timer = 1.8; } break;
      case 'pace':
        this.dir = dx < 0 ? -1 : 1; this.vx = 70 * speed * (Math.abs(dx) > 220 ? this.dir : -this.dir);
        if (this.timer <= 0) { this.state = Math.random() < 0.5 || this.headThrown ? 'windup' : 'throw'; this.timer = 0.6; this.vx = 0; }
        break;
      case 'windup': this.vx = 0; this.dir = dx < 0 ? -1 : 1; if (this.timer <= 0) { this.state = 'charge'; this.charging = true; this.timer = 2.2; SND.bossRoar(); } break;
      case 'charge': {
        this.vx = 560 * speed * this.dir;
        const atWall = (this.dir < 0 && this.x <= this.arena.x + 4) || (this.dir > 0 && this.x + this.w >= this.arena.x + this.arena.w - 4);
        if (atWall || this.timer <= 0) { this.state = 'stunned'; this.charging = false; this.vx = 0; this.timer = 1.5; game.shake = 0.4; game.puff(this.x + this.w / 2, this.y + this.h, 16); }
        break;
      }
      case 'stunned': this.vx = 0; if (this.timer <= 0) { this.state = 'pace'; this.timer = 1.4; } break;
      case 'throw':
        this.vx = 0; this.dir = dx < 0 ? -1 : 1;
        if (this.timer <= 0 && !this.headThrown) {
          this.headThrown = true;
          game.spawnProjectile({ kind: 'head', x: this.x + this.w / 2 + this.dir * 24, y: this.y - 10, vx: clamp(dx * 1.6, -520, 520), vy: -380, grav: 900, life: 2.4, r: 14, dmg: 22, returnTo: this });
          this.state = 'pace'; this.timer = 2.2;
        }
        break;
    }
    if (this.phase2) { this.emberT -= dt; if (this.emberT <= 0) { this.emberT = 0.9; game.spawnProjectile({ kind: 'ember', x: this.arena.x + 60 + Math.random() * (this.arena.w - 120), y: -10, vx: 0, vy: 160, grav: 160, life: 4, r: 6, dmg: 12 }); } }
    this.vy += level.gravity * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, this.arena.x, this.arena.x + this.arena.w - this.w);
    collideBody(this, level);
  }
  takeHit(amount) {
    if (this.hitCD > 0 || !this.alive) return false;
    this.hp -= amount; this.flash = 0.3; this.hitCD = 0.45; SND.bossHit();
    if (this.hp <= 0) { this.alive = false; this.hp = 0; }
    return true;
  }
  draw(ctx, camX, t) { this.camX = camX; if (this.alive) drawDullahan(ctx, this, t); }
}

class PowerUp {
  constructor(kind, x, y) { this.kind = kind; this.x = x; this.y = y; this.w = 24; this.h = 24; this.vy = -200; this.life = 14; }
  rect() { return Rect(this.x, this.y, this.w, this.h); }
  update(dt, level) {
    this.life -= dt; this.vy += GRAVITY * 0.6 * dt; this.y += this.vy * dt;
    const r = this.rect();
    for (const p of solidRects(level)) if (aabb(r, p) && this.vy > 0) { this.y = p.y - this.h; this.vy = 0; }
    if (this.y > VIRTUAL_H + 100) this.life = 0;
  }
  draw(ctx, camX, t) { drawPowerUpIcon(ctx, this.kind, Math.floor(this.x - camX) + this.w / 2, Math.floor(this.y) + this.h / 2, t); }
}

class Particles {
  constructor() { this.list = []; }
  emit(x, y, n, opts) {
    for (let i = 0; i < n; i++) {
      const a = (opts.angle !== undefined ? opts.angle : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * (opts.spread || 6.3);
      const s = (opts.speed || 60) * (0.4 + Math.random() * 0.8);
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: opts.life || 0.5, max: opts.life || 0.5, col: opts.col || '#fff', size: opts.size || 3, grav: opts.grav || 0 });
    }
  }
  update(dt) { for (const p of this.list) { p.life -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; } this.list = this.list.filter(p => p.life > 0); }
  draw(ctx, camX) { for (const p of this.list) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; circle(ctx, p.x - camX, p.y, p.size); } ctx.globalAlpha = 1; }
}
