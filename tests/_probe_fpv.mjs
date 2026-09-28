
import { chromium } from 'playwright-core';
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
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage({ viewport:{width:1100,height:700} });
const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,200)));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(1200);
// Đóng popup chọn phương tiện bằng nút thật
if (await page.locator('#btn-pick-go').isVisible().catch(()=>false)) {
  await page.click('#btn-pick-go');
  await page.waitForTimeout(800);
}
console.log('popup còn mở?', await page.locator('#btn-pick-go').isVisible().catch(()=>false));

for (const veh of ['bike','moto','rover']) {
  await page.evaluate(v=>{ window.__yc.setVehicle(v); window.__yc.setCam(0); }, veh);
  await page.waitForTimeout(700);
  await page.keyboard.down('w'); await page.waitForTimeout(1800);
  const closePop = async () => { await page.evaluate(()=>{
      document.querySelectorAll('#overlay-discovery,#btn-disc-close,.discovery-close').forEach(e=>{ e.classList.add('hidden'); e.style.display='none'; });
      const h=document.getElementById('hud-hint'); if(h) h.style.display='none';
  }); };
  await closePop();
  await page.keyboard.down('a'); await page.waitForTimeout(900);
  await closePop(); await page.screenshot({ path: `tests/fpv-${veh}-left.png` });
  await page.keyboard.up('a');
  await page.keyboard.down('d'); await page.waitForTimeout(900);
  await closePop(); await page.screenshot({ path: `tests/fpv-${veh}-right.png` });
  await page.keyboard.up('d'); await page.keyboard.up('w');
  await page.waitForTimeout(300);
  console.log(veh, JSON.stringify(await page.evaluate(()=>window.__yc.poseInfo())));
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
