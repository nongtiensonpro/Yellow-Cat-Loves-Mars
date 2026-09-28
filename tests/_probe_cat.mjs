
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
const page = await b.newPage({ viewport:{width:1000,height:700} });
const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,220)));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(1500);
if (await page.locator('#btn-pick-go').isVisible().catch(()=>false)) { await page.click('#btn-pick-go'); await page.waitForTimeout(700); }
const closePop = async () => { await page.evaluate(()=>{
    document.querySelectorAll('#overlay-discovery,#btn-disc-close,.discovery-close').forEach(e=>{ e.classList.add('hidden'); e.style.display='none'; });
}); };

// 1) Góc thứ ba: xem toàn thân Mèo (chế độ chase)
for (const [veh,label] of [['bike','bike'],['moto','moto'],['rover','rover']]) {
  await page.evaluate(v=>{ window.__yc.setVehicle(v); window.__yc.setCam(1); }, veh);
  await page.waitForTimeout(600);
  await closePop();
  await page.screenshot({ path: `tests/cat-chase-${label}.png` });
}
// 2) Góc thứ nhất (FPV)
await page.evaluate(()=>window.__yc.setCam(0));
await page.keyboard.down('w'); await page.waitForTimeout(1500);
for (const veh of ['bike','moto','rover']) {
  await page.evaluate(v=>{ window.__yc.setVehicle(v); window.__yc.setCam(0); }, veh);
  await page.waitForTimeout(600);
  await closePop();
  await page.screenshot({ path: `tests/cat-fpv-${veh}.png` });
}
await page.keyboard.up('w');
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
