'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const email = 'jhunlester88@gmail.com';
const projects = {
  masawrap: { title: 'MasaWrap', image: './img/Projects/masaWrap.PNG', url: 'https://masawrap.vercel.app/', description: 'A food and hospitality website introducing MasaWrap, its menu, and its brand. The experience gives visitors a visual introduction to the food and a straightforward way to explore what the business offers.' },
  zabcus: { title: 'Zabcus Builder', image: './img/Projects/Zabcus.PNG', url: 'https://zabcus-builder-rmlr.vercel.app/', description: 'A business website for Zabcus Builder, presenting its construction and renovation services. The site brings the company’s work and service information together into an approachable online presence.' }
};

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').setAttribute('aria-pressed', String(theme === 'dark'));
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#151816' : '#fafaf8';
}
try { setTheme(localStorage.getItem('portfolio-theme') === 'dark' ? 'dark' : 'light'); } catch { setTheme('light'); }
$('#theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('portfolio-theme', theme); } catch { /* Theme still works without storage. */ }
});

function closeMenu(restoreFocus = false) {
  $('#sidebar').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
  if (restoreFocus) $('#menu-toggle').focus();
}
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('#sidebar, #menu-toggle')) closeMenu();
});
window.matchMedia('(min-width: 801px)').addEventListener('change', () => closeMenu());
$$('#sidebar a[href^="#"]').forEach(link => link.addEventListener('click', () => closeMenu()));

const sections = ['home', 'projects', 'about', 'stack', 'services', 'contact', 'github'];
const labels = ['Overview', 'Projects', 'About me', 'Tech stack', 'Services', 'Contact', 'GitHub activity'];
let scrollPending = false;
function updateNavigation() {
  let current = 0;
  sections.forEach((id, index) => { if (document.getElementById(id).getBoundingClientRect().top <= 180) current = index; });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) current = sections.length - 1;
  $$('nav a').forEach((link) => {
    const active = link.getAttribute('href') === `#${sections[current]}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  $('#current-section').textContent = labels[current];
  scrollPending = false;
}
window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation); } }, { passive: true });
updateNavigation();
$('#year').textContent = new Date().getFullYear();
function updateClock() { $('#ph-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
updateClock();
setInterval(updateClock, 60000);

function filterProjects(category) {
  let count = 0;
  $$('.project-card').forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; if (!card.hidden) count++; });
  $$('[data-filter]').forEach(button => { const active = button.dataset.filter === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('#filter-status').textContent = `Showing ${count} project${count === 1 ? '' : 's'}`;
}
$$('[data-filter]').forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.filter)));
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.project];
  $('#project-dialog-title').textContent = project.title;
  $('#project-dialog-description').textContent = project.description;
  $('#project-dialog-image').src = project.image;
  $('#project-dialog-image').alt = `${project.title} website preview`;
  $('#project-dialog-link').href = project.url;
  $('#project-dialog').showModal();
}));
$$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
}));

const searchItems = [
  { title: 'GitHub activity', detail: 'Contribution calendar', href: '#github', keywords: 'github commits contributions coding activity heatmap' },
  { title: 'Jhun Lester Cervantes', detail: 'Overview', href: '#home', keywords: 'home developer educator freelancer jhester' },
  { title: 'MasaWrap', detail: 'Project · Food & hospitality', href: '#projects', keywords: 'food restaurant menu website' },
  { title: 'Zabcus Builder', detail: 'Project · Business', href: '#projects', keywords: 'construction business website' },
  { title: 'About me', detail: 'My background', href: '#about', keywords: 'experience teaching la union philippines' },
  { title: 'Tech stack', detail: 'Languages & tools', href: '#stack', keywords: 'html css javascript php laravel python flutter bootstrap github adobe xd visual studio code' },
  { title: 'Services', detail: 'Ways to work together', href: '#services', keywords: 'web development design interface education teaching support' },
  { title: 'Contact', detail: email, href: '#contact', keywords: 'email hire work collaborate phone' }
];
function renderSearch() {
  const query = $('#site-search').value.trim().toLowerCase();
  const results = searchItems.filter(item => `${item.title} ${item.detail} ${item.keywords}`.toLowerCase().includes(query));
  $('#search-results').replaceChildren();
  results.forEach(item => {
    const link = document.createElement('a'); link.href = item.href;
    const title = document.createElement('span'); title.textContent = item.title;
    const detail = document.createElement('small'); detail.textContent = item.detail;
    link.append(title, detail);
    link.addEventListener('click', () => { filterProjects('all'); $('#search-dialog').close(); closeMenu(); });
    $('#search-results').append(link);
  });
  if (!results.length) { const empty = document.createElement('p'); empty.textContent = 'No matches. Try “projects”, “Laravel”, or “contact”.'; $('#search-results').append(empty); }
}
function openSearch() {
  if ($('dialog[open]')) return;
  $('#site-search').value = ''; renderSearch(); $('#search-dialog').showModal(); $('#site-search').focus();
}
$$('[data-open-search]').forEach(button => button.addEventListener('click', openSearch));
$('#site-search').addEventListener('input', renderSearch);
$('#site-search').addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') { event.preventDefault(); $('#search-results a')?.focus(); }
  if (event.key === 'Enter') { event.preventDefault(); $('#search-results a')?.click(); }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
  if (event.key === 'Escape' && !$('dialog[open]') && $('#sidebar').classList.contains('open')) closeMenu(true);
});
$('#copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(email); $('#copy-status').textContent = 'Email copied. Say hello when you’re ready.'; }
  catch { $('#copy-status').textContent = `Copy this address: ${email}`; }
});
