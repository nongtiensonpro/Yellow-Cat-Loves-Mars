import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:800,height:500}})).newPage();
page.on('pageerror',e=>console.log('PAGEERROR:', e.message.split('\n').slice(0,3).join(' | ')));
page.on('console', m=>{ if(m.type()==='error') console.log('CONSOLE-ERR:', m.text().slice(0,300)); });
page.on('requestfailed', r=>console.log('REQ-FAIL:', r.url().slice(0,120), r.failure()?.errorText));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.waitForTimeout(6000);
console.log('__yc có không:', await page.evaluate(()=>!!window.__yc));
await b.close();
