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
const page = await (await b.newContext({viewport:{width:800,height:500}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
async function trace(label, down, ms, up=[]){
  for(const k of down) await page.keyboard.down(k);
  const seq=[]; const t0=Date.now();
  while(Date.now()-t0<ms){ seq.push(await page.evaluate(()=>window.__yc.animState()));
    await page.waitForTimeout(120); }
  for(const k of up) await page.keyboard.up(k);
  for(const k of down) await page.keyboard.up(k);
  // rút gọn chuỗi liên tiếp
  const out=[]; for(const s of seq){ if(out[out.length-1]!==s) out.push(s); }
  console.log(`${label.padEnd(26)} ${out.join(' → ')}`);
  return new Set(seq);
}
const all = new Set();
for (const veh of ['bike','rover']){
  console.log(`\n=== ${veh} ===`);
  await page.evaluate(v=>{ window.__yc.setVehicle(v); }, veh);
  await page.waitForTimeout(1500);
  (await trace('từ đứng yên → ga', ['w'], 3000)).forEach(s=>all.add(s));
  await page.waitForTimeout(3500);
  (await trace('lùi từ đứng yên', ['s'], 3000)).forEach(s=>all.add(s));
  await page.waitForTimeout(2500);
  await page.keyboard.down('w'); await page.waitForTimeout(3000);
  (await trace('rẽ phải', ['d'], 2000, ['d'])).forEach(s=>all.add(s));
  (await trace('thả ga (trôi)', [], 1600)).forEach(s=>all.add(s));   // vẫn giữ W? không
  await page.keyboard.up('w'); await page.waitForTimeout(200);
  await page.keyboard.down('w'); await page.waitForTimeout(3000);
  await page.keyboard.up('w');
  (await trace('phanh: thả W rồi bấm S', ['s'], 2200)).forEach(s=>all.add(s));
  await page.waitForTimeout(3000);
  await page.keyboard.down('s'); await page.waitForTimeout(2000); await page.keyboard.up('s');
  await page.waitForTimeout(2000);
}
console.log('\nĐÃ THẤY:', [...all].sort().join(', '));
console.log('thiếu:', ['idle','accel','cruise','coast','turn','brake','reverse'].filter(s=>!all.has(s)).join(', ')||'KHÔNG — đủ cả 7');
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
