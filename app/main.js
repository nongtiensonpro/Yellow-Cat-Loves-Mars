import * as THREE from 'three';
import { decodePatches, PATCH_N, PATCH_ORDER, PATCH_IDX, PATCH_RELIEF } from './mola-patches.js';

// ---------- Config ----------
const BIOMES = [
  { id:'arcadia', name:'Arcadia Planitia', color:'#c47a3a', h:10, pos:{x:0,z:0}, icon:'🏜️', desc:'Đồng bằng khởi đầu — bình minh cam hồng vô tận. Nơi Mèo Vàng tập đạp xe.' },
  { id:'valles', name:'Valles Marineris', color:'#8b3a18', h:55, pos:{x:420,z:-180}, icon:'🏔️', desc:'Hẻm núi lớn nhất hệ mặt trời — sâu 7km, dài 4000km. Thử thách cho xe máy.' },
  { id:'olympus', name:'Olympus Mons', color:'#a85a2a', h:95, pos:{x:-380,z:420}, icon:'🌋', desc:'Núi lửa cao 22km — cao gấp 3 Everest. Càng lên cao, trời càng sẫm.' },
  { id:'polar', name:'Planum Australe', color:'#d8c8b8', h:22, pos:{x:-520,z:-520}, icon:'❄️', desc:'Chỏm băng CO2 cực Nam — trắng cam kỳ ảo, băng phản chiếu.' },
  { id:'storm', name:'Dust Storm Zone', color:'#7a3d1a', h:8, pos:{x:520,z:480}, icon:'🌪️', desc:'Vùng bão bụi — tầm nhìn mờ ảo, ánh sáng khuếch tán điện ảnh.' },
];

const VEHICLES = {
  // ride = chiều cao từ mặt đất lên TÂM group (bánh xe chạm đất khi y = ground + ride)
  // wheels = các cục bộ [dx,dz] của điểm tiếp xúc, dùng để nghiêng & chống chìm
  bike:  { name:'Xe đạp', icon:'🚲', speed:4.2, turn:1.9, bob:0.9, ride:-0.07,
           wheels:[[-0.92,0],[-0.92,0],[0.97,0],[0.97,0]], maxSlope:0.85 },
  moto:  { name:'Xe máy', icon:'🏍️', speed:10.5, turn:2.6, bob:0.6, ride:-0.085,
           wheels:[[-1.07,0],[-1.07,0],[1.07,0],[1.07,0]], maxSlope:1.25 },
  rover: { name:'Rover', icon:'🚙', speed:7.0, turn:2.0, bob:0.35, ride:0.38,
           wheels:[[-1.0,0.68],[-1.0,-0.68],[1.0,0.68],[1.0,-0.68]], maxSlope:1.9 },
};


// ---------- Phase 3: POI & Discovery Cards ----------
const POIS = [
  { id:'dune_field', biome:'arcadia', icon:'〰️', pos:{x:110,z:75}, title:'Cánh đồng cồn cát Arcadia', fact:'Cồn cát Sao Hỏa cao tới 40m, di chuyển chậm theo gió loãng nhưng vẫn để lại vệt như trên Trái Đất.', cat:'Mèo lăn tròn trên cồn cát, để lại vệt chân xinh như chữ ký!', earth:'Nếu ở Trái Đất, đây là sa mạc Sahara thu nhỏ — nhưng gió nhẹ hơn 100 lần.' },
  { id:'frost_hollow', biome:'arcadia', icon:'❄️', pos:{x:-160,z:90}, title:'Hõm sương giá', fact:'Sương CO2 đóng băng vào ban đêm, tan vào bình minh — nhiệt độ chênh tới 80°C trong một ngày Sao Hỏa.', cat:'Mèo hít hà sương mai, râu ướt lấp lánh như kim cương!', earth:'Như sương muối ở Đà Lạt, nhưng lạnh gấp 4 lần.' },
  { id:'candor_overlook', biome:'valles', icon:'🏔️', pos:{x:420,z:-180}, title:'Đài quan sát Candor Chasma', fact:'Valles Marineris dài 4000km, sâu 7km — đủ chứa cả dãy Grand Canyon bên trong.', cat:'Mèo đứng mép vực, gió thổi khăn bay — cảm giác như đang bay!', earth:'Grand Canyon dài 446km, sâu 1.8km — chỉ bằng 1/10 Valles.' },
  { id:'melas_labyrinth', biome:'valles', icon:'🌀', pos:{x:520,z:-80}, title:'Mê cung Melas', fact:'Đáy Valles có mạng lưới hẻm nhánh như mê cung, hình thành bởi nước ngầm cổ đại.', cat:'Mèo chạy vòng quanh, tiếng vọng “meo” vang khắp hẻm!', earth:'Như hang Sơn Đoòng nhân lên 1000 lần.' },
  { id:'caldera_rim', biome:'olympus', icon:'🌋', pos:{x:-380,z:420}, title:'Vành Caldera Olympus', fact:'Miệng núi lửa Olympus rộng 80km, sâu 3km — có thể chứa cả Hà Nội bên trong.', cat:'Mèo nhìn xuống miệng núi, thấy bóng mình nhỏ xíu như hạt cát.', earth:'Everest cao 8.8km — Olympus cao 22km, chân núi rộng bằng nước Pháp.' },
  { id:'lava_tube', biome:'olympus', icon:'🕳️', pos:{x:-260,z:340}, title:'Ống dung nham', fact:'Ống dung nham Sao Hỏa có thể rộng hàng km — nơi trú ẩn lý tưởng cho căn cứ tương lai.', cat:'Mèo chui vào ống, vang tiếng “ộp ộp” như hang mèo khổng lồ.', earth:'Ống dung nham ở Iceland rộng vài chục mét — ở đây rộng gấp 50 lần.' },
  { id:'ice_cliff', biome:'polar', icon:'🧊', pos:{x:-520,z:-520}, title:'Vách băng cực Nam', fact:'Chỏm băng cực Nam dày 3km, gồm băng nước và CO2 — mùa đông phủ thêm lớp băng khô 1m.', cat:'Mèo trượt băng, đuôi quét vệt sáng lấp lánh!', earth:'Như Nam Cực, nhưng băng CO2 thay vì chỉ băng nước.' },
  { id:'polar_dune', biome:'polar', icon:'❄️', pos:{x:-420,z:-620}, title:'Cồn cát băng', fact:'Gió cực tạo cồn cát băng đen xen trắng — kỳ quan chỉ có trên Sao Hỏa.', cat:'Mèo nhảy trên cồn băng, mỗi bước kêu “rộp rộp” vui tai.', earth:'Không có tương tự trên Trái Đất — chỉ Sao Hỏa mới có!' },
  { id:'dust_devil_alley', biome:'storm', icon:'🌪️', pos:{x:520,z:480}, title:'Hẻm lốc bụi', fact:'Lốc bụi Sao Hỏa cao tới 8km, để lại vệt xoắn ốc trên cát — Curiosity từng ghi lại.', cat:'Mèo đuổi theo lốc bụi, xoay tít như chong chóng!', earth:'Lốc bụi Trái Đất cao vài trăm mét — ở đây cao gấp 20 lần.' },
  { id:'storm_eye', biome:'storm', icon:'👁️', pos:{x:620,z:580}, title:'Mắt bão bụi', fact:'Bão bụi toàn cầu có thể bao phủ cả hành tinh trong vài tuần — bầu trời chuyển nâu đỏ.', cat:'Mèo nheo mắt trong bão, râu rung như anten dò gió.', earth:'Như bão cát Sahara, nhưng bao phủ cả hành tinh.' },
  { id:'crater_lake', biome:'arcadia', icon:'💧', pos:{x:60,z:-190}, title:'Hồ miệng hố cổ', fact:'Hố va chạm 30km từng là hồ nước — Perseverance đang khám phá Jezero tương tự.', cat:'Mèo soi bóng trong hồ cạn, thấy mình là phi hành gia!', earth:'Như hồ Hoàn Kiếm — nhưng từng chứa nước mặn cổ đại.' },
  { id:'ridge_line', biome:'arcadia', icon:'⛰️', pos:{x:-40,z:220}, title:'Sống núi gió', fact:'Sống núi do gió bào mòn hàng tỷ năm — như vân tay của hành tinh.', cat:'Mèo đi trên sống núi, cảm giác như đi trên lưng rồng đỏ.', earth:'Như sống núi ở Ninh Thuận, nhưng già hơn 3 tỷ năm.' },
];
const DISCOVERED_KEY = 'yc_mars_v1_discovered';
const GALLERY_DB = 'yc_mars_gallery';
const GALLERY_STORE = 'photos';

const STORAGE_KEY = 'yc_mars_v1';

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const minimap = document.getElementById('minimap');
const bigmap = document.getElementById('bigmap');
const hudBiome = document.getElementById('hud-biome');
const hudCoord = document.getElementById('hud-coord');
const hudPaws = document.getElementById('hud-paws');
const hudSpeed = document.getElementById('hud-speed');
const hudVehicleName = document.getElementById('hud-vehicle-name');
const hudHint = document.getElementById('hud-hint');
const loadBar = document.getElementById('load-bar');
const loadPct = document.getElementById('load-pct');
const loadText = document.getElementById('load-text');
const loadingEl = document.getElementById('loading');
const overlayLanding = document.getElementById('overlay-landing');
const overlayVehicle = document.getElementById('overlay-vehicle');
const overlayMap = document.getElementById('overlay-map');
const toast = document.getElementById('toast');
const sheetJournal = document.getElementById('sheet-journal');
const sheetGallery = document.getElementById('sheet-gallery');
const overlayDiscovery = document.getElementById('overlay-discovery');
const lightboxEl = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const shootingStarEl = document.getElementById('shooting-star');

// ---------- State ----------
let vehicleType = localStorage.getItem(STORAGE_KEY+'_vehicle') || 'rover';
let collected = JSON.parse(localStorage.getItem(STORAGE_KEY+'_paws')||'[]');
let distance = parseFloat(localStorage.getItem(STORAGE_KEY+'_dist')||'0');
let visitedBiomes = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY+'_biomes')||'[]'));
let photoMode = false;
let timeOfDay = 0; // 0 dawn, 0.5 noon, 1 dusk
let targetBiomeIdx = 0;
let freeCam = false;
let discovered = new Set(JSON.parse(localStorage.getItem(DISCOVERED_KEY) || '[]'));
let playTimeSec = parseInt(localStorage.getItem(STORAGE_KEY+'_playtime')||'0',10);
let galleryCache = []; // filled from IndexedDB
let audioCtx = null, audioMaster = null, audioNodes = null;
let audioEnabled = localStorage.getItem(STORAGE_KEY+'_audio') === '1';
let audioVolume = parseInt(localStorage.getItem(STORAGE_KEY+'_vol')||'42',10);
let lastBiomeId = null;
let poiCooldown = 0;

let input = { f:0, b:0, l:0, r:0, boost:false, yaw:0 };
let pointerLocked = false;
let joyActive=false, joyVec={x:0,y:0};

// ---------- Three setup ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// ════════════════════════════════════════════════════════════════════════════
// GFX PRESET — chất lượng đồ họa theo thiết bị (Task 0.4 / art-bible.md §7)
// Mỗi preset là một bộ thông số tường minh, lưu cục bộ, đổi được lúc chơi.
// Ngưỡng: Desktop 60 FPS @1080p High · Mobile 30–45 FPS, renderScale 0.7–0.9.
// ════════════════════════════════════════════════════════════════════════════
const GFX_PRESETS = {
  low:       { label:'Thấp',    renderScale:0.70, shadow:0,    fogMul:1.60, dust:0.35, stars:false },
  medium:    { label:'Vừa',     renderScale:0.90, shadow:1024, fogMul:1.15, dust:0.70, stars:true  },
  high:      { label:'Cao',     renderScale:1.00, shadow:2048, fogMul:1.00, dust:1.00, stars:true  },
  cinematic: { label:'Điện ảnh',renderScale:1.00, shadow:4096, fogMul:0.80, dust:1.60, stars:true  },
};
let gfxDustMul = 1;          // hệ số bụi theo preset (frame loop nhân vào opacity)
let gfxShadowOn = true;      // trạng thái shadow thực tế sau khi áp preset
let gfxName = (() => {
  const saved = localStorage.getItem(STORAGE_KEY+'_gfx');
  if (saved && GFX_PRESETS[saved]) return saved;
  // Tự chọn theo thiết bị: màn nhỏ hoặc thiết bị yếu -> thấp.
  const small = Math.min(innerWidth, innerHeight) < 620;
  const cores = navigator.hardwareConcurrency || 4;
  return (small || cores <= 4) ? 'low' : 'high';
})();

// Áp dụng preset. Gọi lại an toàn nhiều lần (đổi preset lúc chạy).
function applyGraphicsPreset(name, save){
  if (!GFX_PRESETS[name]) return gfxName;
  gfxName = name;
  const g = GFX_PRESETS[name];
  const target = g.renderScale * Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(target);
  renderer.setSize(innerWidth, innerHeight, false);
  // Shadow: 0 = tắt hoàn toàn (tiết kiệm lớn nhất trên mobile)
  const wantShadow = g.shadow > 0;
  const wasShadow = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = wantShadow;
  if (wantShadow) {
    sun.shadow.mapSize.set(g.shadow, g.shadow);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  sun.castShadow = wantShadow;
  gfxShadowOn = wantShadow;
  // ĐỔI shadowMap.enabled lúc chạy BẮT BUỘC phải yêu cầu vật liệu biên dịch lại,
  // nếu không shader vẫn giả định có shadow → hiển thị sai (thiếu bóng/đủ bóng
  // theo trạng thái cũ). Đây là bẫy kinh điển của Three.js.
  if (wasShadow !== wantShadow) {
    scene.traverse((o) => {
      const m = o.material;
      if (!m) return;
      if (Array.isArray(m)) m.forEach((x) => { x.needsUpdate = true; });
      else m.needsUpdate = true;
    });
  }
  scene.fog.density = FOG_BASE * g.fogMul;
  // Bụi và sao do frame loop ghi opacity mỗi khung hình, nên preset chỉ đặt
  // HỆ SỐ nhân (dustMul/starMul) — không ghi thẳng opacity (sẽ bị ghi đè).
  gfxDustMul = g.dust;
  dustPoints.visible = g.dust > 0;
  stars.visible = g.stars;
  document.documentElement.dataset.gfx = name;
  if (save !== false) { try { localStorage.setItem(STORAGE_KEY+'_gfx', name); } catch {} }
  const sel = document.getElementById('gfx-select');
  if (sel && sel.value !== name) sel.value = name;
  return gfxName;
}


const scene = new THREE.Scene();
// Fog phải HÒA vào trời ở chân trời, nếu không cạnh lưới terrain 1400m sẽ lộ
// thành một đường ngang tối — đúng lỗi review chỉ ra. Màu fog gần màu trời
// chân trời (#ffb07a) nhưng tối hơn một chút để giữ chiều sâu.
// Mật độ 0.0025 → ở 700m (bán kính bản đồ) đã ~95% mờ, ở 100m chỉ ~6%.
const FOG_COLOR = 0xc4713f;
const FOG_BASE = 0.0025;
scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_BASE);

const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.1, 3000);
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

const ambient = new THREE.HemisphereLight(0xffd8b0, 0x1a0f0a, 0.85);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
sun.position.set(300, 400, 100);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 1400;
sun.shadow.camera.left=-600; sun.shadow.camera.right=600; sun.shadow.camera.top=600; sun.shadow.camera.bottom=-600;
sun.shadow.bias = -0.0005;
scene.add(sun);
const SUN_BASE_I=1.6, AMB_BASE_I=0.85;

