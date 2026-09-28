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
const page = await (await b.newContext({viewport:{width:1000,height:700}})).newPage();
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(2500);

const r = await page.evaluate(()=>{
  const yc = window.__yc;
  const out = { layers: yc.env(), seed: yc.envSeed, near: {} };
  // đếm vật thể trong bán kính 40m quanh spawn (0,0)
  const M = new (yc.scene.constructor === Object ? Object : Object)();
  const Mx = yc.scene.children.filter(o=>o.isInstancedMesh);
  const p = new yc.player.position.constructor(0,0,0);
  const R = 40;
  for (const im of Mx){
    const d = im.geometry.type + '#' + im.uuid.slice(0,4);
    let n = 0; const mtx = new (im.matrixWorld.constructor)();
    for (let i=0;i<im.count;i++){
      im.getMatrixAt(i, mtx);
      const x = mtx.elements[12], z = mtx.elements[14];
      if (Math.hypot(x,z) < R) n++;
    }
    out.near[d] = n + '/' + im.count;
  }
  out.totalInstanced = Mx.length;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
