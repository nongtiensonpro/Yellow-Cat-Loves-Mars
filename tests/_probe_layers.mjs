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
const page = await (await b.newContext({viewport:{width:1100,height:680}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3500);
// KIỂM TRA COVERAGE LAYER — tìm object không nguồn nào chiếu sáng
const r = await page.evaluate(()=>{
  const lights=[];
  window.__yc.scene.traverse(o=>{ if(o.isLight) lights.push({t:o.type, mask:o.layers.mask, name:o.name||''}); });
  const NEAR=2, FAR=4, buckets={near:0,far:0,both:0,none:0}, noneList=[];
  window.__yc.scene.traverse(o=>{
    if(!(o.isMesh||o.isInstancedMesh||o.isPoints||o.isLine)) return;
    const n=!!(o.layers.mask&NEAR), f=!!(o.layers.mask&FAR);
    if(n&&f) buckets.both++; else if(n) buckets.near++; else if(f) buckets.far++;
    else { buckets.none++; if(noneList.length<8) noneList.push(o.type+'/'+(o.material&&o.material.type)); }
  });
  return { buckets, noneList, lights,
    camMask: window.__yc.camera.layers.mask,
    playerMask: window.__yc.player.layers.mask,
    terrainMask: (()=>{ let m=null; window.__yc.scene.traverse(o=>{ if(o.isMesh && o.geometry && o.geometry.attributes.position && o.geometry.attributes.position.count>20000 && !m) m=o.layers.mask; }); return m; })() };
});
console.log('LAYER:', JSON.stringify(r,null,1));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