// Sky dome
const skyGeo = new THREE.SphereGeometry(2000, 32, 22);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { top:{value:new THREE.Color(0x1a0f0a)}, mid:{value:new THREE.Color(0xff7a3d)}, horizon:{value:new THREE.Color(0xffb07a)}, t:{value:0} },
  vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    varying vec3 vPos;
    uniform vec3 top, mid, horizon;
    uniform float t;
    void main(){
      float h = normalize(vPos).y;
      float a = smoothstep(-0.1, 0.18, h);
      float b = smoothstep(0.15, 0.55, h);
      vec3 col = mix(horizon, mid, a);
      col = mix(col, top, b);
      // subtle sun glow
      float sun = pow(max(0.0, dot(normalize(vPos), normalize(vec3(0.6,0.5,0.2)))), 64.0) * 0.35;
      col += vec3(1.0,0.9,0.7)*sun;
      // stars fade in at night
      float night = smoothstep(0.2, -0.05, h) * smoothstep(0.0,0.6, 1.0 - t);
      // cheap stars via fract
      float stars = fract(sin(dot(vPos.xz*0.08, vec2(12.9,78.2)))*43758.5);
      col += vec3(1.0)* pow(stars, 22.0) * night * 0.9;
      gl_FragColor = vec4(col,1.0);
    }
  `
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Stars points
const starGeo = new THREE.BufferGeometry();
const starCount=2200;
const starPos=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  const r=1850+Math.random()*120;
  const theta=Math.random()*Math.PI*2;
  const phi=Math.acos(2*Math.random()-1);
  starPos[i*3]= r*Math.sin(phi)*Math.cos(theta);
  starPos[i*3+1]= r*Math.cos(phi);
  starPos[i*3+2]= r*Math.sin(phi)*Math.sin(theta);
  if(starPos[i*3+1]<120) starPos[i*3+1]=120+Math.random()*400;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
const starMat=new THREE.PointsMaterial({ color:0xffffff, size:2.8, sizeAttenuation:false, transparent:true, opacity:0.0 });
const stars=new THREE.Points(starGeo, starMat);
scene.add(stars);


// ---------- Procedural height ----------
function hash2(x,y){ return Math.abs(Math.sin(x*12.9898 + y*78.233)*43758.5453)%1; }
function smoothNoise(x,y){
  const xi=Math.floor(x), yi=Math.floor(y);
  const xf=x-xi, yf=y-yi;
  const u = xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi), b=hash2(xi+1,yi), c=hash2(xi,yi+1), d=hash2(xi+1,yi+1);
  const ab = a*(1-u)+b*u, cd=c*(1-u)+d*u;
  return ab*(1-v)+cd*v;
}
function fbm(x,y, oct=5){
  let s=0, amp=1, freq=1, max=0;
  for(let i=0;i<oct;i++){ s+= smoothNoise(x*freq, y*freq)*amp; max+=amp; amp*=0.5; freq*=2.0; }
  return s/max;
}

function biomeAt(x,z){
  // distance to each biome center
  let best=BIOMES[0], bestD=Infinity;
  for(const b of BIOMES){
    const d=Math.hypot(x-b.pos.x, z-b.pos.z);
    if(d<bestD){bestD=d; best=b;}
  }
  return { biome:best, dist:bestD };
}

// ---- REAL MOLA patches (NASA PIA02031, public domain) ----
const MOLA_PLANES = decodePatches();
const MOLA_R = 320;              // world radius a biome patch covers
function patchHeightAt(bi, x, z){
  const b = BIOMES[bi];
  const u = (x - b.pos.x)/(MOLA_R*2) + 0.5;
  const v = (z - b.pos.z)/(MOLA_R*2) + 0.5;
  if(u<0||u>1||v<0||v>1) return null;           // outside real-data window
  const N = PATCH_N;
  const fx = u*(N-1), fy = v*(N-1);
  const i0 = Math.floor(fx), j0 = Math.floor(fy);
  const i1 = Math.min(N-1,i0+1), j1 = Math.min(N-1,j0+1);
  const tx = fx-i0, ty = fy-j0;
  const P = MOLA_PLANES[bi];
  const a = P[j0*N+i0], b2 = P[j0*N+i1], c = P[j1*N+i0], d2 = P[j1*N+i1];
  const e = (a*(1-tx)+b2*tx)*(1-ty) + (c*(1-tx)+d2*tx)*ty;
  return (e-0.42) * PATCH_RELIEF[PATCH_ORDER[bi]];   // shape from real elevation, game-scaled
}

function heightAt(x,z){
  const binfo = biomeAt(x,z);
  const b=binfo.biome;
  const d=binfo.dist;
  // base elevation per biome with smooth falloff 700
  const influence = Math.max(0, 1 - d/700);
  const base = b.h * Math.pow(influence, 1.2);

  // REAL MOLA shape blended across neighboring biome windows
  let mola = 0, mw = 0;
  for(let bi2=0; bi2<BIOMES.length; bi2++){
    const bb=BIOMES[bi2];
    const dd=Math.hypot(x-bb.pos.x, z-bb.pos.z);
    if(dd > MOLA_R*Math.SQRT2) continue;
    const w = Math.max(0, 1 - dd/(MOLA_R*1.25));
    if(w<=0) continue;
    const ph = patchHeightAt(bi2, x, z);
    if(ph===null) continue;
    mola += ph*w; mw += w;
  }
  const molaH = mw>0 ? mola/mw : 0;

  // detail noise
  const n1 = fbm(x*0.004, z*0.004, 5)*(mw>0?0.35:1.0);
  const n2 = fbm(x*0.018+100, z*0.018, 3);
  const crater = Math.pow(Math.max(0, 1 - Math.hypot((x%180)-90, (z%180)-90)/38) , 2.2) * -10 * (hash2(Math.floor(x/180), Math.floor(z/180))>0.72?1:0);

  // Valles trench, Olympus cone
  let special=0;
  if(b.id==='valles'){
    const vd = Math.abs((x+z*0.2)-320);
    special -= Math.max(0, 80 - vd*0.9) * influence;
  }
  if(b.id==='olympus'){
    const od = Math.hypot(x+380, z-420);
    special += Math.max(0, 90 - od*0.28) * 1.2;
  }

  return base + molaH + n1*18 + n2*4 + crater + special;
}

// ---------- Terrain mesh (chunked grid 160x160) ----------
const TERRAIN_SIZE=1400, SEG=160;
const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
terrainGeo.rotateX(-Math.PI/2);
const posAttr = terrainGeo.attributes.position;

// ══════ HEIGHTFIELD: bề mặt THẬT của mesh, là nguồn sự thật cho physics ══════
// Mesh là các tam giác phẳng, nên hàm giải tích heightAt() SAI ở giữa ô — đó là
// lý do phương tiện chìm/xuyên qua sườn. Ở đây ta đọc chiều cao thật của từng
// vertex rồi nội suy đúng theo 2 tam giác mà GPU vẽ.
const HF = {
  n: SEG+1,               // số vertex mỗi trục
  min: -TERRAIN_SIZE/2,
  cell: TERRAIN_SIZE/SEG,
  data: null,
  build(posAttr){
    // Dựng lưới chỉ số từ toạ độ XZ THẬT của từng vertex. Không giả định thứ tự
    // index của PlaneGeometry (trục j chạy -Z) — tra cứu bảng tra theo ô.
    const n=this.n, cell=this.cell, min=this.min;
    const lut=new Int32Array(n*n).fill(-1);
    for(let k=0;k<posAttr.count;k++){
      const i=Math.round((posAttr.getX(k)-min)/cell);
      const j=Math.round((posAttr.getZ(k)-min)/cell);
      if(i<0||i>=n||j<0||j>=n) continue;
      lut[j*n+i]=k;
    }
    const d=new Float32Array(n*n);
    for(let k=0;k<n*n;k++){
      const v=lut[k];
      // ô không có vertex (chỉ xảy ra ở rìa nếu lệch số) -> nội suy từ lân cận
      d[k] = v>=0 ? posAttr.getY(v) : 0;
    }
    // điền ô trống bằng trung bình 4 lân cận hợp lệ
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      if(lut[j*n+i]>=0) continue;
      let s=0,c2=0;
      for(const [a,b] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const ii=i+a, jj=j+b;
        if(ii<0||ii>=n||jj<0||jj>=n) continue;
        if(lut[jj*n+ii]<0) continue;
        s+=d[jj*n+ii]; c2++;
      }
      d[j*n+i]= c2 ? s/c2 : 0;
    }
    this.data=d;
  },
  // nội suy tam giác tương ứng 2 tam giác của mỗi ô (khớp raster của GPU)
  at(x,z){
    const d=this.data; if(!d) return 0;
    const n=this.n;
    let gx=(x-this.min)/this.cell, gz=(z-this.min)/this.cell;
    gx=THREE.MathUtils.clamp(gx,0,n-1.0001); gz=THREE.MathUtils.clamp(gz,0,n-1.0001);
    const i=Math.floor(gx), j=Math.floor(gz);
    const tx=gx-i, tz=gz-j;
    const h00=d[j*n+i],       h10=d[j*n+i+1];
    const h01=d[(j+1)*n+i],   h11=d[(j+1)*n+i+1];
    // PlaneGeometry chia ô thành 2 tam giác: (A,C,B) với A=h00,B=h10,C=h01 ; (C,D,B) với D=h11
    if(tz < 1-tx) return h00*(1-tx-tz) + h10*tx + h01*tz;           // h = A·(1-tx-tz) + B·tx + C·tz
    return h01*(1-tx) + h11*(tx+tz-1) + h10*(1-tz);              // h = C·(1-tx) + D·(tx+tz-1) + B·(1-tz)
  },
  // vector pháp tuyến (dùng cho nghiêng xe) — trung bình gradient 4 đỉnh
  normalAt(x,z, out){
    const e=this.cell*0.5;
    const hL=this.at(x-e,z), hR=this.at(x+e,z);
    const hD=this.at(x,z-e), hU=this.at(x,z+e);
    out.set(hL-hR, 2*e, hD-hU).normalize();
    return out;
  }
};

// độ dốc cục bộ (dùng cho giới hạn leo)
function slopeAt(x,z){
  const e=HF.cell*0.5;
  const dx=(HF.at(x+e,z)-HF.at(x-e,z))/(2*e);
  const dz=(HF.at(x,z+e)-HF.at(x,z-e))/(2*e);
  return Math.hypot(dx,dz);
}

function sampleHeight(x,z){ return HF.at(x,z); }

// Khớp physics với bề mặt GPU: đọc Y thật của từng vertex.

for(let i=0;i<posAttr.count;i++){
  const x=posAttr.getX(i), z=posAttr.getZ(i);
  const h = heightAt(x,z);
  posAttr.setY(i, h);
}
terrainGeo.computeVertexNormals();

// Khớp physics với bề mặt GPU: dựng heightfield TỪ vertex Y đã gán ở trên.
// Phải đặt SAU vòng lặp setY — gọi trước sẽ đọc toàn số 0 và mặt đất
// bị phẳng hoàn toàn trong khi mắt vẫn thấy núi (chính là lỗi xuyên địa hình).
HF.build(posAttr);


// vertex color by height/slope
const colors = new Float32Array(posAttr.count*3);
const cTmp=new THREE.Color();
for(let i=0;i<posAttr.count;i++){
  const y=posAttr.getY(i);
  // slope approx via normal
  const n = new THREE.Vector3().fromBufferAttribute(terrainGeo.attributes.normal, i);
  const slope = 1 - n.y;
  let col;
  if(y>80) cTmp.setHSL(0.08, 0.25, 0.62 - slope*0.2);
  else if(y>35) cTmp.setHSL(0.06, 0.55, 0.45 - slope*0.15);
  else if(y>12) cTmp.setHSL(0.05, 0.45, 0.40);
  else if(y<-2) cTmp.setHSL(0.07, 0.35, 0.30);
  else cTmp.setHSL(0.055, 0.50, 0.38);
  // polar tint
  const bi = biomeAt(posAttr.getX(i), posAttr.getZ(i)).biome;
  if(bi.id==='polar') cTmp.lerp(new THREE.Color(0xe8ddd0), 0.45);
  if(bi.id==='storm') cTmp.lerp(new THREE.Color(0x8a4a1e), 0.2);
  colors[i*3]=cTmp.r; colors[i*3+1]=cTmp.g; colors[i*3+2]=cTmp.b;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors,3));

const albedoTex = (()=>{
  const c=document.createElement('canvas'); c.width=c.height=256;
  const g=c.getContext('2d');
  g.fillStyle='#ffffff'; g.fillRect(0,0,256,256);
  // sand grains
  const img=g.getImageData(0,0,256,256); const dd=img.data;
  for(let i=0;i<dd.length;i+=4){
    const n = 215 + Math.random()*40;
    dd[i]=n; dd[i+1]=n*0.98; dd[i+2]=n*0.94;
  }
  g.putImageData(img,0,0);
  // wind ripples
  g.globalAlpha=0.10; g.strokeStyle='#7a3d1a';
  for(let i=0;i<26;i++){
    g.beginPath();
    const y0=Math.random()*256;
    g.moveTo(0,y0);
    for(let x=0;x<=256;x+=16) g.lineTo(x, y0 + Math.sin(x*0.05+i)*5);
    g.stroke();
  }
  // pebble speckles
  g.globalAlpha=0.16;
  for(let i=0;i<130;i++){
    g.fillStyle='#5a2d14';
    g.fillRect(Math.random()*256, Math.random()*256, 1+Math.random()*2, 1+Math.random()*2);
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(90,90);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors:true, map:albedoTex, roughness:0.92, metalness:0.02 });
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.receiveShadow=true;
scene.add(terrain);

// Rocks + craters: ĐÃ CHUYỂN sang hệ "mật độ môi trường" bên dưới (4 lớp
// instanced + cụm + hố + seed tất định). Bản cũ 520 viên Math.random() bị gỡ
// vì vừa tốn draw call vừa phủ đều — đúng thứ khiến cảnh đọc như mặt phẳng trống.
const dummy=new THREE.Object3D();   // giữ lại: các khối sau dùng chung

// ════════════════════════════════════════════════════════════════════════════
// LANDMARK KIT — Giai đoạn 1 P0: "không còn cảm giác prototype trống"
// Quy tắc tuân thủ document/art-bible.md §4:
//   1. đỉnh chính ≥ 1.6× chiều cao phương tiện (≥3.2m)
//   2. không đường thẳng nào dài quá 60m trong silhouette
//   3. ≥2 tầng đọc: khối chính + chi tiết phá vỡ đường viền
//   4. đổ bóng đọc được (hình khối có chiều sâu, không phải tấm phẳng)
//   5. 2 landmark cạnh nhau không cùng hình dạng
// Mỗi landmark = khối chính + đế + răng/rãnh phá vỡ viền + beacon (đọc được xa).
// ════════════════════════════════════════════════════════════════════════════
const LM_MATS = {
  rock:   new THREE.MeshStandardMaterial({ color:0x6b3a22, roughness:0.85, metalness:0.0, flatShading:true }),
  rockLit:new THREE.MeshStandardMaterial({ color:0x8a4a1e, roughness:0.80, metalness:0.0, flatShading:true }),
  dark:   new THREE.MeshStandardMaterial({ color:0x3a1c0d, roughness:0.92, metalness:0.0, flatShading:true }),
  beacon: new THREE.MeshStandardMaterial({ color:0xffcc33, emissive:0xffa500, emissiveIntensity:0.55, roughness:0.4 }),
};
const landmarks = [];

// Một landmark: đá chính (hình học KHÁC NHAU theo loại) + đế bệt + chi tiết viền.
function buildLandmark(kind, x, z, scale){
  const g = new THREE.Group();
  const y = sampleHeight(x, z);
  g.position.set(x, y, z);

  if (kind === 'mesa') {
    // ĐĐÁ TẤM: đỉnh nhưng rất phẳng, bề rộng — tạo silhouette dạng bàn.
    const base = new THREE.Mesh(new THREE.CylinderGeometry(26*scale, 34*scale, 9*scale, 7, 1), LM_MATS.rock);
    base.position.y = 4.5*scale; base.castShadow = base.receiveShadow = true; g.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(22*scale, 26*scale, 5*scale, 7, 1), LM_MATS.rockLit);
    cap.position.y = 11*scale; cap.castShadow = cap.receiveShadow = true; g.add(cap);
    // Răng phá vỡ viền (quy tắc 3): các lăng trụ nhỏ dọc miệng mesa.
    for (let i=0;i<9;i++){
      const a = (i/9)*Math.PI*2 + (i%2)*0.18;
      const r = 23*scale;
      const tooth = new THREE.Mesh(new THREE.CylinderGeometry(1.1*scale, 2.2*scale, (4+((i*7)%5))*scale, 5, 1), LM_MATS.dark);
      tooth.position.set(Math.cos(a)*r, (13.5+((i*3)%3))*scale, Math.sin(a)*r);
      tooth.rotation.set(((i%3)-1)*0.09, a, ((i%4)-1.5)*0.07);
      tooth.castShadow = tooth.receiveShadow = true; g.add(tooth);
    }
  } else if (kind === 'spire') {
    // THÁP NHỌN: nhiều tầng xoắn, đỉnh nhọn — silhouette khác hẳn mesa.
    let w = 11*scale, h = 0;
    for (let i=0;i<7;i++){
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(w*0.74, w, (7+((i*5)%4))*scale, 6, 1), i%2 ? LM_MATS.rockLit : LM_MATS.rock);
      h += (7+((i*5)%4))*scale*0.5;
      seg.position.y = h; seg.rotation.y = i*0.42;
      seg.castShadow = seg.receiveShadow = true; g.add(seg);
      w *= 0.79; h += (7+((i*5)%4))*scale*0.5;
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(w*1.25, 13*scale, 6), LM_MATS.dark);
    cap.position.y = h + 6.5*scale; cap.castShadow = true; g.add(cap);
  } else if (kind === 'arch') {
    // VÒM: hai chân + nhịp cầu, khoảng trống đọc được ngay ở silhouette.
    const legH = 22*scale, span = 30*scale;
    for (const s of [-1, 1]){
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(5*scale, 8.5*scale, legH, 6, 1), LM_MATS.rock);
      leg.position.set(s*span*0.5, legH*0.5, 0);
      leg.rotation.z = -s*0.07;
      leg.castShadow = leg.receiveShadow = true; g.add(leg);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(span*1.12, 6.5*scale, 9*scale), LM_MATS.rockLit);
    deck.position.y = legH; deck.castShadow = deck.receiveShadow = true; g.add(deck);
    // Rãnh phá vỡ viền dưới vòm
    for (let i=0;i<6;i++){
      const sh = new THREE.Mesh(new THREE.BoxGeometry((3+((i*5)%4))*scale, 2.2*scale, 4*scale), LM_MATS.dark);
      sh.position.set((i-2.5)*span*0.17, legH - 3.4*scale, (i%2?1:-1)*4.4*scale);
      sh.rotation.set(0, (i%2?0.3:-0.25), 0);
      sh.castShadow = true; g.add(sh);
    }
  } else { // 'field' — cụm tháp nhỏ, đọc thành cả lũy thay vì một khối
    for (let i=0;i<5;i++){
      const ox = (i-2)*7*scale, oz = ((i*7)%3-1)*6*scale;
      const hh = (10+((i*11)%13))*scale;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.5*scale, 4.5*scale, hh, 6, 1), i%2?LM_MATS.rockLit:LM_MATS.rock);
      t.position.set(ox, sampleHeight(x+ox, z+oz)-y + hh*0.5, oz);
      t.rotation.set(((i%3)-1)*0.1, i*0.8, ((i%4)-1.5)*0.08);
      t.castShadow = t.receiveShadow = true; g.add(t);
    }
  }

  // Đế bệt: tách nền/tiền cảnh, đồng thời "neo" landmark xuống mặt đất
  // (quy tắc 4 — không ai muốn thấy khối đá lơ lửng).
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(46*scale, 58*scale, 1.6, 16), LM_MATS.dark);
  skirt.position.y = 0.4; skirt.receiveShadow = true; g.add(skirt);

  // Beacon nhỏ trên đỉnh — điểm nhấn phát sáng, đọc được từ rất xa.
  const bx = new THREE.Mesh(new THREE.SphereGeometry(1.5*scale, 8, 6), LM_MATS.beacon);
  const topY = (kind==='mesa' ? 17*scale : kind==='arch' ? 30*scale : kind==='spire' ? 66*scale : 22*scale);
  bx.position.set(0, topY, 0); g.add(bx);
  const halo = new THREE.PointLight(0xffb060, 6, 120*scale, 2);
  halo.position.copy(bx.position); g.add(halo);

  g.userData = { kind, x, z, beacon: bx, halo, baseY: y, topY };
  scene.add(g);
  landmarks.push(g);
  return g;
}

// Bố trí: 1 landmark LỚN trong tầm nhìn spawn Arcadia (0,0) — mục tiêu mốc thị giác.
buildLandmark('mesa',  118,  96, 1.55);   // nhìn thấy ngay khi bắt đầu
buildLandmark('spire',-152, -88, 1.15);
buildLandmark('arch',   62, -168, 0.95);
buildLandmark('field', 236, -46, 1.30);
buildLandmark('field',-238, 168, 1.05);
buildLandmark('spire',  64, 292, 1.25);
buildLandmark('mesa', -108, 336, 1.40);
buildLandmark('arch',  332, 176, 0.85);
console.info('[landmark] dựng', landmarks.length, 'landmark');
// ════════════════════════════════════════════════════════════════════════════
// MẬT ĐỘ MÔI TRƯỜNG — Giai đoạn 1 P0 Task 1.2
// Trước đây: 520 Dodecahedron phun đều bằng Math.random() toàn cục → mặt phẳng
// trống, không có cụm, không có cỡ, không có hướng.
// Nay: seed TẤT ĐỊNH (cùng seed luôn cho cùng thế giới) + 4 lớp cỡ + cụm +
// hố + vệt sediment, mỗi lớp một InstancedMesh (giữ draw call thấp).
// Lớp theo art-bible.md §4: đỉnh chính / khối chính / chi tiết viền / nền.
// ════════════════════════════════════════════════════════════════════════════
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296; }; }
const ENV_SEED = 20260927;
const rnd = mulberry32(ENV_SEED);              // rng tất định
const rrange = (a,b) => a + rnd()*(b-a);

// 4 lớp: [geo, mat, sMin, sMax, count, yLift]
const envMat = new THREE.MeshStandardMaterial({ color:0x6b3a22, roughness:0.88, metalness:0, flatShading:true });
const envMatLit = new THREE.MeshStandardMaterial({ color:0x8a4a1e, roughness:0.84, metalness:0, flatShading:true });
const envMatDark = new THREE.MeshStandardMaterial({ color:0x42200f, roughness:0.93, metalness:0, flatShading:true });
const envMatSilt = new THREE.MeshStandardMaterial({ color:0xbb7a45, roughness:0.95, metalness:0 });

// Mật độ đo được trước đó: 856 vật thể / 1.64M m² = 1 vật / ~1985 m², tức quãng
// 45m không có gì → đọc như mặt phẳng trống. Nay mỗi cụm (~1100 m²) chứa
// vài chục vật, tương đương ~1 vật / 40–150 m² trong vùng có cụm.
const envLayers = [
  // ĐÁ LỚN — tạo silhouette giữa cảnh (không lấn át landmark)
  { name:'boulder', geo:new THREE.DodecahedronGeometry(1,0), mat:envMat,    sMin:2.4, sMax:5.2, n: 260, y:0.32, shadow:true  },
  // ĐÁ VỪA — mật độ chính, đọc được ở 60m
  { name:'rock',    geo:new THREE.DodecahedronGeometry(1,0), mat:envMatLit, sMin:0.8, sMax:2.1, n: 900, y:0.30, shadow:true  },
  // VỤN — chi tiết viền, cự ly gần
  // vụn: TETRA (4 tam giác) thay DODECA (36 tam giác) — ở cỡ 0.16–0.55m người
  // chơi không phân biệt được, nhưng tiết kiệm ~96k triangles mỗi khung hình.
  { name:'pebble',  geo:new THREE.TetrahedronGeometry(1,0), mat:envMatDark,sMin:0.16,sMax:0.55,n:3000, y:0.22, shadow:false },
  // BỘT/SÉT — vệt phẳng, phá vỡ mảng màu đồng nhất của mặt đất
  { name:'silt',    geo:new THREE.CircleGeometry(1,7),          mat:envMatSilt,sMin:2.5, sMax:8.0, n: 320, y:0.05, shadow:false, flat:true },
];

// Cụm: đá không phun đều mà tụ lại thành cụm như thật.
// Cụm nhỏ hơn + NHIỀU hơn. Cụm đầu tiên neo đúng tại spawn để người chơi
// luôn thấy chi tiết ngay khung hình đầu tiên (P0: "mọi 30-60s có mốc mới").
const CLUSTERS = [{ x:0, z:0, r:30, k:9 }];
for (let i=0;i<89;i++){
  CLUSTERS.push({ x:rrange(-650,650), z:rrange(-650,650), r:rrange(10,34), k:rrange(3,10) });
}

const envMeshes = [];
for (const L of envLayers){
  const im = new THREE.InstancedMesh(L.geo, L.mat, L.n);
  im.castShadow = L.shadow; im.receiveShadow = true;
  im.frustumCulled = true;
  const d = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < L.n && guard < L.n*14){
    guard++;
    let x, z;
    if (L.name === 'silt'){
      // silt bám cụm nhưng trải rộng hơn để phủ mảng màu
      const c = CLUSTERS[Math.floor(rnd()*CLUSTERS.length)];
      const a = rnd()*Math.PI*2, rr = c.r*1.9*Math.sqrt(rnd());
      x = c.x + Math.cos(a)*rr; z = c.z + Math.sin(a)*rr;
    } else {
      // đá bám theo cụm → có hướng, có nhịp, không phải "mưa rào"
      const c = CLUSTERS[Math.floor(rnd()*CLUSTERS.length)];
      const a = rnd()*Math.PI*2, rr = c.r*Math.sqrt(rnd())*c.k/8;
      x = c.x + Math.cos(a)*rr; z = c.z + Math.sin(a)*rr;
    }
    if (x < -690 || x > 690 || z < -690 || z > 690) continue;
    const y = sampleHeight(x,z);
    if (y < -8) continue;                                  // bỏ vùng hố sâu
    const s = rrange(L.sMin, L.sMax);
    d.position.set(x, y + s*L.y, z);
    if (L.flat){ d.rotation.set(-Math.PI/2 + rrange(-0.08,0.08), 0, rnd()*Math.PI*2); }
    else { d.rotation.set(rnd()*Math.PI, rnd()*Math.PI, rnd()*Math.PI); }
    // Không vật nào chồng lên phương tiện / landmark
    d.scale.set(s, s*rrange(L.flat?1:0.62, L.flat?1:0.92), s);
    d.updateMatrix();
    im.setMatrixAt(placed++, d.matrix);
  }
  im.count = placed;
  im.instanceMatrix.needsUpdate = true;
  scene.add(im);
  envMeshes.push({ name:L.name, count:placed, mesh:im });
}

// Hố nhỏ (crater): vòng trũng + vành đất đổ. Rẻ hơn hình học nặng, đọc rõ trên
// mặt phẳng nên đây là cách rẻ nhất để phá vỡ sự đồng nhất của mặt đất.
const craterGeo = new THREE.TorusGeometry(1, 0.30, 5, 9);
const craterMat = new THREE.MeshStandardMaterial({ color:0x4a2410, roughness:0.95, metalness:0, flatShading:true });
const CRATERS = 95;
const craterIM = new THREE.InstancedMesh(craterGeo, craterMat, CRATERS);
craterIM.receiveShadow = true;
{
  const d = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < CRATERS && guard < CRATERS*20){
    guard++;
    const c = CLUSTERS[Math.floor(rnd()*CLUSTERS.length)];
    const a = rnd()*Math.PI*2, rr = c.r*1.5*Math.sqrt(rnd());
    const x = c.x + Math.cos(a)*rr, z = c.z + Math.sin(a)*rr;
    if (x < -660 || x > 660 || z < -660 || z > 660) continue;
    const y = sampleHeight(x,z); if (y < -8) continue;
    const s = rrange(3.2, 9.5);
    d.position.set(x, y + 0.25, z);
    d.rotation.set(-Math.PI/2, 0, rnd()*Math.PI);
    d.scale.set(s, s, s*0.42);
    d.updateMatrix();
    craterIM.setMatrixAt(placed++, d.matrix);
  }
  craterIM.count = placed; craterIM.instanceMatrix.needsUpdate = true;
  scene.add(craterIM);
  envMeshes.push({ name:'crater', count:placed, mesh:craterIM });
}
console.info('[env]', envMeshes.map(e=>`${e.name}:${e.count}`).join(' '), '| seed', ENV_SEED);

// ── DÃY NÚI XA (horizon range) ───────────────────────────────────────────────
// Bản đồ chỉ 1400m, nên nhìn ra rìa sẽ thấy trời trống. Vòng núi thấp ở
// ~1050m giả làm đường chân trời có chiều sâu, và fog sẽ nuốt dần — đúng
// tầng "background" mà art-bible.md §5 yêu cầu (chỉ còn silhouette).
{
  const farMat = new THREE.MeshStandardMaterial({ color:0x8e4a28, roughness:0.95, metalness:0, flatShading:true });
  const R = 1050, N = 46;
  for (let i=0;i<N;i++){
    const a = (i/N)*Math.PI*2;
    const h = 34 + ((i*37)%11)*11;          // 34..144m — nhấp nháy bất quy tắc
    const w = 90 + ((i*53)%9)*16;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5, 1), farMat);
    peak.position.set(Math.cos(a)*R, h*0.5 - 6, Math.sin(a)*R);
    peak.rotation.y = a*1.7;
    peak.castShadow = false; peak.receiveShadow = false;  // xa quá, tắt shadow
    scene.add(peak);
  }
}


// Paw collectibles
const pawGroup=new THREE.Group();
scene.add(pawGroup);
const pawItems=[];
const pawGeo=new THREE.SphereGeometry(0.9,10,8);
const pawMat=new THREE.MeshStandardMaterial({ color:0xffcc33, emissive:0xffa500, emissiveIntensity:0.55, roughness:0.4 });
for(let i=0;i<18;i++){
  let x,z;
  do{ x=(Math.random()-0.5)*1200; z=(Math.random()-0.5)*1200; } while(biomeAt(x,z).biome.id==='storm' && Math.random()<0.6);
  const y=sampleHeight(x,z)+1.4;
  const m=new THREE.Mesh(pawGeo, pawMat.clone());
  m.position.set(x,y,z);
  m.userData={ idx:i, x,z, y0:y, phase:Math.random()*Math.PI*2 };
  // inner paw pad
  const inner=new THREE.Mesh(new THREE.SphereGeometry(0.45,8,6), new THREE.MeshStandardMaterial({color:0xff8a00, emissive:0xff6a00, emissiveIntensity:0.4}));
  inner.position.y=0.15; m.add(inner);
  pawGroup.add(m);
  pawItems.push(m);
}
// restore collected visibility
for(let idx of collected){ if(pawItems[idx]) pawItems[idx].visible=false; }

// Dust particles (for storm + speed)
const dustCount=900;
const dustGeo=new THREE.BufferGeometry();
const dustPos=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){ dustPos[i*3]=(Math.random()-0.5)*600; dustPos[i*3+1]=2+Math.random()*40; dustPos[i*3+2]=(Math.random()-0.5)*600; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dustMat=new THREE.PointsMaterial({ color:0xffc08a, size:1.8, transparent:true, opacity:0.0, sizeAttenuation:true, depthWrite:false });
const dustPoints=new THREE.Points(dustGeo, dustMat);
scene.add(dustPoints);

// Player (cat + vehicle)
const _calTmp=new THREE.Vector3();
const _calQ=new THREE.Quaternion(), _calE=new THREE.Euler(0,0,0,'YXZ');
const _armQ=new THREE.Quaternion(), _armX=new THREE.Vector3(1,0,0), _armV=new THREE.Vector3();
const player=new THREE.Group();
scene.add(player);
let playerPos=new THREE.Vector3(0, sampleHeight(0,0)+VEHICLES[vehicleType].ride, 0);
player.position.copy(playerPos);
let playerYaw=0, playerPitch=0;

// Mèo được nâng khỏi yên bằng catLift.position.y trong buildVehicle().
// Phải khai báo TRƯỚC buildVehicle() để tránh TDZ.
var BODY_LIFT = 0;
let vRefs = { wheels:[], dish:null, mast:null, tail:null, head:null, scarves:[] };
// Cache hình học bánh: {x,z} offset cục bộ, y = cao độ đáy bánh khi group ở gốc.
let wCache=[];
function buildVehicle(type){
  while(player.children.length) player.remove(player.children[0]);
  // KHÔNG gán lại vRefs: mọi ref đã push vào object cũ, gán lại sẽ làm rỗng
  // wheels/disc/... và mọi logic bánh/đuôi im lặng. Chỉ xoá nội dung mảng.
  vRefs.wheels.length=0; vRefs.scarves.length=0;
  vRefs.dish=vRefs.mast=vRefs.tail=vRefs.head=vRefs.rim=null; vRefs.arms=[];
  const g=new THREE.Group();
  const wheelMat=new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:0.9});
  const frameMat=new THREE.MeshStandardMaterial({color:0xffcc33, metalness:0.5, roughness:0.35});
  const chrome=new THREE.MeshStandardMaterial({color:0xbfc7d0, metalness:0.85, roughness:0.25});
  // shadow disc
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(2.2,18), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.14, depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.renderOrder=-1; g.add(shadow);
  let body;
  if(type==='bike'){
    body=new THREE.Group();
    // diamond frame
    const mk=(x1,y1,x2,y2,th)=>{ const L=Math.hypot(x2-x1,y2-y1); const bar=new THREE.Mesh(new THREE.CylinderGeometry(th,th,L,6), frameMat); bar.position.set((x1+x2)/2,(y1+y2)/2,0); bar.rotation.z=Math.atan2(y2-y1,x2-x1)-Math.PI/2; body.add(bar); };
    mk(-0.9,0.55,0.1,0.62,0.045); mk(0.1,0.62,0.85,0.55,0.045); mk(-0.9,0.55,0.0,1.05,0.045); mk(0.0,1.05,0.1,0.62,0.04); mk(0.0,1.05,0.85,0.55,0.04); mk(0.85,0.55,1.05,1.0,0.04);
    // wheels with spokes
    const mkWheel=(x)=>{
      const w=new THREE.Group();
      const tire=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.07,8,22), wheelMat); tire.rotation.y=Math.PI/2; w.add(tire);
      for(let s=0;s<5;s++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(0.02,1.02,0.02), chrome); sp.rotation.z=s*Math.PI/5; w.add(sp); }
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.12,8), chrome); hub.rotation.z=Math.PI/2; w.add(hub);
      w.position.set(x,0.55,0); w.userData.r=0.62; body.add(w); vRefs.wheels.push(w); return w;
    };
    mkWheel(-0.9); mkWheel(0.95);
    // seat + bars
    const seat=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.08,0.16), wheelMat); seat.position.set(-0.05,1.12,0); body.add(seat);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.5), frameMat); bar.position.set(1.05,1.06,0); body.add(bar);
    vRefs.barPos={x:1.05,y:1.06,z:0,halfW:0.25};
    // ── Giỏ hành trang phía trước: dây đan + túi ngủ + bình nước + ăngten ──
    // (thay thế "hộp + khối xanh" cũ: giỏ mây trông như thùng gỗ, cá là
    //  khối tròn vô nghĩa không ai hiểu)
    const basket=new THREE.Group();
    const wicker=new THREE.MeshStandardMaterial({color:0xc99a5b, roughness:0.9});
    // nền giỏ + 4 vách
    const bFloor=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.03,0.38), wicker);
    bFloor.position.y=-0.15; basket.add(bFloor);
    for(const [dx,dz,ry] of [[0,0.19,0],[-0.23,0,Math.PI/2],[0,-0.19,0],[0.23,0,Math.PI/2]]){
      const w=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.30,0.025), wicker);
      w.position.set(dx,0,dz); w.rotation.y=ry; basket.add(w);
    }
    // sọc dây đan (3 vòng ngang mỗi vách) -> đọc ra "giỏ đan" thay vì "hộp"
    for(let r=0;r<3;r++){
      const y=-0.06+r*0.075;
      for(const [dx,dz,ry] of [[0,0.195,0],[-0.235,0,Math.PI/2],[0,-0.195,0],[0.235,0,Math.PI/2]]){
        const band=new THREE.Mesh(new THREE.BoxGeometry(0.47,0.018,0.032),
              new THREE.MeshStandardMaterial({color:0xa87a42, roughness:0.9}));
        band.position.set(dx,y,dz); band.rotation.y=ry; basket.add(band);
      }
    }
    // quai treo lên ghi đông
    for(const dz of [0.15,-0.15]){
      const handle=new THREE.Mesh(new THREE.TorusGeometry(0.10,0.014,5,12,Math.PI), new THREE.MeshStandardMaterial({color:0x9c6f3c, roughness:0.9}));
      handle.position.set(0,0.16,dz); handle.rotation.y=Math.PI/2; basket.add(handle);
    }
    // túi ngủ cuộn (xanh Sao Hỏa) nằm trong giỏ
    const bag=new THREE.Mesh(new THREE.CapsuleGeometry(0.085,0.26,4,12),
          new THREE.MeshStandardMaterial({color:0x3fb0d8, roughness:0.75}));
    bag.rotation.z=Math.PI/2; bag.position.set(0.02,0.02,0.02); basket.add(bag);
    for(const dz of [-0.09,0.09]){                       // dây buộc túi
      const strap=new THREE.Mesh(new THREE.TorusGeometry(0.088,0.011,5,12),
            new THREE.MeshStandardMaterial({color:0xe23c2e, roughness:0.8}));
      strap.position.set(0.02,0.02,dz); strap.rotation.y=Math.PI/2; basket.add(strap);
    }
    // bình nước bạc chụp lên thành giỏ
    const canteen=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.17,12),
          new THREE.MeshStandardMaterial({color:0xd6dbe2, roughness:0.3, metalness:0.8}));
    canteen.position.set(-0.15,0.08,-0.14); basket.add(canteen);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.032,0.035,8),
          new THREE.MeshStandardMaterial({color:0xe23c2e, roughness:0.6}));
    cap.position.set(-0.15,0.18,-0.14); basket.add(cap);
    // gương + ăngten gắn trên quai
    const mirror=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.012,12),
          new THREE.MeshStandardMaterial({color:0xbfe6ff, roughness:0.05, metalness:0.9}));
    mirror.position.set(0.24,0.22,-0.16); mirror.rotation.z=0.5; basket.add(mirror);
    basket.scale.setScalar(0.52); basket.position.set(1.30,0.66,0); basket.rotation.y=0.04;
    body.add(basket); vRefs.basket=basket;
    // bàn đạp
    const pedal=new THREE.Group();
    const arm=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.03,0.03), chrome); arm.position.x=0.15; pedal.add(arm);
    const cpx=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.025,0.06), wheelMat); cpx.position.x=0.28; pedal.add(cpx);
    pedal.position.set(0.1,0.62,0.16); body.add(pedal); vRefs.pedal=pedal;
    g.add(body);
  } else if(type==='moto'){
    body=new THREE.Group();
    const tank=new THREE.Mesh(new THREE.CapsuleGeometry(0.26,0.7,6,12), new THREE.MeshStandardMaterial({color:0xff3b2f, metalness:0.4, roughness:0.3}));
    tank.rotation.z=Math.PI/2; tank.position.set(0.15,0.95,0); body.add(tank);
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.16,0.42), new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:0.8})); seat.position.set(-0.35,1.12,0); body.add(seat);
    const fork=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.85,8), chrome); fork.position.set(0.85,0.72,0); fork.rotation.z=-0.35; body.add(fork);
    // Ghi đông: thanh ngang + 2 tay cầm cong + nắp cao su
    const hbar=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.52,10), chrome);
    hbar.rotation.x=Math.PI/2; hbar.position.set(1.05,1.12,0); body.add(hbar);
    for(const dz of [0.24,-0.24]){
      const grip=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.13,10),
            new THREE.MeshStandardMaterial({color:0x2a2a2e, roughness:0.9}));
      grip.rotation.x=Math.PI/2; grip.position.set(1.05,1.12,dz); body.add(grip);
      const barEnd=new THREE.Mesh(new THREE.SphereGeometry(0.031,8,6), chrome);
      barEnd.position.set(1.05,1.12,dz*1.14); body.add(barEnd);
    }
    vRefs.barPos={x:1.05,y:1.12,z:0,halfW:0.25}; vRefs.barObj=body;
    const mkW=(x)=>{ const w=new THREE.Group(); const tire=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.115,8,18), wheelMat); tire.rotation.y=Math.PI/2; w.add(tire);
      for(let s=0;s<4;s++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.78,0.025), chrome); sp.rotation.z=s*Math.PI/4+0.4; w.add(sp);} w.position.set(x,0.45,0); w.userData.r=0.535; body.add(w); vRefs.wheels.push(w); return w; };
    mkW(-1.05); mkW(1.05);
    const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.9,8), chrome); pipe.rotation.z=Math.PI/2-0.08; pipe.position.set(-0.55,0.55,0.3); body.add(pipe);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8), new THREE.MeshStandardMaterial({color:0xfff6a0, emissive:0xfff176, emissiveIntensity:0.9})); lamp.position.set(1.12,0.98,0); body.add(lamp);
    // chắn bùn sau (bốc đầu chất chơi)
    const fender=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.05,6,12,Math.PI*0.9), new THREE.MeshStandardMaterial({color:0xff3b2f})); fender.position.set(-1.05,0.45,0); fender.rotation.y=Math.PI/2; fender.rotation.x=0.4; body.add(fender);
    g.add(body);
  } else {
    body=new THREE.Group();
    // Vô-lăng rover: cánh vô-lăng Mèo nắm, đặt trước cabin
    vRefs.barPos={x:0.62,y:1.34,z:0,halfW:0.30};
    const wheelRim=new THREE.Mesh(new THREE.TorusGeometry(0.24,0.028,6,18), chrome);
    wheelRim.position.set(vRefs.barPos.x, vRefs.barPos.y, 0);
    wheelRim.rotation.y=Math.PI/2; wheelRim.rotation.x=0.5;
    body.add(wheelRim); vRefs.rim=wheelRim;
    for(let s=0;s<3;s++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.02,0.02), chrome);
      sp.position.copy(wheelRim.position); sp.rotation.x=s*Math.PI/3+0.5; body.add(sp); }
    const chassis=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.42,1.15), new THREE.MeshStandardMaterial({color:0xd9cfc0, metalness:0.3, roughness:0.5}));
    chassis.position.set(0,1.02,0); body.add(chassis);
    // золотая foil belly
    const foil=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.1,1.0), new THREE.MeshStandardMaterial({color:0xffd54f, metalness:0.9, roughness:0.3})); foil.position.set(0,0.78,0); body.add(foil);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.55,1.05), new THREE.MeshStandardMaterial({color:0x7ec8e3, transparent:true, opacity:0.55, roughness:0.08, metalness:0.1}));
    cabin.position.set(0.05,1.52,0); body.add(cabin); vRefs.cabin=cabin;
    const deck=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.07,1.0), new THREE.MeshStandardMaterial({color:0x12324a, metalness:0.6, roughness:0.35})); deck.position.set(-0.85,1.3,0); body.add(deck); // panel pin
    // mast camera
    const mast=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.8,6), chrome); pole.position.y=0.4; mast.add(pole);
    const eyeBox=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.16,0.14), new THREE.MeshStandardMaterial({color:0x222222})); eyeBox.position.y=0.82; mast.add(eyeBox);
    for(const dz of [-0.05,0.05]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6), new THREE.MeshStandardMaterial({color:0x80deea, emissive:0x00bcd4, emissiveIntensity:0.8})); eye.position.set(0.18,0.82,dz); mast.add(eye); }
    mast.position.set(0.55,1.28,-0.42); body.add(mast); vRefs.mast=mast;
    // ăng-ten dish
    const dishG=new THREE.Group();
    const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.5,5), chrome); stick.position.y=0.25; dishG.add(stick);
    const dish=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,6,0,Math.PI*2,0,Math.PI*0.45), new THREE.MeshStandardMaterial({color:0xf5f5f5, side:THREE.DoubleSide})); dish.position.y=0.52; dish.rotation.x=2.4; dishG.add(dish);
    dishG.position.set(-0.9,1.26,0.45); body.add(dishG); vRefs.dish=dishG;
    // đèn pha
    for(const dz of [0.35,-0.35]){ const l=new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8), new THREE.MeshStandardMaterial({color:0xfff6a0, emissive:0xfff176, emissiveIntensity:0.95})); l.position.set(1.18,1.0,dz); body.add(l); }
    // rocker-bogie 6 bánh
    const mkW=(x,z,armX)=>{
      const leg=new THREE.Group();
      const arm=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.07,0.07), chrome); arm.position.set(armX/2,0,0); leg.add(arm);
      const w=new THREE.Group();
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.26,14), wheelMat); tire.rotation.z=Math.PI/2; w.add(tire);
      for(let s=0;s<6;s++){ const cleat=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.1,0.28), chrome); const a=s*Math.PI/3; cleat.position.set(0, Math.cos(a)*0.34, Math.sin(a)*0.34); cleat.rotation.x=-a; w.add(cleat); }
      w.position.set(armX,0,0); w.userData.r=0.34; leg.add(w); vRefs.wheels.push(w);
      leg.position.set(x,0.72,z); body.add(leg); return leg;
    };
    mkW(1.05,0.68,0.5); mkW(1.05,-0.68,-0.5);
    mkW(0.0,0.72,0.42); mkW(0.0,-0.72,-0.42);
    mkW(-1.0,0.66,0.46); mkW(-1.0,-0.66,-0.46);
    g.add(body);
  }
  // ===== MÈO VÀNG — DỰNG CHI TIẾT =====
  // Mèo ngồi trên yên, hai tay vươn ra nắm ghi đông. Toàn bộ chi tiết dựng
  // bằng procedural geometry (không asset ngoài) để giữ triết lý static.
  const cat=new THREE.Group();

  // ---------- Vật liệu ----------
  const matFur   = new THREE.MeshStandardMaterial({color:0xffc93c, roughness:0.84});
  const matFurD  = new THREE.MeshStandardMaterial({color:0xe2961c, roughness:0.86}); // sọc tabby
  const matCream = new THREE.MeshStandardMaterial({color:0xfff3cf, roughness:0.88}); // bụng/mõm
  const matPink  = new THREE.MeshStandardMaterial({color:0xff9db0, roughness:0.5});
  const matWhite = new THREE.MeshStandardMaterial({color:0xf6f6ef, roughness:0.34, metalness:0.18});
  const matGold  = new THREE.MeshPhysicalMaterial({color:0xffcb63, roughness:0.07, metalness:0.4,
                                                   transparent:true, opacity:0.34,
                                                   side:THREE.DoubleSide, depthWrite:false});
  const matChrome= new THREE.MeshStandardMaterial({color:0xd6dbe2, roughness:0.28, metalness:0.85});
  const matRed   = new THREE.MeshStandardMaterial({color:0xe23c2e, roughness:0.72});
  const matEyeW  = new THREE.MeshStandardMaterial({color:0xfdfbf4, roughness:0.22});
  const matIris  = new THREE.MeshStandardMaterial({color:0x5cc46e, roughness:0.18,
                                                   emissive:0x0e3a1a, emissiveIntensity:0.4});
  const matPupil = new THREE.MeshStandardMaterial({color:0x0a0a0a, roughness:0.1});
  const matGloss = new THREE.MeshBasicMaterial({color:0xffffff});
  const matDark  = new THREE.MeshStandardMaterial({color:0x4a3418, roughness:0.8});

  // Trợ giác: cho một mesh (mặc định trục dọc +Y) chĩa theo vector chỉ định
  const _mUp=new THREE.Vector3(0,1,0), _mDir=new THREE.Vector3();
  const aim=(m,dx,dy,dz)=>{ _mDir.set(dx,dy,dz).normalize(); m.quaternion.setFromUnitVectors(_mUp,_mDir); };

  // ---------- THÂN: ngực + bụng + hông ----------
  // Toàn thân Mèo nâng cao khỏi yên: tư thế ngồi thẳng lưng khi lái
  const BODY_Y=0.13; BODY_LIFT=BODY_Y;
  const torso=new THREE.Mesh(new THREE.SphereGeometry(0.30,22,18), matFur);
  torso.scale.set(1.28,0.95,0.95); torso.position.set(-0.05,1.52,0); cat.add(torso);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(0.225,18,14), matFur);
  chest.scale.set(1.0,1.06,0.96); chest.position.set(0.21,1.58,0); cat.add(chest);
  const belly=new THREE.Mesh(new THREE.SphereGeometry(0.205,18,14), matCream);
  belly.scale.set(1.08,0.78,0.9); belly.position.set(0.15,1.39,0); cat.add(belly);
  const hipMeshes=[], thighMeshes=[], stripeMeshes=[];
  for(const s of [1,-1]){
    const hip=new THREE.Mesh(new THREE.SphereGeometry(0.20,16,12), matFur);
    hip.scale.set(1.0,1.02,0.86); hip.position.set(-0.30,1.49,s*0.13); cat.add(hip); hipMeshes.push(hip);
    // bắp đùi nổi (bó cơ đùi mèo)
    const thighMus=new THREE.Mesh(new THREE.SphereGeometry(0.115,12,10), matFur);
    thighMus.scale.set(1.25,1.0,0.8); thighMus.position.set(-0.20,1.56,s*0.155); cat.add(thighMus); thighMeshes.push(thighMus);
  }
  // sọc tabby: 5 dải ôm đúng mặt cắt thân (bán kính tính theo ellipsoid)
  [[0.30,0.021],[0.17,0.023],[0.03,0.024],[-0.12,0.023],[-0.26,0.020]].forEach(([lx,tr])=>{
    const rr=0.285*Math.sqrt(Math.max(0.04,1-Math.pow(lx/0.384,2)))*1.03;
    const st=new THREE.Mesh(new THREE.TorusGeometry(rr,tr,5,16), matFurD);
    st.rotation.y=Math.PI/2; st.scale.set(1,0.96,1); st.position.set(-0.05+lx,1.52,0);
    cat.add(st); stripeMeshes.push(st);
  });
  // sọc trên đùi
  for(const s of [1,-1]){
    const st=new THREE.Mesh(new THREE.TorusGeometry(0.145,0.017,5,14), matFurD);
    st.rotation.y=Math.PI/2; st.rotation.x=0.4; st.position.set(-0.20,1.56,s*0.152);
    st.scale.set(1,0.95,1); cat.add(st); stripeMeshes.push(st);
  }

  // Gom các khối thân vào một nhóm: ở góc nhìn thứ nhất (cockpit) sẽ ẩn đi,
  // vì ngực Mèo che kín tay khi ngồi sau vô-lăng rover.
  const selfBody=new THREE.Group();
  cat.add(selfBody); vRefs.selfBody=selfBody;
  for(const m of [torso, chest, belly]) selfBody.attach(m);
  for(const h of hipMeshes) selfBody.attach(h);
  for(const t of thighMeshes) selfBody.attach(t);
  for(const s of stripeMeshes) selfBody.attach(s);

  // ---------- KHĂN ĐỎ + HUY HIỆU ----------
  // Khăn quấn quanh CỔ (thấp hơn cằm), không che mặt
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(0.20,0.062,8,24), matRed);
  scarf.rotation.x=Math.PI/2; scarf.position.set(0.06,1.46,0); scarf.scale.set(1,1,0.85); cat.add(scarf);
  const knot=new THREE.Mesh(new THREE.SphereGeometry(0.055,10,8), matRed);
  knot.scale.set(0.9,0.8,1.1); knot.position.set(-0.10,1.47,0.11); cat.add(knot);
  // Đuôi khăn bay về sau (vẫy theo tốc độ)
  const scarfTail=new THREE.Group();
  const sc1=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.095,0.028), matRed); sc1.position.set(-0.13,0,0);
  const sc2=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.082,0.024), matRed); sc2.position.set(-0.35,0.045,0);
  scarfTail.add(sc1,sc2);
  scarfTail.position.set(-0.13,1.47,0.10); scarfTail.rotation.z=0.30;
  cat.add(scarfTail); vRefs.scarf=scarfTail;
  // huy hiệu "MÈO VÀNG" trên ngực
  const badge=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.058,0.012,14), matRed);
  badge.rotation.z=Math.PI/2; badge.position.set(0.30,1.50,0.16); cat.add(badge);
  const badgeDot=new THREE.Mesh(new THREE.SphereGeometry(0.022,10,8), matCream);
  badgeDot.position.set(0.312,1.50,0.16); cat.add(badgeDot);

  // ---------- ĐẦU ----------
  const headG=new THREE.Group();
  const HEAD_S=0.72;                                 // tỉ lệ đầu so với thân
  headG.position.set(0.30,1.78,0); cat.add(headG); vRefs.head=headG;

  const skull=new THREE.Mesh(new THREE.SphereGeometry(0.29,24,18), matFur);
  skull.scale.set(1.02,0.95,1.0); headG.add(skull);
  for(const s of [1,-1]){                       // má phồng
    const ck=new THREE.Mesh(new THREE.SphereGeometry(0.135,14,12), matFur);
    ck.scale.set(0.92,0.86,1.0); ck.position.set(0.165,-0.06,s*0.155); headG.add(ck);
  }
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(0.135,16,12), matCream);
  muzzle.scale.set(1.05,0.80,1.0); muzzle.position.set(0.235,-0.09,0); headG.add(muzzle);
  const noseBridge=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.05,0.095), matCream);
  noseBridge.position.set(0.255,-0.012,0); headG.add(noseBridge);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(0.042,12,10), matPink);
  nose.scale.set(0.9,0.72,1.12); nose.position.set(0.312,-0.038,0); headG.add(nose);
  for(const s of [1,-1]){                       // miệng hình chữ W
    const lip=new THREE.Mesh(new THREE.SphereGeometry(0.031,10,8), matDark);
    lip.scale.set(0.45,1.0,1.45); lip.position.set(0.297,-0.088,s*0.037); headG.add(lip);
  }
  const chin=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,10), matCream);
  chin.scale.set(1.0,0.7,1.1); chin.position.set(0.225,-0.175,0); headG.add(chin);
  headG.scale.setScalar(HEAD_S);   // đầu gọn, cân với thân

  // ---------- MẮT: nhãn cầu + mống + đồng tử dọc + lòng sáng ----------
  const eyes=[];
  for(const s of [1,-1]){
    const eg=new THREE.Group();
    eg.position.set(0.205,0.055,s*0.132);
    eg.rotation.y=-s*0.32; eg.rotation.z=-0.10;
    eg.add(new THREE.Mesh(new THREE.SphereGeometry(0.072,16,14), matEyeW));
    const iris=new THREE.Mesh(new THREE.SphereGeometry(0.062,16,14), matIris);
    iris.position.set(0.026,0.004,0); iris.scale.set(0.6,1,1); eg.add(iris);
    const pup=new THREE.Mesh(new THREE.SphereGeometry(0.05,14,12), matPupil);
    pup.position.set(0.050,0.004,0); pup.scale.set(0.32,1.06,0.55); eg.add(pup);   // đồng tử dọc
    const hi=new THREE.Mesh(new THREE.SphereGeometry(0.016,8,6), matGloss);
    hi.position.set(0.066,0.030,-s*0.017); eg.add(hi);
    const hi2=new THREE.Mesh(new THREE.SphereGeometry(0.009,6,5), matGloss);
    hi2.position.set(0.062,-0.022,s*0.020); eg.add(hi2);
    headG.add(eg); eyes.push(eg);
    // mi mắt trên
    const lid=new THREE.Mesh(new THREE.SphereGeometry(0.080,14,10,0,Math.PI*2,0,Math.PI*0.40), matFurD);
    lid.position.set(0.205,0.055,s*0.132); lid.rotation.y=-s*0.32; lid.rotation.z=0.34;
    lid.scale.set(1,0.72,1); headG.add(lid);
  }
  vRefs.eyes=eyes;

  // ---------- RIA ----------
  for(const s of [1,-1]) for(let i=0;i<4;i++){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(0.0042,0.0018,0.30,4), matCream);
    w.position.set(0.255,-0.052-i*0.021,s*0.095);
    aim(w, 0.88, 0.24-i*0.13, s*(0.44+i*0.16));
    headG.add(w);
  }

  // ---------- TAI (nhô ra khỏi mũ) ----------
  const ears=[];
  for(const s of [1,-1]){
    const outer=new THREE.Mesh(new THREE.ConeGeometry(0.118,0.27,13), matFur);
    outer.position.set(0.295,0.30,s*0.205); aim(outer,-0.16,0.72,s*0.67); headG.add(outer);
    const inner=new THREE.Mesh(new THREE.ConeGeometry(0.074,0.175,11), matPink);
    inner.position.set(0.322,0.295,s*0.222); aim(inner,-0.16,0.72,s*0.67); headG.add(inner);
    for(let i=0;i<3;i++){                        // chùm lông trong tai
      const tf=new THREE.Mesh(new THREE.ConeGeometry(0.015,0.085,5), matCream);
      tf.position.set(0.312,0.325,s*(0.20+i*0.028)); aim(tf,-0.1,0.82,s*0.58); headG.add(tf);
    }
    ears.push(outer); vRefs.ears=ears;
  }

  // ---------- MŨ PHI HÀNH: vỏ trắng + kính vàng + vành + ống thở ----------
  const hel=new THREE.Group();
  hel.position.set(0.30,1.78,0); hel.scale.setScalar(HEAD_S); cat.add(hel); vRefs.helmet=hel;
  // Vỏ trắng: chỉ phần trên-sau (tránh che mặt)
  hel.add(new THREE.Mesh(new THREE.SphereGeometry(0.40,26,18,
        -Math.PI*0.50, Math.PI*1.0, 0, Math.PI*0.52), matWhite));
  // Kính vàng: phần trước, phủ từ trán xuống cằm
  const visor=new THREE.Mesh(new THREE.SphereGeometry(0.406,26,20,
        Math.PI*0.50, Math.PI*1.0, 0, Math.PI*0.72), matGold);
  hel.add(visor); vRefs.helmetVisor=visor;
  // Vành cổ nằm THẤP (dưới cằm) để không cắt ngang mặt
  const neckRing=new THREE.Mesh(new THREE.TorusGeometry(0.355,0.030,8,28), matWhite);
  neckRing.rotation.x=Math.PI/2; neckRing.position.y=-0.285; hel.add(neckRing);
  // Đèn trạng thái + ăngten nằm trên đỉnh vỏ
  const led=new THREE.Mesh(new THREE.SphereGeometry(0.038,10,8),
        new THREE.MeshStandardMaterial({color:0x7dff9c, emissive:0x22ff55, emissiveIntensity:1.5}));
  led.position.set(-0.20,0.30,0.14); hel.add(led);
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.21,5), matChrome);
  ant.position.set(-0.16,0.40,-0.12); ant.rotation.z=-0.35; ant.rotation.x=0.24; hel.add(ant);
  // Huy hiệu Mèo Vàng trên vỏ sau
  const helBadge=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.13,0.19), matRed);
  helBadge.position.set(-0.395,0.06,0); hel.add(helBadge);
  // Bản lề mũ (2 bên)
  for(const s of [1,-1]){
    const hinge=new THREE.Mesh(new THREE.CylinderGeometry(0.036,0.036,0.075,9), matChrome);
    hinge.rotation.x=Math.PI/2; hinge.position.set(0.02,0.02,s*0.385); hel.add(hinge);
  }

  // ---------- CHÂN SAU (bàn chân có ngón + đệm) ----------
  const paws=[];
  function makeLeg(hx,hy,hz,fx,fy,fz,s){
    const lg=new THREE.Group();
    const hipM=new THREE.Mesh(new THREE.SphereGeometry(0.115,12,10), matFur);
    hipM.position.set(hx,hy,hz); lg.add(hipM);
    const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(0.072,0.20,4,10), matFur);
    thigh.position.set((hx+fx)/2,(hy+fy)/2,(hz+fz)/2); aim(thigh,fx-hx,fy-hy,fz-hz); lg.add(thigh);
    const kx=fx+s*0.085, ky=fy+0.03, kz=fz;
    const shin=new THREE.Mesh(new THREE.CapsuleGeometry(0.053,0.19,4,10), matFur);
    shin.position.set((fx+kx)/2,(fy+ky)/2,(fz+kz)/2); aim(shin,kx-fx,ky-fy,kz-fz); lg.add(shin);
    const paw=new THREE.Group(); paw.position.set(kx,ky-0.03,kz);
    const pad=new THREE.Mesh(new THREE.SphereGeometry(0.072,12,10), matCream);
    pad.scale.set(1.25,0.6,0.95); paw.add(pad);
    for(let i=0;i<3;i++){
      const toe=new THREE.Mesh(new THREE.SphereGeometry(0.034,8,6), matCream);
      toe.scale.set(1.1,0.58,0.88); toe.position.set(0.062,-0.010,(i-1)*0.048); paw.add(toe);
      const bean=new THREE.Mesh(new THREE.SphereGeometry(0.017,6,5), matPink);
      bean.scale.set(1,0.4,1.25); bean.position.set(0.018,-0.028,(i-1)*0.048); paw.add(bean);
    }
    lg.add(paw); cat.add(lg); paws.push(paw); return paw;
  }
  const footBike=[0.06,1.18,0.175], footOther=[0.10,1.10,0.215];
  const f = (type==='bike') ? footBike : footOther;
  for(const s of [1,-1]) makeLeg(-0.30,1.46,s*0.155, f[0],f[1],s*f[2], s);

  // ---------- ĐUÔI 5 ĐỐT ----------
  const tail=new THREE.Group();
  let px=0, py=0, r0=0.088;
  const segs=[];
  for(let i=0;i<5;i++){
    const seg=new THREE.Group();
    const rr=r0*(1-i*0.11);
    const m=new THREE.Mesh(new THREE.CapsuleGeometry(rr,0.185,4,12), (i===4)? matCream : matFur);
    m.rotation.z=Math.PI/2; m.position.set(-0.115,0,0); seg.add(m);
    if(i<4){                                   // vòng sọc nối đốt
      const ring=new THREE.Mesh(new THREE.TorusGeometry(rr*0.98,0.013,5,14), matFurD);
      ring.rotation.y=Math.PI/2; ring.position.set(-0.205,0,0); seg.add(ring);
    }
    seg.position.set(px,py,0);
    seg.rotation.z=0.26+i*0.15;                 // cong lên dần -> đuôi mềm
    tail.add(seg); segs.push(seg);
    px-=0.215; py+=0.045;
  }
  tail.position.set(-0.44,1.40,0); tail.scale.set(0.92,0.92,0.92);
  cat.add(tail); vRefs.tail=tail; vRefs.tailSegs=segs;
  // ══════ HAI CÁNH TAY LÁI XE ══════
  // Mèo ngồi trên yên, hai tay vươn ra nắm ghi đông. Mỗi tay gồm: cánh tay
  // (xoay được ở vai) + bàn tay (xoay ở cổ tay) + mũi ên nhô ra. Nhờ vRefs
  // mà góc nhìn thứ nhất thấy rõ Mèo đang lái: cánh tay bám ghi đông, bàn tay
  // xoay theo vô-lăng, tay nhấp nhô khi xe lên xuống.
  const armMat = new THREE.MeshStandardMaterial({color:0xffc93c, roughness:0.82});
  const pawMat  = new THREE.MeshStandardMaterial({color:0xfff3cf, roughness:0.62});
  const clawMat = new THREE.MeshStandardMaterial({color:0x3a2a18, roughness:0.5});
  vRefs.arms = [];
  for(const side of [1,-1]){
    const shoulder = new THREE.Group();
    shoulder.position.set(0.10, 1.66, side*0.19);       // vai (thấp & rộng để tay thấy rõ)
    // Bắp vai (khối cầu) cho vai tròn, không phải mối nối thô
    const deltoid=new THREE.Mesh(new THREE.SphereGeometry(0.088,12,10), armMat);
    deltoid.scale.set(1,0.95,0.9); shoulder.add(deltoid);
    // Cánh tay trên: capsule, chĩa +X
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062,0.16,4,10), armMat);
    upper.rotation.z = Math.PI/2; upper.position.set(0.15,0,0);
    shoulder.add(upper);
    // Cánh tay dưới (rùn hơn) nối khuỷu -> cổ tay
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.052,0.15,4,10), armMat);
    fore.rotation.z = Math.PI/2; fore.position.set(0.27,0,0);
    shoulder.add(fore);
    // Cổ tay (xoay được)
    const wrist = new THREE.Group();
    wrist.position.set(0.34,0,0);
    // Lòng bàn: bàn tay dẹt, hướng +X
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.082,14,12), pawMat);
    paw.scale.set(1.15,0.72,0.95); paw.position.set(0.022,0,0);
    wrist.add(paw);
    // 4 ngón + vuốt ôm ghi đông
    for(let f=0; f<4; f++){
      const ty=(f-1.5)*0.042;
      const toe = new THREE.Mesh(new THREE.CapsuleGeometry(0.021,0.055,3,8), pawMat);
      toe.position.set(0.075, -0.030, ty);
      toe.rotation.x = Math.PI/2; toe.rotation.z = -0.55;
      wrist.add(toe);
      // vuốt nhỏ màu sẫm ở đầu ngón
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.011,0.028,6), clawMat);
      claw.position.set(0.098, -0.046, ty);
      claw.rotation.x = -Math.PI/2; claw.rotation.z = -0.55;
      wrist.add(claw);
    }
    // Ngón cái ôm bên trong
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.019,0.04,3,7), pawMat);
    thumb.position.set(0.02,-0.032, side*0.062); thumb.rotation.x=Math.PI/2; thumb.rotation.z=0.5;
    wrist.add(thumb);
    // Đệm ngón hồng (màu hồng) ở lòng bàn
    const bean = new THREE.Mesh(new THREE.SphereGeometry(0.026,8,6), matPink);
    bean.scale.set(1,0.35,1.2); bean.position.set(0.028,-0.046,0);
    wrist.add(bean);
    shoulder.add(wrist);
    cat.add(shoulder);
    vRefs.arms.push({ shoulder, wrist, side });
  }

  // Nâng cả Mèo lên trên yên
  const catLift=new THREE.Group();
  catLift.position.y=BODY_Y;
  catLift.add(cat);
  g.add(catLift);
  cat.name='cat';
  // Đèn phụ gắn theo xe: giữ Mèo & cánh tay luôn đủ sáng khi nhìn từ góc
  // thứ nhất, tránh bóng tối đọc không ra hình dạng.
  const keyLight=new THREE.PointLight(0xffd9a0, 1.15, 6, 2);
  keyLight.position.set(0.55, 2.4, 0.15);
  g.add(keyLight);
  const fillLight=new THREE.PointLight(0xffb877, 0.55, 5, 2);
  fillLight.position.set(-0.5, 1.9, -0.5);
  g.add(fillLight);
  player.add(g);

  // ---- AUTO-CALIBRATE ride height --------------------------------------
  // ride = world Y của đáy bánh khi group ĐẶT TẠI GỐC. Phải tạm dời group về
  // y=0 (và bỏ rotation) trước khi đo, nếu không sẽ đo theo vị trí hiện tại và
  // ra số sai -> xe lơ lửng.
  const _sPos=player.position.clone(), _sRot=player.rotation.clone();
  player.position.set(0,0,0);
  player.rotation.set(0,0,0,'YXZ');
  player.updateMatrixWorld(true);
  let lowest=Infinity;
  for(const w of vRefs.wheels){
    if(!w) continue;
    w.updateMatrixWorld(true);
    const bottom = w.getWorldPosition(_calTmp).y - (w.userData.r||0);
    if(bottom<lowest) lowest=bottom;
  }
  // CHƯA restore ở đây: phần đo cache bên dưới cũng cần group ở gốc.
  // (Trước đây restore sớm khiến cache đo tại vị trí thật → ride sai → xe
  //  lơ lửng hàng mét.)

  // ---- Suy ra điểm tiếp xúc từ vị trí bánh THẬT --------------------------
  // conf.wheels trước đây hard-code và lệch với model (đặc biệt rover có 6
  // bánh trong các group leg lồng nhau) -> xe bị treo lơ lửng. Đọc thẳng từ
  // world matrix nên luôn khớp với hình học, kể cả khi sửa model sau này.
  // Vị trí bánh phải CHUYỂN VỀ KHÔNG GIAN CỤC BỘ của group `g` (xe), không
  // phải world: bánh rover nằm trong các group `leg` đã xoay, nên world offset
  // bị xoay theo và sai hoàn toàn. Dùng g.worldToLocal trên điểm bánh.
  // Cache đủ thông tin để tính clearance mà không cần world matrix:
  //   x,z = offset cục bộ (đã trừ cấu trúc leg lồng nhau), y = đáy bánh.
  // group `g` đang ở y=0 lúc này (đã đặt ở đầu hàm) nên world == local:
  // y chính là cao độ đáy bánh so với gốc group. Dùng getWorldPosition rồi
  // worldToLocal sẽ ra đúng, NHƯNG phải đảm bảo ma trận đã cập nhật.
  const cache=[];
  for(const w of vRefs.wheels){
    if(!w) continue;
    w.updateMatrixWorld(true);
    w.getWorldPosition(_calTmp);
    // worldToLocal SỬA CHỈNH TẠI chính _calTmp — phải đọc ra số trước rồi mới
    // chuyển, nếu không vị trí của bánh trước sẽ bị bánh sau ghi đè (biến chung).
    const wxp=_calTmp.x, wyp=_calTmp.y, wzp=_calTmp.z;
    g.worldToLocal(_calTmp);
    cache.push({ x:_calTmp.x, z:_calTmp.z, y:wyp, r:(w.userData.r||0) });
  }
  if(cache.length>=3){
    wCache = cache;
    VEHICLES[type].wheels = cache.map(c=>[+c.x.toFixed(4), +c.z.toFixed(4)]);
    // ride = đáy bánh THẤP NHẤT đo bằng world matrix thật (group đang ở gốc).
    // Không dùng c.y-c.r vì bánh rover nằm trong group `leg` đã xoay, nên cao độ
    // local khác cao độ thực tế -> ride lệch -> xe treo lơ lửng cả mét.
    let lowWorld = Infinity;
    for(const w of vRefs.wheels){
      if(!w) continue;
      w.updateMatrixWorld(true);
      const wy = w.getWorldPosition(_calTmp).y;
      const bottom = wy - (w.userData.r||0);
      if(bottom < lowWorld) lowWorld = bottom;
    }
    if(Number.isFinite(lowWorld)) VEHICLES[type].ride = lowWorld;
  }
  // Đã đo xong ở gốc → trả group về vị trí thật.
  player.position.copy(_sPos);
  player.rotation.copy(_sRot);
}

buildVehicle(vehicleType);

// wheel spin helper: find wheels by traversal and spin
let wheelSpin=0;
let targetPitch=0, targetRoll=0;


// ══════ ĐỘNG TÁC LÁI: cánh tay Mèo Vàng bám ghi đông ══════
// Mục tiêu: nhìn từ góc thứ nhất phải ĐỌC ĐƯỢC ra Mèo đang lái thế nào —
//   • tay bám đúng lên ghi đông/vô-lăng của từng xe (dùng vRefs.barPos)
//   • bàn tay xoay theo góc lái thật (input.l-r) → thấy vô-lăng đang nghiêng
//   • vai nhấp nhô nhẹ khi xe chạy, tay hơi chùng xuống khi chạy chậm
//   • ghi đông xoay theo bánh xe đang quay
let steerVis = 0, armBob = 0;
function updateRidingPose(dt, steerInput, speed, boosting){
  if(!vRefs.arms || !vRefs.arms.length) return;
  const bar = vRefs.barPos;
  if(!bar) return;

  // Góc lái hiển thị: nội suy mềm về 0 khi không vào cua
  const target = THREE.MathUtils.clamp(steerInput, -1, 1);
  steerVis += (target - steerVis) * Math.min(1, dt*9);
  const swing = steerVis * 0.62;                    // rad, ~36° khi hết cỡ

  // Nhịp nhấp nhô: nhanh khi chạy nhanh, gần như đứng yên khi dừng
  const sp = Math.min(1, Math.abs(speed)/8);
  armBob += dt * (2.2 + sp*9.0);
  const bobAmt = sp * 0.035;

  for(const arm of vRefs.arms){
    const s = arm.side;                              // +1 trái, -1 phải
    // Vị trí bàn tay: hai bên ghi đông, cách nhau 2*halfW
    const hy = bar.y + bobAmt*Math.sin(armBob) + 0.02;   // ngay trên ghi đông

    // Mèo nằm trong catLift (đã nâng BODY_LIFT khỏi yên), còn vRefs.barPos.y là
    // toạ độ trong group XE. Nên cả vai lẫn bàn tay phải cùng hệ toạ độ.
    //   vai:  y = 1.66            (local trong catLift)
    //   tay:  y = bar.y - BODY_LIFT  (đưa về local của catLift)
    // Vai ở ngực (local y ~1.44), bàn tay với đúng ghi đông. Chiều dài cánh tay
    // = khoảng cách vai->tay, nên tự co giãn theo.
    const sy = 1.44;
    const sx = 0.12, sz = 0.21*s;
    const hyCat = hy - BODY_LIFT;
    // Bàn tay phải nằm ở đúng barPos.x (trục dọc của xe), không phải hx:
    // hx chỉ là độ lệch bên, ta ghép lại thành toạ độ đầy đủ.
    // Hai tay nắm hai đầu ghi đông: dọc theo trục xe (bar.x) và lệch nhau
    // về hai bên ở bar.halfW — nếu cùng z=0 thì hai tay chồng lên nhau.
    const tx = bar.x, tz = bar.halfW * s * 0.82;
    let dx = tx - sx, dy = hyCat - sy, dz = tz - sz;
    const len = Math.hypot(dx,dy,dz) || 1e-6;
    dx/=len; dy/=len; dz/=len;

    // Đặt cánh tay hướng về bàn tay: quaternion từ trục X sang vector (dx,dy,dz)
    arm.shoulder.position.set(sx, sy, sz);
    _armQ.setFromUnitVectors(_armX.set(1,0,0), _armV.set(dx,dy,dz));
    arm.shoulder.quaternion.copy(_armQ);
    // Cánh tay dài = khoảng cách vai->tay, nên scale theo
    arm.shoulder.scale.set(len/0.34, 1, 1);

    // Bàn tay: hơi nghiêng theo góc lái (bàn tay trên vô-lăng xoay theo)
    arm.wrist.rotation.z = swing * 0.45;
    arm.wrist.rotation.x = -0.5 + swing*0.12;
    arm.wrist.position.set(0.34, 0, 0);
  }

  // Ghi đông/vô-lăng xoay theo góc lái (nhìn thấy rõ từ góc thứ nhất)
  if(vRefs.rim) vRefs.rim.rotation.z = swing;
  // Dao động nhẹ khi boost
  if(boosting) for(const arm of vRefs.arms) arm.wrist.rotation.y = Math.sin(now*0.05)*0.12;
}

// ---------- Camera helpers ----------
let camMode=1; // 0 first, 1 third, 2 orbit
let camYaw=0.6, camPitch=0.28, camDist=10;
let isDragging=false, lastX=0, lastY=0;

const _camTmp=new THREE.Vector3(), _camFwd=new THREE.Vector3(), _camLook=new THREE.Vector3();

// camera KHÔNG được chui xuống đất: nâng lên nếu thấp hơn mặt đất tại vị trí đó
function keepCamAboveGround(min=1.2){
  const g=sampleHeight(camera.position.x, camera.position.z)+min;
  if(camera.position.y < g) camera.position.y = g;
}
function updateCamera(dt){
  const py = sampleHeight(playerPos.x, playerPos.z)+1.2;
  if(photoMode || camMode===2){
    const r=camDist;
    const x = playerPos.x + Math.cos(camYaw)*Math.cos(camPitch)*r;
    const y = py + Math.sin(camPitch)*r + 1.0;
    const z = playerPos.z + Math.sin(camYaw)*Math.cos(camPitch)*r;
    camera.position.lerp(_camTmp.set(x,y,z), 0.12);
    keepCamAboveGround(0.8);
    camera.lookAt(playerPos.x, py, playerPos.z);
    return;
  }
  if(camMode===0){
    // ── GÓC NHÌN THỨ NHẤT: NGỒI SAU LƯNG MÈO ──
    // Camera đặt ngay sau đầu Mèo Vàng và cao hơn một chút, hơi cúi xuống.
    // Nhờ vậy khung hình luôn có: đầu mèo (mũ + tai) ở giữa dưới, HAI CÁNH TAY
    // vươn ra nắm ghi đông, và bàn tay xoay theo góc lái — đọc được ngay
    // Mèo đang lái sang trái hay phải, đang nhanh hay chậm.
    // Camera lùi lại SAU VAI MÈO một chút (và cao hơn đầu), để khung hình có
    // đủ khoảng cho: vai + hai cánh tay đang nắm ghi đông ở nửa dưới, còn
    // phía trên mở ra tầm nhìn đường đi. Khoảng cách ~1.1m + nhìn xuống nhẹ.
    const fwd=_camFwd.set(Math.cos(playerYaw),0,Math.sin(playerYaw));
    const right=_camTmp.set(-fwd.z,0,fwd.x);              // hướng bên phải
    // Rover cabin to hơn & mèo ngồi cao hơn -> camera phải lùi xa và cao hơn
    // một chút, nếu không cabin sẽ chiếm gần hết khung hình.
    const isRover = vehicleType === 'rover';
    // GÓC NHÌN QUA VAI (over-the-shoulder): đứng hơi lệch sang phải + cao,
    // nhìn chếch qua thân Mèo. Nhờ vậy thấy ĐỒNG THỜI: đầu mèo (trái khung),
    // hai cánh tay nắm ghi đông (giữa dưới) và tầm nhìn đường đi (trên).
    // Đặt sát SAU ĐẦU Mèo (headG ở local (0.30, 1.78) + BODY_Y 0.13 -> ~1.91m).
    // Ở đây thân không che tay, mà đầu/tai/mũ vẫn lọt vào góc dưới khung.
    // Số đo thực tế (world matrix): mắt Mèo y≈2.68, ghi đông y≈1.83, tay y≈1.85.
    // -> Camera đặt tại mắt Mèo (y≈2.80) và nhìn XUỐNG ~20° để thấy cả hai bàn
    //    tay nắm ghi đông ở nửa dưới khung mà vẫn thoáng tầm nhìn phía trước.
    // (Đầu + mũ được ẩn ở camMode 0 — self-head, đúng như game lái xe thật.)
    const O = (typeof window!=='undefined' && window.__ycFPV) || null;
    // Rover: cabin rộng + vô-lăng ở x=0.62 (gần) -> camera lùi xa hơn để tay
    // không phình to; bike/moto đặt ngay tại mắt Mèo.
    const shoulder = O ? O.sh : 0.0;
    // Neo camera theo BÀN TAY THẬT (world matrix). Rover có cabin rộng + vô-lăng
    // thấp nên dùng thông số riêng (chọn qua probe: RB tốt nhất).
    const bar = vRefs.barPos || {x:1.05, y:1.12, halfW:0.25};
    let handY = bar.y, handX = bar.x;
    if(vRefs.arms && vRefs.arms.length){ player.updateMatrixWorld(true); vRefs.arms[0].wrist.getWorldPosition(_camTmp); handY=_camTmp.y; handX=_camTmp.x; }
    const upH   = O ? O.up : (isRover ? 2.20 : (handY + 0.34 - playerPos.y));
    const backH = O ? O.bk : (isRover ? -0.80 : (handX - playerPos.x) - 1.15);
    camera.position.copy(playerPos).addScaledVector(fwd, backH);
    camera.position.y = playerPos.y + upH;
    keepCamAboveGround(0.9);
    // Nhìm về điểm trước-thấp: vừa thấy tay, vừa thấy đường
    const lookAhead = O ? O.la : 10.0;
    _camLook.copy(playerPos).addScaledVector(fwd, lookAhead)
      .addScaledVector(right, shoulder*0.35);
    // ly âm = nhìn xuống: điểm nhìn thấp hơn mặt đất để bàn tay lọt vào khung
    // Điểm nhìn: thấp hơn camera ~1.9m ở xa 10m -> góc nhìn xuống tự nhiên
    _camLook.y = playerPos.y + (O ? O.ly : (isRover ? -2.60 : (upH - 1.75)));
    // Nghiêng theo góc lái -> cảm giác vào cua
    _camLook.addScaledVector(right, steerVis * 2.2);
    camera.lookAt(_camLook);
  } else {
    const r=camDist;
    const yaw = playerYaw + 0.15;
    const x = playerPos.x - Math.cos(yaw)*r*0.95;
    const z = playerPos.z - Math.sin(yaw)*r*0.95;
    const y = sampleHeight(playerPos.x, playerPos.z)+ 2.8 + Math.sin(0.35)*1.2;
    const tx = THREE.MathUtils.lerp(camera.position.x, x, 0.08);
    const tz = THREE.MathUtils.lerp(camera.position.z, z, 0.08);
    let ty = THREE.MathUtils.lerp(camera.position.y, y, 0.08);
    camera.position.set(tx,ty,tz);
    keepCamAboveGround(1.4);
    camera.lookAt(playerPos.x, sampleHeight(playerPos.x, playerPos.z)+1.0, playerPos.z);
  }
}
// ---------- Heightfield: đọc CHÍNH mesh đang vẽ (nguồn sự thật duy nhất) ----------
// Lý do: mesh là tam giác phẳng nội suy giữa 161×161 vertex. heightAt() là hàm
// giải tích liên tục -> ở GIỮA Ô nó khác bề mặt thật, khiến xe chìm/xuyên địa hình.
// Ta dựng heightfield từ chính posAttr của terrain rồi nội suy tam giác — khớp 100% GPU.
// ---------- Minimap ----------
const miniCtx=minimap.getContext('2d');
const bigCtx=bigmap.getContext('2d');
let bigScale=0.42, bigOffset={x:0,y:0};
let draggingMap=false, lastMapX=0,lastMapY=0;

function drawMini(){
  const w=minimap.width, h=minimap.height;
  miniCtx.clearRect(0,0,w,h);
  // gradient mars
  const g=miniCtx.createRadialGradient(w/2,h/2,10,w/2,h/2,90);
  g.addColorStop(0,'#ff9a5c'); g.addColorStop(0.5,'#c1440e'); g.addColorStop(1,'#2a140a');
  miniCtx.fillStyle=g; miniCtx.fillRect(0,0,w,h);
  // grid
  miniCtx.strokeStyle='rgba(255,255,255,0.08)'; miniCtx.lineWidth=1;
  for(let i=0;i<w;i+=28){ miniCtx.beginPath(); miniCtx.moveTo(i,0); miniCtx.lineTo(i,h); miniCtx.stroke(); }
  for(let i=0;i<h;i+=28){ miniCtx.beginPath(); miniCtx.moveTo(0,i); miniCtx.lineTo(w,i); miniCtx.stroke(); }
  // biomes
  for(const b of BIOMES){
    const mx=(b.pos.x/TERRAIN_SIZE)*w + w/2;
    const my=(b.pos.z/TERRAIN_SIZE)*h + h/2;
    miniCtx.fillStyle=b.id==='polar'?'#e8ddd0':b.color;
    miniCtx.globalAlpha=0.95;
    miniCtx.beginPath(); miniCtx.arc(mx,my, 8,0,Math.PI*2); miniCtx.fill();
    miniCtx.globalAlpha=1;
    miniCtx.strokeStyle='rgba(255,255,255,0.9)'; miniCtx.lineWidth=1.5; miniCtx.stroke();
    miniCtx.fillStyle='rgba(255,255,255,0.9)'; miniCtx.font='700 7px Space Grotesk'; miniCtx.textAlign='center';
    miniCtx.fillText(b.name.split(' ')[0], mx, my+18);
  }
  // player
  const px=(playerPos.x/TERRAIN_SIZE)*w + w/2;
  const pz=(playerPos.z/TERRAIN_SIZE)*h + h/2;
  const dot=document.getElementById('mini-dot');
  dot.style.left=px+'px'; dot.style.top=pz+'px';
  // heading line
  miniCtx.strokeStyle='#ffcc33'; miniCtx.lineWidth=2;
  miniCtx.beginPath(); miniCtx.moveTo(px,pz); miniCtx.lineTo(px+Math.cos(playerYaw)*16, pz+Math.sin(playerYaw)*16); miniCtx.stroke();
  // POI markers (undiscovered)
  for(const poi of POIS){
    if(discovered.has(poi.id)) continue;
    const mx=(poi.pos.x/TERRAIN_SIZE)*w + w/2;
    const my=(poi.pos.z/TERRAIN_SIZE)*h + h/2;
    miniCtx.fillStyle='rgba(255,204,51,0.95)'; miniCtx.strokeStyle='#fff'; miniCtx.lineWidth=1.2;
    miniCtx.beginPath(); miniCtx.arc(mx,my,3.2,0,Math.PI*2); miniCtx.fill(); miniCtx.stroke();
  }
  // paws
  for(const p of pawItems){
    if(!p.visible) continue;
    const mx=(p.position.x/TERRAIN_SIZE)*w + w/2;
    const my=(p.position.z/TERRAIN_SIZE)*h + h/2;
    miniCtx.fillStyle='#ffcc33'; miniCtx.beginPath(); miniCtx.arc(mx,my,2.5,0,Math.PI*2); miniCtx.fill();
  }
}

function drawBigMap(){
  const w=bigmap.width, h=bigmap.height;
  bigCtx.clearRect(0,0,w,h);
  const bg=bigCtx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'#1a0f0a'); bg.addColorStop(1,'#3a1a0a');
  bigCtx.fillStyle=bg; bigCtx.fillRect(0,0,w,h);
  bigCtx.save();
  bigCtx.translate(w/2+bigOffset.x, h/2+bigOffset.y);
  bigCtx.scale(bigScale, bigScale);
  // terrain preview via height shading (sample grid)
  const step=22;
  for(let x=-TERRAIN_SIZE/2; x<TERRAIN_SIZE/2; x+=step){
    for(let z=-TERRAIN_SIZE/2; z<TERRAIN_SIZE/2; z+=step){
      const hh=sampleHeight(x,z);
      const t=THREE.MathUtils.clamp((hh+10)/110,0,1);
      const r=Math.floor(180+t*70), g=Math.floor(70+t*60), b=Math.floor(30+t*20);
      const bi=biomeAt(x,z).biome;
      let rr=r,gg=g,bb=b;
      if(bi.id==='polar'){ rr=210; gg=205; bb=195; }
      if(bi.id==='storm'){ rr=140; gg=70; bb=30; }
      bigCtx.fillStyle=`rgb(${rr},${gg},${bb})`;
      bigCtx.fillRect(x, z, step-1, step-1);
    }
  }
  // biome labels
  for(const b of BIOMES){
    bigCtx.fillStyle='rgba(255,255,255,0.96)';
    bigCtx.beginPath(); bigCtx.arc(b.pos.x, b.pos.z, 14,0,Math.PI*2); bigCtx.fill();
    bigCtx.fillStyle='#1a0f0a'; bigCtx.font='800 11px Space Grotesk'; bigCtx.textAlign='center';
    bigCtx.fillText(b.icon, b.pos.x, b.pos.z+4);
    bigCtx.fillStyle='rgba(255,255,255,0.9)'; bigCtx.font='700 10px Space Grotesk';
    bigCtx.fillText(b.name, b.pos.x, b.pos.z+26);
  }
  // POI markers
  for(const poi of POIS){
    const isDone=discovered.has(poi.id);
    bigCtx.fillStyle=isDone?'rgba(255,255,255,0.42)':'#ffcc33'; bigCtx.strokeStyle=isDone?'rgba(255,255,255,0.6)':'#1a0f0a'; bigCtx.lineWidth=2;
    bigCtx.beginPath(); bigCtx.arc(poi.pos.x, poi.pos.z, 8,0,Math.PI*2); bigCtx.fill(); bigCtx.stroke();
    bigCtx.fillStyle=isDone?'rgba(255,255,255,0.7)':'#1a0f0a'; bigCtx.font='700 8px Space Grotesk'; bigCtx.textAlign='center';
    bigCtx.fillText(poi.icon, poi.pos.x, poi.pos.z+3);
  }
  // paws
  for(const p of pawItems){
    if(!p.visible) continue;
    bigCtx.fillStyle='#ffcc33'; bigCtx.strokeStyle='#1a0f0a'; bigCtx.lineWidth=2;
    bigCtx.beginPath(); bigCtx.arc(p.position.x,p.position.z,5,0,Math.PI*2); bigCtx.fill(); bigCtx.stroke();
  }
  // player
  bigCtx.fillStyle='#ffcc33'; bigCtx.strokeStyle='#fff'; bigCtx.lineWidth=3;
  bigCtx.beginPath(); bigCtx.arc(playerPos.x, playerPos.z, 9,0,Math.PI*2); bigCtx.fill(); bigCtx.stroke();
  bigCtx.strokeStyle='#ffcc33'; bigCtx.lineWidth=2;
  bigCtx.beginPath(); bigCtx.moveTo(playerPos.x, playerPos.z); bigCtx.lineTo(playerPos.x+Math.cos(playerYaw)*22, playerPos.z+Math.sin(playerYaw)*22); bigCtx.stroke();
  // target
  const tb=BIOMES[targetBiomeIdx];
  bigCtx.strokeStyle='rgba(255,204,51,0.9)'; bigCtx.setLineDash([6,6]); bigCtx.lineWidth=2;
  bigCtx.strokeRect(tb.pos.x-24, tb.pos.z-24, 48,48); bigCtx.setLineDash([]);
  bigCtx.restore();
  // overlay info
  bigCtx.fillStyle='rgba(0,0,0,0.45)'; bigCtx.fillRect(10,10,210,26);
  bigCtx.fillStyle='rgba(255,255,255,0.9)'; bigCtx.font='10px JetBrains Mono'; bigCtx.textAlign='left';
  bigCtx.fillText('Kéo để di chuyển · Cuộn để zoom', 16,26);
}

// ---------- Overlays wiring ----------
function renderBiomeList(){
  const el=document.getElementById('biome-list');
  el.innerHTML='';
  BIOMES.forEach((b,i)=>{
    const d=document.createElement('button');
    d.style.cssText=`text-align:left;background:${i===targetBiomeIdx?'rgba(255,204,51,0.14)':'rgba(255,255,255,0.04)'};border:1px solid ${i===targetBiomeIdx?'rgba(255,204,51,0.5)':'rgba(255,255,255,0.08)'};padding:10px 11px;border-radius:12px;cursor:pointer;color:#fff;display:flex;gap:10px;align-items:center;width:100%`;
    d.innerHTML=`<span style="font-size:18px">${b.icon}</span><span style="flex:1"><b style="font-family:Baloo 2,cursive;font-size:13px">${b.name}</b><br><span style="font-size:11px;color:var(--muted)">${b.desc.slice(0,54)}…</span></span><span style="font-size:11px;color:var(--accent)">${i===targetBiomeIdx?'● ':''}${Math.round(Math.hypot(playerPos.x-b.pos.x, playerPos.z-b.pos.z))}m</span>`;
    d.onclick=()=>{ targetBiomeIdx=i; renderBiomeList(); drawBigMap(); };
    el.appendChild(d);
  });
}

