import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
// ── TARGET có mặc định + báo lỗi rõ ràng khi server chưa chạy ──
// Trước đây thiếu TARGET là chết với `url: expected string, got undefined` —
// thông báo không liên quan gì tới việc thật sự sai.
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try {
  const r = await fetch(TARGET_URL, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
} catch (e) {
  console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`);
  console.error('  Khởi động server trước:  node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173');
  console.error('  Hoặc trỏ sang nơi khác:   TARGET=http://... node tests/<probe>.mjs');
  process.exit(2);
}
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
for (let k=0;k<4;k++){ if (await page.evaluate(()=>window.__yc.camMode())===0) break;
  await page.keyboard.press('c'); await page.waitForTimeout(300); }
console.log('camMode =', await page.evaluate(()=>window.__yc.camMode()), '(FPV)');
const C = ()=>page.evaluate(()=>window.__yc.camInfo());

console.log('── 1. FOV động ──');
console.log('đứng yên      ', JSON.stringify(await C()));
await page.keyboard.down('w'); await page.waitForTimeout(4500);
const cruise = await C(); console.log('cruise        ', JSON.stringify(cruise));
await page.keyboard.down('Shift'); await page.waitForTimeout(2600);
const boost = await C(); console.log('boost         ', JSON.stringify(boost));
await page.keyboard.up('Shift');
console.log(`fov: 68 → ${cruise.fov} → ${boost.fov}  mở rộng=${(boost.fov>cruise.fov && cruise.fov>68.5)?'CÓ ✓':'KHÔNG ✗'}`);
await page.keyboard.up('w'); await page.waitForTimeout(3000);

console.log('\n── 2. Trễ hướng nhìn ──');
await page.keyboard.down('w'); await page.waitForTimeout(3000);
await page.keyboard.down('d');
const lag=[]; for(let i=0;i<6;i++){ lag.push(await C()); await page.waitForTimeout(130); }
console.log('sai lệch yaw (độ) theo thời gian:', lag.map(c=>c.yawErr).join(' → '));
await page.keyboard.up('d');
for(let i=0;i<5;i++){ await page.waitForTimeout(300); }
console.log('sau khi thả phím:', JSON.stringify(await C()));
console.log(`trễ có đổi chiều khi rẽ phải=${lag.some(c=>c.yawErr>0.5)?'CÓ ✓':'KHÔNG ✗'}, về ~0 khi ổn định=${Math.abs((await C()).yawErr)<1?'CÓ ✓':'KHÔNG ✗'}`);

console.log('\n── 3. Rung chạm đất ──');
const sh=[]; for(let i=0;i<70;i++){ sh.push(await C()); await page.waitForTimeout(80); }
const peak=Math.max(...sh.map(c=>c.shake));
console.log(`peak shake=${peak.toFixed(4)}  max bump=${Math.max(...sh.map(c=>c.bump)).toFixed(3)}  rung được=${peak>0.05?'CÓ ✓':'KHÔNG ✗'}`);
await page.keyboard.up('w');

console.log('\n── 4. Chặn địa hình ──');
let worst=Infinity, buried=0, n=0;
for(const v of ['bike','moto','rover']){
  await page.evaluate(x=>window.__yc.setVehicle(x), v); await page.waitForTimeout(1200);
  await page.keyboard.down('w');
  for(let i=0;i<45;i++){
    const r = await page.evaluate(()=>{ const c=window.__yc.camera, p=window.__yc.player.position;
      const gy = window.__yc.sampleHeight(c.position.x, c.position.z);
      return { clear:+(c.position.y-gy).toFixed(3), dist:+(c.position.y-p.y).toFixed(3) }; });
    n++; if (r.clear < worst) worst = r.clear;
    if (r.clear < 0.5) buried++;
    await page.waitForTimeout(70);
  }
  await page.keyboard.up('w'); await page.waitForTimeout(1500);
}
console.log(`clearance nhỏ nhất (FPV, ${n} mẫu)=${worst.toFixed(2)}m  số khung sát đất<0.5m=${buried}  ${worst>=0.85&&buried===0?'camera không lọt xuống đất ✓':'LỌT XUỐNG ĐẤT ✗'}`);
console.log('\nERRORS:', errs.length, errs.slice(0,3));
await b.close();
