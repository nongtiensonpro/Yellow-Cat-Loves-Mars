import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:700}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(2500);

const r = await page.evaluate(()=>{
  const yc = window.__yc;
  const out = { layers: yc.env(), seed: yc.envSeed, near: {} };
  // đếm vật thể trong bán kính 40m quanh spawn (0,0)
  const M = new (yc.scene.constructor === Object ? Object : Object)();
  const Mx = yc.scene.children.filter(o=>o.isInstancedMesh);
  const p = new yc.player.position.constructor(0,0,0);
  const R = 40;
  for (const im of Mx){
    const d = im.geometry.type + '#' + im.uuid.slice(0,4);
    let n = 0; const mtx = new (im.matrixWorld.constructor)();
    for (let i=0;i<im.count;i++){
      im.getMatrixAt(i, mtx);
      const x = mtx.elements[12], z = mtx.elements[14];
      if (Math.hypot(x,z) < R) n++;
    }
    out.near[d] = n + '/' + im.count;
  }
  out.totalInstanced = Mx.length;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