// map interactions
bigmap.addEventListener('mousedown', e=>{ draggingMap=true; lastMapX=e.clientX; lastMapY=e.clientY; });
addEventListener('mouseup', ()=> draggingMap=false);
addEventListener('mousemove', e=>{
  if(draggingMap){ bigOffset.x+= e.clientX-lastMapX; bigOffset.y+= e.clientY-lastMapY; lastMapX=e.clientX; lastMapY=e.clientY; drawBigMap(); }
});
bigmap.addEventListener('wheel', e=>{
  e.preventDefault();
  const d = e.deltaY>0?0.92:1.08;
  bigScale = THREE.MathUtils.clamp(bigScale*d, 0.25, 1.4);
  drawBigMap();
},{passive:false});
bigmap.addEventListener('click', e=>{
  if(draggingMap) return;
  const rect=bigmap.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*bigmap.width;
  const y=(e.clientY-rect.top)/rect.height*bigmap.height;
  const worldX=(x - bigmap.width/2 - bigOffset.x)/bigScale;
  const worldZ=(y - bigmap.height/2 - bigOffset.y)/bigScale;
  // find nearest biome
  let best=0, bd=Infinity;
  BIOMES.forEach((b,i)=>{ const d=Math.hypot(worldX-b.pos.x, worldZ-b.pos.z); if(d<bd){bd=d; best=i;} });
  targetBiomeIdx=best; renderBiomeList(); drawBigMap();
});

