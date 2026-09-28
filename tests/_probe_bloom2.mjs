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
const page = await (await b.newContext({viewport:{width:900,height:520}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<3;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(300); }
await page.evaluate(()=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
  window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.3, 60, 0.6); });
await page.waitForTimeout(2500);
console.log('passes ON:', await page.evaluate(()=>window.__yc.composer().passes.map(p=>p.enabled?1:0).join('')));
await page.screenshot({ path:`tests/bon-full.png` });
await page.screenshot({ path:`tests/bon-clip.png`, clip:{x:120,y:90,width:660,height:340} });
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
