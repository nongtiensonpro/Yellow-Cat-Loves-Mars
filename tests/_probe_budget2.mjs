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
const page = await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(6000);
await page.evaluate(()=>{ const bs=[...document.querySelectorAll('#overlay-vehicle button,#overlay-vehicle .cta')];
  const go=bs.find(x=>/Xuất phát|khởi đầu|Bắt đầu/i.test(x.textContent)); (go||bs[bs.length-1]).click(); });
await page.waitForTimeout(1500);
await page.evaluate(()=>window.__yc.setGfx('high'));
await page.waitForTimeout(1500);

for (const v of ['bike','rover']){
  await page.evaluate(x=>window.__yc.setVehicle(x), v);
  await page.waitForTimeout(1800);
  const r = await page.evaluate(()=>{
    const P = window.__yc.player, S = window.__yc.scene;
    const withAll = window.__yc.rendererInfo().calls;
    // ẩn xe
    P.visible = false;
    return { withAll };
  });
  await page.waitForTimeout(700);
  const noVeh = await page.evaluate(()=>window.__yc.rendererInfo().calls);
  await page.evaluate(()=>{ window.__yc.player.visible = true; });
  await page.waitForTimeout(700);
  // đếm mesh/geometry của xe
  const cnt = await page.evaluate(()=>{ const P=window.__yc.player; let m=0,g=new Set();
    P.traverse(o=>{ if(o.isMesh||o.isPoints){ m++; if(o.geometry) g.add(o.geometry.uuid); } });
    return { mesh:m, geo:g.size }; });
  console.log(`${v}: có xe=${r.withAll} · ẩn xe=${noVeh} → XE TỐN ${r.withAll-noVeh} draw call`);
  console.log(`        mesh trên xe = ${cnt.mesh}, geometry riêng = ${cnt.geo}`);
}
// terrain chunk
const ch = await page.evaluate(()=>{ const c=window.__yc.chunkInfo ? window.__yc.chunkInfo() : null;
  if (c) return c;
  let n=0, vis=0; window.__yc.scene.traverse(o=>{ if(o.isMesh && o.userData && o.userData.chunk!==undefined){
    n++; if(o.visible) vis++; } });
  return { chunkMeshes:n, visible:vis }; });
console.log('terrain chunk:', JSON.stringify(ch));
await b.close();