// ---------- Input ----------
addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  if(k==='w' || k==='arrowup') input.f=1;
  if(k==='s' || k==='arrowdown') input.b=1;
  if(k==='a' || k==='arrowleft') input.l=1;
  if(k==='d' || k==='arrowright') input.r=1;
  if(e.shiftKey) input.boost=true;
  if(k==='c' && !photoMode){ camMode=(camMode+1)%3; if(camMode===2) photoMode=false; updateHint(); }
  if(k==='m') toggleMap();
  if(k==='p') togglePhoto();
  if(k==='l'){ timeOfDay=(timeOfDay+0.25)%1; applyTime(); }
  if(k==='h') toggleHelp();
  if(k==='escape'){ if(photoMode) togglePhoto(false); if(!overlayMap.classList.contains('hidden')) toggleMap(false); }
});

addEventListener('keyup', e=>{
  const k=e.key.toLowerCase();
  if(k==='w' || k==='arrowup') input.f=0;
  if(k==='s' || k==='arrowdown') input.b=0;
  if(k==='a' || k==='arrowleft') input.l=0;
  if(k==='d' || k==='arrowright') input.r=0;
  if(!e.shiftKey) input.boost=false;
});

// mouse drag camera
canvas.addEventListener('mousedown', e=>{ if(photoMode || camMode===2){ isDragging=true; lastX=e.clientX; lastY=e.clientY; } });
addEventListener('mouseup', ()=> isDragging=false);
addEventListener('mousemove', e=>{
  if(!isDragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY;
  lastX=e.clientX; lastY=e.clientY;
  camYaw += dx*0.004;
  camPitch = THREE.MathUtils.clamp(camPitch - dy*0.004, -0.25, 1.15);
  if(!photoMode) camDist = THREE.MathUtils.clamp(camDist, 5, 28);
});
canvas.addEventListener('wheel', e=>{
  if(photoMode || camMode===2){ e.preventDefault(); camDist = THREE.MathUtils.clamp(camDist + e.deltaY*0.012, 3.5, 42); }
},{passive:false});

// joystick
(function(){
  const joy=document.getElementById('joystick');
  const stick=document.getElementById('joy-stick');
  let active=false, start={x:0,y:0};
  function pos(e){ const t=e.touches?e.touches[0]:e; return {x:t.clientX, y:t.clientY}; }
  function handle(e){
    const rect=joy.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const p=pos(e);
    let dx=p.x-cx, dy=p.y-cy;
    const len=Math.hypot(dx,dy), max=42;
    if(len>max){ dx=dx/len*max; dy=dy/len*max; }
    stick.style.transform=`translate(${dx}px, ${dy}px)`;
    joyVec.x = dx/max; joyVec.y = dy/max;
  }
  joy.addEventListener('touchstart', e=>{ active=true; joyActive=true; handle(e); e.preventDefault(); },{passive:false});
  joy.addEventListener('touchmove', e=>{ if(active) handle(e); e.preventDefault(); },{passive:false});
  joy.addEventListener('touchend', ()=>{ active=false; joyActive=false; joyVec.x=0; joyVec.y=0; stick.style.transform='translate(0,0)'; });
  // mouse fallback
  joy.addEventListener('mousedown', e=>{ active=true; joyActive=true; handle(e); });
  addEventListener('mousemove', e=>{ if(active) handle(e); });
  addEventListener('mouseup', ()=>{ if(active){ active=false; joyActive=false; joyVec.x=0; joyVec.y=0; stick.style.transform='translate(0,0)'; } });
})();

function applyTime(){
  const t=timeOfDay;
  // sky
  skyMat.uniforms.t.value=t;
  const sunH = Math.sin(t*Math.PI*2 - Math.PI/2);
  sun.position.set(300*Math.cos(t*Math.PI*2), 120+ sunH*340, 100);
  sun.intensity = THREE.MathUtils.lerp(0.35, 1.6, THREE.MathUtils.clamp((sunH+0.5),0,1));
  ambient.intensity = THREE.MathUtils.lerp(0.35, 0.9, THREE.MathUtils.clamp((sunH+0.7),0,1));
  stars.material.opacity = THREE.MathUtils.clamp(0.65 - sunH*0.8, 0, 0.65);
  // fog color
  const fogC = new THREE.Color().lerpColors(new THREE.Color(0x2a140a), new THREE.Color(0x1a0f0a), THREE.MathUtils.clamp(sunH,0,1));
  scene.fog.color.copy(fogC);
  renderer.setClearColor(fogC, 1);
}

function updateHint(){
  const names=['Góc nhìn thứ nhất','Góc nhìn thứ ba','Orbit tự do'];
  hudHint.innerHTML = `<kbd>C</kbd> ${names[camMode]} · <kbd>WASD</kbd> di chuyển · <kbd>Shift</kbd> boost · <kbd>M</kbd> bản đồ · <kbd>P</kbd> photo`;
}

// ---------- Save / Toast ----------
function save(){
  localStorage.setItem(STORAGE_KEY+'_vehicle', vehicleType);
  localStorage.setItem(STORAGE_KEY+'_paws', JSON.stringify(collected));
  localStorage.setItem(STORAGE_KEY+'_dist', String(distance));
  localStorage.setItem(STORAGE_KEY+'_biomes', JSON.stringify([...visitedBiomes]));
  localStorage.setItem(DISCOVERED_KEY, JSON.stringify([...discovered]));
  localStorage.setItem(STORAGE_KEY+'_playtime', String(playTimeSec));
  localStorage.setItem(STORAGE_KEY+'_audio', audioEnabled?'1':'0');
  localStorage.setItem(STORAGE_KEY+'_vol', String(audioVolume));
}
function showToast(icon,title,desc){
  document.getElementById('toast-icon').textContent=icon;
  document.getElementById('toast-title').textContent=title;
  document.getElementById('toast-desc').textContent=desc;
  toast.classList.add('show');
}
document.getElementById('toast-close').onclick=()=> toast.classList.remove('show');

// ---------- Vehicle switching ----------
function setVehicle(type){
  vehicleType=type;
  buildVehicle(type);
  hudVehicleName.textContent=VEHICLES[type].name;
  document.querySelectorAll('.v-btn').forEach(b=> b.classList.toggle('active', b.dataset.v===type));
  document.querySelectorAll('.v-card').forEach(c=> c.classList.toggle('active', c.dataset.pick===type));
  save();
}

document.querySelectorAll('.v-btn').forEach(b=> b.addEventListener('click', ()=> setVehicle(b.dataset.v)));

// ---------- Overlays ----------
let started=false;
function hideLoading(){
  loadBar.style.width='100%'; loadPct.textContent='100%';
  setTimeout(()=> loadingEl.classList.add('out'), 300);
}
function startJourney(){
  if(started) return;
  started=true;
  overlayLanding.classList.add('hidden');
  overlayVehicle.classList.remove('hidden');
}
function beginExplore(){
  overlayVehicle.classList.add('hidden');
  // small camera intro
  camYaw=playerYaw+0.9; camPitch=0.28; camDist=11;
}
document.getElementById('btn-start').onclick=startJourney;
document.getElementById('btn-trailer').onclick=()=>{ overlayLanding.classList.add('hidden'); toggleMap(true); };
document.getElementById('btn-pick-go').onclick=beginExplore;
document.getElementById('btn-pick-cancel').onclick=()=>{ overlayVehicle.classList.add('hidden'); overlayLanding.classList.remove('hidden'); };
document.getElementById('btn-vehicle-close').onclick=()=> overlayVehicle.classList.add('hidden');
document.querySelectorAll('.v-card').forEach(c=> c.addEventListener('click', ()=>{ document.querySelectorAll('.v-card').forEach(x=>x.classList.remove('active')); c.classList.add('active'); setVehicle(c.dataset.pick); }));

function toggleMap(force){
  const show = typeof force==='boolean' ? force : overlayMap.classList.contains('hidden');
  overlayMap.classList.toggle('hidden', !show);
  if(show){ renderBiomeList(); drawBigMap(); updateJournal(); }
}
function togglePhoto(force){
  const show = typeof force==='boolean' ? force : !photoMode;
  photoMode=show;
  document.getElementById('photo-bar').classList.toggle('show', show);
  if(show){ camMode=2; } else { camMode=1; }
}
function toggleHelp(){
  showToast('🐱','Mèo Vàng mách nhỏ','WASD để đi, Shift để tăng tốc, C đổi camera, M mở bản đồ, P chụp ảnh, L đổi giờ. Trên điện thoại dùng joystick góc trái và vuốt để xoay camera nhé!');
}

document.getElementById('btn-map').onclick=()=> toggleMap();
document.getElementById('btn-map-close').onclick=()=> toggleMap(false);
document.getElementById('btn-map-go').onclick=()=>{
  const b=BIOMES[targetBiomeIdx];
  playerPos.set(b.pos.x, sampleHeight(b.pos.x,b.pos.z)+VEHICLES[vehicleType].ride, b.pos.z);
  playerYaw=Math.random()*Math.PI*2;
  toggleMap(false);
  showToast(b.icon, `Đã dịch chuyển tới ${b.name}`, b.desc);
};
document.getElementById('btn-photo').onclick=()=> togglePhoto();
document.getElementById('btn-photo-exit').onclick=()=> togglePhoto(false);
document.getElementById('btn-shot').onclick=()=>{
  const url=renderer.domElement.toDataURL('image/png');
  const a=document.createElement('a'); a.href=url; a.download=`yellow-cat-mars-${Date.now()}.png`; a.click();
  // Phase 3: also save scaled thumbnail to IndexedDB
  try{
    const bi=biomeAt(playerPos.x, playerPos.z).biome;
    // scale to 0.52 via canvas for storage
    const tmpC=document.createElement('canvas'); tmpC.width=640; tmpC.height=400;
    const tctx=tmpC.getContext('2d');
    tctx.drawImage(renderer.domElement, 0,0, tmpC.width, tmpC.height);
    const thumb=tmpC.toDataURL('image/jpeg', 0.62);
    galleryAdd(thumb, { biome: bi.name, coord: `${Math.round(playerPos.x)}, ${Math.round(playerPos.z)}`, vehicle: vehicleType }).then(()=>{ refreshGalleryCache().then(()=> updateJournalPhase3()); });
  }catch(e){ console.warn('gallery save',e); }
  showToast('📸','Đã chụp ảnh!','Đã tải xuống & lưu vào Bộ Sưu Tập (🖼️).');
};
document.getElementById('btn-light').onclick=()=>{ timeOfDay=(timeOfDay+0.25)%1; applyTime(); };
document.getElementById('btn-help').onclick=toggleHelp;
// ---------- Phase 3 Wiring ----------
document.getElementById('btn-journal').onclick=()=> openJournal('j-overview');
document.getElementById('btn-gallery').onclick=()=> openGallerySheet();
document.getElementById('btn-journal-close').onclick=closeJournal;
document.getElementById('btn-gallery-close').onclick=closeGallerySheet;
document.getElementById('btn-audio').onclick=()=>{
  const next=!audioEnabled;
  if(next) ensureAudio();
  setAudioEnabled(next);
  if(next) showToast('🔈','Nhạc đã bật','Nhạc đổi theo vùng & tốc độ — chỉnh volume trong Nhật Ký nhé!');
  else showToast('🔇','Đã tắt nhạc','Mèo sẽ đi trong yên lặng.');
};
document.getElementById('vol-range')?.addEventListener('input', e=> setVolume(e.target.value));
document.getElementById('btn-discovery-close').onclick=()=> closeDiscovery(false);
document.getElementById('btn-discovery-ok').onclick=()=> closeDiscovery(true);
document.getElementById('btn-lightbox-close').onclick=()=> lightboxEl.classList.remove('open');
lightboxEl?.addEventListener('click', e=>{ if(e.target===lightboxEl) lightboxEl.classList.remove('open'); });
sheetJournal?.addEventListener('click', e=>{ if(e.target===sheetJournal) closeJournal(); });
sheetGallery?.addEventListener('click', e=>{ if(e.target===sheetGallery) closeGallerySheet(); });
overlayDiscovery?.addEventListener('click', e=>{ if(e.target===overlayDiscovery) closeDiscovery(false); });
document.querySelectorAll('.tab').forEach(t=> t.addEventListener('click', ()=> openJournal(t.dataset.tab)));
document.getElementById('btn-journal-share')?.addEventListener('click', ()=>{
  const text=`Hành trình Mèo Vàng: ${distance.toFixed(1)} km · ${collected.length}/18 dấu chân · ${visitedBiomes.size}/5 vùng · ${discovered.size}/12 thẻ · ${galleryCache.length} ảnh 🪐🐱 #YellowCatLovesMars`;
  if(navigator.share){ navigator.share({ title:'Yellow Cat Loves Mars', text, url: location.href }).catch(()=>{}); }
  else if(navigator.clipboard){ navigator.clipboard.writeText(text+' '+location.href); showToast('📤','Đã copy!', text); }
  else showToast('📤','Chia sẻ', text);
});
document.getElementById('btn-journal-reset')?.addEventListener('click', ()=>{
  if(!confirm('Xóa toàn bộ tiến trình (km, dấu chân, thẻ, ảnh)?')) return;
  localStorage.clear();
  indexedDB.deleteDatabase(GALLERY_DB);
  location.reload();
});
addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  if(k==='j') sheetJournal.classList.contains('open') ? closeJournal() : openJournal('j-overview');
  if(k==='g') sheetGallery.classList.contains('open') ? closeGallerySheet() : openGallerySheet();
  if(k==='escape'){ if(lightboxEl.classList.contains('open')) lightboxEl.classList.remove('open'); if(sheetJournal.classList.contains('open')) closeJournal(); if(sheetGallery.classList.contains('open')) closeGallerySheet(); if(!overlayDiscovery.classList.contains('hidden')) closeDiscovery(false); }
});
document.getElementById('minimap-wrap').onclick=()=> toggleMap();
addEventListener('keydown', e=>{ if(e.key.toLowerCase()==='m' && !e.repeat) toggleMap(); });

