import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1100,height:640}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const CLOSE=['#btn-discovery-ok','#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const closeAll=async()=>{ for(const s of CLOSE){ const e=await page.$(s); if(e && await e.isVisible().catch(()=>false)) await e.click().catch(()=>{}); }
  await page.evaluate(o=>{ const b=document.getElementById('btn-discovery-ok'); if(b) b.click();
    const tc=document.getElementById('toast-close'); if(tc) tc.click();
    document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show'));
    for(const id of o){const e=document.querySelector(id); if(e){e.style.display='none'; e.classList.add('hidden');} } },OVS); await page.waitForTimeout(350); };
await closeAll();
console.log('landmark dựng:', await page.evaluate(()=>window.__yc.landmarkInfo().length));
console.log('số kind:', await page.evaluate(()=>{
  const c={}; for(const l of window.__yc.landmarkInfo()) c[l.kind]=(c[l.kind]||0)+1; return JSON.stringify(c); }));
// độ sâu hào: cao nhất vs thấp nhất quanh trục
console.log('độ sâu hào Valles:', await page.evaluate(()=>{
  const h=(x,z)=>window.__yc.heightAt(x,z);
  const rim=h(350-70,-150), mid=h(350,-150), other=h(350+70,-150);
  return `bờ ${rim.toFixed(1)} · đáy ${mid.toFixed(1)} · bờ kia ${other.toFixed(1)} | sâu ${(rim-mid).toFixed(1)}m`;
}));
const shots=[['valles-hinh',350,-60,0.6,26,0.7],['valles-ham',350,-150,0.3,20,0.35],['valles-cau',366,-60,0.9,30,0.6],['valles-terrace',300,-240,0.5,24,0.6]];
for (const [nm,x,z,az,d,y] of shots){
  await page.evaluate(a=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
    window.__yc.setPlayerPos(a.x,a.z); window.__yc.setCam(2); window.__yc.setOrbit(a.az,a.d,a.y);
    window.__yc.setVehicle('moto'); }, {x,z,az,d,y});
  await page.waitForTimeout(2600); await closeAll();
  // popup khám phá có thể bật LẠI sau khi đóng (biome check chạy nền theo timer),
  // nên đóng 2 vòng cách nhau rồi mới chụp — chụp khi popup còn là ảnh vô giá trị.
  await page.waitForTimeout(900); await closeAll();
  await page.waitForTimeout(500);
  const still = await page.evaluate(()=>{ const e=document.querySelector('#overlay-discovery');
    return e ? getComputedStyle(e).display : 'khong co'; });
  if (still !== 'none') console.log('   !! popup vẫn hiện, display =', still);
  await page.screenshot({ path:`tests/${nm}.png` });
  console.log('  chụp', nm, await page.evaluate(()=>{const i=window.__yc.rendererInfo(); return `draw ${i.calls} tri ${i.triangles}`;}));
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
