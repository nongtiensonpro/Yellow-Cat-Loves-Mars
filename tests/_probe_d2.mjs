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
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3500);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll=async()=>{ await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS); await page.waitForTimeout(300); };
// BẮT BUỘC preset 'high' trước, nếu không shadow vẫn tắt do localStorage
await page.evaluate(()=>{ localStorage.clear(); window.__yc.setGfx('high'); });
await page.waitForTimeout(1200);
await page.evaluate(()=>{ window.__yc.setPlayerPos(690,690); window.__yc.setCam(1); window.__yc.setOrbit(0.42,20,0.8); });
await page.waitForTimeout(1900); await closeAll();
console.log('SHADOW really on?', await page.evaluate(()=>{
  let s=0; window.__yc.scene.traverse(o=>{ if(o.isDirectionalLight&&o.castShadow) s++; }); return s; }));
// Liệt kê MESH LỚN — thủ phạm là hình học phẳng rộng
const big = await page.evaluate(()=>{
  const out=[]; const THREE=window.__yc.THREE;
  window.__yc.scene.traverse(o=>{
    if(!(o.isMesh||o.isInstancedMesh)) return;
    if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb=o.geometry.boundingBox, sz=[bb.max.x-bb.min.x, bb.max.y-bb.min.y, bb.max.z-bb.min.z];
    const area=Math.max(sz[0],sz[2]);
    if(area>500) out.push({ type:o.type, geo:o.geometry.type,
      size:[Math.round(sz[0]),Math.round(sz[1]),Math.round(sz[2])],
      pos:[Math.round(o.position.x),Math.round(o.position.y),Math.round(o.position.z)],
      mat:o.material&&o.material.type, vis:o.visible, inst:o.count||null });
  });
  return out.sort((a,b)=>Math.max(...b.size)-Math.max(...a.size)).slice(0,10);
});
console.log('MESH LỚN:'); for(const m of big) console.log('  '+JSON.stringify(m));
await page.screenshot({ path:'tests/d2-high-shadowOn.png' });
await page.evaluate(()=>{ const s=window.__yc.scene; s.traverse(o=>{ if(o.isDirectionalLight) o.castShadow=false; }); });
await page.waitForTimeout(1400); await closeAll();
await page.screenshot({ path:'tests/d2-high-shadowOff.png' });
await b.close();