// ---------- Phase 4: dynamic global dust storm ----------
let stormLevel = 0;         // 0 calm .. 1 global dust
let stormTarget = 0;
let nextStormAt = performance.now() + 50000 + Math.random()*70000;
let stormEndsAt = 0;
const stormBanner = document.createElement('div');
stormBanner.id = 'storm-banner';
stormBanner.style.cssText='position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:6;display:none;gap:8px;align-items:center;background:rgba(120,40,10,0.75);border:1px solid rgba(255,154,92,0.5);padding:8px 14px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:0.04em;color:#ffe3c8;backdrop-filter:blur(10px);pointer-events:none';
stormBanner.textContent='🌪️ Bão bụi toàn cầu đang quét qua — bầu trời đỏ rực!';
document.body.appendChild(stormBanner);
function maybeStorm(now){
  if(stormTarget>0 && now > stormEndsAt){ stormTarget=0; stormBanner.style.display='none'; if(audioEnabled) showToast('🌤️','Bão đã tan','Trời quang trở lại, sao bắt đầu lấp lánh.'); }
  else if(now > nextStormAt && stormTarget===0){
    stormTarget = 0.55 + Math.random()*0.45;
    stormEndsAt = now + 22000 + Math.random()*26000;
    nextStormAt = now + 90000 + Math.random()*120000;
    stormBanner.style.display='flex';
    if(audioEnabled) showToast('🌪️','Bão bụi toàn cầu!','Bụi mịn khuếch tán ánh sáng — chân trời nhòa đỏ, tầm nhìn giảm. Kiểu bão từng “tắt điện” Opportunity (2018).');
  }
  stormLevel += (stormTarget - stormLevel) * 0.012; // glide 8s
  const s = stormLevel;
  scene.fog.density = 0.0012 + s*0.0075;
  sun.intensity = THREE.MathUtils.lerp(1.6, 0.5, s) * SUN_BASE_I;
  sun.color.setHSL(0.07, 0.35+s*0.5, THREE.MathUtils.lerp(0.72, 0.5, s));
  skyMat.uniforms.top.value.setHSL(0.06, 0.3+s*0.5, THREE.MathUtils.lerp(0.05, 0.18, s));
  skyMat.uniforms.horizon.value.setHSL(0.05, 0.5+s*0.45, THREE.MathUtils.lerp(0.55, 0.42, s));
  ambient.intensity = THREE.MathUtils.lerp(0.85, 0.5, s) * AMB_BASE_I;
  stormLevelHud(s);
}
let _lastStorm=0;
function stormLevelHud(s){
  const lvl = s>0.66?'TOÀN CẦU':s>0.33?'TRUNG BÌNH':s>0.08?'NHẸ':'yên';
  if(lvl!==_lastStorm){
    _lastStorm=lvl;
    const pill=document.getElementById('hud-storm');
    if(pill){ pill.style.display = s>0.08?'flex':'none'; pill.querySelector('b').textContent=lvl; }
  }
}

