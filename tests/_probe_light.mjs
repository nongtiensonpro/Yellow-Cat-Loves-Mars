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
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
console.log('ánh sáng:', await page.evaluate(()=>{
  const o={}; window.__yc.scene.traverse(x=>{ if(x.isLight) o[x.name||x.type]={
    t:x.type, i:+x.intensity.toFixed(3), layers:x.layers.mask, p:[Math.round(x.position.x),Math.round(x.position.y),Math.round(x.position.z)] }; });
  const s=window.__yc.scene; return JSON.stringify({lights:o, ambient:s.ambient?s.ambient.intensity:'none',
    sunDir:(()=>{const d=window.__yc.scene.getObjectByName('sun'); return d?[Math.round(d.position.x),Math.round(d.position.y),Math.round(d.position.z)]:null;})(),
    shadowNear: window.__yc.renderer.shadowMap.enabled }, null, 1); }));
// cao độ & độ sáng tại các điểm
for (const [nm,x,z] of [['bo-kenh',350,10],['bo-trong',350,-60],['day-ham',350,-150],['nen-dong',0,0]]){
  await page.evaluate(a=>{ const tc=document.getElementById('toast-close'); if(tc) tc.click();
    window.__yc.setGfx('high'); window.__yc.setTime(0.33); window.__yc.setPlayerPos(a.x,a.z);
    window.__yc.setOrbit(0.5, 24, 0.6); }, {x,z});
  await page.waitForTimeout(1800);
  const px = await page.evaluate(()=>{ const c=document.querySelector('canvas');
    const t=document.createElement('canvas'); t.width=c.width; t.height=c.height;
    t.getContext('2d').drawImage(c,0,0);
    const d=t.getContext('2d').getImageData(Math.floor(c.width*0.35), Math.floor(c.height*0.35), 64, 64).data;
    let s=0; for(let i=0;i<d.length;i+=4) s+=(d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722); return (s/(d.length/4)).toFixed(1); });
  const h = await page.evaluate(a=>window.__yc.heightAt(a.x,a.z).toFixed(1), {x,z});
  console.log(`  ${nm.padEnd(9)} (${x},${z}) cao độ ${h}m · sáng trung bình ${px}`);
}
await b.close();
