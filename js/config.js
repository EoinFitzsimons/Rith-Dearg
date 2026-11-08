/* Rith Dearg — shared constants, palette and persistent storage helpers. */

const VIRTUAL_W = 960, VIRTUAL_H = 540;
const GRAVITY = 2200, FRICTION_GROUND = 0.85, DT_CAP = 1 / 30;
const START_LIVES = 3, MAX_HEALTH = 100, MAX_BREATH = 6;
const TOTAL_LEVELS = 25;

const PLAYER = {
  baseSpeed: 240, jumpVel: 780, width: 42, height: 48,
  attackCD: 0.38, attackReach: 46, attackTime: 0.16, invulnTime: 0.8,
  swimStroke: 420, swimCD: 0.3,
};

const COLOURS = {
  bgNight: '#0b1a28', ui: '#e9f2ff', red: '#ff4b4b', gold: '#ffcc33', green: '#59e07a',
  blue: '#38d8ff', shield: '#72f1ff', water: 'rgba(40,120,180,0.55)', waterDeep: 'rgba(12,50,90,0.85)',
};

const POWERUPS = {
  SPEED: 'Speed Boost', SHIELD: 'Shield', LIFE: 'Extra Life',
  FREEZE: 'Time Freeze', MULT: 'Score Multiplier', HEAL: 'Health Restore',
};
const PU_DUR = { 'Speed Boost': 10, 'Shield': 6, 'Time Freeze': 5, 'Score Multiplier': 12 };
const PU_COLOURS = {
  'Speed Boost': '#5af', 'Shield': '#72f1ff', 'Extra Life': '#ff4b4b',
  'Time Freeze': '#9df', 'Score Multiplier': '#ffcc33', 'Health Restore': '#6f6',
};

const STATE = {
  MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete', GAME_OVER: 'game_over', CUSTOMISE: 'customise', LEVELS: 'levels',
};

/* Squirrel skins: fur, belly and tail tip colours plus an optional accessory. */
const SKINS = [
  { id: 'classic', name: 'Classic Red', fur: '#d9532f', belly: '#ffe1cf', tip: '#8c2f16', acc: null, unlock: 0 },
  { id: 'copper', name: 'Copper', fur: '#c2702d', belly: '#ffd9b8', tip: '#7a4214', acc: 'scarf', unlock: 1500 },
  { id: 'moss', name: 'Moss', fur: '#3d9a55', belly: '#dfffe8', tip: '#1f5c30', acc: 'acorn-cap', unlock: 3000 },
  { id: 'midnight', name: 'Midnight', fur: '#3a4ba8', belly: '#dae3ff', tip: '#1b2560', acc: 'cloak', unlock: 5000 },
  { id: 'ghost', name: 'Ghost', fur: '#d4dde4', belly: '#ffffff', tip: '#9fb0bd', acc: 'wisp-aura', unlock: 8000 },
];

/* Storage (all local; the game has no server). */
const Store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};
/* Older saves stored the skin id as a bare string rather than JSON. */
function getSavedSkinId() {
  try { const raw = localStorage.getItem('rd_skin'); if (raw === null) return 'classic'; try { return JSON.parse(raw); } catch { return raw; } } catch { return 'classic'; }
}
function saveSkinId(id) { Store.set('rd_skin', id); }
function getLB() { const lb = Store.get('rd_lb', []); return Array.isArray(lb) ? lb : []; }
function setLB(arr) { Store.set('rd_lb', arr.slice(0, 20)); }
function addLB(entry) { const lb = getLB(); lb.push(entry); lb.sort((a, b) => b.score - a.score); setLB(lb); }
function getProgress() {
  const p = Store.get('rd_progress', { unlocked: 1, best: {} });
  if (typeof p.unlocked !== 'number') p.unlocked = 1;
  if (!p.best) p.best = {};
  return p;
}
function saveProgress(p) { Store.set('rd_progress', p); }
function recordLevelResult(index, score) {
  const p = getProgress();
  p.unlocked = Math.max(p.unlocked, Math.min(TOTAL_LEVELS, index + 2));
  p.best[index] = Math.max(p.best[index] || 0, score);
  saveProgress(p);
  return p;
}

/* Geometry helpers */
function Rect(x, y, w, h) { return { x, y, w, h }; }
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

/* Deterministic pseudo-random generator so each level is the same every run. */
function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
