import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:520}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<3;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(300); }
await page.evaluate(()=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
  window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.3, 60, 0.6); });
await page.waitForTimeout(2200);
const names = await page.evaluate(()=>window.__yc.composer().passes.map((p,i)=>i+':'+p.constructor.name));
console.log('passes:', names.join(' | '));
for (let i=1;i<2;i++){
  const nm = 'off'+i;
  const info = await page.evaluate(idx=>{
    const c = window.__yc.composer();
    c.passes.forEach((p,j)=> p.enabled = (j!==idx));
    return window.__yc.composer().passes[idx].constructor.name;
  }, i);
  await page.waitForTimeout(1400);
  await page.screenshot({ path:`tests/bloom-${nm}.png`, clip:{x:120,y:90,width:660,height:340} });
  const st = await page.evaluate(()=>{ const c=window.__yc.composer();
    return { rtType: c.renderTarget1.texture.type, cs: c.renderTarget1.texture.colorSpace,
             fmt: c.renderTarget1.texture.format, post: window.__yc.postFXOn() }; });
  console.log(`tắt pass[${i}] ${info} → rtType=${st.rtType} colorSpace=${st.cs} format=${st.fmt} post=${st.post}`);
}
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
