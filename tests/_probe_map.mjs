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
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.evaluate(()=>localStorage.clear());   // bỏ route cũ + bitmask 36 sai định dạng
await page.reload({waitUntil:'networkidle'});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(5000);
await page.click('#btn-pick-go');
await page.waitForTimeout(1500);

console.log('trước khi lái:', JSON.stringify(await page.evaluate(()=>window.__yc.mapInfo())));

// lái vòng để tạo route + mở ô đã khám phá
console.log('đang lái...');
await page.keyboard.down('w');
for (const [x,z] of [[0,0],[260,120],[420,340],[300,560],[40,520],[-160,340],[-120,90],[0,0]]){
  await page.evaluate(p=>window.__yc.setPlayerPos(p[0],p[1]), [x,z]);
  await page.waitForTimeout(1200);
}
await page.keyboard.up('w');
await page.waitForTimeout(800);
const mi = await page.evaluate(()=>window.__yc.mapInfo());
console.log('sau khi lái  :', JSON.stringify(mi));

// đưa xe tới chỗ không có POI để khám phá khởi động
await page.evaluate(()=>window.__yc.setPlayerPos(0,0));
await page.waitForTimeout(1200);
await page.evaluate(()=>{
  ['#toast','#overlay-discovery','#overlay-landing','#overlay-vehicle'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.classList.add('hidden');
  });
  document.querySelectorAll('#toast-close').forEach(b=>b.classList.add('hidden'));
});
await page.waitForTimeout(500);
await page.click('#btn-map');            // bấm nút, không bấm phím
await page.waitForTimeout(1800);
await page.evaluate(()=>{ ['#toast','#overlay-discovery'].forEach(id=>{
  const e=document.getElementById(id); if(e) e.classList.add('hidden'); }); });
await page.waitForTimeout(400);
const vis = await page.evaluate(()=>!document.getElementById('overlay-map').classList.contains('hidden'));
console.log('bản đồ mở:', vis);
const el = await page.$('#bigmap');
await el.screenshot({ path:'tests/t41c-map.png' });
console.log('đã chụp canvas bản đồ');
// phóng to rồi chụp lại
for(let i=0;i<5;i++){ await page.mouse.move(700,450); await page.mouse.wheel(0,-140); await page.waitForTimeout(180); }
await page.waitForTimeout(1200);
await (await page.$('#bigmap')).screenshot({ path:'tests/t41c-map-zoom.png' });
console.log('đã chụp bản đồ zoom');
await page.screenshot({ path:'tests/t41c-map-full.png' });

// xác nhận route vẫn còn sau khi đóng/mở lại (kiểm tra localStorage)
await page.keyboard.press('m'); await page.waitForTimeout(700);
await page.keyboard.press('m'); await page.waitForTimeout(1200);
const mi2 = await page.evaluate(()=>window.__yc.mapInfo());
console.log('mở lại     :', JSON.stringify(mi2));
console.log('giữ được route qua localStorage:', mi2.routeLen >= mi.routeLen ? 'CÓ ✓' : 'MẤT ✗');
console.log('giữ được vùng khám phá        :', mi2.footCells >= mi.footCells ? 'CÓ ✓' : 'MẤT ✗');
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
