import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try { const r = await fetch(TARGET_URL,{signal:AbortSignal.timeout(4000)}); if(!r.ok) throw new Error('HTTP '+r.status); }
catch(e){ console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`); process.exit(2); }
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(TARGET_URL,{waitUntil:'networkidle',timeout:45000});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(6000);
await page.click('#btn-pick-go');
await page.waitForTimeout(1800);

// so matrix TRONG KHUNG XE (không phải world): nếu xe chạy thì world đổi hết,
// nhưng bộ phận gắn cứng thì không đổi tương đối với xe.
await page.evaluate(()=>{
  const THREE = window.__yc.THREE;
  window.__meta = ()=>{ const P=window.__yc.player, out=[];
    P.traverse(o=>{ if(o.isMesh) out.push({ uuid:o.uuid, mat:o.material?.uuid||'',
      tris: Math.floor((o.geometry?.index?o.geometry.index.count:o.geometry?.attributes?.position?.count||0)/3) }); });
    return out; };
  window.__capture = ()=>{
    const P = window.__yc.player, inv = new THREE.Matrix4().copy(P.matrixWorld).invert();
    const cur = {};
    P.traverse(o=>{ if(!o.isMesh) return;
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      cur[o.uuid] = m.elements.map(v=>Math.round(v*1e4)).join(',');
    });
    if (!window.__base) window.__base = cur;
    else if (!window.__moved) window.__moved = new Set();
    for (const k in cur){
      if (window.__base[k] !== undefined && cur[k] !== window.__base[k]) window.__moved.add(k);
    }
    return Object.keys(cur).length;
  };
  window.__reset = ()=>{ window.__base=null; window.__moved=new Set(); };
  window.__report = ()=>{ const meta=window.__meta(), moved=window.__moved||new Set();
    const still=meta.filter(m=>!moved.has(m.uuid));
    const mats=new Map();
    for(const m of still) mats.set(m.mat, (mats.get(m.mat)||0)+1);
    const allMats=new Map();
    for(const m of meta) allMats.set(m.mat, (allMats.get(m.mat)||0)+1);
    return { total:meta.length, still:still.length, moved:moved.size,
      matGroups:mats.size, allMatGroups:allMats.size,
      groupSizes:[...mats.values()].sort((a,b)=>b-a).slice(0,12),
      staticTris: still.reduce((s,m)=>s+m.tris,0) }; };
});

const states = [
  ['nghỉ',        async()=>{ await page.waitForTimeout(900); }],
  ['tăng tốc',    async()=>{ await page.keyboard.down('w'); await page.waitForTimeout(2400); }],
  ['rẽ trái',    async()=>{ await page.keyboard.down('a'); await page.waitForTimeout(2000); await page.keyboard.up('a'); }],
  ['phanh',       async()=>{ await page.keyboard.down('s'); await page.waitForTimeout(1500); }],
  ['lùi',         async()=>{ await page.waitForTimeout(1800); }],
  ['boost rẽ phải',async()=>{ await page.keyboard.up('s'); await page.keyboard.down('d'); await page.keyboard.down('Shift');
                             await page.waitForTimeout(1800); await page.keyboard.up('Shift'); await page.keyboard.up('d'); }],
  ['chạy tiếp',   async()=>{ await page.waitForTimeout(2000); await page.keyboard.up('w'); }],
];
for (const v of ['bike','moto','rover']){
  await page.evaluate(x=>window.__yc.setVehicle(x), v);
  await page.waitForTimeout(2000);
  await page.evaluate(()=>window.__reset());
  await page.evaluate(()=>window.__capture());
  for (const [nm, fn] of states){
    await fn(); await page.evaluate(()=>window.__capture());
  }
  const r = await page.evaluate(()=>window.__report());
  console.log(`\n═══ ${v} ═══`);
  console.log(`  mesh ${r.total} · ĐỨNG YÊN trong khung xe: ${r.still} · chuyển động: ${r.moved}`);
  console.log(`  gộp theo vật liệu: ${r.matGroups} nhóm (toàn xe có ${r.allMatGroups} vật liệu)`);
  console.log(`  draw call xe: ${r.total} → ${r.still - r.matGroups + r.moved}  (giảm ${r.still - r.matGroups})`);
  console.log(`  nhóm tĩnh lớn nhất: ${r.groupSizes.join(', ')}`);
}
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
