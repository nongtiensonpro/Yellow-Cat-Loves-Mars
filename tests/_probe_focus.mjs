import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#photo-bar','#toast'];
const clean = async()=>{ await page.evaluate(h=>h.forEach(id=>{const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.remove('show');}}),HIDE);
  await page.waitForTimeout(300); };
await page.evaluate(()=>{ window.__yc.setGfx('cinematic'); window.__yc.setTime(0.35);
  window.__yc.setOrbit(0.06, 4.2, 0.10); });
await page.waitForTimeout(2500); await clean();
console.log('ngoài photo mode, focus =', await page.evaluate(()=>window.__yc.focusOn()));
await page.screenshot({ path:'tests/t35-focus-OFF.png' });
await page.keyboard.press('p');
await page.waitForTimeout(1600); await clean();
console.log('trong photo mode, focus =', await page.evaluate(()=>window.__yc.focusOn()));
await page.screenshot({ path:'tests/t35-focus-ON.png' });
await page.keyboard.press('p'); await page.waitForTimeout(1200);
console.log('tắt lại, focus =', await page.evaluate(()=>window.__yc.focusOn()));
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
