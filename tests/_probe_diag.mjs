import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1100,height:680}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);
const OVS = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const CLOSE = ['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const closeAll = async () => {
  for (const sel of CLOSE){ const el=await page.$(sel); if(el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{}); }
  await page.evaluate(o=>{ for(const id of o){ const e=document.querySelector(id); if(e) e.style.display='none'; } }, OVS);
  await page.waitForTimeout(300);
};
await closeAll();
await page.evaluate(()=>{ window.__yc.setPlayerPos(690,690); window.__yc.setCam(1); window.__yc.setOrbit(0.42, 22, 0.8); });
await page.waitForTimeout(1800); await closeAll();
await page.screenshot({ path:'tests/diag-shadow-ON.png' });
// TẮT shadow: nếu vệt tối cứng biến mất -> do frustum shadow
await page.evaluate(()=>{ window.__yc.setGfx('low'); });
await page.waitForTimeout(1800); await closeAll();
await page.screenshot({ path:'tests/diag-shadow-OFF.png' });
console.log('shadowMap sau khi tắt:', await page.evaluate(()=>window.__yc.rendererInfo().shadowMapEnabled));
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
