/* Експорт презентації у PDF (кожен слайд — сторінка 1600×900).
   Потрібен локальний сервер кореня проєкту на :5513.
   node presentation-pagination/export-pdf.mjs <папка з playwright-core> */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(join(process.argv[2], 'package.json'));
const { chromium } = require('playwright-core');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.emulateMedia({ colorScheme: 'light' });
await page.goto('http://localhost:5513/presentation-pagination/index.html', { waitUntil: 'networkidle' });
await page.evaluate(async () => { localStorage.removeItem('deck-theme'); document.documentElement.dataset.theme = 'light'; await document.fonts.ready; });
await page.pdf({
  path: 'presentation-pagination/pagination-mazur-1sp23b.pdf',
  width: '1600px', height: '900px', printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' }
});
await browser.close();
console.log('saved presentation-pagination/pagination-mazur-1sp23b.pdf');
