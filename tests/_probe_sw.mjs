import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport:{width:900,height:600}, serviceWorkers:'allow' });
const page = await ctx.newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(4000);
const out = await page.evaluate(async()=>{
  const keys = await caches.keys();
  if(!keys.length) return {error:'no cache'};
  const c = await caches.open(keys[0]);
  const res=[];
  for(const req of await c.keys()){
    const r = await c.match(req);
    const buf = await r.clone().arrayBuffer();
    res.push({ path:new URL(req.url).pathname, type:r.headers.get('content-type'), bytes:buf.byteLength });
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
