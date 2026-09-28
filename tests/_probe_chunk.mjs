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
page.on('console', m=>{ const t=m.text(); if(t.includes('[terrain]')) console.log('  '+t); if(m.type()==='error') errs.push(t.slice(0,180)); });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
async function clean(){ for(let k=0;k<3;k++){ await page.evaluate(h=>{
  const t=document.getElementById('toast-close'); if(t) t.click();
  document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show'));
  for(const id of h){const e=document.querySelector(id); if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE);
  await page.waitForTimeout(400);} }
await clean();
console.log('boot:', JSON.stringify(await page.evaluate(()=>window.__yc.chunkInfo())));
// đo tam giác THẬT do renderer vẽ ở nhiều nơi
for (const [nm,x,z] of [['spawn',0,0],['valles',350,-150],['olympus',-380,420],['polar',-520,-520],['goc',650,650]]){
  await page.evaluate(a=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
    window.__yc.setPlayerPos(a.x,a.z); window.__yc.setOrbit(0.35, 90, 0.7); }, {x,z});
  await page.waitForTimeout(1600); await clean();
  const r = await page.evaluate(()=>{ const i=window.__yc.rendererInfo(), c=window.__yc.chunkInfo();
    return { calls:i.calls, tri:i.triangles, chunksVis:c.visible, chunkTris:c.tris }; });
  const pl = await page.evaluate(()=>window.__yc.chunkInfo().perLod);
  console.log(`${nm.padEnd(8)} (${x},${z})  draw ${r.calls}  tri ${r.tri}  chunk ${r.chunksVis}/64  tri chunk ${r.chunkTris}  LOD ${JSON.stringify(pl)}`);
  await page.screenshot({ path:`tests/ck-${nm}.png` });
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
