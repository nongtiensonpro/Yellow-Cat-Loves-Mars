
import { chromium } from 'playwright-core';
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
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage();
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.status()+' '+r.url()); });
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:45000 });
await page.waitForTimeout(2500);
console.log(JSON.stringify(bad, null, 1));
await b.close();
