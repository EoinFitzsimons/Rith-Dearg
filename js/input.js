/* Rith Dearg — keyboard and touch input. */

const KEYS = new Set();
const input = { left: false, right: false, down: false, jump: false, jumpPressed: false, attack: false, attackPressed: false };
let jumpLatch = false, attackLatch = false;

function updateInputFromKeys() {
  input.left = KEYS.has('ArrowLeft') || KEYS.has('KeyA');
  input.right = KEYS.has('ArrowRight') || KEYS.has('KeyD');
  const jumpHeld = ['Space', 'ArrowUp', 'KeyW'].some(k => KEYS.has(k));
  if (jumpHeld && !jumpLatch) input.jumpPressed = true;
  jumpLatch = jumpHeld;
  input.jump = jumpHeld;
  input.down = KEYS.has('ArrowDown') || KEYS.has('KeyS');
  input.attack = KEYS.has('KeyJ') || KEYS.has('KeyK');
  if (input.attack && !attackLatch) input.attackPressed = true;
  attackLatch = input.attack;
}
/* Consumed once per frame so a held key does not re-trigger a jump. */
function consumeJumpPress() { const p = input.jumpPressed; input.jumpPressed = false; return p; }
/* A quick tap of the attack key is remembered until the next frame so it is never lost. */
function consumeAttackPress() { const p = input.attackPressed; input.attackPressed = false; return p; }
function clearInput() { KEYS.clear(); jumpLatch = false; attackLatch = false; input.jumpPressed = false; input.attackPressed = false; updateInputFromKeys(); }

const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!e.repeat) {
    if (e.code === 'Escape' || e.code === 'KeyP') { onPauseKey(); return; }
    if (e.code === 'KeyL') { toggleLBDock(); return; }
    if (e.code === 'KeyM') { setMuted(SND.toggleMuted()); return; }
    if (e.code === 'Enter') { onEnterKey(); }
  }
  KEYS.add(e.code); updateInputFromKeys();
});
window.addEventListener('keyup', (e) => { KEYS.delete(e.code); updateInputFromKeys(); });
window.addEventListener('blur', clearInput);

/* Touch controls are only shown for coarse pointers (phones and tablets). */
const touchControls = document.getElementById('touchControls');
function hasCoarsePointer() {
  return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) <= 820);
}
function initTouch() {
  touchControls.hidden = !hasCoarsePointer();
  touchControls.querySelectorAll('[data-k]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const code = btn.getAttribute('data-k');
    const down = (ev) => { ev.preventDefault(); SND.ensure(); if (code === 'KeyP') { onPauseKey(); return; } KEYS.add(code); updateInputFromKeys(); };
    const up = (ev) => { ev.preventDefault(); KEYS.delete(code); updateInputFromKeys(); };
    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up, { passive: false });
    btn.addEventListener('touchcancel', up, { passive: false });
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  });
}
