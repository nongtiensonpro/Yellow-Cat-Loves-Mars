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
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(6000);
await page.evaluate(()=>{ const bs=[...document.querySelectorAll('#overlay-vehicle button,#overlay-vehicle .cta')];
  const go=bs.find(x=>/Xuất phát|khởi đầu|Bắt đầu/i.test(x.textContent)); (go||bs[bs.length-1]).click(); });
await page.waitForTimeout(1500);

const PLACES = [
  ['spawn      ', 0, 0],
  ['valles     ', 420, -180],
  ['open plain ', 120, 620],
];
const out = {};
for (const gfx of ['low','medium','high','cinematic']){
  await page.evaluate(g=>window.__yc.setGfx(g), gfx);
  await page.waitForTimeout(1200);
  const rows = [];
  for (const [nm, x, z] of PLACES){
    await page.evaluate(p=>window.__yc.setPlayerPos(p[0],p[1]), [x, z]);
    await page.waitForTimeout(1800);
    const r = await page.evaluate(()=>({ ...window.__yc.rendererInfo(), ...window.__yc.gpuBudget() }));
    rows.push({ nm, ...r });
  }
  // giữ vị trí tệ nhất cho tổng hợp
  const worst = rows.reduce((a,b2)=> b2.calls>a.calls?b2:a);
  out[gfx] = { rows, worst };
  console.log(`\n═══ preset ${gfx.toUpperCase()} ═══`);
  for (const r of rows)
    console.log(`  ${r.nm} calls=${String(r.calls).padStart(4)} tri=${String(r.triangles).padStart(7)} `+
      `prog=${String(r.programs).padStart(3)} tex=${String(r.textures).padStart(3)} (${r.textureMB}MB) `+
      `geo=${String(r.geometries).padStart(4)} instTri=${r.instancedTriangles}`);
  console.log(`  ► TỆ NHẤT: ${worst.nm} · calls=${worst.calls} · tri=${worst.triangles} · texture=${worst.textureMB}MB`);
}
console.log('\nTEXTURE LỚN NHẤT:', JSON.stringify(out.cinematic.rows[0].biggest), out.cinematic.rows[0].biggestMB+'MB');
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
