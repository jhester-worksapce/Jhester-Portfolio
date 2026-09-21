import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
let html = await readFile('index.html', 'utf8');
const isPreview = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production';
const rawUrl = isPreview ? undefined : (process.env.SITE_URL || (process.env.VERCEL_ENV === 'production' ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://jhester-portfolio.vercel.app') : undefined));
let base;
if (rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('SITE_URL must be your public HTTPS URL, without credentials, query, or fragment.');
  base = parsed.href.replace(/\/$/, '') + '/';
}
await rm('dist/assistant-worker.js', { force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.css', 'portfolio.js', 'favicon.svg', 'features.css', 'features.js', 'calendar.js', 'assistant.js', 'portrait.js']) await cp(file, `dist/${file}`);
for (const file of ['jhun_profile.png', 'portrait-directions.png', 'Projects/masaWrap.PNG', 'Projects/Zabcus.PNG']) {
  await mkdir(`dist/img/${file.includes('/') ? 'Projects' : ''}`, { recursive: true });
  await cp(`img/${file}`, `dist/img/${file}`);
}
const xmlEscape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const verification = process.env.GOOGLE_SITE_VERIFICATION;
if (verification) html = html.replace('</head>', `<meta name="google-site-verification" content="${xmlEscape(verification)}"></head>`);
if (base) {
  html = html.replace('</head>', `<link rel="canonical" href="${xmlEscape(base)}"><meta property="og:url" content="${xmlEscape(base)}"><meta property="og:image" content="${xmlEscape(base)}img/jhun_profile.png"><meta property="og:image:alt" content="Jhun Lester Cervantes"><meta name="twitter:image" content="${xmlEscape(base)}img/jhun_profile.png"></head>`);
  html = html.replace(/(<script type="application\/ld\+json" id="profile-schema">)([\s\S]*?)(<\/script>)/, (_, start, json, end) => start + JSON.stringify({ ...JSON.parse(json), url: base, image: base + 'img/jhun_profile.png' }).replaceAll('<', '\\u003c') + end);
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${xmlEscape(base)}</loc></url></urlset>\n`);
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
} else {
  // Preview builds must never retain metadata from a previous production build.
  await writeFile('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
  await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n');
  html = html.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"');
  console.warn('PREVIEW BUILD: Set SITE_URL to your real public HTTPS URL before publishing to enable indexing and canonical metadata.');
}
await writeFile('dist/index.html', html);
console.log(`Built dist/ (${base || 'local preview, indexing disabled'})`);
