
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage({ viewport:{width:1280,height:800} });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=> !!window.__yc, null, { timeout:45000 });
await page.waitForTimeout(1500);
await page.keyboard.down('w'); await page.waitForTimeout(2800); await page.keyboard.up('w');
await page.waitForTimeout(500);
await page.screenshot({ path:'tests/v04-arcadia.png' });
await page.evaluate(()=>{ const p=window.__yc.POIS.find(p=>p.biome==='valles'); window.__yc.setPlayerPos(p.pos.x-60, p.pos.z+40); });
await page.waitForTimeout(600);
await page.screenshot({ path:'tests/v04-valles.png' });
await page.evaluate(()=>{ const p=window.__yc.POIS.find(p=>p.biome==='olympus'); window.__yc.setPlayerPos(p.pos.x+90, p.pos.z+90); });
await page.waitForTimeout(600);
await page.screenshot({ path:'tests/v04-olympus.png' });
// force storm visual for screenshot
await page.evaluate(()=>{ window.__yc.forceStorm && window.__yc.forceStorm(); });
await page.waitForTimeout(3500);
await page.screenshot({ path:'tests/v04-storm.png' });
await b.close(); console.log('shots ok');
