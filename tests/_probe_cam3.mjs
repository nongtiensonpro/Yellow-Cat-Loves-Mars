import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
for (const mode of [0, 1]){
  // ép chế độ camera bằng phím C cho tới khi khớp
  for (let k=0;k<4;k++){ const m = await page.evaluate(()=>window.__yc.camMode());
    if (m===mode) break; await page.keyboard.press('c'); await page.waitForTimeout(300); }
  const got = await page.evaluate(()=>window.__yc.camMode());
  console.log(`\n===== camMode ${mode} (thực tế ${got}) =====`);
await page.keyboard.down('w');
const rows=[];
for(let i=0;i<18;i++){
  rows.push(await page.evaluate(()=>{ const y=window.__yc, c=y.camera, p=y.player.position;
    return { dXZ:+Math.hypot(c.position.x-p.x, c.position.z-p.z).toFixed(2),
      dY:+(c.position.y-p.y).toFixed(2),
      datCam:+y.sampleHeight(c.position.x,c.position.z).toFixed(2),
      datXe:+y.sampleHeight(p.x,p.z).toFixed(2),
      y:+(c.position.y).toFixed(2), xe:+(p.y).toFixed(2) }; }));
  await page.waitForTimeout(260);
}
await page.keyboard.up('w');
console.log(' dXZ(m)   dY(m)   đất(cam)  đất(xe)   camY      xeY');
for (const r of rows) console.log(` ${String(r.dXZ).padStart(6)} ${String(r.dY).padStart(7)} ${String(r.datCam).padStart(9)} ${String(r.datXe).padStart(8)} ${String(r.y).padStart(9)} ${String(r.xe).padStart(9)}`);
const dxz=rows.map(r=>r.dXZ);
console.log(`\nkhoảng cách ngang camera↔xe: ${Math.min(...dxz)} .. ${Math.max(...dxz)} m`);
const dy=rows.map(r=>r.dY);
console.log(`cao độ tương đối: ${Math.min(...dy).toFixed(2)} .. ${Math.max(...dy).toFixed(2)} m`);
console.log('\ncamMode hiện tại:', await page.evaluate(()=>window.__yc.camMode ? window.__yc.camMode() : '?'));
await page.keyboard.up('w'); await page.waitForTimeout(2500);
}
console.log('\nERRORS:', errs.length);
await b.close();
