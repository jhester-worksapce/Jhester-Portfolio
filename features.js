import { makePassage } from './typing.js';
import { prepareCalendar } from './calendar.js';
import './assistant.js';

// Keep the system pointer; the decorative ring never captures input.
const follower = document.querySelector('#cursor-follower');
const motion = matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)');
let targetX = 0, targetY = 0, x = 0, y = 0, frame = 0, pointerActive = false;
function animatePointer() {
  x += (targetX - x) * 0.2; y += (targetY - y) * 0.2;
  follower.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
  frame = pointerActive && (Math.abs(targetX - x) > .1 || Math.abs(targetY - y) > .1) ? requestAnimationFrame(animatePointer) : 0;
}
document.addEventListener('pointermove', event => {
  if (!motion.matches || event.pointerType === 'touch') return;
  targetX = event.clientX; targetY = event.clientY;
  if (!pointerActive) { x = targetX; y = targetY; pointerActive = true; }
  follower.classList.add('visible');
  follower.classList.toggle('over-link', Boolean(event.target.closest('button,a,input,select,textarea')));
  if (!frame) frame = requestAnimationFrame(animatePointer);
}, { passive: true });
function hidePointer() { pointerActive = false; follower.classList.remove('visible'); cancelAnimationFrame(frame); frame = 0; }
document.documentElement.addEventListener('pointerleave', hidePointer);
window.addEventListener('blur', hidePointer);
motion.addEventListener('change', hidePointer);

const portraitMotion = await import('./portrait.js');
portraitMotion.initPortrait();

