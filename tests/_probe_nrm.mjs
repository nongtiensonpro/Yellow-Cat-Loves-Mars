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
const page = await (await b.newContext({viewport:{width:900,height:520}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(4500);
const out = await page.evaluate(()=>{
  const s = window.__yc.scene;
  const grp = s.getObjectByName('terrainChunks');
  // chunk LOD0 ở giữa bản đồ
  const dist = {};
  for (const c of grp.children){ const p=c.geometry.getAttribute('position');
    dist[p.count]=(dist[p.count]||0)+1; }
  const counts = Object.keys(dist);
  const lod0n = +counts.find(c=>Math.sqrt(+c)===21) || +counts[0];
  let m = null;
  for (const c of grp.children){ if (c.geometry.getAttribute('position').count===lod0n) m=c; }
  if(!m) return {err:'khong co chunk', dist};
  const P=m.geometry.getAttribute('position'), N=m.geometry.getAttribute('normal'), C=m.geometry.getAttribute('color');
  const HF = window.__yc.HF ? window.__yc.HF() : null;
  const samples=[];
  for (const vi of [0, 110, 220, 330, 440]){
    const x=P.array[vi*3], y=P.array[vi*3+1], z=P.array[vi*3+2];
    const nx=N.array[vi*3], ny=N.array[vi*3+1], nz=N.array[vi*3+2];
    let cmp='n/a';
    if (HF){ const T=window.__yc.THREE; const n2=HF.normalAt(x,z,new T.Vector3());
      cmp=[n2.x.toFixed(3),n2.y.toFixed(3),n2.z.toFixed(3)].join(','); }
    samples.push({ vi, x:+x.toFixed(1), y:+y.toFixed(2), z:+z.toFixed(1),
      n:[+nx.toFixed(3),+ny.toFixed(3),+nz.toFixed(3)], len:+Math.hypot(nx,ny,nz).toFixed(4),
      col:[+C.array[vi*3].toFixed(3),+C.array[vi*3+1].toFixed(3),+C.array[vi*3+2].toFixed(3)],
      hfNormal: cmp });
  }
  // phân bố độ sáng màu vertex toàn bản đồ
  let lum=[], negN=0, zeroN=0;
  for (const c of grp.children){ if(c.geometry.getAttribute('position').count!==lod0n) continue;
    const N2=c.geometry.getAttribute('normal'), C2=c.geometry.getAttribute('color');
    for(let i=0;i<N2.count;i++){ const ny=N2.array[i*3+1];
      if (ny<0) negN++; if (Math.abs(ny)<0.01) zeroN++; }
    for(let i=0;i<C2.count;i++) lum.push(C2.array[i*3]*0.2126+C2.array[i*3+1]*0.7152+C2.array[i*3+2]*0.0722); }
  lum.sort((a,b)=>a-b);
  return { vertexCountPerMesh: dist, lod0n, matName: m.material.name||'?', matType: m.material.type,
    vertexColors: m.material.vertexColors, hasMap: !!m.material.map,
    mapCS: m.material.map ? m.material.map.colorSpace : null,
    samples, negN, zeroN, n: lum.length,
    lumP5:+lum[Math.floor(lum.length*0.05)].toFixed(3),
    lumMed:+lum[Math.floor(lum.length*0.5)].toFixed(3),
    lumP95:+lum[Math.floor(lum.length*0.95)].toFixed(3) };
});
console.log(JSON.stringify(out, null, 1));
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
