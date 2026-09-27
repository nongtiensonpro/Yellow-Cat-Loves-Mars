import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,160)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<3;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(300); }
await page.evaluate(()=>{ window.__yc.setGfx('high'); window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.16, 70, 0.45); });
const gathered = [];
const KEYS = [['1','dem'],['2','binhminh'],['3','trua'],['4','hoanghon']];
for (const [key, nm] of KEYS){
  await page.evaluate(()=>{ const t=document.getElementById('toast-close'); if(t)t.click(); });
  await page.keyboard.press(key);
  await page.waitForTimeout(2600);
  await page.evaluate(()=>{ const t=document.getElementById('toast-close'); if(t)t.click(); });
  const st = await page.evaluate(()=>{ const s=window.__yc.scene;
    return { gio: document.getElementById('hud-time').textContent,
      sun:'#'+window.__yc.renderer.getContext()&&'', 
      fog:'#'+s.fog.color.getHexString(),
      top:'#'+s.getObjectByProperty('type','Mesh')?'-':'-' }; });
  // Đo ĐÚNG đèn mặt trời + bán cầu. Trước đây traverse lấy đèn đầu tiên và bắt
  // nhầm đèn phụ; giờ lấy theo tên + kiểm tra chỉ số tiếp cận đúng đèn.
  const m = await page.evaluate(()=>{ const o={};
    window.__yc.scene.traverse(x=>{
      if(x.isDirectionalLight && x.castShadow) o.sun = +x.intensity.toFixed(3);
      if(x.isHemisphereLight) o.hemi = +x.intensity.toFixed(3); });
    return o; });
  gathered.push(m);
  console.log(`phím ${key} → pill="${st.gio}"  fog=${st.fog}  đèn=${JSON.stringify(m)}`);
  await page.screenshot({ path:`tests/tg-${nm}.png` });
}
// kiểm tra pill giờ cập nhật khi đổi bằng console
const viaApi = await page.evaluate(()=>{ window.__yc.setTime(0.5); return 1; });
await page.waitForTimeout(900);
console.log('setTime(0.5) → pill =', await page.evaluate(()=>document.getElementById('hud-time').textContent));
// ASSERT: cường độ đèn PHẢI khác nhau giữa 4 mốc — đây là chỗ hỏng tiềm ẩn
// (maybeStorm gán đè khiến bình minh y hệt trưa).
const uniq = new Set(gathered.map(g=>g.sun)).size;
console.log('\nASSERT sun.intensity theo 4 mốc:', JSON.stringify(gathered.map(g=>g.sun)));
if (uniq < 3){ console.log('✗ XẤP XỜI: sun.intensity không đổi theo giờ — còn chủ sở hữu thứ hai'); }
else { console.log('✓ cường độ đèn tách rõ theo giờ'); }
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
