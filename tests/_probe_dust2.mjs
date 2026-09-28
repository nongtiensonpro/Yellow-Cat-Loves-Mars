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
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<4;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(320); }
async function clean(){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE);
  await page.evaluate(()=>{ const t=document.getElementById('toast-close'); if(t)t.click();
    document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show')); });
  await page.waitForTimeout(300); }
const left = await page.evaluate(h=>h.filter(id=>{const e=document.querySelector(id);
  return e && getComputedStyle(e).display!=='none';}), HIDE);
console.log('overlay còn:', left.length? left.join(','):'không');
await page.evaluate(()=>{ window.__yc.setGfx('cinematic'); window.__yc.setTime(0.5);
  window.__yc.setVehicle('rover'); window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.10, 3.0, 0.13); });
await page.waitForTimeout(3000); await clean();
for (const v of [0, 0.85]){
  await page.evaluate(x=>window.__yc.setDust(x), v);
  await page.waitForTimeout(900); await clean();
  console.log(`bụi ${v}:`, JSON.stringify(await page.evaluate(()=>window.__yc.dustInfo())));
  await page.screenshot({ path:`tests/t33-gan${v===0?'0':'085'}.png` });
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
