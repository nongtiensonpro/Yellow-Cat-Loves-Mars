import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext()).newPage();
const errs=[]; page.on('pageerror',e=>errs.push({m:e.message, s:(e.stack||'').split('\n').slice(0,4).join(' | ')}));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(6000);
await page.keyboard.down('w'); await page.waitForTimeout(2500);
await page.keyboard.down('d'); await page.waitForTimeout(2500);
await page.keyboard.up('d'); await page.waitForTimeout(1500);
await page.keyboard.down('s'); await page.waitForTimeout(1500);
await page.keyboard.up('s'); await page.keyboard.up('w'); await page.waitForTimeout(1500);
await page.keyboard.down('w'); await page.waitForTimeout(2000);
await page.keyboard.down('Shift'); await page.waitForTimeout(2000);
await page.keyboard.up('Shift'); await page.keyboard.up('w'); await page.waitForTimeout(1200);
for (const v of ['moto','rover','bike']){ await page.evaluate(x=>window.__yc.setVehicle(x), v); await page.waitForTimeout(1600); }
await page.keyboard.down('c'); await page.waitForTimeout(900); await page.keyboard.up('c'); await page.waitForTimeout(1500);
const seen = new Map();
for (const e of errs) if (!seen.has(e.m)) seen.set(e.m, {n:0, s:e.s});
for (const e of errs) if (seen.has(e.m)) seen.get(e.m).n++;
for (const [m,v] of seen) console.log(`[${v.n}×] ${m}\n     ${v.s}\n`);
await b.close();
