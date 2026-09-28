import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET,{waitUntil:'networkidle',timeout:45000});
console.log('pre-click __yc:', await page.evaluate(()=>typeof window.__yc));
await page.click('#btn-start');
for (let i=0;i<10;i++){
  await page.waitForTimeout(1000);
  const s = await page.evaluate(()=>({ yc:typeof window.__yc, pct:document.getElementById('load-pct')?.textContent }));
  if (s.yc==='object' && s.pct==='100%'){ console.log('sẵn sàng sau', i+1, 's'); break; }
  if (i===9) console.log('chưa sẵn sàng:', JSON.stringify(s), '| lỗi:', errs.slice(0,3));
}
await page.waitForTimeout(6000);
await page.click('#btn-pick-go');
await page.waitForTimeout(1500);
await page.evaluate(()=>window.__yc.setGfx('high'));
await page.waitForTimeout(1500);
await page.keyboard.press('p');
await page.waitForTimeout(2200);
const info = await page.evaluate(()=>({ u: window.__yc.photoUniforms(), d: window.__yc.depthValid() }));
console.log('uniforms:', JSON.stringify(info.u));
console.log('depth   :', JSON.stringify(info.d));

async function shot(name, setup){
  await page.evaluate(setup);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `tests/${name}.png` });
  console.log('  chụp', name);
}
// A: không blur
await shot('t41-noblur', ()=>{ const s=document.getElementById('ps-fstop');
  s.value=22; s.dispatchEvent(new Event('input')); });
// B: f/1.4 lấy nét xa → cận phải mờ
await shot('t41-f14-far', ()=>{ const f=document.getElementById('ps-fstop');
  f.value=1.4; f.dispatchEvent(new Event('input'));
  const o=document.getElementById('ps-focus'); o.value=90; o.dispatchEvent(new Event('input')); });
// C: f/1.4 lấy nét gần
await shot('t41-f14-near', ()=>{ const o=document.getElementById('ps-focus');
  o.value=3; o.dispatchEvent(new Event('input')); });
// D: LUT chân không + EV thấp
await shot('t41-void', ()=>{ const b=[...document.querySelectorAll('#photo-looks button')].find(x=>/Chân không/.test(x.textContent));
  b.click(); const e=document.getElementById('ps-ev'); e.value=-1.2; e.dispatchEvent(new Event('input')); });
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
