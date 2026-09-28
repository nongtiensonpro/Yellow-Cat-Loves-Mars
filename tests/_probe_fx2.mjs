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
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const closeAll=async()=>{ await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS); await page.waitForTimeout(400); };
await closeAll();
await page.evaluate(()=>{ localStorage.clear(); window.__yc.setGfx('cinematic'); window.__yc.setTime(0.33);
  window.__yc.setPlayerPos(0,0); window.__yc.setCam(1); window.__yc.setOrbit(0.30, 11, 0.8); });
await page.waitForTimeout(2200); await closeAll();
// A: GIỮ NGUYÊN preset cinematic (post bật)
await page.screenshot({ path:'tests/fxA-post-ON.png' });
// B: cùng preset, tắt TOÀN BỘ pass post (render thẳng) — chỉ khác post-FX
await page.evaluate(()=>{ window.__yc.setPostEnabled(false); });
await page.waitForTimeout(1500); await closeAll();
await page.screenshot({ path:'tests/fxB-post-OFF.png' });
console.log('trạng thái sau khi tắt:', JSON.stringify(await page.evaluate(()=>window.__yc.postState())));
// C: chỉ tắt grade (giữ bloom+fxaa) để biết grade đóng góp bao nhiêu
await page.evaluate(()=>{ window.__yc.setPostEnabled(true); window.__yc.setPass('grade', false); });
await page.waitForTimeout(1400); await closeAll();
await page.screenshot({ path:'tests/fxC-noGrade.png' });
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
