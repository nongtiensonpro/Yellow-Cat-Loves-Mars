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
// camMode 2 = orbit (thấy toàn cảnh + xe), bật data-perf để xem số đo
await closeAll();
await page.evaluate(()=>{ document.documentElement.dataset.perf='1'; });

const shots = [
  ['lm-spawn',    0,   0, 2],
  ['lm-mesa',    34,  46, 2],
  ['lm-wide',   -60,  30, 2],
];
for (const [name,x,z,cam] of shots){
  await page.evaluate(([x,z,cam])=>{ window.__yc.setPlayerPos(x,z); window.__yc.setCam(cam); }, [x,z,cam]);
  await page.waitForTimeout(1600);
  await closeAll();
  await page.screenshot({ path:`tests/${name}.png` });
  console.log('  chụp', name, await page.evaluate(()=>window.__yc.perf().calls)+' draw');
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
