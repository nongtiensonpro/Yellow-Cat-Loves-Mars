import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const info = ()=>page.evaluate(()=>window.__yc.animInfo());
const P = k => page.evaluate(x=>window.__yc.animInfo().P[x], k);

console.log('các trạng thái:', JSON.stringify(await page.evaluate(()=>window.__yc.animStates())));
const seen = new Set();
async function q(label, ms=2200){ const t0=Date.now();
  while(Date.now()-t0<ms){ const a=await info(); seen.add(a.state);
    console.log(`  ${label.padEnd(9)} state=${a.state.padEnd(7)} pitch=${String(a.P.pitch).padEnd(9)} roll=${String(a.P.roll).padEnd(9)} earBack=${String(a.P.earBack).padEnd(9)} tailLift=${String(a.P.tailLift).padEnd(9)} scarf=${String(a.P.scarf).padEnd(8)} crouch=${String(a.P.crouch).padEnd(8)} bump=${a.bump} n=${a.age}ms`);
    await page.waitForTimeout(600); } }

await q('đứng yên', 1800);
await page.keyboard.down('w');            await q('tăng tốc', 2600);
await q('cruise', 2600);
await page.keyboard.down('d');            await q('rẽ phải', 2000);
await page.keyboard.up('d');
await page.keyboard.up('w');
await page.keyboard.down('s');            await q('phanh', 2000);
await page.keyboard.up('s');
await page.waitForTimeout(2500);
console.log('\nĐÃ QUAY QUA:', [...seen].join(', '));
// tỉ lệ thời gian: bump trên đất bằng phải HIẾM, nếu chiếm nhiều là ngưỡng sai
const cnt = await page.evaluate(()=>{ const c={}; const t0=performance.now();
  return new Promise(r=>{ const iv=setInterval(()=>{ const s=window.__yc.animState();
    c[s]=(c[s]||0)+1; if(performance.now()-t0>6000){clearInterval(iv);r(c);} },50); }); });
const tot = Object.values(cnt).reduce((a,b)=>a+b,0);
// tỉ lệ bump khi LÁI: phải hiếm, nếu cao là vẫn nhận diện sai
await page.keyboard.down('w'); await page.waitForTimeout(2500);
const cb = await page.evaluate(()=>new Promise(r=>{ const c={}; const t0=performance.now();
  const iv=setInterval(()=>{ const s=window.__yc.animInfo();
    c[s.state]=(c[s.state]||0)+1; c._bumpSum=(c._bumpSum||0)+s.bump;
    if(performance.now()-t0>8000){clearInterval(iv); r(c);} },50); }));
await page.keyboard.up('w');
const tb = Object.entries(cb).filter(([k])=>!k.startsWith('_')).reduce((a,[,v])=>a+v,0);
console.log('\nphân bố 8s LÁI THẲNG:', Object.entries(cb).filter(([k])=>!k.startsWith('_'))
  .map(([k,v])=>`${k} ${(v/tb*100).toFixed(0)}%`).join(' · '),
  `| thời gian trong xung bump: ${(cb._bumpSum/160*100).toFixed(0)}%`);
await page.waitForTimeout(1500);
console.log('phân bố 6s (đang đứng yên):', Object.entries(cnt).map(([k,v])=>`${k} ${(v/tot*100).toFixed(0)}%`).join(' · '));
console.log('thiếu:', ['idle','accel','cruise','turn','brake','reverse'].filter(s=>!seen.has(s)).join(', ')||'không');
// KIỂM CHỨNG: các trạng thái có GIÁ TRỊ KHÁC NHAU thật không
const P0 = await P('earBack');
await page.keyboard.down('s'); await page.waitForTimeout(2500);
const P1 = await P('earBack');
await page.keyboard.up('s');
console.log(`\nearBack: cruise=${P0}  brake=${P1}  khác nhau=${Math.abs(P0-P1)>0.05?'CÓ ✓':'KHÔNG ✗'}`);
// rẽ: roll có khác 0 và DÀN?
await page.keyboard.down('w'); await page.waitForTimeout(2000);
await page.keyboard.down('d'); await page.waitForTimeout(1400);
const r1 = await page.evaluate(()=>window.__yc.animInfo().P.roll);
await page.keyboard.up('d'); await page.keyboard.down('a'); await page.waitForTimeout(1400);
const r2 = await page.evaluate(()=>window.__yc.animInfo().P.roll);
await page.keyboard.up('a'); await page.keyboard.up('w');
console.log(`roll khi rẽ: D=${r1}  A=${r2}  đổi chiều=${(r1*r2)<0?'CÓ ✓':'KHÔNG ✗'}`);
// sở hữu: anim KHÔNG được ghi đè tư thế địa hình
console.log('\nterrain vs anim là hai nguồn riêng:',
  JSON.stringify(await page.evaluate(()=>{const a=window.__yc.animInfo();
    return {terrainPitch:a.terrainPitch, animPitch:a.P.pitch};})));
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
