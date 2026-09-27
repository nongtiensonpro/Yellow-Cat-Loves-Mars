import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:800,height:500}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll=async()=>{ await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS); await page.waitForTimeout(300); };
await closeAll();
await page.evaluate(()=>{ localStorage.clear(); window.__yc.setGfx('high'); window.__yc.setTime(0.33); window.__yc.setPlayerPos(0,0); });
await page.waitForTimeout(2000);
const snap = async (tag) => {
  const s = await page.evaluate(()=>{
    const sc=window.__yc.scene, cam=window.__yc.camera;
    const L=[]; sc.traverse(o=>{ if(o.isLight) L.push({t:o.type, i:+o.intensity.toFixed(3),
      c:'#'+o.color.getHexString(), g:o.groundColor?'#'+o.groundColor.getHexString():null}); });
    // tìm tường bụi
    let wall=null;
    sc.traverse(o=>{ if(o.isMesh && o.geometry.type==='CylinderGeometry' && o.geometry.parameters && o.geometry.parameters.radiusTop>400){
      wall={ op:+o.material.opacity.toFixed(3), col:'#'+o.material.color.getHexString(),
             vis:o.visible, y:Math.round(o.position.y), side:o.material.side, fog:o.material.fog }; } });
    return { cam:[cam.position.x|0,cam.position.y|0,cam.position.z|0],
      fog:{ c:'#'+sc.fog.color.getHexString(), d:+sc.fog.density.toFixed(5) },
      sky:{ top:'#'+window.__yc.scene.getObjectByProperty('type','Mesh')? '?':'?' },
      lights:L, wall };
  });
  console.log(tag, JSON.stringify(s, null, 1));
};
await snap('YEN  ');
await page.evaluate(()=>window.__yc.forceStorm());
await page.waitForTimeout(6000);
await closeAll();
await snap('BAO  ');
await page.screenshot({ path:'tests/diag-storm.png' });
await b.close();
