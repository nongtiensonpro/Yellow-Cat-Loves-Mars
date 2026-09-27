import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const ctx = await b.newContext({ viewport:{width:1100,height:700}, serviceWorkers:'allow' });
const page = await ctx.newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(4000);
const entry = (await page.evaluate(()=>[...document.querySelectorAll('script[type=module]')].map(s=>s.src)))[0];
const h = await page.evaluate(async(u)=>{ const k=await caches.keys(); const c=await caches.open(k[0]);
  const r=await c.match(u); if(!r) return null; const o={}; r.headers.forEach((v,n)=>o[n]=v); return o; }, entry);
console.log('CACHE HEADERS:', JSON.stringify(h));
await ctx.setOffline(true);
const fails=[]; const oks=[];
page.on('requestfailed', r=>fails.push(r.url().split('/').pop()));
page.on('response', r=>oks.push(r.status()+' '+r.url().split('/').pop()));
await page.reload({ waitUntil:'domcontentloaded', timeout:30000 }).catch(e=>fails.push('RELOAD:'+e.message.slice(0,60)));
await page.waitForTimeout(2000);
console.log('OFFLINE responses:', JSON.stringify(oks));
console.log('OFFLINE failed   :', JSON.stringify(fails));
console.log('boot ran?', await page.evaluate(()=>typeof window.__ycBoot!=='undefined' || !!document.getElementById('btn-start')));
await b.close();
