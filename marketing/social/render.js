#!/usr/bin/env node
// Saves every .asset in social.html as social/<data-name>.png, and copies the
// link-preview image to demo/og-image.png.
//   NODE_PATH=../mediq-web/node_modules node marketing/social/render.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 2700, height: 1500 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(__dirname, 'social.html'));
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete || new Promise(r => { i.onload = i.onerror = r; }))));
  await page.evaluate(() => document.fonts.ready);
  for (const asset of await page.locator('.asset').all()) {
    const name = await asset.getAttribute('data-name');
    const file = path.join(__dirname, `${name}.png`);
    await asset.screenshot({ path: file });
    console.log('saved', path.relative(process.cwd(), file));
  }
  fs.copyFileSync(path.join(__dirname, 'og-image-1200x630.png'), path.join(__dirname, '..', 'demo', 'og-image.png'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
