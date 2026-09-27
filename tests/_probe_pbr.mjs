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
  await page.waitForTimeout(350);
};
await closeAll();
for (const veh of ['rover','bike','moto']){
  await page.evaluate(v=>{ window.__yc.setVehicle(v); window.__yc.setCam(1); window.__yc.setOrbit(0.24, 3.4, 0.7); }, veh);
  await page.waitForTimeout(2000);
  await closeAll();
  await page.screenshot({ path:`tests/pbr-${veh}.png` });
}
// đo vật liệu thực sự dùng
const mats = await page.evaluate(()=>{
  const seen=new Set(), out=[];
  window.__yc.scene.traverse(o=>{ if(o.isMesh && o.material){ if(!seen.has(o.material.uuid)){ seen.add(o.material.uuid);
    const m=o.material; out.push({t:m.type, cc:m.clearcoat??null, nm:!!m.normalMap, rm:!!m.roughnessMap, r:m.roughness}); } } });
  return { unique: out.length, physical: out.filter(m=>m.t==='MeshPhysicalMaterial').length,
           withNormal: out.filter(m=>m.nm).length, withRough: out.filter(m=>m.rm).length,
           samples: out.filter(m=>m.t==='MeshPhysicalMaterial').slice(0,4) };
});
console.log('VẬT LIỆU:', JSON.stringify(mats,null,1));
console.log('PERF:', JSON.stringify(await page.evaluate(()=>{ const i=window.__yc.rendererInfo(); return {calls:i.calls,tri:i.triangles,progs:window.__yc.renderer.info.programs.length}; })));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
