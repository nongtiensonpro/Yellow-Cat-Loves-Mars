import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const CAND=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser'];
const EXE=CAND.find(p=>{try{return existsSync(p)}catch{return false}});
// TARGET có mặc định + báo rõ khi chưa bật server
const TARGET_URL = process.env.TARGET || 'http://127.0.0.1:4173/';
try { const r = await fetch(TARGET_URL,{signal:AbortSignal.timeout(4000)}); if(!r.ok) throw new Error('HTTP '+r.status); }
catch(e){ console.error(`✗ Không gọi được ${TARGET_URL} (${e.message})`);
  console.error('  Khởi động server trước:  node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173'); process.exit(2); }
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

for (const v of ['bike','rover']){
  await page.evaluate(x=>window.__yc.setVehicle(x), v);
  await page.waitForTimeout(1800);
  const st = await page.evaluate(()=>{
    const P = window.__yc.player;
    const direct=[], nested=[]; const named=[]; let depthMax=0;
    for (const c of P.children){
      if (c.isMesh) direct.push(c);
      else if (c.isGroup || c.isObject3D){
        let n=0, hasMesh=false;
        c.traverse(o=>{ if(o.isMesh){n++; hasMesh=true;} });
        if (hasMesh) nested.push({ name:c.name||'(không tên)', type:c.type, meshes:n,
                                  kids:c.children.length });
        named.push(c.name||'(không tên)');
      }
    }
    P.traverse(o=>{ let d=0,q=o; while(q.parent&&q.parent!==P){d++;q=q.parent;} if(d>depthMax)depthMax=d; });
    // mesh KHÔNG có tên và là con trực tiếp
    const unnamedDirect = direct.filter(m=>!m.name).length;
    // nhóm nào được tham chiếu bằng getObjectByName
    const byName = {}; P.children.forEach(c=>{ if(c.name) byName[c.name]=1; });
    return { directMeshes: direct.length, unnamedDirect, groups:nested.length,
      groupList:nested.slice(0,30), depthMax, names:Object.keys(byName) };
  });
  console.log(`\n═══ ${v} ═══`);
  console.log(`  mesh con trực tiếp: ${st.directMeshes} (không tên: ${st.unnamedDirect}) · nhóm con: ${st.groups} · sâu nhất: ${st.depthMax}`);
  console.log('  nhóm (tên, số mesh):');
  for (const g of st.groupList.slice(0,22)) console.log(`    ${g.name.padEnd(22)} ${g.meshes} mesh, ${g.kids} con`);
}
console.log('ERRORS:', errs.length, errs.slice(0,2));
await b.close();
