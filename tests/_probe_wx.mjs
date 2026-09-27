import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
// ĐÓNG MỌI THỨ và XÁC NHẬN đã đóng. Popup chọn xe mở ngay sau #btn-start —
// quên đóng nó thì ảnh chụp được là GIAO DIỆN, không phải cảnh 3D. Đã dính.
const HIDE = ['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
async function clean(){
  for (let k=0;k<3;k++){
    await page.evaluate(h=>{
      const t=document.getElementById('toast-close'); if(t) t.click();
      document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show'));
      for(const id of h){ const e=document.querySelector(id);
        if(e){ e.style.setProperty('display','none','important'); e.classList.add('hidden'); } }
    }, HIDE);
    await page.waitForTimeout(500);
  }
  const left = await page.evaluate(h=>h.filter(id=>{const e=document.querySelector(id);
    return e && getComputedStyle(e).display!=='none';}), HIDE);
  if (left.length) console.log('  !! còn overlay:', left.join(','));
  return left.length===0;
}
await clean();
const PITCH=+(process.env.PITCH||0.42), DIST=+(process.env.DIST||46);
const pts=[['A-dongbang',0,0],['B-bo-ham',350,10],['C-day-ham',350,-150],['D-bo-khuc',300,-240],['E-cau',366,-60]];
for (const [nm,x,z] of pts){
  await page.evaluate(a=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
    window.__yc.setPlayerPos(a.x,a.z); window.__yc.setOrbit(a.p, a.d, 0.7); }, {x,z, p:PITCH, d:DIST});
  await page.waitForTimeout(1700);
  const ok = await clean();
  await page.screenshot({ path:`tests/${process.env.TAG||'wx'}-${nm}.png` });
  const h = await page.evaluate(a=>+window.__yc.heightAt(a.x,a.z).toFixed(1), {x,z});
  console.log(`${nm.padEnd(11)} (${x},${z}) cao ${String(h).padStart(6)}m · overlay sạch=${ok}`);
}
await b.close();
