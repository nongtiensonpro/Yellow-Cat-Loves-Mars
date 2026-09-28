import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio','--autoplay-policy=no-user-gesture-required'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const I = ()=>page.evaluate(()=>window.__yc.cineInfo());

console.log('── trước khi kích hoạt ──');
console.log(' ', JSON.stringify(await I()));
console.log('  burst có trong scene:', await page.evaluate(()=>window.__yc.cineInfo().burst));
console.log('  audio:', await page.evaluate(()=>!!(window.__yc.audioState && window.__yc.audioState().ctx)));

console.log('\n── kích hoạt cinematic (dune_field) ──');
console.log('  startCine ->', await page.evaluate(()=>window.__yc.startCine('dune_field')));
for (const w of [200, 500, 700, 800, 900, 700, 900]){
  await page.waitForTimeout(w);
  const i = await I();
  const vis = await page.evaluate(()=>{ const e=document.getElementById('overlay-discovery');
    const cs=getComputedStyle(e); const card=e.querySelector('.discovery-card');
    return { an:e.classList.contains('hidden')?'ẩn':'hiện', phase:e.dataset.phase||'-',
      cardOpacity:+getComputedStyle(card).opacity, transform:getComputedStyle(card).transform.slice(0,34),
      dur:+card.getBoundingClientRect().height.toFixed(0) }; });
  console.log(`  t=${String(i.t).padStart(5)} focus=${String(i.focus).padStart(5)} burstLife=${String(i.burstLife).padStart(6)} | ${vis.an} phase=${vis.phase} opacity=${vis.cardOpacity} ${vis.transform}`);
}
await page.screenshot({ path:'tests/t36-cine.png' });
console.log('\n── đánh dấu khám phá ──');
console.log('  đã khám phá dune_field?', await page.evaluate(()=>window.__yc.discoveredCount ? window.__yc.discoveredCount() : 'n/a'));
await page.waitForTimeout(2500);
console.log('  sau khi khoảnh khắc hết:', JSON.stringify(await I()));
console.log('\n── nhịp lặp: cooldown 30–60s ──');
const cd = (await I()).cooldown;
console.log(`  cooldown sau lần đầu = ${cd}s  ${cd>=30&&cd<=60.1?'✓ trong khoảng 30–60':'✗ ngoài khoảng'}`);
// thử kích hoạt lại ngay — phải bị chặn
const before = await page.evaluate(()=>window.__yc.cineInfo().t);
await page.evaluate(()=>window.__yc.startCine('frost_hollow'));
await page.waitForTimeout(400);
const after = await I();
console.log(`  kích hoạt lại ngay: target=${after.target} (không chặn bở tự gọi trong test)`);
// kiểm tra auto-trigger: đứng yên 12s không nên tự bật lại
await page.evaluate(()=>{ window.__yc.closeDiscovery ? window.__yc.closeDiscovery(false) : 0; });
await page.waitForTimeout(6000);
console.log(`  sau 6s đứng yên: t=${(await I()).t} cooldown=${(await I()).cooldown} ${(await I()).t<0?'✓ không tự lặp':'✗ lặp liên tục'}`);
console.log('\nERRORS:', errs.length, errs.slice(0,3));
await b.close();
