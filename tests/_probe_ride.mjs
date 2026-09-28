
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
const page = await b.newPage({ viewport:{width:1000,height:640} });
const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,200)));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc && !!window.__yc.rideReport, null, {timeout:45000});
await page.waitForTimeout(600);

const spots = await page.evaluate(()=>window.__yc.POIS.map(p=>({name:p.title, x:p.pos.x, z:p.pos.z})));
console.log('=== ĐO BẰNG WORLD MATRIX THẬT (đáy bánh - mặt đất) ===');
let worstSink=0, worstFloat=0, bad=0;
for (const veh of ['bike','moto','rover']) {
  await page.evaluate(v=>window.__yc.setVehicle(v), veh);
  const rows=[];
  for (const s of spots) {
    // đặt vị trí rồi đợi vài frame để game tự settle (đo hành vi thật)
    const r = await page.evaluate(async o=>{
      window.__yc.setPlayerPos(o.x,o.z);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      return window.__yc.rideReport();
    }, s);
    rows.push(r);
    if (r.minClear < worstSink) worstSink = r.minClear;
    if (r.minClear > worstFloat) worstFloat = r.minClear;
  }
  const v=rows.map(r=>r.minClear);
  console.log(`${veh.toUpperCase().padEnd(6)} min=${Math.min(...v).toFixed(3)}  max=${Math.max(...v).toFixed(3)}  avg=${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(3)}`);
  for (let i=0;i<rows.length;i++){
    const c=rows[i].minClear;
    if (c < -0.02 || c > 0.45){ console.log(`   ⚠ ${String(spots[i].name).slice(0,22).padEnd(23)} clear=${c.toFixed(3)}`); bad++; }
  }
}
console.log(`\n>>> chìm nặng nhất = ${worstSink.toFixed(3)} m  (âm = XUYÊN ĐẤT)`);
console.log(`>>> lơ lửng nặng nhất = ${worstFloat.toFixed(3)} m`);
console.log(`>>> số vị trí lệch quá [-0.02, 0.45] = ${bad}`);
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
