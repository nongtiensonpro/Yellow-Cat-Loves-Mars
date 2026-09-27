import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1400,height:850}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(3000);
const closeAll = async () => {
  for (const sel of ['#btn-vehicle-close','#btn-pick-go']){
    const el = await page.$(sel);
    if (el && await el.isVisible().catch(()=>false)) await el.click().catch(()=>{});
  }
  await page.evaluate(()=>{ const e=document.getElementById('overlay-vehicle'); if(e) e.style.display='none'; });
  await page.waitForTimeout(400);
};
await closeAll();
await page.evaluate(()=>{ window.__yc.setPlayerPos(0,0); window.__yc.setCam(1); });
await page.waitForTimeout(1200);

// LÁI THẬT để tạo vệt bánh
await page.keyboard.down('w');
await page.waitForTimeout(6000);
await page.keyboard.up('w');
await page.waitForTimeout(800);
console.log('sau khi lái:', JSON.stringify(await page.evaluate(()=>({
  coord:[Math.round(window.__yc.player.position.x), Math.round(window.__yc.player.position.z)],
  contactVisible: (()=>{let n=0; window.__yc.scene.traverse(o=>{ if(o.isMesh && o.material && o.material.map && o.geometry.type==='PlaneGeometry' && o.visible) n++; }); return n;})(),
  calls: window.__yc.rendererInfo().calls, tri: window.__yc.rendererInfo().triangles,
}))));
await page.screenshot({ path:'tests/cs-trail-1.png' });
// nhìn từ trên xuống để thấy vệt bánh rõ
await page.evaluate(()=>{ window.__yc.setOrbit(1.32, 26, 0.6); });
await page.waitForTimeout(1500);
await closeAll();
await page.screenshot({ path:'tests/cs-trail-top.png' });
// góc thấp để thấy contact shadow dưới bánh
await page.evaluate(()=>{ window.__yc.setOrbit(0.10, 4.2, 1.2); });
await page.waitForTimeout(1500);
await closeAll();
await page.screenshot({ path:'tests/cs-contact.png' });
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
process.exit(errs.length?1:0);
