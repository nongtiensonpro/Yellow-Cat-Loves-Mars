import * as THREE from 'three';

// ---------- Config ----------
const BIOMES = [
  { id:'arcadia', name:'Arcadia Planitia', color:'#c47a3a', h:10, pos:{x:0,z:0}, icon:'🏜️', desc:'Đồng bằng khởi đầu — bình minh cam hồng vô tận. Nơi Mèo Vàng tập đạp xe.' },
  { id:'valles', name:'Valles Marineris', color:'#8b3a18', h:55, pos:{x:420,z:-180}, icon:'🏔️', desc:'Hẻm núi lớn nhất hệ mặt trời — sâu 7km, dài 4000km. Thử thách cho xe máy.' },
  { id:'olympus', name:'Olympus Mons', color:'#a85a2a', h:95, pos:{x:-380,z:420}, icon:'🌋', desc:'Núi lửa cao 22km — cao gấp 3 Everest. Càng lên cao, trời càng sẫm.' },
  { id:'polar', name:'Planum Australe', color:'#d8c8b8', h:22, pos:{x:-520,z:-520}, icon:'❄️', desc:'Chỏm băng CO2 cực Nam — trắng cam kỳ ảo, băng phản chiếu.' },
  { id:'storm', name:'Dust Storm Zone', color:'#7a3d1a', h:8, pos:{x:520,z:480}, icon:'🌪️', desc:'Vùng bão bụi — tầm nhìn mờ ảo, ánh sáng khuếch tán điện ảnh.' },
];

const VEHICLES = {
  bike:  { name:'Xe đạp', icon:'🚲', speed:4.2, turn:1.9, bob:0.9 },
  moto:  { name:'Xe máy', icon:'🏍️', speed:10.5, turn:2.6, bob:0.6 },
  rover: { name:'Rover', icon:'🚙', speed:7.0, turn:2.0, bob:0.35 },
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

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x2a140a, 0.0012);

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

function heightAt(x,z){
  const binfo = biomeAt(x,z);
  const b=binfo.biome;
  const d=binfo.dist;
  // base elevation per biome with smooth falloff 700
  const influence = Math.max(0, 1 - d/700);
  const base = b.h * Math.pow(influence, 1.2);

  // detail noise
  const n1 = fbm(x*0.004, z*0.004, 5);
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

  return base + n1*18 + n2*4 + crater + special;
}

// ---------- Terrain mesh (chunked grid 160x160) ----------
const TERRAIN_SIZE=1400, SEG=160;
const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
terrainGeo.rotateX(-Math.PI/2);
const posAttr = terrainGeo.attributes.position;

for(let i=0;i<posAttr.count;i++){
  const x=posAttr.getX(i), z=posAttr.getZ(i);
  const h = heightAt(x,z);
  posAttr.setY(i, h);
}
terrainGeo.computeVertexNormals();


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

const terrainMat = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.92, metalness:0.02 });
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.receiveShadow=true;
scene.add(terrain);

// Rocks + craters decoration
const rockGeo = new THREE.DodecahedronGeometry(1,0);
const rockMat = new THREE.MeshStandardMaterial({ color:0x6b3a22, roughness:0.85 });
const rockCount=520;
const rocks=new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
rocks.castShadow=true; rocks.receiveShadow=true;
const dummy=new THREE.Object3D();
let ri=0;
for(let i=0;i<900 && ri<rockCount;i++){
  const x=(Math.random()-0.5)*TERRAIN_SIZE;
  const z=(Math.random()-0.5)*TERRAIN_SIZE;
  const y=heightAt(x,z);
  if(y<-6) continue;
  const s=0.5+Math.random()*1.8;
  dummy.position.set(x, y+ s*0.35, z);
  dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  dummy.scale.set(s,s*0.85,s);
  dummy.updateMatrix();
  rocks.setMatrixAt(ri++, dummy.matrix);
}
rocks.instanceMatrix.needsUpdate=true;
scene.add(rocks);

