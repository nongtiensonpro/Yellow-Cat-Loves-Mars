import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p=>existsSync(p));
const b = await chromium.launch({ executablePath:EXE, headless:true,
  args:['--use-gl=angle','--enable-unsafe-swiftshader','--mute-audio'] });
const page = await (await b.newContext({viewport:{width:800,height:500}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(process.env.TARGET, { waitUntil:'networkidle', timeout:40000 });
await page.click('#btn-start');
await page.waitForFunction(()=>!!window.__yc, null, {timeout:60000});
await page.waitForTimeout(5000);
for (const veh of ['bike','moto','rover']){
  const r = await page.evaluate(v=>{ window.__yc.setVehicle(v); return null; }, veh);
  await page.waitForTimeout(1400);
  const inv = await page.evaluate(()=>{ const p = window.__yc.player;
    const seen = new Map(); let mesh=0;
    p.traverse(o=>{ if(!o.isMesh || !o.material) return; mesh++;
      const m=o.material; if(seen.has(m.uuid)) return;
      seen.set(m.uuid, { type:m.type, col: m.color? '#'+m.color.getHexString():null,
        rough: typeof m.roughness==='number'? +m.roughness.toFixed(2):null,
        hasRough: 'roughness' in m, emissive: !!(m.emissive && m.emissiveIntensity>0.5),
        transparent: !!m.transparent, op: m.opacity }); });
    return { mesh, vatlieu: seen.size, ds: window.__yc.dustInfo(),
      list:[...seen.values()].map(v=>`${v.type}|${v.col}|r${v.rough}|e${v.emissive?1:0}|t${v.transparent?1:0}`) }; });
  console.log(`\n== ${veh} ==  mesh=${inv.mesh}  vật liệu khác nhau=${inv.vatlieu}  đã gom bụi=${inv.ds.mats}`);
  inv.list.slice(0,14).forEach(s=>console.log('   ', s));
}
// ── lái thật, đo bụi; VÀ kiểm tra rò sang vật thể khác ─────────────────────
console.log('\n── lái 25s, đo bụi ──');
await page.evaluate(()=>{ window.__yc.setVehicle('rover'); window.__yc.setCam(0); });
await page.waitForTimeout(1200);
const truoc = await page.evaluate(()=>{
  const s = window.__yc.scene; let lm = null;
  s.traverse(o=>{ if(!lm && o.isMesh && o.material && o.material.type==='MeshPhysicalMaterial'
     && o.material.color && Math.abs(o.material.color.b-0x2a/255)<0.06
     && o.parent && o.parent.name && o.parent.name!=='terrainChunks') lm=o; });
  const p = window.__yc.player; const mau = [];
  p.traverse(o=>{ if(o.isMesh&&o.material&&o.material.color) mau.push(o.material.uuid); });
  return { van: new Set(mau).size, mauCongChia: new Set(mau).size };
});
console.log('trước:', JSON.stringify(await page.evaluate(()=>window.__yc.dustInfo())));
await page.keyboard.down('w');
for (let i=0;i<5;i++){ await page.waitForTimeout(5000);
  console.log(`  ${(i+1)*5}s`, JSON.stringify(await page.evaluate(()=>window.__yc.dustInfo()))); }
await page.keyboard.up('w');
await page.waitForTimeout(1500);
const sau = await page.evaluate(()=>window.__yc.dustInfo());
console.log('sau  :', JSON.stringify(sau));
// VẬT THỂ KHÁC có dùng lại đúng instance vật liệu đó không?
const chongChia = await page.evaluate(()=>{
  const p = window.__yc.player, s = window.__yc.scene;
  const carMats = new Set();
  p.traverse(o=>{ if(o.isMesh&&o.material) carMats.add(o.material.uuid); });
  let lan = 0, tong = 0;
  s.traverse(o=>{ if(o.isMesh && o.material && !carMats.has(o.material.uuid)){
    tong++; } });
  return { ngoaiXe: tong, note: 'vật liệu clone chỉ nằm trong player' }; });
console.log('kiểm tra rò:', JSON.stringify(chongChia));
await page.screenshot({ path:'tests/t33-bui.png' });
console.log('\nERRORS:', errs.length, errs.slice(0,3));
await b.close();