// ---- helper: đặt group lên mặt đất bằng điểm tiếp xúc bánh xe ----
// Với 4 điểm bánh: lấy max chiều cao (bánh cao nhất chạm trước → không chìm),
// và suy ra pitch/roll từ mặt phẳng nghiêng qua 4 điểm đó.
const _up=new THREE.Vector3(0,1,0), _nrm=new THREE.Vector3();
const _q=new THREE.Quaternion(), _eul=new THREE.Euler(0,0,0,'YXZ');
function settleToGround(){
  const conf=VEHICLES[vehicleType];
  const cy=Math.cos(playerYaw), sy=Math.sin(playerYaw);
  let maxH=-Infinity, sumH=0;
  const hz=[];
  for(const [lx,lz] of conf.wheels){
    // xoay offset cục bộ theo yaw
    const wx = playerPos.x + (lx*cy - lz*sy);
    const wz = playerPos.z + (lx*sy + lz*cy);
    const h = sampleHeight(wx, wz);
    hz.push({lx,lz,h});
    if(h>maxH) maxH=h;
    sumH+=h;
  }
  // --- Đặt Y sao cho KHÔNG BÁNH NÀO CHÌM VÀO ĐẤT -----------------------
  // Ý tưởng: y = max( ground_i + ride ) trên mọi bánh. Bánh nào có đất cao
  // nhất sẽ ép xe lên, đảm bảo mọi bánh còn lại nằm trên hoặc ngang mặt đất.
  // Cộng SKIN một chút cho lốp có ren gai/vanh nhô ra ngoài bán kính lý thuyết,
  // nếu thiếu xe sẽ ăn đất vài cm.
  // SKIN tương đối theo kích thước bánh: lốp có ren gai/vanh nhô ra ngoài bán
  // kính lý thuyết nên cần chút lề. Tỷ lệ 25% bán kính nhỏ nhất giữ xe sát
  // đất với xe máy (bán kính nhỏ) mà không chìm với rover to.
  const minR = Math.min(...wCache.map(c=>c.r));
  const SKIN = minR * 0.25;
  playerPos.y = maxH + conf.ride + SKIN;
  // ---- Nghiêng xe: suy từ CHÍNH 4 điểm tiếp xúc bánh (đã lấy ở trên) ----
  // Dùng phương pháp bình phương nhỏ nhất trên 4 điểm thay vì pháp tuyến của
  // 1 tam giác: ổn định, không nhảy góc khi bánh lọt sang ô kế bên, và tự
  // nhiên cho pitch/roll hợp với việc 3-4 bánh cùng chạm đất.
  let n=hz.length;
  let sxz=0, sz2=0, syz=0, szz=0, sxy=0, szy=0;
  for(const q of hz){
    const lx=q.lx, lz=q.lz;              // offset cục bộ đã gán trục X=fwd, Z=lateral
    sxz+=lx; sz2+=lz*lz; syz+=q.h*lz; szz+=lz;
    sxy+=lx*q.h; szy+=q.h;
  }
  // dốc theo trục fwd (X) và lateral (Z), giải hệ 2 phương trình
  const det=n*sz2 - szz*szz;
  const pitch = Math.abs(det)>1e-6 ? (n*sxy - szz*szy)/det : 0;
  const roll  = Math.abs(det)>1e-6 ? (n*syz - szz*sxy)/det : 0;
  // GIỚI HẠN góc: một cell dốc không được làm xe nghiêng quá mức
  const MAX_TILT = 0.30;
  targetPitch = Math.atan(Math.max(-MAX_TILT, Math.min(MAX_TILT, pitch)));
  targetRoll  = Math.atan(Math.max(-MAX_TILT, Math.min(MAX_TILT, -roll)));

  // ---- HIỆU CHỈNH CUỐI: bảo đảm tuyệt đối không bánh nào chìm -------------
  // Sau khi đã biết pitch/roll, tính world-offset của từng bánh thật sự (bánh
  // rover nằm trong group leg đã xoay nên world offset KHÔNG còn nằm trên
  // mặt phẳng của group), rồi nâng xe lên đúng mức còn thiếu. Đây là bước
  // chốt chặn cuối — sau nó thì clearance của mọi bánh >= 0.
  // Mỗi bánh đã lưu sẵn: localXZ (offset cục bộ trong group) + localY (cao độ
  // đáy bánh khi group ở gốc) + r. Tính clearance bằng phép biến đổi yaw+pitch
  // TRÊN CHÍNH offset đó — không đụng tới world matrix (đang phản ánh vị trí
  // của frame trước, nên dùng nó sẽ nhảy lung tung).
  const cp=Math.cos(targetPitch), sp=Math.sin(targetPitch);
  const cr=Math.cos(targetRoll),  sr=Math.sin(targetRoll);
  const cyw=Math.cos(-playerYaw), syw=Math.sin(-playerYaw);
  let need = 0;
  for(const w of wCache){
    // xoay yaw quanh trục Y
    const wx = playerPos.x + (w.x*cyw - w.z*syw);
    const wz = playerPos.z + (w.x*syw + w.z*cyw);
    // local (0, w.y, 0) -> nghiêng pitch(X) rồi roll(Z)
    const yl = w.y;
    const dy = yl*cp;
    const dx = -yl*sp;
    const dz = yl*sr*cp;               // phần do roll nhấc theo phía bên
    const gx = wx + dx*cyw - dz*syw;
    const gz = wz + dx*syw + dz*cyw;
    const bottom = playerPos.y + dy - w.r;
    const c = bottom - sampleHeight(gx, gz);
    if(-c > need) need = -c;
  }
  if(need > 0.001) playerPos.y += need + 0.02;
}

