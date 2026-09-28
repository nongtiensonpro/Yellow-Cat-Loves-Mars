import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5500);
// đóng modal chọn xe
await page.evaluate(()=>{ const bs=[...document.querySelectorAll('#overlay-vehicle button,#overlay-vehicle .cta')];
  const go=bs.find(b=>/Xuất phát|khởi đầu|Bắt đầu/i.test(b.textContent)); (go||bs[bs.length-1]).click(); });
await page.waitForTimeout(1200);
const left = await page.evaluate(()=>['#overlay-vehicle','#overlay-discovery','#toast']
  .filter(id=>{const e=document.querySelector(id); return e && getComputedStyle(e).display!=='none';}));
console.log('overlay còn:', left.length?left.join(','):'không');
// đứng yên, chụp nền
await page.evaluate(()=>window.__yc.setCam(0));
await page.waitForTimeout(1200);
await page.screenshot({ path:'tests/t36-truoc.png' });
// bật cinematic
await page.evaluate(()=>window.__yc.startCine('crater_lake'));
for (const [w, tag] of [[420,'beat'],[430,'slide'],[520,'settle'],[600,'body'],[800,'hold']]){
  await page.waitForTimeout(w);
  const i = await page.evaluate(()=>window.__yc.cineInfo());
  console.log(`  ${tag.padEnd(7)} t=${String(i.t).padStart(5)} focus=${String(i.focus).padStart(5)} burstLife=${String(i.burstLife).padStart(6)} vis=${i.burstVisible}`);
  await page.screenshot({ path:`tests/t36-${tag}.png` });
  if (tag==='slide'){
    const c = await page.evaluate(()=>{ const g=id=>document.getElementById(id).textContent.trim();
      return { icon:g('d-icon'), title:g('d-title'), biome:g('d-biome'),
        fact:g('d-fact').slice(0,46), cat:g('d-cat').slice(0,40), earth:g('d-earth').slice(0,40) }; });
    console.log('  nội dung thẻ:', JSON.stringify(c, null, 0));
    const ph = await page.evaluate(()=>{ const e=document.getElementById('overlay-discovery');
      return { phienToan:+(e.getBoundingClientRect().height/innerHeight).toFixed(2),
        anhHu:+(e.querySelector('.discovery-hero').getBoundingClientRect().height/innerHeight).toFixed(2) }; });
    console.log('  overlay chiếm', (ph.phienToan*100).toFixed(0)+'% chiều cao · hero', (ph.anhHu*100).toFixed(0)+'%');
  }
}
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