// Paw collectibles
const pawGroup=new THREE.Group();
scene.add(pawGroup);
const pawItems=[];
const pawGeo=new THREE.SphereGeometry(0.9,10,8);
const pawMat=new THREE.MeshStandardMaterial({ color:0xffcc33, emissive:0xffa500, emissiveIntensity:0.55, roughness:0.4 });
for(let i=0;i<18;i++){
  let x,z;
  do{ x=(Math.random()-0.5)*1200; z=(Math.random()-0.5)*1200; } while(biomeAt(x,z).biome.id==='storm' && Math.random()<0.6);
  const y=heightAt(x,z)+1.4;
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
const player=new THREE.Group();
scene.add(player);
let playerPos=new THREE.Vector3(0, heightAt(0,0)+1.2, 0);
player.position.copy(playerPos);
let playerYaw=0, playerPitch=0;

function buildVehicle(type){
  while(player.children.length) player.remove(player.children[0]);
  const g=new THREE.Group();
  // shadow disc
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(2.2,18), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.22}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; g.add(shadow);
  // body
  let body;
  if(type==='bike'){
    body=new THREE.Group();
    const frame=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.22,0.28), new THREE.MeshStandardMaterial({color:0xffcc33}));
    frame.position.set(0,0.9,0); body.add(frame);
    const wheelG=new THREE.TorusGeometry(0.55,0.08,8,18);
    const wMat=new THREE.MeshStandardMaterial({color:0x1a1a1a});
    const w1=new THREE.Mesh(wheelG,wMat); w1.position.set(-0.9,0.55,0); w1.rotation.y=Math.PI/2; body.add(w1);
    const w2=w1.clone(); w2.position.set(0.95,0.55,0); body.add(w2);
    const basket=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.35,0.4), new THREE.MeshStandardMaterial({color:0xd9a86c})); basket.position.set(1.15,1.0,0); body.add(basket);
    const fish=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), new THREE.MeshStandardMaterial({color:0x4fc3f7, emissive:0x0288d1, emissiveIntensity:0.3})); fish.position.set(1.15,1.22,0); body.add(fish);
    g.add(body);
  } else if(type==='moto'){
    body=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.5,0.7), new THREE.MeshStandardMaterial({color:0xff3b2f}));
    b.position.set(0,0.85,0); body.add(b);
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.22,0.55), new THREE.MeshStandardMaterial({color:0x1a1a1a})); seat.position.set(-0.2,1.12,0); body.add(seat);
    const wG=new THREE.TorusGeometry(0.42,0.12,8,16); const wM=new THREE.MeshStandardMaterial({color:0x111111});
    const w1=new THREE.Mesh(wG,wM); w1.position.set(-1.05,0.45,0); w1.rotation.y=Math.PI/2; body.add(w1);
    const w2=w1.clone(); w2.position.set(1.05,0.45,0); body.add(w2);
    g.add(body);
  } else {
    body=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.75,1.45), new THREE.MeshStandardMaterial({color:0xe8ddd0}));
    b.position.set(0,0.95,0); body.add(b);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.6,1.15), new THREE.MeshStandardMaterial({color:0x7ec8e3, transparent:true, opacity:0.72, roughness:0.2}));
    cabin.position.set(0.15,1.48,0); body.add(cabin);
    const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.0,8), new THREE.MeshStandardMaterial({color:0x111111})); ant.position.set(-1.1,1.6,0.55); body.add(ant);
    const light=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), new THREE.MeshStandardMaterial({color:0xfff6a0, emissive:0xfff176, emissiveIntensity:0.9})); light.position.set(1.35,0.95,0.35); body.add(light);
    const light2=light.clone(); light2.position.set(1.35,0.95,-0.35); body.add(light2);
    const wG=new THREE.CylinderGeometry(0.38,0.38,0.32,14); wG.rotateZ(Math.PI/2); const wM=new THREE.MeshStandardMaterial({color:0x1e1e1e});
    for(const [x,z] of [[-0.9,0.78],[0.9,0.78],[-0.9,-0.78],[0.9,-0.78]]){ const w=new THREE.Mesh(wG,wM); w.position.set(x,0.42,z); body.add(w); }
    g.add(body);
  }
  // cat
  const cat=new THREE.Group();
  const catBody=new THREE.Mesh(new THREE.CapsuleGeometry(0.28,0.45,4,10), new THREE.MeshStandardMaterial({color:0xffcc33}));
  catBody.rotation.z=Math.PI/2; catBody.position.set(0,1.55,0); cat.add(catBody);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,10), new THREE.MeshStandardMaterial({color:0xffd54f})); head.position.set(0.38,1.82,0); cat.add(head);
  const earG=new THREE.ConeGeometry(0.12,0.22,8);
  const ear1=new THREE.Mesh(earG, new THREE.MeshStandardMaterial({color:0xffb300})); ear1.position.set(0.42,2.05,0.14); cat.add(ear1);
  const ear2=ear1.clone(); ear2.position.set(0.42,2.05,-0.14); cat.add(ear2);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(0.42,14,10), new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:0.22, roughness:0.05})); helmet.position.set(0.38,1.84,0); cat.add(helmet);
  const scarf=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.52), new THREE.MeshStandardMaterial({color:0xff3b2f})); scarf.position.set(0.12,1.58,0); cat.add(scarf);
  g.add(cat);
  cat.name='cat';
  player.add(g);
}
buildVehicle(vehicleType);

// wheel spin helper: find wheels by traversal and spin
let wheelSpin=0;


// ---------- Camera helpers ----------
let camMode=1; // 0 first, 1 third, 2 orbit
let camYaw=0.6, camPitch=0.28, camDist=10;
let isDragging=false, lastX=0, lastY=0;

