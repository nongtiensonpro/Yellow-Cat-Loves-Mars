import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:520}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const pts=[['A-dongbang',0,0],['B-bo-ham',350,10],['C-day-ham',350,-150],['D-bo-khuc',300,-240]];
for (const [nm,x,z] of pts){
  await page.evaluate(a=>{ const tc=document.getElementById('toast-close'); if(tc) tc.click();
    window.__yc.setGfx('high'); window.__yc.setTime(0.33); window.__yc.setPlayerPos(a.x,a.z);
    window.__yc.setOrbit(0.42, 40, 0.7); }, {x,z});
  await page.waitForTimeout(1800);
  await page.evaluate(()=>{ const tc=document.getElementById('toast-close'); if(tc) tc.click(); });
  await page.waitForTimeout(400);
  const st = await page.evaluate(()=>{ const c=window.__yc.camera, s=window.__yc.scene;
    return { camY:+c.position.y.toFixed(1), camXZ:[Math.round(c.position.x),Math.round(c.position.z)],
      shadow:window.__yc.renderer.shadowMap.enabled, exposure:window.__yc.renderer.toneMappingExposure }; });
  await page.screenshot({ path:`tests/vx-${nm}.png` });
  console.log(nm, `(${x},${z})`, JSON.stringify(st));
}
await b.close();
