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
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(6000);
await page.click('#btn-pick-go');
await page.waitForTimeout(2000);

const before = await page.evaluate(()=>window.__yc.gpuBudget());
console.log('trước khi phá :', JSON.stringify({wasted:before.mipWastedMB, count:before.mipWastedCount,
  total:before.textureMB, textures:before.textures}));

// CỐ TÌNH phá: đặt minFilter=LinearFilter trên các texture 512² (đã sinh mip).
// Đây đúng là lỗi nguy hiểm nhất của texture: vẫn cấp phát ~4/3 bộ nhớ cho
// chuỗi mip nhưng KHÔNG dùng, và mặt đất rung ở xa. Không triệu chứng nào khác.
const broke = await page.evaluate(()=>{
  const seen=new Set(); const S=window.__yc.scene; let n=0;
  S.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
    for(const m of ms) for(const k in m){ const t=m[k];
      if(!t||!t.isTexture||seen.has(t.uuid)) continue; seen.add(t.uuid);
      if(t.image?.width===512 && t.generateMipmaps!==false){ t.minFilter=1006; n++; } } });
  return n;
});
await page.waitForTimeout(900);
const after = await page.evaluate(()=>window.__yc.gpuBudget());
console.log('đã phá         :', broke, 'texture đặt minFilter=LinearFilter');
console.log('sau khi phá    :', JSON.stringify({wasted:after.mipWastedMB, count:after.mipWastedCount,
  total:after.textureMB, textures:after.textures}));
const caught = after.mipWastedMB > 0 && after.mipWastedCount === broke;
console.log(caught
  ? `DETECTOR BẮT ĐƯỢC ✓ — ${after.mipWastedMB} MB / ${after.mipWastedCount} texture bị đánh dấu lãng phí`
  : `KHÔNG BẮT ✗ — mipWastedMB=${after.mipWastedMB} count=${after.mipWastedCount}`);
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
