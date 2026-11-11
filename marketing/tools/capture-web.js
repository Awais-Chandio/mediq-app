#!/usr/bin/env node
// Walks the MediQ web app through one clinic's day and saves a screenshot of
// every screen to marketing/screenshots/web/. Runs against the LOCAL stack only
// (supabase start in this repo, mediq-web on :3100 with .env.local).
//
//   NODE_PATH=../mediq-web/node_modules node marketing/tools/capture-web.js
//
// Every run creates a fresh owner and clinic, so it can be re-run any time.
const path = require('path');
const { chromium, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = path.join(__dirname, '..', 'screenshots', 'web');
const run = Date.now().toString(36);
const owner = { name: 'Dr. Sana Malik', email: `sana.${run}@demo.mediq.test`, password: 'password-123' };
const clinic = { name: 'City Care Clinic', city: 'Hyderabad', address: 'Saddar, Hyderabad' };
const doctors = [
  { name: 'Dr. Ayesha Khan', specialty: 'General Physician', room: '3' },
  { name: 'Dr. Hamid Ali', specialty: 'Child Specialist', room: '5' },
];
const walkIns = ['Ali Raza', 'Sara Bibi', 'Hamza Iqbal', 'Nida Shah'];

require('fs').rmSync(OUT, { recursive: true, force: true });
require('fs').mkdirSync(OUT, { recursive: true });

// hotspots.json: where the button the next step clicks sits in each screenshot,
// as percentages of the image (used by the interactive demo).
const hotspots = {};
let n = 0;
const shot = async (page, name, opts = {}, target) => {
  const base = `${String(++n).padStart(2, '0')}-${name}`;
  const file = path.join(OUT, `${base}.png`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400); // let transitions settle
  if (target) {
    const box = await target.boundingBox();
    const [w, h] = await page.evaluate(full => [innerWidth, full ? document.documentElement.scrollHeight : innerHeight], !!opts.fullPage);
    if (box) hotspots[base] = { x: +((box.x + box.width / 2) / w * 100).toFixed(1), y: +((box.y + box.height / 2) / h * 100).toFixed(1), w: +(box.width / w * 100).toFixed(1), h: +(box.height / h * 100).toFixed(1) };
  }
  await page.screenshot({ path: file, ...opts });
  console.log('saved', path.relative(process.cwd(), file));
};

(async () => {
  const browser = await chromium.launch();
  const desktop = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const desk = await desktop.newPage();

  // 1. Onboarding: account -> clinic -> doctors -> receptionist -> QR poster
  await desk.goto('/onboarding');
  await desk.getByLabel('Your name').fill(owner.name);
  await desk.getByLabel('Email').fill(owner.email);
  await desk.getByLabel('Password (at least 8 characters)').fill(owner.password);
  await shot(desk, 'onboarding-1-account', {}, desk.getByRole('button', { name: 'Create account' }));
  await desk.getByRole('button', { name: 'Create account' }).click();

  await desk.getByLabel('Clinic name').fill(clinic.name);
  await desk.getByLabel('City').fill(clinic.city);
  await desk.getByLabel('Address').fill(clinic.address);
  await shot(desk, 'onboarding-2-clinic', {}, desk.getByRole('button', { name: 'Next' }));
  await desk.getByRole('button', { name: 'Next' }).click();

  await expect(desk.getByText('Are you a doctor here yourself?')).toBeVisible();
  await desk.getByRole('radio', { name: 'No' }).check();
  for (const [i, d] of doctors.entries()) {
    if (i > 0) await desk.getByRole('button', { name: 'Add another doctor' }).click();
    await desk.getByLabel("Doctor's name").nth(i).fill(d.name);
    await desk.getByLabel('Specialty').nth(i).fill(d.specialty);
    await desk.getByLabel('Room / counter').nth(i).fill(d.room);
  }
  await shot(desk, 'onboarding-3-doctors', {}, desk.getByRole('button', { name: 'Next' }));
  await desk.getByRole('button', { name: 'Next' }).click();

  await desk.getByLabel(/Receptionist's email/).fill(`reception.${run}@demo.mediq.test`);
  await shot(desk, 'onboarding-4-reception', {}, desk.getByRole('button', { name: 'Create clinic' }));
  await desk.getByRole('button', { name: 'Create clinic' }).click();
  await expect(desk.getByRole('heading', { name: 'Your clinic is ready' })).toBeVisible();
  const poster = desk.getByTestId('qr-poster');
  await expect(poster.locator('img')).toBeVisible();
  const slug = (await poster.locator('.num').innerText()).trim().split('/c/')[1];
  await shot(desk, 'onboarding-5-qr-poster', { fullPage: true }, desk.getByTestId('poster-download'));

  // 3. Settings: fee per doctor and online payment details
  await desk.goto('/settings');
  await expect(desk.getByRole('heading', { name: 'Settings' })).toBeVisible();
  for (let i = 0; i < doctors.length; i++) {
    const who = await desk.getByLabel("Doctor's name").nth(i).inputValue();
    await desk.getByLabel('Fee (Rs)').nth(i).fill(who.includes('Hamid') ? '1200' : '1000');
    await desk.getByRole('button', { name: 'Save' }).nth(i).click();
    await expect(desk.getByText('Saved').first()).toBeVisible();
  }
  await shot(desk, 'settings-doctors', { fullPage: true });
  await desk.getByRole('tab', { name: 'Fees' }).click();
  const fees = desk.getByRole('form', { name: 'Fees' });
  await fees.getByLabel('Easypaisa number').fill('0300 1234567');
  await fees.getByLabel('Easypaisa account title').fill('City Care Clinic');
  await fees.getByLabel('Bank name').fill('Meezan Bank');
  await fees.getByLabel('Bank account title').fill('City Care Clinic');
  await fees.getByLabel('IBAN').fill('PK36 MEZN 0000 0011 2345 6702');
  await fees.getByLabel('Raast ID (mobile number)').fill('03112223334');
  await fees.getByRole('button', { name: 'Save' }).click();
  await expect(desk.getByText('Saved')).toBeVisible();
  await shot(desk, 'settings-fees', { fullPage: true }, fees.getByRole('button', { name: 'Save' }));

  // 4. Reception: walk-ins with cash, then call the first one in
  await desk.goto('/reception');
  await expect(desk.getByRole('heading', { name: "Today's queue" })).toBeVisible();
  const form = desk.getByRole('form', { name: 'New walk-in token' });
  for (const [i, name] of walkIns.entries()) {
    await form.getByLabel('Patient name').fill(name);
    await form.getByLabel(/Phone/).fill(`0300 12345${String(i).padStart(2, '0')}`);
    const pick = form.getByLabel('Doctor');
    const doc = i === 3 ? 'Hamid' : 'Ayesha';
    await pick.selectOption(await pick.evaluate((el, d) => [...el.options].find(o => o.text.includes(d)).value, doc));
    if (i === 1) await shot(desk, 'reception-new-walk-in', {}, form.getByRole('button', { name: 'Issue token' }));
    await form.getByRole('button', { name: 'Issue token' }).click();
    await expect(desk.getByTestId('toast')).toContainText(`issued for ${name}`);
  }
  // Doctor columns come in no fixed order; find each one's "Call next" by its heading
  const cards = await desk.getByRole('heading', { name: /^Dr\. / }).allInnerTexts();
  const callNext = d => desk.getByRole('button', { name: /Call next/ }).nth(cards.findIndex(t => t.includes(d)));
  await shot(desk, 'reception-queue', {}, callNext('Ayesha'));
  await callNext('Ayesha').click();
  await expect(desk.getByTestId('now-token')).toHaveText('1');
  await shot(desk, 'reception-now-serving');

  // 5. Patient scans the QR at the door (phone, Urdu by default)
  const phone = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pat = await phone.newPage();
  await pat.goto(`/c/${slug}`);
  await expect(pat.getByRole('heading', { name: 'اپنا ٹوکن لیں' })).toBeVisible();
  await pat.getByLabel('مریض کا نام').fill('Zainab Ali');
  await pat.getByLabel('موبائل نمبر').fill('0301 5550001');
  await pat.getByRole('radio', { name: /Ayesha Khan/ }).check();
  const take = pat.getByRole('button', { name: 'ٹوکن لیں' });
  await expect(take).toBeEnabled({ timeout: 30_000 });
  await shot(pat, 'patient-join-urdu', { fullPage: true }, take);
  // Same screen in English for the portfolio
  const toEn = pat.getByRole('button', { name: 'انگریزی میں دیکھیں' });
  if (await toEn.isVisible()) {
    await toEn.click();
    await shot(pat, 'patient-join-english');
    await pat.getByRole('button', { name: 'Switch to Urdu' }).click();
  }
  await pat.getByRole('radio', { name: /Ayesha Khan/ }).check();
  await expect(take).toBeEnabled({ timeout: 30_000 });
  await take.click();
  await pat.waitForURL(/\/t\/[A-Z0-9]{8}$/);
  const statusUrl = pat.url();
  await expect(pat.getByTestId('pay-title')).toBeVisible();
  await pat.getByRole('button', { name: 'انگریزی میں دیکھیں' }).click();
  await shot(pat, 'patient-pay-fee', {}, pat.getByRole('button', { name: 'Send online' }));
  await pat.getByRole('button', { name: 'Send online' }).click();
  await pat.getByLabel(/Transaction ID/).fill('1111 2222 333');
  await shot(pat, 'patient-pay-online', { fullPage: true }, pat.getByRole('button', { name: /Send for check/ }));
  const send = pat.getByRole('button', { name: /Send for check/ });
  await expect(send).toBeEnabled({ timeout: 30_000 });
  await send.click();
  await expect(pat.getByTestId('pay-checking')).toBeVisible();
  await shot(pat, 'patient-payment-checking');

  // 6. Reception verifies the Easypaisa payment
  await desk.goto('/reception');
  const claim = desk.locator('[data-testid^="claim-"]').first();
  await expect(claim).toBeVisible();
  await shot(desk, 'reception-verify-payment', {}, claim.getByRole('button', { name: 'Verify' }));
  await claim.getByRole('button', { name: 'Verify' }).click();
  await expect(desk.getByTestId('toast')).toContainText('verified');

  // 7. Patient: in the line, live position
  await expect(pat.getByTestId('paid-in-line')).toBeVisible({ timeout: 15_000 });
  await shot(pat, 'patient-in-line', { fullPage: true });

  // 8. TV in the waiting room
  await desk.goto('/settings');
  await desk.getByRole('tab', { name: 'TV & QR' }).click();
  const displayUrl = (await desk.getByTestId('link-TV display link').innerText()).trim();
  await shot(desk, 'settings-tv-qr', { fullPage: true }, desk.getByTestId('link-TV display link'));
  const tvCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const tv = await tvCtx.newPage();
  await tv.goto(displayUrl);
  await expect(tv.getByTestId('tv-connection')).toHaveText('Live', { timeout: 15_000 });
  const startSound = tv.getByRole('button', { name: /Tap to start sound/ });
  if (await startSound.isVisible()) await startSound.click();

  // Call people in until it's Zainab's turn; TV and phone update live
  await desk.goto('/reception');
  await callNext('Hamid').click();
  for (let i = 0; i < 3; i++) {
    await callNext('Ayesha').click();
    await desk.waitForTimeout(700);
    if (i === 1) {
      await tv.waitForTimeout(1500);
      await shot(tv, 'tv-display');
      await pat.goto(statusUrl);
      await shot(pat, 'patient-almost-turn');
    }
  }
  await expect(pat.getByTestId('status-banner')).toBeVisible();
  await pat.waitForTimeout(11_000); // status page refreshes every 10s
  await shot(pat, 'patient-your-turn');
  await shot(desk, 'reception-busy');

  // 9. Records, plan and Urdu desk
  await desk.goto('/hisaab');
  await desk.waitForLoadState('networkidle');
  await shot(desk, 'records', { fullPage: true });
  await desk.goto('/settings/plan');
  await desk.waitForLoadState('networkidle');
  await shot(desk, 'plans', { fullPage: true });
  await desk.goto('/reception');
  await desk.getByRole('button', { name: 'Switch to Urdu' }).click();
  await expect(desk.locator('html')).toHaveAttribute('dir', 'rtl');
  await shot(desk, 'reception-urdu');
  await desk.getByRole('button', { name: /انگریزی|English/ }).first().click().catch(() => {});

  // 10. Sign-in page
  const anon = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const login = await anon.newPage();
  await login.goto('/login');
  await shot(login, 'login', {}, login.getByRole('button', { name: 'Sign in' }));

  await browser.close();
  require('fs').writeFileSync(path.join(OUT, 'hotspots.json'), JSON.stringify(hotspots, null, 1) + '\n');
  console.log('clinic slug:', slug);
})().catch(e => { console.error(e); process.exit(1); });
