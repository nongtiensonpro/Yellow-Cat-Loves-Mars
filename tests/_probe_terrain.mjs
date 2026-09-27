import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1400,height:850}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,200)); });
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
await closeAll();
await page.evaluate(()=>{ document.documentElement.dataset.perf='1'; });
console.log('terrainMat:', JSON.stringify(await page.evaluate(()=>window.__yc.terrainMat())));
console.log('rendererInfo:', JSON.stringify(await page.evaluate(()=>window.__yc.rendererInfo())));

const shots = [
  ['tm-close',  10,  20, 0.16, 3.0],
  ['tm-mid',    34,  46, 0.50, 8],
  ['tm-wide',  -60,  30, 0.95, 11],
];
for (const [name,x,z,pitch,dist] of shots){
  await page.evaluate(([x,z,p,d])=>{ window.__yc.setPlayerPos(x,z); window.__yc.setOrbit(p,d,0.9); }, [x,z,pitch,dist]);
  await page.waitForTimeout(1500);
  await closeAll();
  await page.screenshot({ path:`tests/${name}.png` });
  console.log('  chụp', name);
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
