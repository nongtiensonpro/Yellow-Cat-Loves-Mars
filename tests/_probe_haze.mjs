import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,150)); });
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<3;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(300); }
async function hideToast(){ await page.evaluate(()=>{ const t=document.getElementById('toast-close'); if(t)t.click();
  document.querySelectorAll('.toast,#toast').forEach(e=>e.classList.remove('show')); }); }
// A/B công bằng: cùng preset cinematic, cùng góc, chỉ bật/tắt pass
await page.evaluate(()=>{ window.__yc.setGfx('cinematic'); window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.10, 62, 0.32); });
for (const [tag, on] of [['OFF', false], ['ON', true]]){
  await page.evaluate(v=>{ const c=window.__yc.composer();
    c.passes.forEach(p=>{ if(p.constructor.name==='Gd' || p.material){} });
    // haze & rays là hai ShaderPass vừa thêm: tìm theo tên uniform
    c.passes.forEach(p=>{ const u=p.material&&p.material.uniforms;
      if(u && u.uAmount) p.enabled = v;
      if(u && u.uSunUV) p.enabled = v; });
  }, on);
  await page.waitForTimeout(2600); await hideToast();
  const st = await page.evaluate(()=>{ const c=window.__yc.composer();
    const f=c.passes.map((p,i)=>{ const u=p.material&&p.material.uniforms;
      return u&&(u.uAmount?`haze a=${u.uAmount.value.toFixed(2)} en=${p.enabled}`
        : u&&u.uSunUV?`rays s=${u.uStrength.value.toFixed(2)} vis=${u.uSunVis.value} en=${p.enabled}`:null); })
      .filter(Boolean);
    return { f, err: window.__yc.errList ? null : 0 }; });
  console.log(`${tag.padEnd(4)} ${st.f.join(' | ')} | sun=${JSON.stringify(st.sun)}`);
  await page.screenshot({ path:`tests/t33-${tag}.png` });
}
// theo giờ
for (const [key,nm] of [['1','dem'],['2','binhminh'],['3','trua']]){
  await page.evaluate(v=>{ const c=window.__yc.composer();
    c.passes.forEach(p=>{ const u=p.material&&p.material.uniforms;
      if(u&&(u.uAmount||u.uSunUV)) p.enabled=v; }); }, true);
  await page.keyboard.press(key); await page.waitForTimeout(2400); await hideToast();
  console.log(`giờ ${nm}:`, await page.evaluate(()=>{ const c=window.__yc.composer();
    return c.passes.map(p=>{ const u=p.material&&p.material.uniforms;
      return u&&u.uAmount?`haze=${u.uAmount.value.toFixed(2)}`:u&&u.uSunUV?`rays=${u.uStrength.value.toFixed(2)} vis=${u.uSunVis.value}`:null; })
      .filter(Boolean).join(' ') + ' | sun=' + JSON.stringify(window.__yc.sunScreen()); }));
  await page.screenshot({ path:`tests/t33-${nm}.png` });
}
// ── bụi bám: chạy thật rồi đo, không giả lập ─────────────────────────────
console.log('\n── bụi bám trên xe ──');
console.log('lúc mới    ', JSON.stringify(await page.evaluate(()=>window.__yc.dustInfo())));
// lái thật để distance tăng
await page.evaluate(()=>{ window.__yc.setCam(0); });
await page.keyboard.down('w');
for (let i=0;i<5;i++){ await page.waitForTimeout(4000);
  console.log(`  sau ${(i+1)*4}s`, JSON.stringify(await page.evaluate(()=>window.__yc.dustInfo()))); }
await page.keyboard.up('w');
await page.waitForTimeout(2500);
const din = await page.evaluate(()=>window.__yc.dustInfo());
console.log('sau khi lái', JSON.stringify(din));
// kiểm tra mèo/đá KHÔNG bị bám bụi theo (vật liệu dùng chung cache)
const lan = await page.evaluate(()=>{ const s=window.__yc.scene; let n=0, total=0;
  s.traverse(o=>{ if(o.isMesh && o.material && !o.material.emissive){ total++;
    if(o.material.name==='' && o.material._fromCache) n++; } });
  return { ngoiScene: total }; });
console.log('kiểm tra lan sang vật thể khác:', JSON.stringify(lan));
await page.screenshot({ path:'tests/t33-bui.png' });
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
