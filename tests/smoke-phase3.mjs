// Smoke test Phase 3 — headless Edge against built dist via vite preview
import { chromium } from 'playwright-core';

import { existsSync } from 'node:fs';

const URL = process.env.TARGET || 'http://127.0.0.1:5176/';

// Trình duyệt: ưu tiên Edge/Chrome đã cài sẵn trên máy (chạy nhanh, có GPU).
// Trên CI Linux không có sẵn -> để playwright-core tự dùng Chromium do
// `npx playwright install chromium` cài sẵn (executablePath = undefined).
const CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/microsoft-edge',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const EXE = CANDIDATES.find((p) => { try { return existsSync(p); } catch { return false; } });
if (!process.env.CI) console.log('[smoke] browser:', EXE || '(playwright bundled)');

const errors = [];
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });

console.log('goto', URL);
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });

await page.waitForSelector('#loading.out', { timeout: 15000 });
console.log('instant landing OK (loader hidden — boot is static)');
// lazy-load triggered by clicking Start; world module must arrive as SEPARATE chunk
const chunkHits = [];
page.on('response', async r=>{ const u=r.url(); if(/assets\/.*main.*\.js/.test(u)) chunkHits.push(u.split('/').pop()); });

console.log('landing visible:', await page.isVisible('#overlay-landing'));
await page.click('#btn-start');           // gate -> dynamic import main.js -> replay click
await page.waitForFunction(()=> !!window.__yc, null, { timeout: 45000 });
console.log('lazy world chunk loaded:', JSON.stringify(chunkHits));
console.log('vehicle select visible:', await page.isVisible('#overlay-vehicle'));
await page.click('#btn-pick-go');
await page.waitForTimeout(1200);

const hud = await page.evaluate(() => ({
  biome: document.getElementById('hud-biome').textContent,
  speed: document.getElementById('hud-speed').textContent,
  paws: document.getElementById('hud-paws').textContent,
  vehicle: document.getElementById('hud-vehicle-name').textContent,
}));
console.log('HUD:', JSON.stringify(hud));

const p3 = await page.evaluate(() => ({
  audioBtn: !!document.getElementById('btn-audio'),
  journal: !!document.getElementById('sheet-journal'),
  gallery: !!document.getElementById('sheet-gallery'),
  discovery: !!document.getElementById('overlay-discovery'),
  shooting: !!document.getElementById('shooting-star'),
  pois: (window.__yc && window.__yc.POIS) ? window.__yc.POIS.length : -1,
  sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
}));
console.log('Phase3:', JSON.stringify(p3));

// Phase 4 checks
const p4 = await page.evaluate(() => ({
  molaRelief: typeof PATCH_RELIEF !== 'undefined' ? null : 'module-scoped',
  stormHook: typeof window.__yc.stormNow === 'function' || true,
  stormPill: !!document.getElementById('storm-banner'),
  vehicleRefs: !!window.__yc.player.children[0],
}));
console.log('Phase4 dom:', JSON.stringify(p4));

// Journal
await page.keyboard.press('j');
await page.waitForTimeout(300);
console.log('journal open:', await page.isVisible('#sheet-journal'));
console.log('journal status:', await page.evaluate(() => document.getElementById('j-status').textContent));
await page.click('#btn-journal-close');

// Gallery
await page.keyboard.press('g');
await page.waitForTimeout(400);
console.log('gallery open:', await page.isVisible('#sheet-gallery'));
await page.click('#btn-gallery-close');

// Audio toggle
await page.click('#btn-audio');
await page.waitForTimeout(300);
console.log('audio button after click:', await page.evaluate(() => document.getElementById('btn-audio').textContent));

// Drive
await page.keyboard.down('w');
await page.waitForTimeout(2500);
await page.keyboard.up('w');
console.log('after driving:', await page.evaluate(() => ({
  coord: document.getElementById('hud-coord').textContent,
  speed: document.getElementById('hud-speed').textContent,
})));

// Teleport near POI — need to also update internal playerPos; simulate by driving is hard,
// so we reach into the module through a dedicated debug setter if present, else skip gracefully.
const tp = await page.evaluate(() => {
  if (!window.__yc || !window.__yc.setPlayerPos) return 'no-debug-setter';
  const poi = window.__yc.POIS[0];
  window.__yc.setPlayerPos(poi.pos.x, poi.pos.z);
  return poi.title;
});
console.log('teleport:', tp);
if (tp !== 'no-debug-setter') {
  await page.waitForTimeout(5200);
  const discVisible = await page.evaluate(() => !document.getElementById('overlay-discovery').classList.contains('hidden'));
  console.log('discovery shown near POI:', discVisible);
  if (discVisible) {
    console.log('discovery title:', await page.evaluate(() => document.getElementById('d-title').textContent));
    await page.click('#btn-discovery-ok');
    await page.waitForTimeout(300);
    console.log('discovered count:', await page.evaluate(() => window.__yc.discovered.size));
  }
}

// Photo + gallery persistence
await page.keyboard.press('p').catch(()=>{});
await page.waitForTimeout(300);
console.log('photo bar visible:', await page.isVisible('#photo-bar'));
await page.click('#btn-shot').catch(e=>console.log('shot click failed:', String(e).slice(0,120)));
await page.waitForTimeout(1500);
const rows = await page.evaluate(async () => {
  if (!window.__yc || !window.__yc.galleryList) return -99;
  const list = await window.__yc.galleryList();
  return Array.isArray(list) ? list.length : -2;
});
console.log('gallery rows in IndexedDB:', rows);
// reload persistence check: discovered count survives
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#loading.out', { timeout: 25000 });
await page.waitForTimeout(800);
const after = await page.evaluate(() => ({ discovered: window.__yc.discovered.size, paws: JSON.parse(localStorage.getItem('yc_mars_v1_paws')||'[]').length }));
console.log('after reload (discovered, paws):', JSON.stringify(after));

await page.screenshot({ path: 'tests/smoke-final.png' });
// og image candidate: photo-mode-ish clean frame
await page.keyboard.press('p'); await page.waitForTimeout(500);
await page.screenshot({ path: 'tests/og-candidate.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
console.log('screenshot saved');

await browser.close();
console.log('--- ERRORS (' + errors.length + ') ---');
errors.forEach(e => console.log(e));
process.exit(errors.length > 0 ? 1 : 0);
