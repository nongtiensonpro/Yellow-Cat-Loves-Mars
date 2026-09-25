
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage({ viewport:{width:1280,height:800} });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:45000 });
await page.waitForSelector('#loading.out', { timeout:25000 });
await page.click('#btn-start'); await page.waitForTimeout(300);
await page.click('#btn-pick-go'); await page.waitForTimeout(600);
// drive forward a bit and look around via camera orbit press twice (first-person?) keep third
await page.keyboard.down('w'); await page.waitForTimeout(2600); await page.keyboard.up('w');
await page.waitForTimeout(600);
await page.screenshot({ path:'tests/ingame-arcadia.png' });
// teleport to Olympus for drama
await page.evaluate(()=>{ const p=window.__yc.POIS.find(p=>p.biome==='olympus'); window.__yc.setPlayerPos(p.pos.x-40, p.pos.z-40); });
await page.waitForTimeout(700);
await page.screenshot({ path:'tests/ingame-olympus.png' });
// night
await page.keyboard.press('l'); await page.keyboard.press('l'); await page.keyboard.press('l'); // ~night
await page.waitForTimeout(700);
await page.screenshot({ path:'tests/ingame-night.png' });
await b.close();
console.log('shots ok');