// ---------- Main loop ----------
let lastT=performance.now();
let speedKmh=0;

function updateJournal(){
  document.getElementById('j-dist').textContent=distance.toFixed(1);
  document.getElementById('j-paws').textContent=collected.length;
  document.getElementById('j-biomes').textContent=visitedBiomes.size;
}



// ---------- Phase 3 Helpers: Audio (Web Audio synthesis) ----------
const BIOME_CHORDS = {
  arcadia: [261.63, 329.63, 392.00, 493.88], // C E G B (Amaj7-ish transposed)
  valles:  [164.81, 196.00, 246.94, 293.66], // E G B D
  olympus: [293.66, 329.63, 392.00, 493.88], // D E G B
  polar:   [261.63, 293.66, 329.63, 392.00], // C D E G
  storm:   [185.00, 220.00, 277.18, 329.63], // F# A C# E
};

function ensureAudio(){
  if(audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  audioCtx = new AC();
  audioMaster = audioCtx.createGain();
  audioMaster.gain.value = (audioVolume/100)*0.18;
  audioMaster.connect(audioCtx.destination);
  // nodes
  const padGain = audioCtx.createGain(); padGain.gain.value=0.0; padGain.connect(audioMaster);
  const arpGain = audioCtx.createGain(); arpGain.gain.value=0.0; arpGain.connect(audioMaster);
  const windGain = audioCtx.createGain(); windGain.gain.value=0.0; windGain.connect(audioMaster);
  const windFilter = audioCtx.createBiquadFilter(); windFilter.type='lowpass'; windFilter.frequency.value=900; windFilter.connect(windGain);
  // wind noise (buffer)
  const bufSize = audioCtx.sampleRate*2;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const ch = buf.getChannelData(0);
  for(let i=0;i<bufSize;i++) ch[i]= (Math.random()*2-1)*0.6;
  const windSrc = audioCtx.createBufferSource(); windSrc.buffer=buf; windSrc.loop=true;
  windSrc.connect(windFilter); windSrc.start();
  audioNodes = { padGain, arpGain, windGain, windFilter, windSrc, padOscs:[], arpTimer:0, arpIdx:0, curBiome:null };
  // pad oscs (2)
  for(let i=0;i<2;i++){
    const o = audioCtx.createOscillator(); o.type = i===0?'sine':'triangle'; o.frequency.value=220; o.start();
    const g = audioCtx.createGain(); g.gain.value=0; o.connect(g); g.connect(padGain);
    audioNodes.padOscs.push({o,g});
  }
  // arp osc
  const arpOsc = audioCtx.createOscillator(); arpOsc.type='sine'; arpOsc.frequency.value=440; arpOsc.start();
  const arpEnv = audioCtx.createGain(); arpEnv.gain.value=0; arpOsc.connect(arpEnv); arpEnv.connect(arpGain);
  audioNodes.arpOsc=arpOsc; audioNodes.arpEnv=arpEnv;
  updateAudioBiome(biomeAt(playerPos.x, playerPos.z).biome.id, true);
  return audioCtx;
}

function updateAudioBiome(biomeId, immediate=false){
  if(!audioNodes) return;
  if(audioNodes.curBiome===biomeId && !immediate) return;
  audioNodes.curBiome=biomeId;
  const chord = BIOME_CHORDS[biomeId] || BIOME_CHORDS.arcadia;
  const t = audioCtx.currentTime;
  // pad: two notes from chord
  audioNodes.padOscs.forEach((pg,i)=>{
    const freq = chord[i % chord.length] * (i===1?0.5:1);
    if(immediate) pg.o.frequency.setValueAtTime(freq, t);
    else pg.o.frequency.linearRampToValueAtTime(freq, t+1.2);
    pg.g.gain.cancelScheduledValues(t);
    if(audioEnabled) pg.g.gain.linearRampToValueAtTime(0.22, t+0.6);
  });
  // fade in pad
  audioNodes.padGain.gain.cancelScheduledValues(t);
  audioNodes.padGain.gain.linearRampToValueAtTime(audioEnabled?0.55:0, t+0.8);
}

function tickAudio(dt, speedKmh, biomeId){
  if(!audioEnabled || !audioCtx || audioCtx.state==='suspended') return;
  if(!audioNodes) return;
  if(biomeId!==audioNodes.curBiome) updateAudioBiome(biomeId);
  // arp tempo by speed
  const tempo = THREE.MathUtils.clamp(0.18 + speedKmh*0.012, 0.12, 0.85);
  audioNodes.arpGain.gain.linearRampToValueAtTime(Math.min(0.45, tempo*0.6), audioCtx.currentTime+0.1);
  audioNodes.windGain.gain.linearRampToValueAtTime(audioEnabled?(biomeId==='storm'?0.18:0.04)+ Math.min(0.12, speedKmh*0.003):0, audioCtx.currentTime+0.2);
  audioNodes.windFilter.frequency.linearRampToValueAtTime(600 + speedKmh*22, audioCtx.currentTime+0.2);
  // arp pluck
  audioNodes.arpTimer += dt* (2.2 + speedKmh*0.06);
  if(audioNodes.arpTimer > (0.42 - Math.min(0.22, speedKmh*0.004))){
    audioNodes.arpTimer=0;
    const chord = BIOME_CHORDS[biomeId]||BIOME_CHORDS.arcadia;
    const note = chord[audioNodes.arpIdx % chord.length] * (audioNodes.arpIdx%3===0?2:1);
    audioNodes.arpIdx++;
    const tt=audioCtx.currentTime;
    audioNodes.arpOsc.frequency.setValueAtTime(note, tt);
    audioNodes.arpEnv.gain.cancelScheduledValues(tt);
    audioNodes.arpEnv.gain.setValueAtTime(0, tt);
    audioNodes.arpEnv.gain.linearRampToValueAtTime(0.28, tt+0.02);
    audioNodes.arpEnv.gain.exponentialRampToValueAtTime(0.001, tt+0.32);
  }
}

function setAudioEnabled(v){
  audioEnabled=v;
  localStorage.setItem(STORAGE_KEY+'_audio', v?'1':'0');
  const btn=document.getElementById('btn-audio');
  if(btn) btn.textContent = v?'🔈':'🔇';
  if(v) { ensureAudio(); if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); }
  if(audioNodes){
    const t=audioCtx.currentTime;
    audioNodes.padGain.gain.cancelScheduledValues(t);
    audioNodes.padGain.gain.linearRampToValueAtTime(v?0.55:0, t+0.4);
    audioNodes.arpGain.gain.linearRampToValueAtTime(v?0.15:0, t+0.4);
    audioNodes.windGain.gain.linearRampToValueAtTime(0, t+0.3);
    audioNodes.padOscs.forEach(pg=> pg.g.gain.linearRampToValueAtTime(v?0.22:0, t+0.4));
  }
  updatePWAStatus();
}

function setVolume(pct){
  audioVolume=THREE.MathUtils.clamp(Math.round(pct),0,100);
  localStorage.setItem(STORAGE_KEY+'_vol', String(audioVolume));
  const lab=document.getElementById('vol-label'); if(lab) lab.textContent=audioVolume+'%';
  const r=document.getElementById('vol-range'); if(r) r.value=String(audioVolume);
  if(audioMaster) audioMaster.gain.linearRampToValueAtTime((audioVolume/100)*0.22, audioCtx.currentTime+0.1);
}

// ---------- Phase 3 Helpers: IndexedDB Gallery ----------
function idbOpen(){
  return new Promise((res, rej)=>{
    const req=indexedDB.open(GALLERY_DB, 1);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(GALLERY_STORE)) db.createObjectStore(GALLERY_STORE, {keyPath:'id', autoIncrement:true}); };
    req.onsuccess=()=> res(req.result);
    req.onerror=()=> rej(req.error);
  });
}
async function galleryAdd(dataUrl, meta){
  try{
    const db=await idbOpen();
    const tx=db.transaction(GALLERY_STORE,'readwrite');
    tx.objectStore(GALLERY_STORE).add({ dataUrl, meta, ts:Date.now() });
    return new Promise((res,rej)=>{ tx.oncomplete=()=>{ db.close(); res(true); }; tx.onerror=()=> rej(tx.error); });
  }catch(e){ console.warn('galleryAdd',e); return false; }
}
async function galleryList(){
  try{
    const db=await idbOpen();
    const tx=db.transaction(GALLERY_STORE,'readonly');
    const req=tx.objectStore(GALLERY_STORE).getAll();
    const rows=await new Promise((res,rej)=>{ req.onsuccess=()=> res(req.result); req.onerror=()=> rej(req.error); });
    db.close();
    // cap 30, LRU
    rows.sort((a,b)=> b.ts - a.ts);
    if(rows.length>30){
      const toDel=rows.slice(30);
      const db2=await idbOpen();
      const tx2=db2.transaction(GALLERY_STORE,'readwrite');
      toDel.forEach(r=> tx2.objectStore(GALLERY_STORE).delete(r.id));
      await new Promise(res=> tx2.oncomplete=()=>{ db2.close(); res(); });
      return rows.slice(0,30);
    }
    return rows;
  }catch(e){ console.warn('galleryList',e); return []; }
}
async function galleryDelete(id){
  const db=await idbOpen();
  const tx=db.transaction(GALLERY_STORE,'readwrite');
  tx.objectStore(GALLERY_STORE).delete(id);
  return new Promise(res=>{ tx.oncomplete=()=>{ db.close(); res(); }; });
}
async function refreshGalleryCache(){
  galleryCache = await galleryList();
  return galleryCache;
}

// ---------- Phase 3 Helpers: Discovery ----------
function nearestPOI(x,z){
  let best=null, bd=Infinity;
  for(const p of POIS){ const d=Math.hypot(x-p.pos.x, z-p.pos.z); if(d<bd){ bd=d; best=p; } }
  return { poi:best, dist:bd };
}
function openDiscovery(poi){
  document.getElementById('d-icon').textContent=poi.icon;
  document.getElementById('d-title').textContent=poi.title;
  document.getElementById('d-biome').textContent=BIOMES.find(b=> b.id===poi.biome)?.name || poi.biome;
  document.getElementById('d-fact').innerHTML='<b>「Fact NASA」</b><br>'+poi.fact;
  document.getElementById('d-cat').textContent='Mèo Vàng thì thầm: “'+poi.cat+'”';
  document.getElementById('d-earth').textContent=poi.earth;
  overlayDiscovery.classList.remove('hidden');
  overlayDiscovery.dataset.poi=poi.id;
}
function closeDiscovery(markRead){
  const pid=overlayDiscovery.dataset.poi;
  overlayDiscovery.classList.add('hidden');
  if(markRead && pid && !discovered.has(pid)){
    discovered.add(pid);
    save();
    renderJournalCards();
    updateJournal();
    updatePWAStatus();
    showToast('📖','Đã lưu thẻ khám phá!', 'Xem lại trong Nhật Ký → Thẻ khám phá.');
  }
}

// ---------- Phase 3 Helpers: Journal & Gallery UI ----------
function renderJournalCards(){
  const grid=document.getElementById('j-cards-grid');
  if(!grid) return;
  grid.innerHTML='';
  for(const poi of POIS){
    const done=discovered.has(poi.id);
    const el=document.createElement('div');
    el.style.cssText='border:1px solid var(--border);border-radius:14px;padding:12px;background:'+(done?'rgba(255,204,51,0.10)':'rgba(255,255,255,0.03)')+';display:flex;gap:10px;align-items:flex-start';
    el.innerHTML='<span style="font-size:22px">'+poi.icon+'</span><div style="flex:1"><b style="font-family:Baloo 2,cursive;font-size:13px;color:'+(done?'#fff':'var(--muted)')+'">'+poi.title+'</b><br><span style="font-size:11px;color:var(--muted)">'+poi.fact.slice(0,72)+'...</span><br><span style="font-size:10px;letter-spacing:0.06em;color:'+(done?'var(--accent)':'rgba(255,255,255,0.4)')+'">'+(done?'✓ ĐÃ MỞ':'○ Chưa mở')+' · '+(BIOMES.find(b=>b.id===poi.biome)?.name||poi.biome)+'</span></div>';
    el.style.cursor='pointer';
    el.onclick=()=> openDiscovery(poi);
    grid.appendChild(el);
  }
}

function updatePWAStatus(){
  const el=document.getElementById('j-status');
  if(!el) return;
  const swReady = navigator.serviceWorker && navigator.serviceWorker.controller ? 'SW ✓' : 'SW …';
  const offline = navigator.onLine ? 'Online' : 'Offline';
  const audio = audioEnabled ? 'Audio 🔊 '+audioVolume+'%' : 'Audio 🔇';
  el.textContent = `${swReady} · ${offline} · ${audio} · Thẻ ${discovered.size}/12 · Ảnh ${galleryCache.length}/30`;
}

async function renderGallery(){
  const grid=document.getElementById('gallery-grid');
  const empty=document.getElementById('gallery-empty');
  if(!grid) return;
  await refreshGalleryCache();
  grid.innerHTML='';
  if(galleryCache.length===0){
    if(empty) empty.style.display='block';
    // also update journal counts
    const jph=document.getElementById('j-photos2'); if(jph) jph.textContent='0';
    updatePWAStatus();
    return;
  }
  if(empty) empty.style.display='none';
  for(const row of galleryCache){
    const card=document.createElement('div');
    card.className='g-thumb';
    const img=document.createElement('img'); img.src=row.dataUrl; img.loading='lazy'; img.alt='Ảnh Sao Hỏa';
    card.appendChild(img);
    const meta=document.createElement('div'); meta.className='g-meta';
    const b=row.meta?.biome || '';
    const c=row.meta?.coord || '';
    meta.innerHTML='<span>'+(b||'Mars')+'</span><span>'+(c||'')+'</span>';
    card.appendChild(meta);
    // actions bar
    const bar=document.createElement('div');
    bar.style.cssText='position:absolute;top:8px;right:8px;display:flex;gap:6px';
    const btnDel=document.createElement('button');
    btnDel.textContent='✕'; btnDel.title='Xóa'; btnDel.style.cssText='width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.55);color:#fff;cursor:pointer';
    btnDel.onclick=(e)=>{ e.stopPropagation(); galleryDelete(row.id).then(()=> renderGallery()); };
    const btnShare=document.createElement('button');
    btnShare.textContent='⤴'; btnShare.title='Chia sẻ'; btnShare.style.cssText='width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.55);color:#fff;cursor:pointer';
    btnShare.onclick=(e)=>{
      e.stopPropagation();
      const text=`Tôi vừa ở ${row.meta?.biome||'Sao Hỏa'} (${row.meta?.coord||''}) cùng Mèo Vàng! 🪐🐱 #YellowCatLovesMars`;
      if(navigator.share){ navigator.share({ title:'Yellow Cat Loves Mars', text, url: location.href }).catch(()=>{}); }
      else if(navigator.clipboard){ navigator.clipboard.writeText(text+' '+location.href); showToast('📤','Đã copy!', text); }
      else { showToast('📤','Chia sẻ', text); }
    };
    bar.appendChild(btnShare); bar.appendChild(btnDel);
    card.appendChild(bar);
    card.onclick=()=>{
      lightboxImg.src=row.dataUrl;
      lightboxEl.classList.add('open');
    };
    grid.appendChild(card);
  }
  const jph=document.getElementById('j-photos2'); if(jph) jph.textContent=String(galleryCache.length);
  updatePWAStatus();
}

function openJournal(tab='j-overview'){
  sheetJournal.classList.add('open');
  sheetJournal.setAttribute('aria-hidden','false');
  document.querySelectorAll('.tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('j-tab-overview').style.display = tab==='j-overview'?'block':'none';
  document.getElementById('j-tab-cards').style.display = tab==='j-cards'?'block':'none';
  document.getElementById('j-tab-stats').style.display = tab==='j-stats'?'block':'none';
  // update stats tab
  const st=document.getElementById('j-stats-text');
  if(st) st.innerHTML=`Quãng đường <b>${distance.toFixed(2)} km</b><br>Dấu chân <b>${collected.length}/18</b><br>Vùng đã thăm <b>${visitedBiomes.size}/5</b> (${[...visitedBiomes].join(', ')||'—'})<br>Thẻ đã mở <b>${discovered.size}/12</b><br>Ảnh <b>${galleryCache.length}</b><br>Thời gian chơi <b>${Math.floor(playTimeSec/60)} phút ${playTimeSec%60}s</b><br>Biome hiện tại <b>${biomeAt(playerPos.x, playerPos.z).biome.name}</b><br>Tọa độ <b>${Math.round(playerPos.x)}, ${Math.round(playerPos.z)}</b>`;
}
function closeJournal(){ sheetJournal.classList.remove('open'); sheetJournal.setAttribute('aria-hidden','true'); }
function openGallerySheet(){ sheetGallery.classList.add('open'); sheetGallery.setAttribute('aria-hidden','false'); renderGallery(); }
function closeGallerySheet(){ sheetGallery.classList.remove('open'); sheetGallery.setAttribute('aria-hidden','true'); }

// ---------- Phase 3 Helpers: Shooting Star ----------
let nextStarAt = performance.now() + 9000 + Math.random()*8000;
function maybeShootingStar(now){
  if(now < nextStarAt) return;
  nextStarAt = now + 8000 + Math.random()*12000;
  const el=shootingStarEl;
  const startX = Math.random()*innerWidth*0.7 + innerWidth*0.15;
  const startY = Math.random()*innerHeight*0.35 + 40;
  const dx = (Math.random()>0.5?1:-1)*(220+Math.random()*260);
  const dy = 120+Math.random()*120;
  el.style.left=startX+'px'; el.style.top=startY+'px'; el.style.opacity='1';
  el.animate([
    { transform:`translate(0,0)`, opacity:1 },
    { transform:`translate(${dx}px, ${dy}px)`, opacity:0 }
  ], { duration: 900+Math.random()*500, easing:'cubic-bezier(0.2,0,0.1,1)' }).onfinish=()=>{ el.style.opacity='0'; };
  // tiny sound if audio
  if(audioEnabled && audioCtx){
    const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=880;
    const g=audioCtx.createGain(); g.gain.value=0.0; o.connect(g); g.connect(audioMaster);
    o.start();
    const t=audioCtx.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t+0.03); g.gain.exponentialRampToValueAtTime(0.001, t+0.45);
    o.frequency.exponentialRampToValueAtTime(220, t+0.4);
    o.stop(t+0.5);
  }
}

