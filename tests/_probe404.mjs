
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage();
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.status()+' '+r.url()); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:45000 });
await page.waitForTimeout(2500);
console.log(JSON.stringify(bad, null, 1));
await b.close();
