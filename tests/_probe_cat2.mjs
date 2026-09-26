
import { chromium } from 'playwright-core';
import fs from 'fs';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport:{width:900,height:700} });
const errs=[]; page.on('pageerror', e=>errs.push(e.stack||String(e)));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(1500);
if (await page.locator('#btn-pick-go').isVisible().catch(()=>false)) { await page.click('#btn-pick-go'); await page.waitForTimeout(700); }
await page.evaluate(()=>{ window.__yc.setVehicle('bike'); });
await page.waitForTimeout(800);

const shots = [
  ['face-front', 0.0, 0.10, 1.9],
  ['face-side',  1.9, 0.10, 0.5],
  ['face-3q',    1.6, 0.8, 1.6],
  ['full-body',  2.3, 0.6, 2.3],
  ['paws-low',   1.0,-0.55, 1.3],
  ['tail-back', -1.5, 0.4, 1.7],
];
for (const [name, dx, dy, dz] of shots) {
  // Dừng vòng lặp game: bỏ requestAnimationFrame, render thủ công rồi đọc canvas.
  const dataUrl = await page.evaluate(async ([dx,dy,dz])=>{
    const yc=window.__yc;
    // tạo camera phụ
    const cam = new yc.camera.constructor(72, yc.renderer.domElement.width/yc.renderer.domElement.height, 0.03, 500);
    const p = yc.player.position;
    cam.position.set(p.x+dx, p.y+1.52+dy, p.z+dz);
    cam.lookAt(p.x+0.28, p.y+1.66, p.z);
    cam.updateMatrixWorld(true);
    yc.renderer.render(yc.scene, cam);
    return yc.renderer.domElement.toDataURL('image/png');
  }, [dx,dy,dz]);
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.writeFileSync(`tests/catzoom-${name}.png`, buf);
  console.log(name, buf.length, 'bytes');
}
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
