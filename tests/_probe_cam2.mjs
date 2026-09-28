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
await page.waitForTimeout(5000);
// __yc.camera là gì?
console.log('kiểu __yc.camera:', await page.evaluate(()=>typeof window.__yc.camera),
            '| __yc.player:', await page.evaluate(()=>typeof window.__yc.player));
await page.keyboard.down('w');
const rows=[];
for(let i=0;i<26;i++){
  const r = await page.evaluate(()=>{ const y=window.__yc;
    const c=y.camera, p=y.player.position, gy=y.sampleHeight(c.position.x, c.position.z);
    return { camY:+c.position.y.toFixed(2), camX:+c.position.x.toFixed(1), camZ:+c.position.z.toFixed(1),
      xeY:+p.y.toFixed(2), dat:+gy.toFixed(2), trenDat:+(c.position.y-gy).toFixed(2),
      trenXe:+(c.position.y-p.y).toFixed(2) }; });
  rows.push(r); await page.waitForTimeout(220);
}
await page.keyboard.up('w');
for (const r of rows) console.log(` camY=${String(r.camY).padStart(7)} xeY=${String(r.xeY).padStart(7)} đất=${String(r.dat).padStart(7)} | trên đất=${String(r.trenDat).padStart(6)}m trên xe=${String(r.trenXe).padStart(6)}m`);
const tds = rows.map(r=>r.trenDat);
console.log(`\ntrên đất: min=${Math.min(...tds)} max=${Math.max(...tds)}  |  trên xe: min=${Math.min(...rows.map(r=>r.trenXe))} max=${Math.max(...rows.map(r=>r.trenXe))}`);
// camera phải bám xe trong dải hẹp: cao độ lý tưởng + tối đa 1.6m nâng tránh địa hình
const dx = rows.map(r=>r.trenXe);
console.log(`camera bám xe: ${Math.min(...dx).toFixed(2)} .. ${Math.max(...dx).toFixed(2)}m  (lý tưởng ~${dx[0].toFixed(2)}m, nâng tối đa 1.6m)`);
const d0 = dx[0];
console.log(`lệch so với lý tưởng: ${Math.min(...dx.map(v=>v-d0)).toFixed(2)} .. ${Math.max(...dx.map(v=>v-d0)).toFixed(2)}m  ${Math.max(...dx.map(v=>v-d0))<2.0?'✓ không ratchet, không chui xuống':'✗ vẫn lệch'} `);
console.log('ERRORS:', errs.length);
await b.close();
