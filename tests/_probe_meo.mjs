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
const errs=[], logs=[];
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ const t=m.text(); if(t.includes('[meo]')) logs.push(t);
  if(m.type()==='error') errs.push(t.slice(0,200)); });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForFunction(()=>{ const i=window.__yc.meoInfo(); return i.loaded || i.err; }, null, {timeout:40000})
  .catch(()=>console.log('!! GLB không nạp xong trong 40s'));
await page.waitForTimeout(2500);
console.log('meoInfo:', JSON.stringify(await page.evaluate(()=>window.__yc.meoInfo())));
console.log('log [meo]:', logs.join(' | ') || '(không có)');
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
async function clean(){ for(let k=0;k<3;k++){ await page.evaluate(h=>{
  const t=document.getElementById('toast-close'); if(t) t.click();
  document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show'));
  for(const id of h){const e=document.querySelector(id); if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE);
  await page.waitForTimeout(400);} }
await clean();
for (const [nm, glb] of [['giap', false], ['glb', true]]){
  for (const [gn, yaw, dist, pitch] of [['sau',0.0,3.0,0.16],['ho',1.57,2.4,0.08],['truoc',3.14,2.5,0.10]]){
    await page.evaluate(a=>{ window.__yc.setMeoSource(a.g); window.__yc.setGfx('high'); window.__yc.setTime(0.33);
      window.__yc.setVehicle('moto'); window.__yc.setPlayerPos(0,0);
      window.__yc.setCam(2); window.__yc.setOrbit(a.p, a.d, a.y); },
      {g:glb, y:yaw, d:dist, p:pitch});
    await page.waitForTimeout(1500); await clean();
    await page.screenshot({ path:`tests/meo-${nm}-${gn}.png` });
  }
  const st = await page.evaluate(()=>{ const i=window.__yc.rendererInfo();
    return { draw:i.calls, tri:i.triangles, glb:window.__yc.meoInfo().useGLB }; });
  console.log(nm, JSON.stringify(st));
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
