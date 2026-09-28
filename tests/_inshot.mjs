
import { chromium } from 'playwright-core';
// ── TARGET có mặc định + báo lỗi rõ ràng khi server chưa chạy ──
// Trước đây thiếu TARGET là chết với `url: expected string, got undefined` —
// thông báo không liên quan gì tới việc thật sự sai.
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try {
  const r = await fetch(TARGET_URL, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
} catch (e) {
  console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`);
  console.error('  Khởi động server trước:  node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173');
  console.error('  Hoặc trỏ sang nơi khác:   TARGET=http://... node tests/<probe>.mjs');
  process.exit(2);
}
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage({ viewport:{width:1280,height:800} });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=> !!window.__yc, null, { timeout:45000 });
await page.waitForTimeout(1500);
await page.keyboard.down('w'); await page.waitForTimeout(2800); await page.keyboard.up('w');
await page.waitForTimeout(500);
await page.screenshot({ path:'tests/v04-arcadia.png' });
await page.evaluate(()=>{ const p=window.__yc.POIS.find(p=>p.biome==='valles'); window.__yc.setPlayerPos(p.pos.x-60, p.pos.z+40); });
await page.waitForTimeout(600);
await page.screenshot({ path:'tests/v04-valles.png' });
await page.evaluate(()=>{ const p=window.__yc.POIS.find(p=>p.biome==='olympus'); window.__yc.setPlayerPos(p.pos.x+90, p.pos.z+90); });
await page.waitForTimeout(600);
await page.screenshot({ path:'tests/v04-olympus.png' });
// force storm visual for screenshot
await page.evaluate(()=>{ window.__yc.forceStorm && window.__yc.forceStorm(); });
await page.waitForTimeout(3500);
await page.screenshot({ path:'tests/v04-storm.png' });
await b.close(); console.log('shots ok');
