import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,160)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);

console.log('preset khởi tạo:', await page.evaluate(()=>window.__yc.gfx()));
console.log('selector trong DOM:', await page.evaluate(()=>!!document.getElementById('gfx-select')));
console.log('localStorage:', await page.evaluate(()=>localStorage.getItem('yc_mars_gfx')||'(chưa lưu)'));

for (const n of ['low','medium','high','cinematic']) {
  await page.evaluate((x)=>window.__yc.setGfx(x), n);
  await page.waitForTimeout(1200);
  const info = await page.evaluate(()=>window.__yc.perf());
  console.log(`  ${n.padEnd(10)} pixelRatio=${info.pixelRatio} shadow=${info.shadow} calls=${info.calls} tri=${Math.round(info.triangles/1000)}k`);
  // chạy vài frame để chắc không lỗi sau khi đổi preset
  await page.keyboard.down('w'); await page.waitForTimeout(900); await page.keyboard.up('w');
}
// đổi preset qua UI thật
await page.selectOption('#gfx-select','medium');
await page.waitForTimeout(800);
console.log('đổi qua UI ->', await page.evaluate(()=>window.__yc.gfx()));
// bật pill hiệu năng
await page.evaluate(()=>{document.documentElement.dataset.perf='1';});
await page.waitForTimeout(1500);
console.log('pill hiệu năng:', await page.evaluate(()=>document.getElementById('hud-perf')?.textContent));
await page.screenshot({ path:'tests/gfx-preset.png' });
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
