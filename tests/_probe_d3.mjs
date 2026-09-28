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
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3500);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll=async()=>{ await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS); await page.waitForTimeout(300); };
await page.evaluate(()=>{ localStorage.clear(); window.__yc.setGfx('cinematic'); });
await page.waitForTimeout(1200);
await page.evaluate(()=>{ window.__yc.setPlayerPos(0,0); window.__yc.setCam(1); window.__yc.setOrbit(0.26, 4.5, 0.7); });
await page.waitForTimeout(2000); await closeAll();
console.log('thông tin:', JSON.stringify(await page.evaluate(()=>{
  const s=window.__yc.scene; const L=[];
  s.traverse(o=>{ if(o.isDirectionalLight) L.push({mask:o.layers.mask, cast:o.castShadow,
    map:o.shadow.mapSize.x, box:o.shadow.camera.right, hasMap:!!o.shadow.map,
    inten:+o.intensity.toFixed(2), pos:[o.position.x|0,o.position.y|0,o.position.z|0]}); });
  return { lights:L, shadowOn: window.__yc.renderer.shadowMap.enabled, type: window.__yc.renderer.shadowMap.type };
})));
await page.screenshot({ path:'tests/d3-spawn-shadowON.png' });
await page.evaluate(()=>{ const s=window.__yc.scene; s.traverse(o=>{ if(o.isDirectionalLight) o.castShadow=false; }); });
await page.waitForTimeout(1400); await closeAll();
await page.screenshot({ path:'tests/d3-spawn-shadowOFF.png' });
console.log('ERRORS:', errs.length);
await b.close();
