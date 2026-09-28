import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:900,height:560}})).newPage();
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
for (let k=0;k<4;k++){ if (await page.evaluate(()=>window.__yc.camMode())===1) break;
  await page.keyboard.press('c'); await page.waitForTimeout(300); }
console.log('camMode:', await page.evaluate(()=>window.__yc.camMode()),
            '| camDist:', await page.evaluate(()=>window.__yc.camDist ? window.__yc.camDist() : '?'));
await page.keyboard.down('w');
await page.waitForTimeout(9000);   // để đạt trạng thái xác lập
const rows=[];
for(let i=0;i<10;i++){
  rows.push(await page.evaluate(()=>{ const y=window.__yc, c=y.camera, p=y.player.position;
    return { dXZ:+Math.hypot(c.position.x-p.x, c.position.z-p.z).toFixed(2),
      kmh:+(y.speedKmh ? y.speedKmh() : 0).toFixed(1) }; }));
  await page.waitForTimeout(200);
}
await page.keyboard.up('w');
console.log('dXZ:', rows.map(r=>r.dXZ).join(' '));
console.log('km/h:', rows.map(r=>r.kmh).join(' '));
const v = rows[rows.length-1].kmh/3.6;   // m/s
const lag = rows[rows.length-1].dXZ;
console.log(`\ntốc độ ${v.toFixed(1)} m/s, trễ ${lag.toFixed(1)}m  =>  hằng số thời gian hiệu dụng = ${(lag/v).toFixed(3)}s`);
console.log(`để trễ 3m: tau = ${(3/v).toFixed(3)}s`);
await b.close();
