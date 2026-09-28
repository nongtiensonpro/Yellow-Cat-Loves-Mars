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
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(6000);
await page.evaluate(()=>{ const bs=[...document.querySelectorAll('#overlay-vehicle button,#overlay-vehicle .cta')];
  const go=bs.find(x=>/Xuất phát|khởi đầu|Bắt đầu/i.test(x.textContent)); (go||bs[bs.length-1]).click(); });
await page.waitForTimeout(1500);
console.log('vị trí'.padEnd(16)+'geometry  texture  drawCall');
console.log('đầu'.padEnd(16)+ String((await page.evaluate(()=>window.__yc.rendererInfo())).geometries).padStart(6));
// đi khắp bản đồ, 12 chặng
const PATH = [[0,0],[200,0],[400,100],[500,-200],[300,-400],[0,-500],[-300,-400],
              [-550,-200],[-550,200],[-300,450],[0,550],[300,300],[0,0]];
let n=0;
for (const [x,z] of PATH){
  await page.evaluate(p=>window.__yc.setPlayerPos(p[0],p[1]), [x,z]);
  await page.waitForTimeout(1300);
  const r = await page.evaluate(()=>window.__yc.rendererInfo());
  n++;
  console.log(`(${String(x).padStart(5)},${String(z).padStart(5)})`.padEnd(16)+
    String(r.geometries).padStart(6)+String(r.textures).padStart(10)+String(r.calls).padStart(10));
}
const first = (await page.evaluate(()=>window.__yc.rendererInfo())).geometries;
console.log(`\nđi ${n} chặng. geometry cuối = ${first}`);
// đổi xe nhiều lần — thử xem có rò không
for (let i=0;i<15;i++){ await page.evaluate(v=>window.__yc.setVehicle(v), ['bike','moto','rover'][i%3]);
  await page.waitForTimeout(1100); }
const afterVeh = (await page.evaluate(()=>window.__yc.rendererInfo())).geometries;
console.log(`sau 15 lần đổi xe: geometry = ${afterVeh} (trước ${first}, +${afterVeh-first})`);
console.log(`  ${afterVeh-first < 60 ? 'KHÔNG rò ✓' : 'VẪN RÒ ✗ — mỗi lần đổi xe lại vứt ~' + Math.round((afterVeh-first)/15) + ' geometry'}`);
// và vẫn phải chơi được sau khi dispose
await page.keyboard.down('w'); await page.waitForTimeout(3000); await page.keyboard.up('w');
const alive = await page.evaluate(()=>({ calls: window.__yc.rendererInfo().calls,
  errs: 0 }));
console.log(`  sau khi dispose vẫn chơi được: ${alive.calls} draw call`);
console.log('  lỗi runtime:', (await page.evaluate(()=>window.__yc.cineInfo().burst)) !== null ? 'xem dưới' : 'ok');
await b.close();
