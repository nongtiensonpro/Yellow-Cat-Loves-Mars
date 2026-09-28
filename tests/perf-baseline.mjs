// Perf baseline — đo FPS / draw calls / triangles / texture memory
// Mốc so sánh bắt buộc cho mọi Phase nâng cấp đồ họa (xem document/art-bible.md §7).
//
// Chạy:  node tests/perf-baseline.mjs
//        TARGET=http://127.0.0.1:4173/ node tests/perf-baseline.mjs
// Xuất:  JSON ra stdout + tests/perf-latest.json
import { chromium } from 'playwright-core';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const SECONDS = Number(process.env.PERF_SECONDS || 12);

const CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/microsoft-edge',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const EXE = CANDIDATES.find((p) => { try { return existsSync(p); } catch { return false; } });

const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--mute-audio',
         '--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 40000 });
await page.click('#btn-start');
await page.waitForFunction(() => !!window.__yc, null, { timeout: 60000 });
await page.waitForTimeout(3000);

// Chạy một vòng lái để đo ở trạng thái có tải thật (không phải đứng yên).
await page.keyboard.down('w');
const frames = await page.evaluate((secs) => new Promise((resolve) => {
  const times = [];
  let last = performance.now();
  const t0 = last;
  function tick(now) {
    times.push(now - last);
    last = now;
    if (now - t0 < secs * 1000) requestAnimationFrame(tick);
    else resolve(times);
  }
  requestAnimationFrame(tick);
}), SECONDS);
await page.keyboard.up('w');

const info = await page.evaluate(() => {
  const r = window.__yc?.renderer;
  if (!r) return null;
  const i = r.info;
  return {
    drawCalls: i.render.calls,
    triangles: i.render.triangles,
    lines: i.render.lines,
    points: i.render.points,
    geometries: i.memory.geometries,
    textures: i.memory.textures,
    programs: i.programs?.length ?? null,
    pixelRatio: r.getPixelRatio(),
    size: [r.domElement.width, r.domElement.height],
  };
});

const sorted = [...frames].sort((a, b) => a - b);
const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;

const out = {
  url: TARGET_URL,
  viewport: '1920x1080',
  seconds: SECONDS,
  frames: frames.length,
  fpsAvg: +(1000 / avg).toFixed(1),
  fpsP95Worst: +(1000 / pct(0.95)).toFixed(1),   // 95% frame chậm nhất
  frameMsAvg: +avg.toFixed(2),
  frameMsP95: +pct(0.95).toFixed(2),
  frameMsMax: +Math.max(...frames).toFixed(2),
  renderer: info,
  errors: errors.length,
  errorSample: errors.slice(0, 3),
};

console.log(JSON.stringify(out, null, 2));
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, 'perf-latest.json'), JSON.stringify(out, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
