import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
for(let k=0;k<3;k++){ await page.evaluate(h=>{ for(const id of h){const e=document.querySelector(id);
  if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE); await page.waitForTimeout(350); }
await page.evaluate(()=>{ window.__yc.setGfx('high'); window.__yc.setTime(0.33);
  window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.35, 90, 0.7); });
await page.waitForTimeout(2500);
const d = await page.evaluate(()=>{
  const r = window.__yc.renderer, s = window.__yc.scene, T = window.__yc.THREE;
  const cc = new T.Color(); r.getClearColor(cc);
  const c = window.__yc.composer ? window.__yc.composer() : null;
  const out = { gfx: window.__yc.gfxName, hasComposer: !!c,
    clearAlpha: r.getClearAlpha(), clearColor: '#'+cc.getHexString(),
    bg: s.background ? (s.background.isColor ? '#'+s.background.getHexString() : s.background.type) : null,
    canvas: { w: r.domElement.width, h: r.domElement.height, cw: r.domElement.clientWidth },
    ctxAttrs: r.getContext().getContextAttributes(),
    postOn: window.__yc.postFXOn ? window.__yc.postFXOn() : null };
  if (c){ const rt = c.renderTarget1;
    out.rt = { w: rt.width, h: rt.height, tex: !!rt.texture };
    out.passes = c.passes.map(p=>({ n:p.constructor.name, en:p.enabled,
      clearAlpha: p.clearAlpha, clear: p.clear, rtSize: p.renderToScreen }));
  }
  // đọc pixel thật từ buffer composer để tìm chỗ bị đen
  out.px = {};
  for (const [nm, rt] of [['rt1', c.readBuffer], ['rt2', c.writeBuffer]]){
    try{
      const w = rt.width, h = rt.height;
      const buf = new Uint8Array(w*h*4);
      r.readRenderTargetPixels(rt, 0, 0, w, h, buf);
      let sum=0, n=0, mx=0;
      for (let k=0;k<buf.length;k+=4*17){ const l=buf[k]*0.2126+buf[k+1]*0.7152+buf[k+2]*0.0722;
        sum+=l; n++; if(l>mx)mx=l; }
      out.px[nm] = { w, h, mean:+(sum/n).toFixed(1), max:mx };
    }catch(e){ out.px[nm] = 'ERR '+e.message.slice(0,80); }
  }
  // đọc trực tiếp từ shader pass xem có uniform nào NaN không
  out.grad = {};
  for (const ps of c.passes){
    if (!ps.material || !ps.material.uniforms) continue;
    const u = ps.material.uniforms, bad = {};
    for (const k in u){ const v = u[k] && u[k].value;
      if (typeof v === 'number' && !isFinite(v)) bad[k] = String(v);
      if (v && v.isVector3 && (!isFinite(v.x)||!isFinite(v.y)||!isFinite(v.z))) bad[k] = `v3(${v.x},${v.y},${v.z})`;
      if (v && v.isColor && !isFinite(v.r)) bad[k] = `col(${v.r},${v.g},${v.b})`; }
    out.grad[ps.constructor.name + (u.uGrain? '_grade':u.resolution? '_fxaa':'')] = Object.keys(bad).length? bad : 'sach';
  }
  return out; });
console.log(JSON.stringify(d, null, 1));
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
