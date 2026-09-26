import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless:true, args:['--use-gl=angle','--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport:{width:900,height:640} });
const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,200)));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:30000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:45000});
await page.waitForTimeout(1500);
if (await page.locator('#btn-pick-go').isVisible().catch(()=>false)) { await page.click('#btn-pick-go'); await page.waitForTimeout(700); }
const closePop = async()=>{ await page.evaluate(()=>{
  document.querySelectorAll('#overlay-discovery,.discovery-close,#btn-disc-close').forEach(e=>{ e.style.display='none'; e.classList.add('hidden'); });
}); };
await page.evaluate(()=>{ window.__yc.setVehicle('rover'); window.__yc.setCam(0); });
await page.waitForTimeout(700);
// rover: tay y=2.49, x=0.64. Camera phai cao + lui de nhin qua thanh xe.
const cands = [
  ['RA', {sh:0.00, up:2.00, bk:-0.60, la:10, ly:-2.30}],
  ['RB', {sh:0.00, up:2.20, bk:-0.80, la:11, ly:-2.60}],
  ['RC', {sh:0.00, up:2.40, bk:-1.00, la:12, ly:-2.90}],
  ['RD', {sh:0.00, up:2.20, bk:-0.40, la:10, ly:-2.60}],
  ['RE', {sh:0.00, up:2.60, bk:-1.20, la:12, ly:-3.20}],
  ['RF', {sh:0.00, up:2.30, bk:-0.20, la:11, ly:-2.70}],
];
for (const [n,c] of cands) {
  await page.evaluate(cc=>{ window.__ycFPV = cc; }, c);
  await page.waitForTimeout(450);
  await closePop();
  await page.screenshot({ path: `tests/fpvfit-${n}.png` });
  console.log(n, JSON.stringify(c));
}
console.log('ERRORS:', errs.length);
await b.close();
