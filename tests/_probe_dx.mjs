import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
// ── TARGET có mặc định + báo lỗi rõ ràng khi server chưa chạy ──
// Trước đây thiếu TARGET là chết với `url: expected string, got undefined` —
// thông báo không liên quan gì tới việc thật sự sai.
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try {
  const r = await fetch(TARGET_URL, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
} catch (e) {
  console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`);
  console.error('  Khởi động server trước:  node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173');
  console.error('  Hoặc trỏ sang nơi khác:   TARGET=http://... node tests/<probe>.mjs');
  process.exit(2);
}
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
const HIDE=['#overlay-vehicle','#overlay-discovery','#overlay-map','#overlay-landing','#lightbox','#sheet-gallery','#sheet-journal'];
async function clean(){ for(let k=0;k<3;k++){ await page.evaluate(h=>{
  const t=document.getElementById('toast-close'); if(t) t.click();
  for(const id of h){const e=document.querySelector(id); if(e){e.style.setProperty('display','none','important'); e.classList.add('hidden');}} },HIDE);
  await page.waitForTimeout(400);}
  const left = await page.evaluate(h=>h.filter(id=>{const e=document.querySelector(id);
    return e && getComputedStyle(e).display!=='none';}), HIDE);
  if(left.length) console.log('  !! overlay còn:', left.join(',')); }
await clean();
for (const gfx of ['low','high']){
  await page.evaluate(g=>{ window.__yc.setGfx(g); window.__yc.setTime(0.33);
    window.__yc.setPlayerPos(0,0); window.__yc.setOrbit(0.35, 90, 0.7); }, gfx);
  await page.waitForTimeout(2000); await clean();
  const st = await page.evaluate(()=>{ const T=window.__yc.THREE, s=window.__yc.scene, c=window.__yc.camera;
    const grp = s.getObjectByName('terrainChunks');
    let visChunk=0, visMeshes=0, tot=0;
    grp.children.forEach(m=>{ tot++; if(m.visible) visMeshes++; });
    const box = new T.Box3();
    s.traverse(o=>{ if(o.isMesh && o.visible && o.name && o.name.startsWith('body')) box.setFromObject(o); });
    return { post:window.__yc.meoInfo()&&undefined, cam:[c.position.x|0,c.position.y|0,c.position.z|0],
      chunksTotal:tot, chunksVisible:visMeshes, render:window.__yc.rendererInfo(),
      fog:{c:'#'+s.fog.color.getHexString(), d:+s.fog.density.toFixed(5)},
      bodyBox: box.isEmpty()?null:box.min.toArray().map(v=>+v.toFixed(1)).concat(box.max.toArray().map(v=>+v.toFixed(1))) }; });
  console.log(gfx, JSON.stringify(st));
  await page.screenshot({ path:`tests/dx-${gfx}.png` });
}
console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
