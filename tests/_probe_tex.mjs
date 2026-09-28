import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio']});
const page=await (await b.newContext({viewport:{width:1000,height:600}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET,{waitUntil:'networkidle',timeout:45000});
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc,null,{timeout:70000});
await page.waitForTimeout(6000);
await page.click('#btn-pick-go');
await page.waitForTimeout(2000);

const rep = await page.evaluate(()=>{
  const seen = new Map();
  const S = window.__yc.scene;
  let mats=new Set(), meshes=0, matOwners=new Map();
  S.traverse(o=>{
    if(!o.isMesh && !o.isInstancedMesh) return;
    meshes++;
    const ms = o.material ? (Array.isArray(o.material)?o.material:[o.material]) : [];
    for (const m of ms){
      mats.add(m.uuid);
      matOwners.set(m.uuid, (matOwners.get(m.uuid)||0)+1);
      for (const k in m){
        const tx = m[k]; if (!tx || !tx.isTexture) continue;
        if (seen.has(tx.uuid)){ seen.get(tx.uuid).uses++; continue; }
        const img = tx.image||{};
        seen.set(tx.uuid, { slot:k, w:img.width||0, h:img.height||0,
          mip: tx.generateMipmaps!==false, aniso: tx.anisotropy||0,
          minFilter: tx.minFilter, magFilter: tx.magFilter,
          wrapS:tx.wrapS, src: (tx.isCanvasTexture?'canvas':'file'),
          uses:1, mipOwned:0, mipUsed:0 });
      }
    }
  });
  const list=[...seen.values()];
  const bytes = t => t.w*t.h*4*(t.mip?4/3:1);
  list.forEach(t=>{ t.MB=+(bytes(t)/1048576).toFixed(2);
    // có dùng chuỗi mip không? MipmapLinearFilter=1008, LinearMipmapNearest=1009,
    // NearestMipmapLinear=1010, NearestMipmapNearest=1011
    t.mipUsed = [1008,1009,1010,1011].includes(t.minFilter);
    t.mipOwned= t.mip; });
  list.sort((a,b)=>b.MB-a.MB);
  const SHARED = { textures: seen.size, materials: mats.size, meshes };
  return { ...SHARED,
    total: list.length, totalMB:+list.reduce((s,t)=>s+t.MB,0).toFixed(2),
    mipGenerated: list.filter(t=>t.mip).length,
    mipActuallyUsed: list.filter(t=>t.mipUsed).length,
    wastedMB: +(list.filter(t=>t.mip&&!t.mipUsed).reduce((s,t)=>s+t.MB,0)).toFixed(2),
    sharedTextures: list.filter(t=>t.uses>1).length,
    singleUse: list.filter(t=>t.uses===1).length,
    minFilterCounts: list.reduce((a,t)=>{ a[t.minFilter]=(a[t.minFilter]||0)+1; return a; },{}),
    big: list.slice(0,8), bySizeKeys:[...new Set(list.map(t=>t.w+'x'+t.h))] };
});
const NAME={1006:'LinearFilter',1008:'MipmapLinear',1009:'LinearMipmapNearest',1010:'NearestMipmapLinear',1011:'NearestMipmapNearest',1003:'NearestFilter'};
console.log(`scene: ${rep.meshes} mesh · ${rep.materials} vật liệu · ${rep.total} texture · ${rep.totalMB} MB`);
console.log(`sinh ra mip: ${rep.mipGenerated} · THỰC SỰ DÙNG: ${rep.mipActuallyUsed} → lãng phí ${rep.wastedMB} MB`);
console.log('minFilter:', Object.entries(rep.minFilterCounts).map(([k,v])=>`${NAME[k]||k}=${v}`).join(' · '));
console.log(`texture dùng chung (>1 mesh): ${rep.sharedTextures} · chỉ dùng 1 chỗ: ${rep.singleUse}`);
console.log('kích thước có trong scene:', rep.bySizeKeys.join(', '));
console.log('\n8 texture nặng nhất:');
for (const t of rep.big) console.log(`  ${String(t.MB).padStart(6)}MB ${String(t.w+'x'+t.h).padStart(9)} uses=${String(t.uses).padStart(3)} mipGen=${t.mip} mipUse=${t.mipUsed} ${NAME[t.minFilter]||t.minFilter} ${t.slot}`);





console.log('ERRORS:', errs.length, errs.slice(0,3));
await b.close();