function updateCamera(dt){
  if(photoMode || camMode===2){
    // free orbit around player
    const r=camDist;
    const x = playerPos.x + Math.cos(camYaw)*Math.cos(camPitch)*r;
    const y = heightAt(playerPos.x, playerPos.z)+ 1.2 + Math.sin(camPitch)*r + 1.0;
    const z = playerPos.z + Math.sin(camYaw)*Math.cos(camPitch)*r;
    camera.position.lerp(new THREE.Vector3(x,y,z), 0.12);
    camera.lookAt(playerPos.x, heightAt(playerPos.x, playerPos.z)+1.2, playerPos.z);
    return;
  }
  if(camMode===0){
    const fwd=new THREE.Vector3(Math.cos(playerYaw),0,Math.sin(playerYaw));
    camera.position.copy(playerPos).addScaledVector(fwd, 0.9);
    camera.position.y = heightAt(playerPos.x, playerPos.z)+1.55;
    const look=new THREE.Vector3().copy(playerPos).addScaledVector(fwd, 12);
    camera.lookAt(look);
  } else {
    const r=camDist;
    const yaw = playerYaw + 0.15;
    const x = playerPos.x - Math.cos(yaw)*r*0.95;
    const z = playerPos.z - Math.sin(yaw)*r*0.95;
    const y = heightAt(playerPos.x, playerPos.z)+ 2.8 + Math.sin(0.35)*1.2;
    // clamp terrain
    const tx = THREE.MathUtils.lerp(camera.position.x, x, 0.08);
    const tz = THREE.MathUtils.lerp(camera.position.z, z, 0.08);
    const ty = THREE.MathUtils.lerp(camera.position.y, y, 0.08);
    camera.position.set(tx,ty,tz);
    camera.lookAt(playerPos.x, heightAt(playerPos.x, playerPos.z)+1.0, playerPos.z);
  }
}

// ---------- Terrain height sampling for player ----------
function sampleHeight(x,z){
  // bilinear from terrain geo is heavy; use heightAt for gameplay, lerp visually
  return heightAt(x,z);
}

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
      const hh=heightAt(x,z);
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
  playerPos.set(b.pos.x, sampleHeight(b.pos.x,b.pos.z)+1.5, b.pos.z);
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

  // movement
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
    const nx = playerPos.x + Math.cos(playerYaw)*distStep;
    const nz = playerPos.z + Math.sin(playerYaw)*distStep;
    // clamp world
    const nxC=THREE.MathUtils.clamp(nx, -TERRAIN_SIZE/2+8, TERRAIN_SIZE/2-8);
    const nzC=THREE.MathUtils.clamp(nz, -TERRAIN_SIZE/2+8, TERRAIN_SIZE/2-8);
    const h0=sampleHeight(playerPos.x, playerPos.z);
    const h1=sampleHeight(nxC, nzC);
    // slope limit per vehicle
    const slope=Math.abs(h1-h0)/Math.max(0.1, Math.hypot(nxC-playerPos.x, nzC-playerPos.z));
    let allow=true;
    if(vehicleType==='bike' && slope>0.72) allow=false;
    if(vehicleType==='moto' && slope>1.15) allow=false;
    // rover can go anywhere but slower uphill
    const uphill = Math.max(0, h1-h0);
    const slow = THREE.MathUtils.clamp(1 - uphill*0.09, 0.32, 1);
    if(allow){
      playerPos.set(nxC, h1+1.18, nzC);
      distance += Math.hypot(nxC, nzC) ? Math.abs(distStep)*0.06*slow : 0;
      wheelSpin += Math.abs(distStep)*4.2;
    }
    // bobbing
    const bob = Math.sin(now*0.012 * (Math.abs(speed)+1.2))* conf.bob*0.08 * Math.abs(fwd);
    playerPos.y = sampleHeight(playerPos.x, playerPos.z)+1.18 + Math.max(0,bob);
  } else {
    playerPos.y = sampleHeight(playerPos.x, playerPos.z)+1.18;
  }
  player.position.copy(playerPos);
  player.rotation.y = playerYaw;
  // wheel spin visual: rotate wheels
  player.traverse(o=>{
    if(o.isMesh && o.geometry && o.geometry.type==='TorusGeometry'){ o.rotation.x += wheelSpin*0.02; wheelSpin*=0.92; }
  });

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
  dustMat.opacity = THREE.MathUtils.clamp( (isStorm?0.42:0.0) + Math.min(0.35, speedKmh/70), 0, 0.55);
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
  // Phase 3: audio + stars + journal
  if(audioEnabled) tickAudio(dt, speedKmh, bi.id);
  maybeShootingStar(now);
  updateJournalPhase3();

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

let loadP=0;
const loadIv=setInterval(()=>{
  loadP=Math.min(100, loadP+ (Math.random()*18+6));
  loadBar.style.width=loadP+'%'; loadPct.textContent=Math.round(loadP)+'%';
  if(loadP>=100){ clearInterval(loadIv); hideLoading(); applyTime(); setVehicle(vehicleType); updateHint(); updateJournalPhase3(); drawMini(); drawBigMap(); renderJournalCards(); requestAnimationFrame(frame); }
}, 120);
loadText.textContent='Đang dựng đồng bằng Arcadia và đánh thức Mèo Vàng...';

// expose for debug
window.__yc={ scene, player, BIOMES, POIS, heightAt, discovered, setPlayerPos(x,z){ playerPos.set(x, heightAt(x,z)+1.18, z); player.position.copy(playerPos); }, galleryList, refreshGalleryCache, openDiscovery, saveState(){ save(); return { distance, collected, discovered:[...discovered], playTimeSec }; } };
