
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage();
page.on('pageerror', e=>{ console.log('[pageerror]', String(e).slice(0,300)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=> !!window.__yc, null, { timeout:45000 });
await page.waitForTimeout(1500);
const h = await page.evaluate(()=> {
  const H = window.__yc.heightAt;
  const s=(x,z)=> +H(x,z).toFixed(2);
  return {
    arcadiaCenter: s(0,0),
    arcadiaEdge:   s(150,120),
    olympusPatch:  s(-380,420),
    olympusSlope:  s(-300,340),
    vallesTrench:  s(420,-180),
    betweenFar:    s(900,900),           // outside all windows -> pure procedural
    patchVariety:  (function(){ let mn=1e9,mx=-1e9; for(let i=0;i<200;i++){ const x=(Math.random()-0.5)*500, z=(Math.random()-0.5)*500; const v=H(x,z); mn=Math.min(mn,v); mx=Math.max(mx,v);} return [+mn.toFixed(1), +mx.toFixed(1)]; })()
  };
});
console.log('heightAt:', JSON.stringify(h, null, 1));
await b.close();
