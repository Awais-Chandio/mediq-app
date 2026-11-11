#!/usr/bin/env node
// Gives the seed doctor (doctor.a, Sunrise Medical Centre) a queue for the mobile
// doctor screenshots: reception (staff.a) issues walk-ins on the web desk.
//   NODE_PATH=../mediq-web/node_modules node marketing/tools/seed-doctor-queue.js
const { chromium, expect } = require('@playwright/test');
const BASE = process.env.BASE_URL || 'http://localhost:3100';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
  await page.goto('/login');
  await page.getByLabel('Email').fill('staff.a@mediq.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/reception$/);
  const form = page.getByRole('form', { name: 'New walk-in token' });
  for (const [i, name] of ['Fatima Noor', 'Kashif Mehmood', 'Ayesha Siddiqa', 'Rehan Baig', 'Saima Javed'].entries()) {
    await form.getByLabel('Patient name').fill(name);
    await form.getByLabel(/Phone/).fill(`0333 76543${String(i).padStart(2, '0')}`);
    await form.getByRole('button', { name: 'Issue token' }).click();
    await expect(page.getByTestId('toast')).toContainText(`issued for ${name}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
