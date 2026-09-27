import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1400,height:850}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);
const closeAll = async () => {
  for (const sel of ['#btn-vehicle-close','#btn-pick-go']){
    const el = await page.$(sel);
    if (el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{});
  }
  await page.evaluate(()=>{ const e=document.getElementById('overlay-vehicle'); if(e) e.style.display='none'; });
  await page.waitForTimeout(400);
};
const state = async () => page.evaluate(()=>({
  compact: document.getElementById('hud')?.classList.contains('hud-compact'),
  hintHidden: document.getElementById('hud-hint')?.classList.contains('hud-drive-hidden'),
  switchHidden: document.getElementById('vehicle-switch')?.classList.contains('hud-drive-hidden'),
}));
await closeAll();
await page.evaluate(()=>{ window.__yc.setCam(1); });
await page.waitForTimeout(1400);
console.log('ĐỨNG YỀN :', JSON.stringify(await state()));
await page.screenshot({ path:'tests/hud-idle.png' });
await page.keyboard.down('w');
await page.waitForTimeout(1400);
console.log('ĐANG LÁI :', JSON.stringify(await state()));
await page.screenshot({ path:'tests/hud-drive.png' });
await page.keyboard.up('w');
await page.waitForTimeout(2200);
console.log('DỪNG 2.2s:', JSON.stringify(await state()));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
