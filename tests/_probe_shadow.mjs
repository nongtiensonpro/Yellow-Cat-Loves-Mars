import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1280,height:780}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);
const CLOSE = ['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const OVS = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll = async () => {
  for (const sel of CLOSE){ const el=await page.$(sel); if(el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{}); }
  await page.evaluate(o=>{ for(const id of o){ const e=document.querySelector(id); if(e) e.style.display='none'; } }, OVS);
  await page.waitForTimeout(300);
};
await closeAll();
// ĐO: độ phân giải texel shadow tại các vị trí, kể cả RÌA bản đồ (700m)
const SPOTS = [['giua',0,0],['ria-dong',690,0],['ria-bac',-690,-690],['gia-cor',690,690]];
for (const [id,x,z] of SPOTS){
  await page.evaluate(([x,z])=>{ window.__yc.setPlayerPos(x,z); window.__yc.setCam(1); window.__yc.setOrbit(0.30, 6.5, 0.8); }, [x,z]);
  await page.waitForTimeout(1600); await closeAll();
  const d = await page.evaluate(()=>{
    const s=window.__yc.scene, sun=s.children.find(o=>o.isDirectionalLight);
    const c=sun.shadow.camera;
    const w=(c.right-c.left), map=sun.shadow.mapSize.x;
    return { texel:+(w/map).toFixed(4), box:+w.toFixed(0), map,
      target:[Math.round(sun.target.position.x), Math.round(sun.target.position.z)],
      player:[Math.round(window.__yc.player.position.x), Math.round(window.__yc.player.position.z)],
      far:+sun.shadow.camera.far.toFixed(0), normalBias:sun.shadow.normalBias };
  });
  console.log(id.padEnd(9), JSON.stringify(d));
  await page.screenshot({ path:`tests/sh-${id}.png` });
}
console.log('PERF:', JSON.stringify(await page.evaluate(()=>{const i=window.__yc.rendererInfo();return{calls:i.calls,tri:i.triangles};})));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
