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
