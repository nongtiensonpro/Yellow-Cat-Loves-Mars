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
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,200)); });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const CLOSE=['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const closeAll=async()=>{
  for(const s of CLOSE){ const e=await page.$(s); if(e && await e.isVisible().catch(()=>false)) await e.click().catch(()=>{}); }
  await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS);
  await page.waitForTimeout(400);
};
await closeAll();
const state = () => page.evaluate(()=>{
  const y = window.__yc;
  return { gfx:y.gfxName,
           post: y.postState ? y.postState() : '(chưa có API)' };
});
for (const g of ['low','medium','high','cinematic']){
  await page.evaluate(x=>{ localStorage.clear(); window.__yc.setGfx(x); window.__yc.setTime(0.33); }, g);
  await page.waitForTimeout(1600);
  await page.evaluate(()=>{ window.__yc.setPlayerPos(0,0); window.__yc.setCam(1); window.__yc.setOrbit(0.30, 11, 0.8); });
  await page.waitForTimeout(1800); await closeAll();
  const st = await state();
  console.log(g.padEnd(10), JSON.stringify(st));
  await page.screenshot({ path:`tests/fx-${g}.png` });
}
console.log('ERRORS:', errs.length, errs.slice(0,4));
await b.close();
process.exit(errs.length?1:0);
