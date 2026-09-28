import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try { const r = await fetch(TARGET_URL,{signal:AbortSignal.timeout(4000)}); if(!r.ok) throw new Error('HTTP '+r.status); }
catch(e){ console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`); process.exit(2); }
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1100,height:800}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(6000);
await page.click('#btn-pick-go');
await page.waitForTimeout(2000);
await page.evaluate(()=>window.__yc.setGfx('high'));
await page.waitForTimeout(1200);
// camera tự do nhìn sát Mèo Vàng
await page.keyboard.press('p');
await page.waitForTimeout(1800);
await page.evaluate(()=>{ ['#toast','#overlay-discovery','#overlay-landing','#overlay-vehicle']
  .forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.add('hidden'); }); });

// đưa camera ra trước mặt, ngang tầm đầu mèo
// ── GÓC NGƯỜI CHƠI THẬT SỰ THẤY: FPV (ngồi sau lưng mèo) ──
// Phải THOÁT photo mode: updateCamera() quay về sớm ở nhánh photo, bỏ qua camMode.
await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
await page.evaluate(()=>{ window.__yc.setTime(0.5); });   // trưa
await page.waitForTimeout(1200);
const D = JSON.parse(process.env.DIST || '0');
for (const veh of ['bike','rover']){
  await page.evaluate(v=>window.__yc.setVehicle(v), veh);
  await page.waitForTimeout(1700);
  await page.evaluate(()=>{ window.__yc.setCamMode(0); });   // FPV
  await page.waitForTimeout(1400);
  await page.screenshot({ path:`tests/hero-fpv-${veh}.png` });
  console.log('chụp FPV', veh);
}
// ── ẢNH CHÂN DUNG: camera đứng TRƯỚC xe ──
// updateCamera đặt camera tại playerPos + (cos(camYaw), sin(camPitch), sin(camYaw))*r
// Xe nhìn về +X (yaw 0) ⇒ phía TRƯỚC xe ứng với camYaw = 0, không phải PI.
for (const veh of ['bike','rover']){
  await page.evaluate(v=>window.__yc.setVehicle(v), veh);
  await page.waitForTimeout(1700);
  for (const [nm, yaw, pitch, dist, lookY] of [
    [`${veh}-chinh-dien`,  0.00, 0.10, 2.5, 1.02],
    [`${veh}-trai`,      -0.62, 0.10, 2.5, 1.02],
    [`${veh}-phai`,       0.62, 0.10, 2.5, 1.02]]){
    // camMode 2 = camera tự do; camMode 0/1 bỏ qua setCamPose
    await page.evaluate(o=>{ window.__yc.setCamMode(2); window.__yc.setYaw(0);
      window.__yc.setCamLookY(o.lookY);
      window.__yc.setCamPose({yaw:o.yaw, pitch:o.pitch, dist:o.dist}); }, {yaw,pitch,dist,lookY});
    await page.waitForTimeout(1200);
    await page.screenshot({ path:`tests/hero-${nm}.png` });
    console.log('chụp', nm);
  }
}
// đo vị trí các bộ phận đầu mèo
const head = await page.evaluate(()=>{
  const P=window.__yc.player; const out=[];
  P.traverse(o=>{ if(o.isMesh && o.name) out.push({n:o.name, y:+o.getWorldPosition(new window.__yc.THREE.Vector3()).y.toFixed(2),
    v:o.geometry?.attributes?.position?.count||0}); });
  return out.slice(0,40);
});
console.log('mesh có tên:', JSON.stringify(head));
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
