// A single continuous portrait, with a fixed torso and smoothly changing head angles.
export function initPortrait() {
  const stage = document.querySelector('.portrait-stage');
  const canvas = document.querySelector('.portrait-angles');
  const context = canvas.getContext('2d');
  const motion = matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)');
  if (!context) return;
  const makeSurface = () => {
    const surface = document.createElement('canvas'); surface.width = surface.height = 500;
    const ctx = surface.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    return { surface, ctx };
  };
  const torso = makeSurface(), head = makeSurface(), target = makeSurface(), previous = makeSurface();
  if (!torso || !head || !target || !previous) return;
  const atlas = new Image();
  let ready = false, active = false, frame = 4, pending = 0, animation = 0, pointerX = 0, pointerY = 0;
  const directions = ['up-left','up','up-right','left','center','right','down-left','down','down-right'];
  function paintFrame(ctx, index) {
    const size = atlas.naturalWidth / 3;
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(atlas, (index % 3) * size + 2, Math.floor(index / 3) * size + 2, size - 4, size - 4, 50, 100, 400, 400);
  }
  function feather(ctx, upper) {
    ctx.globalCompositeOperation = 'destination-in';
    const blend = ctx.createLinearGradient(0, 365, 0, 420);
    blend.addColorStop(0, upper ? '#fff' : 'transparent');
    blend.addColorStop(1, upper ? 'transparent' : '#fff');
    ctx.fillStyle = blend; ctx.fillRect(0, 0, 500, 500);
    ctx.globalCompositeOperation = 'source-over';
  }
  function compose(index) {
    paintFrame(head.ctx, index); feather(head.ctx, true);
    target.ctx.clearRect(0, 0, 500, 500);
    target.ctx.drawImage(torso.surface, 0, 0);
    // Complementary alpha adds to one: no jaw cut, duplicate head, or translucent seam.
    target.ctx.globalCompositeOperation = 'lighter';
    target.ctx.drawImage(head.surface, 0, 0);
    target.ctx.globalCompositeOperation = 'source-over';
  }
  function draw(index, immediate = false) {
    if (!ready) return;
    cancelAnimationFrame(animation); animation = 0;
    previous.ctx.clearRect(0, 0, 500, 500); previous.ctx.drawImage(canvas, 0, 0);
    frame = index; compose(index);
    canvas.hidden = false; stage.classList.add('has-angles');
    canvas.removeAttribute('aria-hidden'); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Jhun Lester Cervantes smiling in a cream barong');
    canvas.dataset.direction = directions[index];
    if (immediate || !motion.matches) { context.clearRect(0, 0, 500, 500); context.drawImage(target.surface, 0, 0); return; }
    const started = performance.now();
    function blendFrame(now) {
      const t = Math.min(1, (now - started) / 135);
      const eased = t * t * (3 - 2 * t);
      context.clearRect(0, 0, 500, 500);
      context.globalAlpha = 1 - eased; context.drawImage(previous.surface, 0, 0);
      context.globalCompositeOperation = 'lighter';
      context.globalAlpha = eased; context.drawImage(target.surface, 0, 0);
      context.globalAlpha = 1; context.globalCompositeOperation = 'source-over';
      animation = t < 1 ? requestAnimationFrame(blendFrame) : 0;
    }
    animation = requestAnimationFrame(blendFrame);
  }
  function axis(value, threshold, current) {
    // Hysteresis prevents flickering when the pointer rests on a pose boundary.
    if (current === 0 && value < -threshold + 14) return 0;
    if (current === 2 && value > threshold - 14) return 2;
    return value < -threshold ? 0 : value > threshold ? 2 : 1;
  }
  function update() {
    pending = 0;
    if (!active || !motion.matches || !ready) return;
    const rect = stage.getBoundingClientRect();
    const dx = pointerX - (rect.left + rect.width * .50);
    const dy = pointerY - (rect.top + rect.height * .42);
    const col = axis(dx, Math.max(55, rect.width * .20), frame % 3);
    const row = axis(dy, Math.max(45, rect.height * .15), Math.floor(frame / 3));
    const next = row * 3 + col;
    if (next !== frame) draw(next);
  }
  document.addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType === 'touch') return;
    active = true; pointerX = event.clientX; pointerY = event.clientY;
    if (!pending) pending = requestAnimationFrame(update);
  }, { passive: true });
  function rest() { active = false; cancelAnimationFrame(pending); pending = 0; draw(4); }
  document.documentElement.addEventListener('pointerleave', rest);
  window.addEventListener('blur', rest);
  window.addEventListener('scroll', () => { if (active && !pending) pending = requestAnimationFrame(update); }, { passive: true });
  motion.addEventListener('change', () => { rest(); draw(4, true); });
  atlas.onload = () => {
    ready = true; paintFrame(torso.ctx, 4); feather(torso.ctx, false); draw(4, true);
    if (active) update();
  };
  // Only a loading/failure fallback; never rendered underneath the animated portrait.
  atlas.src = './img/portrait-directions.png';
}
