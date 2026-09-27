import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3500);
const OVS = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll = async () => { await page.evaluate(o=>{ for(const id of o){ const e=document.querySelector(id); if(e) e.style.display='none'; } }, OVS); await page.waitForTimeout(300); };
await closeAll();
// Tắt TẤT CẢ đèn directional + ambient để chỉ còn môi trường
await page.evaluate(()=>{ window.__yc.setPlayerPos(690,690); window.__yc.setCam(1); window.__yc.setOrbit(0.42, 20, 0.8); });
await page.waitForTimeout(1800); await closeAll();
await page.screenshot({ path:'tests/diff-A-normal.png' });
// Tắt riêng sunFar
await page.evaluate(()=>{ const s=window.__yc.scene; s.traverse(o=>{ if(o.isDirectionalLight && o.layers.mask===4) o.castShadow=false; }); });
await page.waitForTimeout(1500); await closeAll();
await page.screenshot({ path:'tests/diff-B-noFarShadow.png' });
// Tắt cả sun lẫn sunFar
await page.evaluate(()=>{ const s=window.__yc.scene; s.traverse(o=>{ if(o.isDirectionalLight) o.castShadow=false; }); });
await page.waitForTimeout(1500); await closeAll();
await page.screenshot({ path:'tests/diff-C-noShadowAtAll.png' });
console.log('ok');
await b.close();