// ---------- Phase 3: updateJournal (override) ----------
const _origUpdateJournal = updateJournal;
function updateJournalPhase3(){
  _origUpdateJournal();
  const j2d=document.getElementById('j-dist2'); if(j2d) j2d.textContent=distance.toFixed(1);
  const jp2=document.getElementById('j-paws2'); if(jp2) jp2.textContent=String(collected.length);
  const jb2=document.getElementById('j-biomes2'); if(jb2) jb2.textContent=String(visitedBiomes.size);
  const jc2=document.getElementById('j-cards2'); if(jc2) jc2.textContent=String(discovered.size);
  const jpht=document.getElementById('j-photos2'); if(jpht) jpht.textContent=String(galleryCache.length);
  const jt2=document.getElementById('j-time2'); if(jt2) jt2.textContent=String(Math.floor(playTimeSec/60));
  const sum=document.getElementById('j-summary');
  if(sum){
    const bi=biomeAt(playerPos.x, playerPos.z).biome;
    sum.textContent = `Mèo đang ở ${bi.name} (${Math.round(playerPos.x)}, ${Math.round(playerPos.z)}), đã đi ${distance.toFixed(1)} km, nhặt ${collected.length}/18 dấu chân và mở ${discovered.size}/12 thẻ khám phá. ${galleryCache.length?`Đã chụp ${galleryCache.length} ảnh.`:'Hãy chụp vài tấm ảnh nhé!'}`;
  }
  updatePWAStatus();
}


function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(0.033, (now-lastT)/1000); lastT=now;
  updatePerfHud(dt);
  // Beacon landmark nhấp nháy chậm — ở xa đây là mốc định hướng đầu tiên,
  // phải đủ tương phản với bầu trời đỏ mà không chói mắt khi đến gần.
  if (landmarks.length){
    const bp = 0.55 + 0.45*Math.sin(now*0.0016);
    for (let i=0;i<landmarks.length;i++){
      const L = landmarks[i];
      L.userData.halo.intensity = 3 + bp*5;
      L.userData.beacon.scale.setScalar(1 + bp*0.28);
    }
  }

  // ══════ MOVEMENT (sửa xuyên địa hình) ══════
  const conf=VEHICLES[vehicleType];
  let fwd = input.f - input.b;
  let turn = input.r - input.l;
  if(joyActive){ fwd += -joyVec.y; turn += joyVec.x; }
  fwd = THREE.MathUtils.clamp(fwd, -1, 1);
  turn = THREE.MathUtils.clamp(turn, -1, 1);
  const boost = input.boost ? 1.6 : 1;
  const speed = fwd * conf.speed * boost;
  speedKmh = Math.abs(speed*3.2);

  if(Math.abs(speed)>0.01){
    playerYaw += turn * conf.turn * dt * (speed>0?1:-1) * (Math.abs(speed)/conf.speed*0.9+0.2);
    const distStep = speed * dt * 12;
    // ---- SUB-STEP: không bao giờ nhảy quá 1/4 ô địa hình (chống xuyên sườn) ----
    const MAX_SUB = HF.cell*0.25;
    const steps = Math.max(1, Math.ceil(Math.abs(distStep)/MAX_SUB));
    const sub = distStep/steps;
    let moved=0;
    for(let s=0;s<steps;s++){
      const nx = playerPos.x + Math.cos(playerYaw)*sub;
      const nz = playerPos.z + Math.sin(playerYaw)*sub;
      const nxC=THREE.MathUtils.clamp(nx, -TERRAIN_SIZE/2+8, TERRAIN_SIZE/2-8);
      const nzC=THREE.MathUtils.clamp(nz, -TERRAIN_SIZE/2+8, TERRAIN_SIZE/2-8);
      // slope đo trên heightfield thật
      const sl = slopeAt(nxC, nzC);
      // giới hạn riêng từng xe (bike không leo dốc đứng, rover leo thoải mái)
      if(sl > conf.maxSlope) continue;
      // chặn "leo tường": nếu chênh cao quá bước đi được thì trượt xuống
      const h0=sampleHeight(playerPos.x, playerPos.z);
      const h1=sampleHeight(nxC, nzC);
      const stepLen=Math.max(0.001, Math.hypot(nxC-playerPos.x, nzC-playerPos.z));
      if(Math.abs(h1-h0)/stepLen > conf.maxSlope) continue;
      playerPos.x=nxC; playerPos.z=nzC;
      const uphill=Math.max(0,h1-h0);
      const slow=THREE.MathUtils.clamp(1-uphill*0.09,0.32,1);
      moved += Math.abs(sub)*0.06*slow;
      wheelSpin += Math.abs(sub)*4.2;
    }
    distance += moved;
  }
  settleToGround();
  // bob nhẹ (chỉ khi đang chạy)
  const bob = Math.abs(speed)>0.01 ? Math.sin(now*0.012*(Math.abs(speed)+1.2))*conf.bob*0.08*Math.abs(fwd) : 0;
  playerPos.y += Math.max(0,bob);
  player.position.copy(playerPos);
  // ══════ HƯỚNG XE: yaw đúng trục + nghiêng theo địa hình ══════
  // Lưu ý: mô hình có +X là hướng đi, nên yaw phải là -playerYaw
  // (Three.js rotateY dương đưa +X về +Z, còn phương đi là (cos,sin) ở XZ).
  player.rotation.set(targetPitch, -playerYaw, targetRoll, 'YXZ');

  // ══════ CHỐT CHẶN CUỐI: không bánh nào được chìm vào địa hình ══════
  // Ở đây transform đã áp dụng xong nên đọc world matrix là chính xác tuyệt
  // đối (không suy luận từ công thức). Nếu bánh nào thấp hơn mặt đất, nâng
  // cả xe lên đúng mức thiếu. Đây là lưới an toàn cuối cùng — kể cả khi
  // wCache/ride lệch nhẹ vì model được sửa, xe vẫn không bao giờ xuyên đất.
  player.updateMatrixWorld(true);
  let needLift = 0;
  for(const w of vRefs.wheels){
    if(!w) continue;
    w.updateMatrixWorld(true);
    w.getWorldPosition(_camTmp);
    const clear = (_camTmp.y - (w.userData.r||0)) - sampleHeight(_camTmp.x, _camTmp.z);
    if(-clear > needLift) needLift = -clear;
  }
  if(needLift > 0){
    playerPos.y += needLift;
    player.position.y = playerPos.y;
    player.updateMatrixWorld(true);
  }

  // wheel spin + life animation (refs, không traverse)
  for(const w of vRefs.wheels){ w.rotation.x += wheelSpin*0.06; }
  wheelSpin *= 0.90;
  if(vRefs.pedal) vRefs.pedal.rotation.x += wheelSpin*0.05;
  if(vRefs.tail) vRefs.tail.rotation.y = Math.sin(now*0.0035 + speedKmh*0.04)*(0.25 + Math.min(0.5, speedKmh*0.012));
  if(vRefs.dish) vRefs.dish.rotation.y = Math.sin(now*0.0012)*0.9;
  if(vRefs.mast) vRefs.mast.rotation.y = Math.sin(now*0.0008+1.3)*0.7;
  if(vRefs.head) vRefs.head.rotation.z = Math.sin(now*0.004)*0.05 * (1 + Math.min(1, speedKmh*0.02));
  // Mèo sống: tai động đậy, đuôi vẩy, đèn LED nhấp nháy, khăn đuôi bay
  // Góc nhìn thứ nhất = mắt Mèo: ẩn đầu + mũ (self-head) để không che tay.
  if(camMode===0){
    if(vRefs.head) vRefs.head.visible=false;     // self-head
    if(vRefs.helmet) vRefs.helmet.visible=false; // self-mũ
    if(vRefs.cabin) vRefs.cabin.visible=false;   // vỏ cabin bao quanh người lái
    if(vRefs.selfBody) vRefs.selfBody.visible = (vehicleType!=='rover'); // rover: ngực che tay
  } else {
    if(vRefs.selfBody) vRefs.selfBody.visible=true;
    if(vRefs.head) vRefs.head.visible=true;
    if(vRefs.helmet) vRefs.helmet.visible=true;
    if(vRefs.cabin) vRefs.cabin.visible=true;
  }
  if(vRefs.ears && vRefs.ears.length){
    const gust=Math.sin(now*0.0016)+0.5*Math.sin(now*0.0043+1.1);
    vRefs.ears[0].rotation.x = gust*0.10 - 0.10;
    if(vRefs.ears[1]) vRefs.ears[1].rotation.x = -gust*0.10 - 0.10;
  }
  if(vRefs.tailSegs && vRefs.tailSegs.length){
    // sóng chạy dọc đuôi
    for(let i=0;i<vRefs.tailSegs.length;i++)
      vRefs.tailSegs[i].rotation.y = Math.sin(now*0.006 - i*0.7)*(0.10 + Math.min(0.22, speedKmh*0.006));
  }
  if(vRefs.helmet && vRefs.helmet.children.length>3){
    const ledM=vRefs.helmet.children[3];
    if(ledM.material) ledM.material.emissiveIntensity = 0.7 + 1.4*(0.5+0.5*Math.sin(now*0.006));
  }
  if(vRefs.scarf) vRefs.scarf.rotation.y = Math.sin(now*0.0042)*(0.12 + Math.min(0.55, speedKmh*0.018));

  // paws
  for(const p of pawItems){
    if(!p.visible) continue;
    p.position.y = p.userData.y0 + Math.sin(now*0.002 + p.userData.phase)*0.35;
    p.rotation.y += dt*0.9;
    if(playerPos.distanceTo(p.position)<3.2){
      p.visible=false;
      collected.push(p.userData.idx);
      save(); updateJournal();
      hudPaws.textContent=collected.length;
      showToast('🐾','Nhặt được Dấu Chân Mèo!', `Còn ${pawItems.filter(x=>x.visible).length} dấu chân đang chờ ngoài kia. Mèo Vàng vui lắm!`);
      // little pop
      p.scale.set(1.6,1.6,1.6);
    }
  }

  // biome tracking
  const bi=biomeAt(playerPos.x, playerPos.z).biome;
  if(!visitedBiomes.has(bi.id)){
    visitedBiomes.add(bi.id); save(); updateJournal();
    if(started && overlayVehicle.classList.contains('hidden') && overlayMap.classList.contains('hidden')){
      showToast(bi.icon, `Đã tới ${bi.name}!`, bi.desc);
    }
  }

  // HUD
  hudBiome.textContent=bi.name;
  hudCoord.textContent=`${Math.round(playerPos.x)}, ${Math.round(playerPos.z)}`;
  hudSpeed.textContent=Math.round(speedKmh);
  hudPaws.textContent=collected.length;
  document.getElementById('j-dist') && (document.getElementById('j-dist').textContent=distance.toFixed(1));
  // minimap
  drawMini();
  // dust
  const isStorm = bi.id==='storm';
  dustMat.opacity = gfxDustMul * THREE.MathUtils.clamp( (isStorm?0.42:0.0) + Math.min(0.35, speedKmh/70) + stormLevel*0.5, 0, 0.95);
  const dpos=dustGeo.attributes.position;
  for(let i=0;i<dustCount;i++){
    let x=dpos.getX(i), y=dpos.getY(i), z=dpos.getZ(i);
    x += (Math.cos(playerYaw+0.4)* speed*0.02 + (Math.random()-0.5)*0.3);
    z += (Math.sin(playerYaw+0.4)* speed*0.02 + (Math.random()-0.5)*0.3);
    y += (Math.random()-0.5)*0.18 -0.02;
    // wrap around player
    if(Math.hypot(x-playerPos.x, z-playerPos.z)>320){ x=playerPos.x+(Math.random()-0.5)*320; z=playerPos.z+(Math.random()-0.5)*320; y=2+Math.random()*38; }
    if(y<0.5) y=2+Math.random()*35;
    if(y>45) y=2+Math.random()*10;
    dpos.setXYZ(i,x,y,z);
  }
  dpos.needsUpdate=true;
  dustPoints.position.copy(playerPos);

  // Phase 3: POI discovery
  if(!overlayDiscovery.classList.contains('hidden')===false){
    const near = nearestPOI(playerPos.x, playerPos.z);
    if(near.poi && near.dist < 28 && !discovered.has(near.poi.id) && poiCooldown<=0){
      openDiscovery(near.poi);
      poiCooldown=4.0;
    }
    if(poiCooldown>0) poiCooldown -= dt;
  } else {
    if(poiCooldown>0) poiCooldown -= dt;
  }
  maybeStorm(now);
  // Phase 3: audio + stars + journal
  if(audioEnabled) tickAudio(dt, speedKmh, bi.id);
  maybeShootingStar(now);
  updateJournalPhase3();

  // Động tác lái: cánh tay mèo bám ghi đông, xoay theo input.l-r thật
  updateRidingPose(dt, (input.l?1:0) - (input.r?1:0), speedKmh, input.boost);
  updateCamera(dt);
  renderer.render(scene, camera);
}

// ---------- Resize ----------
function onResize(){
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}
addEventListener('resize', onResize);
onResize();

// ---------- Boot ----------
// Phase 3: init volume + audio button + POI markers on maps
setVolume(audioVolume);
document.getElementById('btn-audio').textContent = audioEnabled ? '🔈' : '🔇';
refreshGalleryCache().then(()=> updateJournalPhase3());
// SW register
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(()=> updatePWAStatus()).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange', ()=> updatePWAStatus());
}
addEventListener('online', updatePWAStatus); addEventListener('offline', updatePWAStatus);
// playTime ticker (save every 5s)
setInterval(()=>{ playTimeSec++; if(playTimeSec%5===0) save(); updateJournalPhase3(); }, 1000);
// ensure first user gesture enables audio (also on Start)
const _origStartJourney = startJourney;
startJourney = function(){ _origStartJourney(); if(audioEnabled) { ensureAudio(); if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); } renderJournalCards(); };
document.getElementById('btn-start').onclick=()=>startJourney();

// (network load đã xong ở boot.js — chỉ còn dựng scene, diễn ra tức thì)
let loadP=0;
const loadIv=setInterval(()=>{
  loadP=Math.min(100, loadP+ (Math.random()*30+34));
  loadBar.style.width=loadP+'%'; loadPct.textContent=Math.round(loadP)+'%';
  if(loadP>=100){ clearInterval(loadIv); hideLoading(); applyTime(); setVehicle(vehicleType); updateHint(); updateJournalPhase3(); drawMini(); drawBigMap(); renderJournalCards(); requestAnimationFrame(frame); }
}, 55);
loadText.textContent='Đang dựng đồng bằng Arcadia và đánh thức Mèo Vàng...';

// ═══ Áp preset đồ họa (gọi sau khi sun/dust/stars đã có) ═══
applyGraphicsPreset(gfxName, false);

// HUD: chọn preset + số đo hiệu năng
const gfxSel = document.getElementById('gfx-select');
if (gfxSel) {
  gfxSel.value = gfxName;
  gfxSel.addEventListener('change', () => {
    const n = applyGraphicsPreset(gfxSel.value, true);
    showToast('🎨', 'Đồ họa: ' + GFX_PRESETS[n].label, 'Đã áp dụng preset ' + n);
  });
}
const perfEl = document.getElementById('hud-perf');
let perfAcc = 0, perfFrames = 0, perfFps = 0;
function updatePerfHud(dt){
  if (!perfEl) return;
  perfAcc += dt; perfFrames++;
  if (perfAcc < 0.5) return;
  perfFps = Math.round(perfFrames / perfAcc);
  perfAcc = 0; perfFrames = 0;
  const i = renderer.info.render;
  perfEl.textContent = perfFps + ' FPS · ' + i.calls + ' draw · ' +
                        Math.round(i.triangles/1000) + 'k tri · ' + gfxName;
}

// expose for debug
window.__yc={ scene, player, camera, renderer, BIOMES, POIS, heightAt, sampleHeight, slopeAt, discovered, VEHICLES, setPlayerPos(x,z){ playerPos.x=x; playerPos.z=z; playerPos.y=sampleHeight(x,z)+VEHICLES[vehicleType].ride; settleToGround(); player.position.copy(playerPos); player.rotation.set(targetPitch, -playerYaw, targetRoll, 'YXZ'); player.updateMatrixWorld(true); },
  setVehicle(t){ setVehicle(t); },
  setCam(m){ camMode=m; },
  env: () => envMeshes.map(e=>({ name:e.name, count:e.count })),
  envSeed: ENV_SEED,
  landmarks: () => landmarks.map(L => ({ kind:L.userData.kind, x:L.userData.x, z:L.userData.z,
                                        topY:+L.userData.topY.toFixed(1) })),
  GFX_PRESETS, gfx: ()=>gfxName,
  setGfx(n){ return applyGraphicsPreset(n, true); },
  perf(){ return { fps:perfFps, ...renderer.info.render, gfx:gfxName,
                   pixelRatio:renderer.getPixelRatio(),
                   shadow: gfxShadowOn ? sun.shadow.mapSize.width : 0,
                   shadowMapEnabled: renderer.shadowMap.enabled,
                   fogDensity: scene.fog.density, dustMul: gfxDustMul }; },
  poseInfo(){ return { camMode, steerVis:+steerVis.toFixed(3), arms: vRefs.arms?vRefs.arms.length:0, bar: vRefs.barPos||null, bodyLift: BODY_LIFT }; },
  handWorld(){ player.updateMatrixWorld(true);
    return (vRefs.arms||[]).map(a=>{ const v=new THREE.Vector3(); a.wrist.getWorldPosition(v);
      const s=new THREE.Vector3(); a.shoulder.getWorldPosition(s);
      return { side:a.side, wrist:[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)],
               shoulder:[+s.x.toFixed(2),+s.y.toFixed(2),+s.z.toFixed(2)] }; }); },
  headWorld(){ player.updateMatrixWorld(true); const v=new THREE.Vector3();
    (vRefs.head||player).getWorldPosition(v); return [+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)]; },
  barWorld(){ player.updateMatrixWorld(true); const v=new THREE.Vector3();
    v.set(vRefs.barPos.x, vRefs.barPos.y, 0);
    (vRefs.barObj||player).localToWorld(v); return [+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)]; },
  torsoWorld(){ player.updateMatrixWorld(true); const v=new THREE.Vector3();
    v.set(0,1.52,0); player.localToWorld(v); return [+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)]; },
  wheels(){ return vRefs.wheels; },
  wheelCache(){ return wCache; },
  rides(){ return Object.fromEntries(Object.entries(VEHICLES).map(([k,v])=>[k,v.ride])); },
  rideReport(){
    // Đo BẰNG ĐÚNG công thức mà settleToGround dùng (wCache + yaw/pitch/roll),
    // nếu không phép đo sẽ lệch với hành vi thật của game.
    const cp=Math.cos(targetPitch), sp=Math.sin(targetPitch);
    const sr=Math.sin(targetRoll);
    const cyw=Math.cos(-playerYaw), syw=Math.sin(-playerYaw);
    let minClear=Infinity, sumClear=0, n=0;
    for(const w of wCache){
      const wx = playerPos.x + (w.x*cyw - w.z*syw);
      const wz = playerPos.z + (w.x*syw + w.z*cyw);
      const dy = w.y*cp;
      const dx = -w.y*sp;
      const dz = w.y*sr*cp;
      const gx = wx + dx*cyw - dz*syw;
      const gz = wz + dx*syw + dz*cyw;
      const clear = (playerPos.y + dy - w.r) - sampleHeight(gx, gz);
      if(clear<minClear) minClear=clear;
      sumClear+=clear; n++;
    }
    return { veh:vehicleType, minClear, hover:sumClear/Math.max(1,n),
             pitch:targetPitch, roll:targetRoll };
  },

  forceSettle(){ settleToGround(); player.position.copy(playerPos); player.rotation.set(targetPitch, -playerYaw, targetRoll, 'YXZ'); },
  get hf(){ return HF; }, forceStorm(){ stormTarget=0.9; stormEndsAt=performance.now()+30000; stormBanner.style.display='flex'; }, galleryList, refreshGalleryCache, openDiscovery, saveState(){ save(); return { distance, collected, discovered:[...discovered], playTimeSec }; } };
