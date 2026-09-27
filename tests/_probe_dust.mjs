import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4000);
const OVS=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing'];
const CLOSE=['#btn-discovery-close','#btn-pick-cancel','#btn-vehicle-close','#btn-map-close','#btn-journal-close','#btn-gallery-close','#btn-lightbox-close'];
const closeAll=async()=>{
  for(const s of CLOSE){ const e=await page.$(s); if(e && await e.isVisible().catch(()=>false)) await e.click().catch(()=>{}); }
  await page.evaluate(o=>{for(const id of o){const e=document.querySelector(id); if(e)e.style.display='none';}},OVS);
  await page.waitForTimeout(400);
};
await closeAll();
// BẬT ô FPS bằng phím F (đúng cách người chơi sẽ dùng)
await page.keyboard.press('f');
await page.waitForTimeout(600);
console.log('ô FPS hiện không?:', await page.evaluate(()=>document.getElementById('hud-perf-pill') && getComputedStyle(document.getElementById('hud-perf-pill')).display));
for (const [id, forceStorm] of [['yen',false],['bao',true]]){
  await page.evaluate(s=>{ localStorage.clear(); window.__yc.setGfx('high'); window.__yc.setTime(0.33);
    window.__yc.setPlayerPos(0,0); window.__yc.setCam(1); window.__yc.setOrbit(0.30, 11, 0.8);
    if(s) window.__yc.forceStorm(); }, forceStorm);
  await page.waitForTimeout(forceStorm?7000:2500); await closeAll();
  console.log(id, JSON.stringify(await page.evaluate(()=>{
    const i=window.__yc.rendererInfo();
    return { calls:i.calls, tri:i.triangles, fps:window.__yc.perf().fps,
             hud:(document.getElementById('hud-perf')||{}).textContent };
  })));
  await page.screenshot({ path:`tests/dust-${id}.png` });
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
