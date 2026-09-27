import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1100,height:680}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3500);
const CLOSE = ['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const OVS = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll = async () => {
  for (const sel of CLOSE){ const el=await page.$(sel); if(el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{}); }
  await page.evaluate(o=>{ for(const id of o){ const e=document.querySelector(id); if(e) e.style.display='none'; } }, OVS);
  await page.waitForTimeout(300);
};
await page.evaluate(()=>{ localStorage.clear(); window.__yc.setGfx('high'); window.__yc.setTime(0.33); });
await page.waitForTimeout(1500);
await closeAll();
const SPOTS = [['goc',690,690],['giua',0,0],['gan',120,80]];
for (const [id,x,z] of SPOTS){
  await page.evaluate(([x,z])=>{ window.__yc.setPlayerPos(x,z); window.__yc.setCam(1); window.__yc.setOrbit(0.42, 20, 0.8); }, [x,z]);
  await page.waitForTimeout(1900); await closeAll();
  await page.screenshot({ path:`tests/f5-${id}.png` });
}
// cận xe để soi bóng sắc
await page.evaluate(()=>{ window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.22, 3.6, 0.7); });
await page.waitForTimeout(1600); await closeAll();
await page.screenshot({ path:'tests/f5-xe.png' });
console.log('lights:', JSON.stringify(await page.evaluate(()=>{
  const o=[]; window.__yc.scene.traverse(x=>{ if(x.isLight) o.push(x.type+':'+x.layers.mask); }); return o.slice(0,4); })));
console.log('PERF:', JSON.stringify(await page.evaluate(()=>{const i=window.__yc.rendererInfo();return{calls:i.calls,tri:i.triangles};})));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
