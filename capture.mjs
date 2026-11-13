/* Скріншоти реальних сайтів для презентації -> presentation-pagination/img/
   node presentation-pagination/capture.mjs <папка з playwright-core>
   Google знімається вручну у звичайному браузері: автоматичні запити він блокує капчею. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(join(process.argv[2], 'package.json'));
const { chromium } = require('playwright-core');
const OUT = 'presentation-pagination/img';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: false, args: ['--window-position=-3000,-3000', '--window-size=1440,1000'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, locale: 'uk-UA' });
const page = await ctx.newPage();

/* 1. Rozetka: низ каталогу — «Показати ще» + нумеровані сторінки, до і після кліку */
try {
  await page.goto('https://rozetka.com.ua/ua/notebooks/c80004/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('button.show-more', { timeout: 30000 });
  await page.evaluate(() => document.querySelector('.show-more-wrap').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(OUT, 'rozetka-bottom.png') });
  log('rozetka-bottom ok', page.url());

  await page.locator('button.show-more').first().click();
  await page.waitForTimeout(4500);
  await page.evaluate(() => document.querySelector('.show-more-wrap')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, 'rozetka-after.png') });
  const after = { url: page.url(), title: await page.title(), checkedAt: new Date().toISOString() };
  writeFileSync(join(OUT, 'rozetka-after.json'), JSON.stringify(after, null, 2));
  log('rozetka after click:', after.url, after.title);
} catch (e) { log('rozetka FAIL', e.message.slice(0, 160)); }

await browser.close();

/* 2. GitHub API: реальна відповідь на глибоку сторінку */
try {
  const url = 'https://api.github.com/repos/nodejs/node/issues?state=all&per_page=100&page=459';
  const r = await fetch(url, { headers: { 'User-Agent': 'fitki-presentation', Accept: 'application/vnd.github+json' } });
  const body = await r.text();
  writeFileSync(join(OUT, 'github-422.json'), JSON.stringify({ url, status: r.status, body: JSON.parse(body), checkedAt: new Date().toISOString() }, null, 2));
  log('github', r.status, body.slice(0, 160));
} catch (e) { log('github FAIL', e.message); }
