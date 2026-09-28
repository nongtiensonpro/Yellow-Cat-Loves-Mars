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
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(5000);
await page.click('#btn-pick-go');
await page.waitForTimeout(1500);
await page.evaluate(()=>{
  ['#toast','#overlay-discovery','#overlay-landing','#overlay-vehicle'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.classList.add('hidden'); });
});
await page.click('#btn-map');
await page.waitForTimeout(1800);
await page.evaluate(()=>{['#toast','#overlay-discovery'].forEach(id=>{
  const e=document.getElementById(id); if(e) e.classList.add('hidden');});});
await page.waitForTimeout(400);

// đo tỉ lệ pixel TỐI (fog) trên canvas bản đồ
const stat = await page.evaluate(()=>{
  const c=document.getElementById('bigmap'), x=c.getContext('2d');
  const d=x.getImageData(0,0,c.width,c.height).data;
  let dark=0, mid=0, bright=0, tot=0;
  for(let i=0;i<d.length;i+=4*17){   // lấy mẫu ~1/17
    const L=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114);
    if(L<40) dark++; else if(L<140) mid++; else bright++;
    tot++;
  }
  return { pctDark:Math.round(dark/tot*100), pctMid:Math.round(mid/tot*100),
           pctBright:Math.round(bright/tot*100), w:c.width, h:c.height,
           info: window.__yc.mapInfo() };
});
console.log('phân bố độ sáng canvas bản đồ:', JSON.stringify(stat));
// đo lại với fog TẮT để so sánh
const cmp = await page.evaluate(()=>{
  const c=document.getElementById('bigmap');
  window.__yc.clearFootForTest();
  window.__yc.setGfx && null;
  return true;
}).catch(()=>false);
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
