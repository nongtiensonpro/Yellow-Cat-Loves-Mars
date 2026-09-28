import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
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
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext()).newPage();
const errs=[]; page.on('pageerror',e=>errs.push({m:e.message, s:(e.stack||'').split('\n').slice(0,4).join(' | ')}));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(6000);
await page.keyboard.down('w'); await page.waitForTimeout(2500);
await page.keyboard.down('d'); await page.waitForTimeout(2500);
await page.keyboard.up('d'); await page.waitForTimeout(1500);
await page.keyboard.down('s'); await page.waitForTimeout(1500);
await page.keyboard.up('s'); await page.keyboard.up('w'); await page.waitForTimeout(1500);
await page.keyboard.down('w'); await page.waitForTimeout(2000);
await page.keyboard.down('Shift'); await page.waitForTimeout(2000);
await page.keyboard.up('Shift'); await page.keyboard.up('w'); await page.waitForTimeout(1200);
for (const v of ['moto','rover','bike']){ await page.evaluate(x=>window.__yc.setVehicle(x), v); await page.waitForTimeout(1600); }
await page.keyboard.down('c'); await page.waitForTimeout(900); await page.keyboard.up('c'); await page.waitForTimeout(1500);
const seen = new Map();
for (const e of errs) if (!seen.has(e.m)) seen.set(e.m, {n:0, s:e.s});
for (const e of errs) if (seen.has(e.m)) seen.get(e.m).n++;
for (const [m,v] of seen) console.log(`[${v.n}×] ${m}\n     ${v.s}\n`);
await b.close();
