import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:800,height:500}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
async function doRun(label, keys, ms){
  await page.evaluate(()=>{ window.__ycDev=[]; });
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  const raw = await page.evaluate(()=>window.__ycDev.slice());
  const d = raw.filter((_,i)=>i%2===1);   // phần tử lẻ = jerk
  for (const k of keys) await page.keyboard.up(k);
  await page.waitForTimeout(1200);
  d.sort((a,b)=>a-b);
  const q = p => d[Math.floor(d.length*p)];
  console.log(`${label.padEnd(12)} n=${String(d.length).padStart(5)}  p50=${q(.50).toFixed(4)}  p90=${q(.90).toFixed(4)}  p99=${q(.99).toFixed(4)}  max=${d[d.length-1].toFixed(4)}  >7.5cm: ${(d.filter(x=>x>0.075).length/d.length*100).toFixed(1)}%`);
  return d;
}
await doRun('đứng yên', [], 5000);
await doRun('đi thẳng', ['w'], 9000);
await doRun('đi + rẽ', ['w','d'], 8000);
await b.close();
