import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const CLOSE=['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const closeAll=async()=>{ for(const s of CLOSE){ const e=await page.$(s); if(e && await e.isVisible().catch(()=>false)) await e.click().catch(()=>{}); }
  await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS); await page.waitForTimeout(350); };
await closeAll();
const pillVisible = () => page.evaluate(()=>{
  const p=document.querySelector('#hud-perf-pill');
  if(!p) return 'khong co pill';
  return p.classList.contains('hud-drive-hidden') ? 'AN (hud-drive-hidden)' : 'HIEN';
});
await page.keyboard.press('f');
await page.waitForTimeout(800); await closeAll();
console.log('sau khi bấm F, đứng yên :', await pillVisible());
// LÁI THẬT
await page.keyboard.down('w');
await page.waitForTimeout(3000);
console.log('đang lái (giữ W)        :', await pillVisible());
await page.waitForTimeout(2500);
console.log('vẫn đang lái            :', await pillVisible(), '| FPS:', await page.evaluate(()=>window.__yc.perf().fps));
await page.keyboard.up('w');
await page.waitForTimeout(3000);
console.log('dừng lại 3s             :', await pillVisible());
// TẮT F rồi lái: ô đo không còn ghim nên HUD gọn khi lái hoạt động lại
await page.keyboard.press('f');
await page.waitForTimeout(500);
await page.keyboard.down('w'); await page.waitForTimeout(2500); await page.keyboard.up('w');
console.log('tắt F rồi lái (đã ẩn)  :', await pillVisible());
console.log('ERRORS:', errs.length);
await b.close();
