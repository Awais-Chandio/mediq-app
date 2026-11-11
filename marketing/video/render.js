#!/usr/bin/env node
// Renders video.html to H.264 MP4s, frame by frame:
//   mediq-demo-16x9.mp4  1920×1080  portfolio, YouTube, LinkedIn, website
//   mediq-demo-9x16.mp4  1080×1920  Instagram Reels / Stories, TikTok, Facebook Reels
//
//   NODE_PATH=../mediq-web/node_modules node marketing/video/render.js            # both
//   NODE_PATH=../mediq-web/node_modules node marketing/video/render.js portrait   # one
//   NODE_PATH=../mediq-web/node_modules node marketing/video/render.js landscape --stills 3 20 75
//
// Needs Playwright (from mediq-web's node_modules) and ffmpeg with libx264.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('@playwright/test');

const FPS = 30;
const HERE = __dirname;
const FORMATS = {
  landscape: { w: 1920, h: 1080, query: '', file: 'mediq-demo-16x9.mp4' },
  portrait: { w: 1080, h: 1920, query: '&portrait', file: 'mediq-demo-9x16.mp4' },
};

async function render(browser, name, stills) {
  const f = FORMATS[name];
  const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(HERE, 'video.html') + '?render' + f.query);
  await page.evaluate(() => window.READY);
  const duration = await page.evaluate(() => window.DURATION);

  if (stills) {
    const dir = path.join(HERE, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stills) {
      await page.evaluate(x => window.renderFrame(x), t);
      await page.screenshot({ path: path.join(dir, `${name}@${t}s.png`) });
    }
    return page.close();
  }

  const file = path.join(HERE, f.file);
  // Silent audio track: upload tools expect one. Add music in CapCut/Instagram.
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate(x => window.renderFrame(x), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (FPS * 10) === 0) console.log(`${name}: ${Math.round(i / FPS)}s / ${duration}s`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`${name}: done → ${path.relative(process.cwd(), file)}`);
  await page.close();
}

(async () => {
  const args = process.argv.slice(2);
  const si = args.indexOf('--stills');
  const stills = si >= 0 ? args.slice(si + 1).map(Number) : null;
  const names = (si >= 0 ? args.slice(0, si) : args).filter(a => FORMATS[a]);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--font-render-hinting=none'] });
  try {
    for (const name of names.length ? names : Object.keys(FORMATS)) await render(browser, name, stills);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
