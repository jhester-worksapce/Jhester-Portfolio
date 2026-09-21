import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
test('Vercel production builds are indexable and previews clear old metadata', () => {
  const env = { ...process.env, SITE_URL: '', GOOGLE_SITE_VERIFICATION: '', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'portfolio.example' };
  const build = () => execFileSync(process.execPath, ['scripts/build.mjs'], { env, stdio: 'pipe' });
  try {
    build();
    assert.match(readFileSync('dist/index.html', 'utf8'), /rel="canonical" href="https:\/\/portfolio.example\/"/);
    assert.match(readFileSync('dist/robots.txt', 'utf8'), /Allow: \//);
    assert.match(readFileSync('dist/sitemap.xml', 'utf8'), /https:\/\/portfolio.example\//);
    env.VERCEL_PROJECT_PRODUCTION_URL = ''; build();
    const fallback = readFileSync('dist/index.html', 'utf8');
    assert.match(fallback, /rel="canonical" href="https:\/\/jhester-portfolio.vercel.app\/"/);
    assert.match(fallback, /"alternateName":\["Jhun Lester","Jhester"\]/);
    env.VERCEL_ENV = 'preview'; env.SITE_URL = 'https://production.example'; build();
    const preview = readFileSync('dist/index.html', 'utf8');
    assert.match(preview, /noindex, nofollow/); assert.doesNotMatch(preview, /rel="canonical"/);
    assert.doesNotMatch(readFileSync('dist/sitemap.xml', 'utf8'), /portfolio.example|production.example/);
  } finally {
    env.VERCEL_ENV = ''; env.SITE_URL = ''; env.VERCEL_PROJECT_PRODUCTION_URL = ''; build();
  }
});
