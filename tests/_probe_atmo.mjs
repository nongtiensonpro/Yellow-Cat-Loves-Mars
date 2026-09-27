import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1280,height:760}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);
// Đóng mọi overlay/hộp thoại trước khi chụp, nếu không ảnh chỉ toàn popup.
const CLOSE_BTNS = ['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close',
                    '#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const CLOSE_OVERLAYS = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll = async (page) => {
  for (const sel of CLOSE_BTNS){
    const el = await page.$(sel);
    if (el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{});
  }
  await page.evaluate((ovs)=>{ for(const id of ovs){ const e=document.querySelector(id); if(e) e.style.display='none'; } }, CLOSE_OVERLAYS);
  await page.waitForTimeout(350);
};
await closeAll(page);
const read = () => page.evaluate(()=>{
  const s=window.__yc.scene;
  return { fog:'#'+s.fog.color.getHexString(), density:+s.fog.density.toFixed(5) };
});
const SPOTS = [['arcadia',0,0],['valles',420,-180],['olympus',-380,420],['polar',-520,-520],['storm',520,480]];
for (const [id,x,z] of SPOTS){
  await page.evaluate(([x,z])=>{ window.__yc.setPlayerPos(x,z); window.__yc.setOrbit(0.30, 13, 0.8); }, [x,z]);
  await page.waitForTimeout(2600);
  await closeAll(page);
  console.log(`${id.padEnd(9)}`, JSON.stringify(await read()));
  await page.screenshot({ path:`tests/atmo-${id}.png` });
}
// đổi preset rồi đọc lại: density phải theo fogMul
for (const g of ['low','cinematic','high']){
  await page.evaluate(x=>window.__yc.setGfx(x), g);
  await page.waitForTimeout(1500);
  console.log(`preset ${g.padEnd(10)}`, JSON.stringify(await read()));
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
