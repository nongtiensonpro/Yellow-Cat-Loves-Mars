// ════════════════════════════════════════════════════════════════════════════
// PERF BUDGET — Phase 3 Task 3.7
//
// CI phải ĐỎ khi vượt ngân sách. Đây là điểm khác biệt giữa "có số liệu" và
// "được canh": số liệu chỉ có giá trị nếu ai đó bị phạt vì nó.
//
// Trần đặt ở đây, KHÔNG đặt ở CI yml — để chỉ có một nơi duy nhất phải sửa.
// Số trần dựa trên đo thật ở `document/perf-budget.md`, cộng dự phòng ~12–35%.
//
// Trần `geometries` ĐÃ HẠ từ 620 xuống 560. Lần đo đầu thấy nhảy tới 683 — tưởng
// là dao động, hoá ra là TRIỆU CHỨNG của một rò bộ nhớ thật (đổi xe không dispose).
// Đã sửa; giờ đi 13 chặng + đổi xe 15 lần thì đứng yên ở 495–498. Giữ trần cao
// để "số liệu dao động" không còn là chỗ để giấu rò nữa.
//
// KHÔNG kiểm thời gian khung hình ở đây. CI chạy SwiftShader (dựng phần mềm);
// ngưỡng thời gian khung hình trên bộ dựng phần mềm là cảm giác an toàn giả.
// Số thật do người chơi đo trên máy thật: 144 FPS, ổn định trên 100.
// ════════════════════════════════════════════════════════════════════════════
import { chromium } from 'playwright-core';
import { existsSync, writeFileSync } from 'node:fs';

export const BUDGET = {
  calls:     { max: 460,   why: 'draw call qua MỌI pass composer' },
  triangles: { max: 135000, why: 'tam giác/khung' },
  programs:  { max: 56,    why: 'biến thể shader (mỗi cái = một compile)' },
  textures:  { max: 80,    why: 'số texture GPU' },
  textureMB: { max: 32,    why: 'bộ nhớ texture ước tính' },
  geometries:{ max: 560,   why: 'geometry đang còn trong bộ nhớ' },
};

const PLACES = [
  ['spawn     ',   0,   0],
  ['valles    ', 420, -180],
  ['open plain', 120, 620],
];

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g,'/')}` || process.argv[1].endsWith('perf-budget.mjs')) {
  // Phải liệt kê cả Windows lẫn Linux, và phải FALLBACK về Chromium của
  // Playwright. Lần đầu chỉ có đường dẫn Windows nên trên runner Ubuntu nó
  // exit(1) — CI đỏ vì lý do SAI, không phải vì vượt ngân sách. Một guard đỏ
  // sai nguyên nhân nguy hiểm ngang một guard không bao giờ chạy: cả hai đều
  // khiến người ta mất niềm tin vào cả hệ thống.
  const CANDIDATES = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/microsoft-edge',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const EXE = CANDIDATES.find(p=>{ try{ return existsSync(p); } catch { return false; } });
  if (!process.env.CI) console.log('[budget] browser:', EXE || '(playwright bundled)');

  const b = await chromium.launch({ executablePath:EXE, headless:true,
    args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
  const page = await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  const TARGET = process.env.TARGET || 'http://127.0.0.1:4173/';

  try{
    await page.goto(TARGET, { waitUntil:'networkidle', timeout:45000 });
    await page.click('#btn-start');
    await page.waitForFunction(()=>!!window.__yc, null, {timeout:70000});
    await page.waitForTimeout(6000);
    await page.evaluate(()=>{ const bs=[...document.querySelectorAll('#overlay-vehicle button,#overlay-vehicle .cta')];
      const go=bs.find(x=>/Xuất phát|khởi đầu|Bắt đầu/i.test(x.textContent)); (go||bs[bs.length-1]).click(); });
    await page.waitForTimeout(1500);

    const measured = {};
    console.log('\n           vị trí        calls      tri   shader  texture      MB   geometry');
    for (const gfx of ['low','medium','high','cinematic']){
      await page.evaluate(g=>window.__yc.setGfx(g), gfx);
      await page.waitForTimeout(1200);
      const rows=[];
      for (const [nm,x,z] of PLACES){
        await page.evaluate(p=>window.__yc.setPlayerPos(p[0],p[1]), [x,z]);
        await page.waitForTimeout(1800);
        const r = await page.evaluate(()=>({ ...window.__yc.rendererInfo(), ...window.__yc.gpuBudget() }));
        rows.push({ nm, ...r });
        console.log(`${gfx.padEnd(9)} ${nm} ${String(r.calls).padStart(7)} ${String(r.triangles).padStart(9)} `+
          `${String(r.programs).padStart(8)} ${String(r.textures).padStart(8)} ${String(r.textureMB).padStart(8)} ${String(r.geometries).padStart(10)}`);
      }
      // Tệ nhất theo draw call — draw call là hạng mục dễ vỡ nhất
      measured[gfx] = rows.reduce((a,c)=> c.calls>a.calls ? c : a);
    }

    console.log('\n═══ NGÂN SÁCH ═══');
    const over=[];
    for (const [k, r] of Object.entries(BUDGET)){
      const worst = Object.values(measured).reduce((a,c)=> (c[k]??0)>(a[k]??0) ? c : a);
      const v = worst[k] ?? 0, pct = (v/r.max*100).toFixed(0);
      const bad = v > r.max;
      if (bad) over.push(`${k}=${v} > ${r.max}`);
      console.log(`  ${bad?'✗ VƯỢT':'✓'} ${k.padEnd(10)} ${String(v).padStart(8)} / ${String(r.max).padStart(8)}  (${pct}%)  ${r.why}`);
    }
    if (errs.length) console.log(`\n  ✗ ${errs.length} lỗi runtime: ${errs.slice(0,3).join(' | ')}`);

    writeFileSync('tests/perf-budget-latest.json', JSON.stringify({
      budget: BUDGET, measured, errors: errs,
      checkedAt: new Date().toISOString(),
    }, null, 2));

    if (over.length || errs.length){
      console.log(`\n>>> NGÂN SÁCH BỊ VƯỢT: ${over.join(', ') || '(không hạng mục nào) — lỗi runtime: '+errs.slice(0,2).join(' | ')}`);
      console.log('    Tăng trần chỉ khi đã trả lời được: ngân sách này bảo vệ điều gì?');
      process.exit(1);
    }
    console.log('\n>>> NGÂN SÁCH ĐẠT');
  } finally { await b.close(); }
}
