// Renders the Play listing images into store/play/<lang>/.
// Run from the QueueLess root:
//   NODE_PATH=../mediq-web/node_modules node store/play/tools/render.js
// Inputs: marketing/screenshots/mobile/*.png (Pixel 9 Pro captures) and
// src/assets/branding/play_store_512.png. Fonts come from mediq-web.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(__dirname, '..');
const FONTS = path.resolve(ROOT, '../mediq-web/node_modules');
const SHOTS = path.join(ROOT, 'marketing/screenshots/mobile');
const file = (p) => 'file://' + p;

// No prices, plans or "buy" anywhere: these screens show no plan banner.
const SCREENS = [
  { img: '13-doctor-queue.png',
    en: ['Today’s queue at a glance', 'Waiting, done and missed patients, live'],
    ur: ['آج کی قطار ایک نظر میں', 'انتظار، مکمل اور رہ جانے والے مریض، لائیو'] },
  { img: '14-doctor-now-serving.png',
    en: ['Call the next patient in one tap', 'The TV and the patient’s phone update at once'],
    ur: ['ایک ٹیپ میں اگلا مریض بلائیں', 'ٹی وی اور مریض کا فون فوراً اپ ڈیٹ'] },
  { img: '15-doctor-prescription.png',
    en: ['Notes and prescription with every visit', 'Diagnosis and medicines, saved to the record'],
    ur: ['ہر وزٹ کے ساتھ نوٹس اور نسخہ', 'تشخیص اور دوائیں ریکارڈ میں محفوظ'] },
  { img: '16-doctor-schedule.png',
    en: ['Your next two weeks', 'Working days, bookings and leave in one place'],
    ur: ['اگلے دو ہفتوں کا شیڈول', 'کام کے دن، بکنگ اور چھٹیاں ایک جگہ'] },
  { img: '17-doctor-availability.png',
    en: ['Set your hours and breaks', 'Patients see when you are in and running late'],
    ur: ['اپنے اوقات اور وقفے طے کریں', 'مریض دیکھیں کہ آپ موجود ہیں یا دیر ہے'] },
  { img: '03-intro-notifications.png',
    en: ['Alerts when the turn is near', 'Less waiting in a crowded hall'],
    ur: ['باری قریب آنے پر اطلاع', 'بھرے ہال میں کم انتظار'] },
];

const FEATURE = {
  en: { title: 'Clinic queue, made calm', sub: 'Tokens, live line and TV display for clinics in Pakistan' },
  ur: { title: 'کلینک کی قطار، آسان', sub: 'ٹوکن، لائیو قطار اور ٹی وی ڈسپلے، پاکستان کے کلینکس کے لیے' },
};

const css = `
@font-face { font-family: Inter; src: url(${file(FONTS + '/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: Nastaliq; src: url(${file(FONTS + '/@fontsource/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-400-normal.woff2')}); font-weight: 400; }
@font-face { font-family: Nastaliq; src: url(${file(FONTS + '/@fontsource/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-700-normal.woff2')}); font-weight: 700; }
* { box-sizing: border-box; margin: 0; }
body { font-family: Inter, sans-serif; color: #fff; }
.bg { position: relative; overflow: hidden;
  background: radial-gradient(70% 60% at 15% 0%, #14B8A6 0%, transparent 60%), linear-gradient(160deg, #0E7C86 0%, #0B4F55 100%); }
.grid { position: absolute; inset: 0; opacity: .07;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 60px 60px; }
[lang=ur] { font-family: Nastaliq, serif; }
`;

const shotHtml = (s, lang) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}
.bg { width: 1080px; height: 1920px; display: flex; flex-direction: column; align-items: center; }
.cap { position: relative; text-align: center; padding: 0 70px; height: 400px; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
h1 { font-size: 70px; font-weight: 800; letter-spacing: -.02em; line-height: 1.12; }
p { font-size: 38px; color: #CCFBF1; line-height: 1.3; }
[lang=ur] h1 { font-size: 64px; font-weight: 700; line-height: 1.9; letter-spacing: 0; }
[lang=ur] p { font-size: 36px; line-height: 2; }
.phone { position: relative; width: 694px; padding: 14px; border-radius: 74px; background: #0F2A33;
  box-shadow: 0 40px 90px rgba(0,0,0,.35), 0 0 0 2px rgba(255,255,255,.12); }
.phone img { display: block; width: 666px; height: ${Math.round(666 * 2856 / 1280)}px; border-radius: 60px; }
</style></head><body><div class="bg"><div class="grid"></div>
<div class="cap" lang="${lang}" dir="${lang === 'ur' ? 'rtl' : 'ltr'}"><h1>${s[lang][0]}</h1><p>${s[lang][1]}</p></div>
<div class="phone"><img src="${file(path.join(SHOTS, s.img))}"></div></div></body></html>`;

const featureHtml = (lang) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}
.bg { width: 1024px; height: 500px; display: flex; align-items: center; gap: 56px; padding: 0 84px; }
img { width: 220px; height: 220px; border-radius: 52px; box-shadow: 0 24px 60px rgba(0,0,0,.3); position: relative; }
.t { position: relative; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.brand { font-size: 40px; font-weight: 800; color: #5EEAD4; letter-spacing: -.02em; }
h1 { font-size: 58px; font-weight: 800; line-height: 1.08; letter-spacing: -.02em; }
p { font-size: 26px; color: #CCFBF1; line-height: 1.35; }
[dir=rtl] .t { gap: 0; }
h1[lang=ur] { font-size: 46px; font-weight: 700; line-height: 2.3; letter-spacing: 0; }
p[lang=ur] { font-size: 24px; line-height: 2.4; }
</style></head><body><div class="bg" dir="${lang === 'ur' ? 'rtl' : 'ltr'}"><div class="grid"></div>
<img src="${file(path.join(ROOT, 'src/assets/branding/play_store_512.png'))}">
<div class="t"><div class="brand" lang="en">MediQ</div><h1 lang="${lang}">${FEATURE[lang].title}</h1><p lang="${lang}">${FEATURE[lang].sub}</p></div></div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const tmp = path.join(OUT, 'tools/.tmp.html');
  const render = async (html, w, h, out) => {
    fs.writeFileSync(tmp, html);
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(file(tmp));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
  };
  for (const lang of ['en', 'ur']) {
    fs.mkdirSync(path.join(OUT, lang, 'phone'), { recursive: true });
    await render(featureHtml(lang), 1024, 500, path.join(OUT, lang, 'feature-graphic-1024x500.png'));
    for (const [i, s] of SCREENS.entries()) {
      await render(shotHtml(s, lang), 1080, 1920, path.join(OUT, lang, 'phone', `${i + 1}-${s.img.replace(/^\d+-/, '')}`));
    }
  }
  fs.unlinkSync(tmp);
  await browser.close();
})();
