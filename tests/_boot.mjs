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
const page=await (await b.newContext({viewport:{width:900,height:600}})).newPage();
const msgs=[];
page.on('pageerror',e=>msgs.push('PAGEERROR: '+e.message+'\n'+String(e.stack||'').split('\n').slice(0,5).join('\n')));
page.on('console',m=>{ if(m.type()==='error') msgs.push('CONSOLE: '+m.text().slice(0,300)); });
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.waitForTimeout(3000);
console.log('trước start  __yc:', await page.evaluate(()=>typeof window.__yc));
await page.click('#btn-start');
for (const t of [2000,4000,8000,15000,25000]){
  await page.waitForTimeout(t===2000?2000:t-2000);
  const s = await page.evaluate(()=>({ yc: typeof window.__yc,
    pct: document.getElementById('load-pct')?.textContent,
    land: !!document.querySelector('#overlay-landing:not(.hidden)'),
    veh: !!document.querySelector('#overlay-vehicle:not(.hidden)'),
    canvas: !!document.querySelector('canvas') }));
  console.log(`t=${t}ms`, JSON.stringify(s));
}
console.log('--- lỗi ---'); console.log(msgs.slice(0,4).join('\n---\n')||'(không có)');
await b.close();
