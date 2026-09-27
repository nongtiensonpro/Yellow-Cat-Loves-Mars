import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext()).newPage();
const seen=[];
page.on('pageerror', e=>{ if(seen.length<2) seen.push({msg:e.message, stack:(e.stack||'').split('\n').slice(0,6).join(' | ')}); });
await page.goto(process.env.TARGET, { waitUntil:'domcontentloaded', timeout:40000 });
await page.waitForTimeout(2500);
await page.click('#btn-start').catch(()=>{});
await page.waitForTimeout(3500);
console.log(JSON.stringify(seen, null, 1));
await b.close();
