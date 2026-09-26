
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await b.newPage();
page.on('console', m=> console.log('[console]', m.type(), m.text().slice(0,300)));
page.on('pageerror', e=> console.log('[pageerror]', String(e).slice(0,500)));
page.on('request', r=>{ const u=r.url(); if(/assets\/|\.js/.test(u) && !u.includes('es-module-shims')) console.log('[req]', u.split('/').slice(-2).join('/')); });
page.on('requestfailed', r=> console.log('[reqfail]', r.url().split('/').slice(-2).join('/'), r.failure()?.errorText));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.waitForTimeout(6000); // idle-callback silent preload should fetch main chunk
console.log('--- now click start ---');
await page.click('#btn-start');
await page.waitForTimeout(6000);
const st = await page.evaluate(()=> ({
  yc: !!window.__yc,
  btn: document.getElementById('btn-start')?.textContent?.slice(0,40),
  loadingOut: document.getElementById('loading').className,
  veh: !document.getElementById('overlay-vehicle').classList.contains('hidden'),
}));
console.log('state:', JSON.stringify(st));
await b.close();