const username = 'Jhester11';
const yearSelect = document.querySelector('#contribution-year');
const currentYear = new Date().getUTCFullYear();
for (let year = currentYear; year >= currentYear - 4; year--) yearSelect.add(new Option(String(year), String(year)));
const calendar = document.querySelector('#contribution-calendar');
const summary = document.querySelector('#contribution-summary');
const errorBox = document.querySelector('#contribution-error');
const detail = document.querySelector('#contribution-detail');
const cache = new Map();
let requestId = 0, controller;
const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
function renderCalendar(data) {
  const model = prepareCalendar(data);
  const fragment = document.createDocumentFragment();
  calendar.style.setProperty('--weeks', model.weeks);
  for (const [label, row] of [['Mon',3],['Wed',5],['Fri',7]]) {
    const node = document.createElement('span'); node.className = 'calendar-day-label'; node.textContent = label; node.style.gridColumn = 1; node.style.gridRow = row; fragment.append(node);
  }
  const months = new Set();
  let lastMonthColumn = -5;
  model.days.forEach((day, index) => {
    const month = day.date.slice(0, 7);
    if (!months.has(month) && day.column - lastMonthColumn >= 3) {
      const label = document.createElement('span'); label.className = 'calendar-month'; label.textContent = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(day.timestamp); label.style.gridColumn = `${day.column} / span 3`; label.style.gridRow = 1; fragment.append(label); months.add(month); lastMonthColumn = day.column;
    }
    const cell = document.createElement('button');
    const label = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${dateFormatter.format(day.timestamp)}`;
    cell.className = 'calendar-cell'; cell.dataset.level = day.level; cell.style.gridColumn = day.column; cell.style.gridRow = day.row; cell.title = label; cell.setAttribute('aria-label', label); cell.tabIndex = index === 0 ? 0 : -1;
    const show = () => { detail.textContent = label; };
    cell.addEventListener('pointerenter', show); cell.addEventListener('focus', show); cell.addEventListener('click', show);
    fragment.append(cell);
  });
  calendar.replaceChildren(fragment);
  summary.textContent = `${model.total.toLocaleString()} contributions ${yearSelect.value === 'last' ? 'in the last 12 months' : 'in ' + yearSelect.value}`;
  detail.textContent = 'Select a day to see its contributions.';
}
calendar.addEventListener('keydown', event => {
  const offset = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }[event.key];
  if (!offset || !event.target.matches('.calendar-cell')) return;
  event.preventDefault();
  const cells = [...calendar.querySelectorAll('.calendar-cell')];
  const index = cells.indexOf(event.target);
  const next = cells[Math.max(0, Math.min(cells.length - 1, index + offset))];
  event.target.tabIndex = -1; next.tabIndex = 0; next.focus();
});
async function loadContributions() {
  const id = ++requestId;
  controller?.abort(); controller = new AbortController();
  const timeout = setTimeout(() => controller?.abort(), 15000);
  const year = yearSelect.value;
  calendar.setAttribute('aria-busy', 'true'); calendar.replaceChildren(); errorBox.hidden = true; summary.textContent = 'Loading GitHub activity…'; detail.textContent = '';
  try {
    let data = cache.get(year);
    if (!data) {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('GitHub feed unavailable');
      data = await response.json(); prepareCalendar(data); cache.set(year, data);
    }
    if (id === requestId) renderCalendar(data);
  } catch {
    if (id === requestId) { summary.textContent = 'GitHub activity'; errorBox.hidden = false; detail.textContent = 'No activity counts are shown while the feed is unavailable.'; }
  } finally { clearTimeout(timeout); if (id === requestId) calendar.setAttribute('aria-busy', 'false'); }
}
yearSelect.addEventListener('change', loadContributions);
document.querySelector('#retry-contributions').addEventListener('click', loadContributions);
// Fetch only as the activity section approaches the viewport.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadContributions(); } }, { rootMargin: '400px' });
  observer.observe(document.querySelector('#github'));
} else loadContributions();

// Compact sidebar utilities. Test results remain local to this page.
const typingDialog = document.querySelector('#typing-dialog');
const typingInput = document.querySelector('#typing-input');
let targetPassage = '';
let duration = 30;
let startedAt = 0, typingTimer, soundEnabled = false, audioContext;
function renderPassage() {
  const typed = typingInput.value;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < targetPassage.length; i++) {
    const span = document.createElement('span'); span.textContent = targetPassage[i];
    if (i < typed.length) span.className = typed[i] === targetPassage[i] ? 'typed-correct' : 'typed-wrong';
    fragment.append(span);
  }
  document.querySelector('#typing-passage').replaceChildren(fragment);
  const passageElement = document.querySelector('#typing-passage');
  const current = passageElement.children[Math.min(typed.length, targetPassage.length - 1)];
  if (current) {
    const top = current.getBoundingClientRect().top - passageElement.getBoundingClientRect().top;
    if (top < 0 || top > passageElement.clientHeight - 40) passageElement.scrollTop += top;
  }
}
function updateTyping() {
  const elapsed = startedAt ? Math.min(duration, (performance.now() - startedAt) / 1000) : 0;
  const typed = typingInput.value;
  const correct = [...typed].filter((character, index) => character === targetPassage[index]).length;
  const wpm = elapsed > 0 ? Math.round(correct / 5 / (elapsed / 60)) : 0;
  const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100;
  document.querySelector('#typing-wpm').textContent = wpm;
  document.querySelector('#typing-accuracy').textContent = accuracy;
  document.querySelector('#typing-time').textContent = Math.ceil(duration - elapsed);
  if (elapsed >= duration || typed.length >= targetPassage.length) {
    clearInterval(typingTimer); typingInput.disabled = true;
    document.querySelector('#typing-result').textContent = `Finished! ${wpm} words per minute with ${accuracy}% accuracy.`;
  }
}
function resetTyping() {
  duration = Number(document.querySelector('#typing-duration').value);
  targetPassage = makePassage(document.querySelector('#typing-mode').value, targetPassage);
  typingInput.maxLength = targetPassage.length;
  clearInterval(typingTimer); startedAt = 0; typingInput.value = ''; typingInput.disabled = false;
  document.querySelector('#typing-result').textContent = ''; renderPassage(); updateTyping(); typingInput.focus();
}
function openTyping() {
  if (typingDialog.open) return;
  document.querySelector('dialog[open]')?.close(); typingDialog.showModal(); resetTyping();
}
document.querySelectorAll('[data-open-typing]').forEach(button => button.addEventListener('click', openTyping));
document.querySelector('#typing-restart').addEventListener('click', resetTyping);
typingDialog.addEventListener('close', () => clearInterval(typingTimer));
document.querySelector('#typing-mode').addEventListener('change', resetTyping);
document.querySelector('#typing-duration').addEventListener('change', resetTyping);
typingInput.addEventListener('paste', event => event.preventDefault());
typingInput.addEventListener('drop', event => event.preventDefault());
typingInput.addEventListener('beforeinput', event => { if (startedAt && performance.now() - startedAt >= duration * 1000) { event.preventDefault(); updateTyping(); } });
typingInput.addEventListener('input', () => {
  if (!startedAt && typingInput.value.length) { startedAt = performance.now(); typingTimer = setInterval(updateTyping, 100); }
  renderPassage(); updateTyping();
  if (soundEnabled) {
    try {
      audioContext ||= new AudioContext(); void audioContext.resume();
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.frequency.value = 480; gain.gain.setValueAtTime(.025, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .035);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + .04);
    } catch { /* Sound is optional. */ }
  }
});
document.querySelector('#sound-toggle').addEventListener('click', async event => {
  const button = event.currentTarget;
  soundEnabled = !soundEnabled; button.setAttribute('aria-pressed', String(soundEnabled));
  button.title = soundEnabled ? 'Mute sounds' : 'Enable sounds and play ringtone';
  if (!soundEnabled) {
    const previousContext = audioContext; audioContext = undefined;
    await previousContext?.close().catch(() => {}); return;
  }
  try {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    if (!soundEnabled) return;
    // A short original chime, synthesized locally with no audio download.
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const at = audioContext.currentTime + index * .14;
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(.06, at + .015);
      gain.gain.exponentialRampToValueAtTime(.001, at + .3);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(at); oscillator.stop(at + .32);
    });
  } catch {
    soundEnabled = false; button.setAttribute('aria-pressed', 'false');
    button.title = 'Sound unavailable in this browser';
  }
});
document.addEventListener('keydown', event => {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.code === 'KeyJ') { event.preventDefault(); openTyping(); }
  if (event.code === 'KeyK') { event.preventDefault(); document.querySelector('[data-open-ai]').click(); }
});
