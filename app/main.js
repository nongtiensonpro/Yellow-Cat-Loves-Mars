import * as THREE from 'three';
import { decodePatches, PATCH_N, PATCH_ORDER, PATCH_IDX, PATCH_RELIEF } from './mola-patches.js';
// Phase 2 Task 2.4 — post-processing. Tất cả đều đã có sẵn trong three@0.160.
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader }      from 'three/examples/jsm/shaders/FXAAShader.js';
// Hero asset glTF — Mèo Vàng dựng bằng Blender (scripts/build-meo-vang.py).
// Draco nén 852 KB -> 105 KB nhưng cần bộ giải mã; vite.config.js chép sẵn vào
// dist/draco/. Đường dẫn tính từ document.baseURI vì base='./' (Pages nằm ở
// subpath) — đường dẫn tuyệt đối '/draco/' sẽ 404 trên GitHub Pages.
import { GLTFLoader }      from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader }     from 'three/examples/jsm/loaders/DRACOLoader.js';

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
// GIÁ TRỊ ĐÚNG theo công thức sunH = sin(t*2π - π/2):
//   t=0.00 → sunH=-1  NỬA ĐÊM      t=0.50 → sunH=+1  TRƯA
//   t=0.25 → sunH= 0  BÌNH MINH    t=0.75 → sunH= 0  HOÀNG HÔN
// Comment cũ ghi "0 dawn, 0.5 noon, 1 dusk" là SAI, và timeOfDay=0 khiến game
// luôn khởi động ở nửa đêm (mặt trời thấp hơn mặt đất 220m) nên cảnh tối om.
let timeOfDay = 0.33;   // sáng sớm: nắng vừa lên, đủ sáng mà vẫn có bóng dài
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
// autoReset mặc định reset info ở MỖI lần renderer.render(). Khi bật composer,
// lượt render cuối là pass hình vuông toàn màn hình → info chỉ còn "1 draw, 1 tri"
// và số liệu trở nên vô nghĩa. Tắt autoReset và reset thủ công đầu mỗi khung:
// giờ số liệu là TỔNG của cả cảnh + các pass hậu kỳ — đúng thứ cần đo.
renderer.info.autoReset = false;
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
// Phase 2 Task 2.4 — trạng thái post-FX.
// PHẢI khai báo TRƯỚC applyGraphicsPreset(): hàm đó được gọi lúc khởi tạo và gọi
// applyPostFX(), nếu khai báo sau sẽ TDZ -> ReferenceError lúc boot. Đã dính lỗi
// này một lần; giữ nguyên vị trí này.
let composer = null, renderPass = null, bloomPass = null, fxaaPass = null, gradePass = null, focusPass = null;
let postEnabled = false;
let hazePass = null, raysPass = null;

function applyGraphicsPreset(name, save){
  if (!GFX_PRESETS[name]) return gfxName;
  gfxName = name;
  const g = GFX_PRESETS[name];
  const target = g.renderScale * Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(target);
  renderer.setSize(innerWidth, innerHeight, false);
  // Post-FX phải đi sau setPixelRatio/setSize: EffectComposer tự tạo render
  // target theo kích thước lúc khởi tạo, nếu không setSize lại thì preset
  // renderScale (low 0.70) bị vô hiệu hoá khi bật post-FX.
  applyPostFX(name);
  resizePostFX();
  // Shadow: 0 = tắt hoàn toàn (tiết kiệm lớn nhất trên mobile)
  const wantShadow = g.shadow > 0;
  const wasShadow = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = wantShadow;
  if (wantShadow) {
    sun.shadow.mapSize.set(g.shadow, g.shadow);
  // Lớp xa dùng nửa độ phân giải: nó phủ 600m nên cần độ mịn hơn nhưng không
  // cần bằng lớp gần; giữ nguyên phân bổ ngân sách cho lớp gần.
  sunFar.shadow.mapSize.set(Math.max(512, g.shadow/2), Math.max(512, g.shadow/2));
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  if (sunFar.shadow.map) { sunFar.shadow.map.dispose(); sunFar.shadow.map = null; }
  }
  sun.castShadow = wantShadow;
  sunFar.castShadow = wantShadow;
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

const hemi = new THREE.HemisphereLight(0xffd8b0, 0x1a0f0a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
sun.position.set(300, 400, 100);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 1400;
// ── Task 2.3: shadow camera BÁM THEO NGƯỜI CHƠI ──
// Trước đây: hộp ortho 1200×1200 tĩnh, tâm ở gốc toạ độ.
//  + Bản đồ rộng 1400m nhưng hộp chỉ ±600m → người chơi ở rìa bản đồ rơi
//    NGOÀI hộp shadow, mất bóng hoàn toàn.
//  + 1200m / 2048 texel = 0.586 m mỗi texel. Mèo Vàng cao ~1m → bóng xe chỉ
//    được ~1.7 texel, nhòe thành vệt.
// Nay: hộp ±SHADOW_FOLLOW_R quanh người chơi, cùng mapSize.
// 75m / 2048 = 0.037 m mỗi texel → mượt hơn 16×, và luôn bao trọn người chơi.
const SHADOW_FOLLOW_R = 40;
sun.shadow.camera.left  =-SHADOW_FOLLOW_R; sun.shadow.camera.right = SHADOW_FOLLOW_R;
sun.shadow.camera.top   = SHADOW_FOLLOW_R; sun.shadow.camera.bottom=-SHADOW_FOLLOW_R;
sun.shadow.camera.updateProjectionMatrix();
// normalBias: terrain nay da co normal map, mat phang nghieng → acnhe ghe,
// phai day (khong phai bias) thi moi dung. Gia tri ~0.05m cho san 8.75m/cell.
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
// Blur nhẹ: PCFSoft đã lọc, radius chỉ giúp bóng mềm ở cạnh mà không nhòe tim bóng
sun.shadow.radius = 2;
// sun.target mặc định là (0,0,0) và KHÔNG nằm trong scene — dùng thì nên thêm
// vào scene, nếu không ma trận thế giới của nó không được cập nhật.
const sunTarget = new THREE.Object3D();
scene.add(sunTarget);
sun.target = sunTarget;
scene.add(sun);

// ── CASCADE 2 LỚP (Task 2.3, phương án A) ──
// Một hộp shadow duy nhất KHÔNG thỏa cả hai đồng thời: hộp hẹp → sắc nhưng mép
// cắt rõ; hộp rộng → phủ hết nhưng thô. Nên tách theo LAYER, không theo khoảng
// cách — layer là tĩnh, nên mép ghép không trôi theo người chơi.
//
//   layer 1 (sun)    : ±40m  / 2048 → xe + Mèo Vàng. 40/2048 = 0.020 m/texel
//   layer 2 (sunFar) : ±600m / 1024 → địa hình, đá, landmark. 1.17 m/texel
//
// Mỗi vật thể chỉ bật đúng MỘT layer ánh sáng → không bao giờ bị chiếu sáng
// đôi. Camera vẫn thấy hết vì mọi object đều giữ layer 0.
sun.layers.set(1);
const sunFar = new THREE.DirectionalLight(0xfff0d0, 1.6);
sunFar.position.set(300, 400, 100);
sunFar.castShadow = true;
sunFar.shadow.mapSize.set(1024, 1024);
sunFar.shadow.camera.near = 1; sunFar.shadow.camera.far = 1400;
const SHADOW_FAR_R = 600;
sunFar.shadow.camera.left=-SHADOW_FAR_R; sunFar.shadow.camera.right=SHADOW_FAR_R;
sunFar.shadow.camera.top =SHADOW_FAR_R; sunFar.shadow.camera.bottom=-SHADOW_FAR_R;
sunFar.shadow.camera.updateProjectionMatrix();
// Lưới thưa hơn nên phải đẩy vệt ra xa hơn, nếu không bóng mờ thành vệt đen
sunFar.shadow.bias = -0.0009;
sunFar.shadow.normalBias = 0.30;
sunFar.shadow.radius = 3;
const sunFarTarget = new THREE.Object3D();
scene.add(sunFarTarget);
sunFar.target = sunFarTarget;
sunFar.layers.set(2);
scene.add(sunFar);
// Ánh sáng môi trường phải chiếu MỌI layer, nếu không các vật thể chỉ nhận
// đúng một nguồn trong hai nguồn sẽ thành mảng tối.
hemi.layers.enableAll();

/**
 * Đánh dấu object thuộc lớp ánh sáng XA (nhận bóng từ sunFar).
 *
 * CHỈ áp cho mesh. Bản đầu gọi enable(2) cho MỌI thứ trong scene và đã bắt
 * được chính các đèn: sun bị đổi mask 2 → 6, tức nó sáng cho CẢ hai lớp, và
 * mọi vật thể lớp xa bị chiếu sáng đôi (sun + sunFar cộng dồn) → màu nhạt, mờ.
 * Đèn không được tự bật layer: layer quyết định vật thể nào được đèn nào soi.
 */
function markFar(obj){
  if (obj.isLight || obj.isCamera) return obj;      // đèn/camera: giữ nguyên layer
  if (obj.isMesh || obj.isInstancedMesh || obj.isPoints || obj.isLine) obj.layers.enable(2);
  if (obj.traverse) obj.traverse(o=>{
    if (o.isLight || o.isCamera) return;
    if (o.isMesh || o.isInstancedMesh || o.isPoints || o.isLine) o.layers.enable(2);
  });
  return obj;
}
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

// ════════════════════════════════════════════════════════════════════════════
// BỘ MAP THỦ TỤC CHO ĐẤT — Giai đoạn 1 P0 Task 1.4
//
// Vấn đề gốc: terrain chỉ có vertexColors + albedo 256², KHÔNG có normal map.
// Không có normal map thì bề mặt không đổi sắc độ theo hướng ánh sáng → đọc
// như một mặt phẳng, đúng lỗi "mặt phẳng procedural trống" mà review nêu.
// Nay sinh 3 map từ CÙNG một trường cao fbm (tất định, không Math.random):
//   • normal  — cho ánh sáng vi tế, đây là thứ giúp đất "có bề mặt"
//   • albedo  — cát cơ bản + vệt sóng gió + đốm sỏi, lấy từ độ cao
//   • rough   — biến thiên độ nhám, vùng gió mạnh thì bóng hơn
// Mọi thứ tile được (RepeatWrapping) nên không lộ tile khi lái xa.
// ════════════════════════════════════════════════════════════════════════════
const TERR_N = 512;                       // 512² ≈ 22px/m khi repeat 60
function terrHash(x, y, s){
  let h = x*374761393 + y*668265263 + s*1442695040888963407;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function terrNoise(x, y, s){               // value noise + nội suy mượt
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf);
  const a = terrHash(xi, yi, s),     b = terrHash(xi+1, yi, s);
  const c = terrHash(xi, yi+1, s),   d = terrHash(xi+1, yi+1, s);
  return (a*(1-u)+b*u)*(1-v) + (c*(1-u)+d*u)*v;
}
function terrFbm(x, y, oct){
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i=0;i<oct;i++){
    sum += terrNoise(x*freq, y*freq, 7+i*13) * amp;
    norm += amp; amp *= 0.5; freq *= 2.07;
  }
  return sum / norm;                       // 0..1
}
// Trường cao: hạt cát tần số cao + vệt sóng gió + mảng lớn.
// Vệt gió được DOMAIN WARP trước khi lấy sin: nếu không, các vân song song
// đều tăm tắp lặp theo tile và nhìn rõ "vân sọc" nhân tạo khi lái xa.
function terrHeight(x, y){
  const grain = terrFbm(x*0.42, y*0.42, 3);              // hạt cát
  // warp: dịch pha (và cả toạ độ) theo fbm tần số thấp
  const wx = terrFbm(x*0.021, y*0.021, 2) - 0.5;
  const wy = terrFbm(x*0.021+31.7, y*0.021-11.3, 2) - 0.5;
  const rx = x + wx*46 + wy*9;                            // vệt uốn lượn
  const ripple = 0.5 + 0.5*Math.sin(rx*0.38 + wy*5.0 + terrFbm(x*0.06, y*0.06, 2)*4.0);
  const patch = terrFbm(x*0.035, y*0.035, 3);             // mảng lớn
  return grain*0.42 + ripple*0.16 + patch*0.42;
}

const terrMaps = (()=>{
  // --- 1. trường cao (dùng chung cho cả 3 map) ---
  const H = new Float32Array(TERR_N*TERR_N);
  for (let y=0;y<TERR_N;y++)
    for (let x=0;x<TERR_N;x++)
      H[y*TERR_N+x] = terrHeight(x, y);

  const cA = document.createElement('canvas'); cA.width=cA.height=TERR_N;
  const gA = cA.getContext('2d');
  const iA = gA.createImageData(TERR_N, TERR_N), dA = iA.data;

  const cR = document.createElement('canvas'); cR.width=cR.height=TERR_N;
  const gR = cR.getContext('2d');
  const iR = gR.createImageData(TERR_N, TERR_N), dR = iR.data;

  const cN = document.createElement('canvas'); cN.width=cN.height=TERR_N;
  const gN = cN.getContext('2d');
  const iN = gN.createImageData(TERR_N, TERR_N), dN = iN.data;

  const at = (x,y)=> H[((y+TERR_N)%TERR_N)*TERR_N + ((x+TERR_N)%TERR_N)];
  const STRENGTH = 1.75;   // cường độ nện (bump) — quá cao thì đất thành vũng bùn
  for (let y=0;y<TERR_N;y++){
    for (let x=0;x<TERR_N;x++){
      const k = y*TERR_N+x, o = k*4;
      const h = H[k];
      // ---- albedo: cát sáng, mảng tối theo patch, lấm tấm sỏi ----
      const v = 0.90 + h*0.24;
      dA[o  ] = Math.min(255, 255*v);
      dA[o+1] = Math.min(255, 250*v);     // hơi ấm
      dA[o+2] = Math.min(255, 240*v*0.96);// bớt xanh
      dA[o+3] = 255;
      // ---- roughness: chỗ thấp (bụi lắng) nhám hơn, chỗ cao bóng hơn ----
      const rg = 216 - h*66;              // ~0.85 .. ~0.59
      dR[o]=dR[o+1]=dR[o+2]=rg; dR[o+3]=255;
      // ---- normal map: gradient của trường cao (OpenGL: +Y lên) ----
      const dx = (at(x+1,y) - at(x-1,y)) * STRENGTH;
      const dy = (at(x,y+1) - at(x,y-1)) * STRENGTH;
      let nx = -dx, ny = -dy, nz = 1.0;
      const len = Math.hypot(nx,ny,nz);
      nx/=len; ny/=len; nz/=len;
      dN[o  ] = (nx*0.5+0.5)*255;
      dN[o+1] = (ny*0.5+0.5)*255;
      dN[o+2] = (nz*0.5+0.5)*255;
      dN[o+3] = 255;
    }
  }
  gA.putImageData(iA,0,0); gR.putImageData(iR,0,0); gN.putImageData(iN,0,0);

  const mk = (cv, srgb, rep)=>{
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { albedo: mk(cA, true, 60), rough: mk(cR, false, 60), normal: mk(cN, false, 60) };
})();
const albedoTex = terrMaps.albedo;

const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors:true, map:albedoTex,
  normalMap: terrMaps.normal, normalScale: new THREE.Vector2(1.00, 1.00),
  roughnessMap: terrMaps.rough, roughness: 1.0,   // 1.0 để roughnessMap chi phối (0.59–0.85)
  metalness:0.02,
});
// ════════════════════════════════════════════════════════════════════════════
// TERRAIN CHUNK + LOD — Phase 2 Task 2.5
//
// Trước đây: MỘT PlaneGeometry 1400×1400, 160×160 ô = 51 200 tam giác, luôn
// vẽ trọn bản đồ mỗi khung bất kể người chơi đứng ở đâu. 1400×1400 m đứng
// yên thì nhìn thấy có vài trăm mét — phần còn lại vẽ để không.
//
// Cách chia: 8×8 chunk, mỗi chunk 175m. Ba mức LOD lồng NHAU trên cùng một
// lưới: 20 → 10 → 5 ô. Vì 20 chia hết cho 10 và cho 5, mọi đỉnh của mức thô
// đều là tập con của mứt mịn và CÙNG LÀ một điểm lưới, nên:
//   · chiều cao lấy thẳng từ HF.data → khớp 100% với physics
//   · hai LOD kề nhau CÙNG dùng một đỉnh ở mép → KHÔNG có khe nứt theo cấu trúc,
//     không cần kỹ thuật "vày che" (skirt) hay snap cạnh.
// Ngưỡng chuyển mức đặt sau tường bụi 430m (Task 2.6) nên người chơi không thấy
// đường chuyển; thêm hysteresis 28m để chunk đang nằm đúng ngưỡng không nhấp nháy.
const CHUNKS        = 8;
const CHUNK_SIZE    = TERRAIN_SIZE / CHUNKS;                 // 175 m
const HF_CELLS_CHUNK= Math.round(CHUNK_SIZE / HF.cell);       // 20 ô heightfield
const CHUNK_LOD_SEG = [HF_CELLS_CHUNK, HF_CELLS_CHUNK/2, HF_CELLS_CHUNK/4];  // 20/10/5
const CHUNK_LOD_DIST= [190, 380, 700];   // <190 m LOD0, <380 LOD1, còn lại LOD2
const CHUNK_HYST    = 28;                // m: nới ngưỡng khi lùi ra để không nhấp nháy

const terrainChunks = [];
const _chNormal = new THREE.Vector3();
const _chColor  = new THREE.Color();
const POLAR_TINT= new THREE.Color(0xe8ddd0);
const STORM_TINT= new THREE.Color(0x8a4a1e);
const chunkGroup= new THREE.Group();
chunkGroup.name='terrainChunks';
scene.add(chunkGroup);

/** Dựng geometry của 1 chunk ở 1 mức LOD, đọc chiều cao từ HF.data. */
function buildChunkGeo(cx, cz, seg){
  const n  = HF.n, data = HF.data, min = HF.min, cell = HF.cell;
  const stride = HF_CELLS_CHUNK / seg;                 // 1, 2 hoặc 4
  const i0 = cx*HF_CELLS_CHUNK, j0 = cz*HF_CELLS_CHUNK;
  const vcount = (seg+1)*(seg+1);
  const pos  = new Float32Array(vcount*3);
  const nor  = new Float32Array(vcount*3);
  const col  = new Float32Array(vcount*3);
  const idx  = new Uint32Array(seg*seg*6);
  for (let j=0;j<=seg;j++){
    const gj = Math.min(n-1, j0 + j*stride);
    for (let i=0;i<=seg;i++){
      const gi = Math.min(n-1, i0 + i*stride);
      const k  = gj*n + gi;
      const x  = min + gi*cell, z = min + gj*cell, y = data[k];
      const v  = (j*(seg+1)+i)*3;
      pos[v]=x; pos[v+1]=y; pos[v+2]=z;
      // pháp tuyến: gradient lưới, dùng chung công thức với HF.normalAt
      const hL=data[gj*n+Math.max(0,gi-1)], hR=data[gj*n+Math.min(n-1,gi+1)];
      const hD=data[Math.max(0,gj-1)*n+gi], hU=data[Math.min(n-1,gj+1)*n+gi];
      _chNormal.set(hL-hR, 2*cell, hD-hU).normalize();
      nor[v]=_chNormal.x; nor[v+1]=_chNormal.y; nor[v+2]=_chNormal.z;
      // màu: đúng công thức vertex color của terrain gốc
      const slope = 1 - _chNormal.y;
      // PHẢI Y HỆT công thức gốc. Đã viết sai `y < -2` thành `y > -2` một lần:
      // nhánh tối (0.07,0.35,0.30) dành cho đất TRŨNG dưới -2m, nhưng đảo dấu thành
      // `y > -2` thì gần như TOÀN BỘ đồng bằng (y≈0) rơi vào nhánh tối → mặt đất
      // đen như mực, chỉ còn đá vẫn thấy.
      if      (y> 80) _chColor.setHSL(0.08, 0.25, 0.62 - slope*0.2);
      else if (y> 35) _chColor.setHSL(0.06, 0.55, 0.45 - slope*0.15);
      else if (y> 12) _chColor.setHSL(0.05, 0.45, 0.40);
      else if (y< -2) _chColor.setHSL(0.07, 0.35, 0.30);
      else            _chColor.setHSL(0.055,0.50, 0.38);
      const bi = biomeAt(x,z).biome;
      if (bi.id==='polar') _chColor.lerp(POLAR_TINT, 0.45);
      if (bi.id==='storm') _chColor.lerp(STORM_TINT, 0.20);
      // BUG ĐÃ MẮC: viết `_chColor.z` — THREE.Color có .r/.g/.b, KHÔNG có .z.
      // undefined ghi vào Float32Array thành NaN → mảng đen; và NaN lan qua
      // chuỗi blur của UnrealBloomPass nên đen TOÀN BỘ khung hình.
      col[v]=_chColor.r; col[v+1]=_chColor.g; col[v+2]=_chColor.b;
    }
  }
  for (let j=0;j<seg;j++) for (let i=0;i<seg;i++){
    const a=j*(seg+1)+i, b=a+1, c=a+seg+1, d=c+1, o=(j*seg+i)*6;
    // cùng cách chia tam giác như PlaneGeometry để hướng pháp tuyến khớp
    idx[o]=a; idx[o+1]=c; idx[o+2]=b;
    idx[o+3]=c; idx[o+4]=d; idx[o+5]=b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('normal',   new THREE.BufferAttribute(nor,3));
  g.setAttribute('color',    new THREE.BufferAttribute(col,3));
  g.setIndex(new THREE.BufferAttribute(idx,1));
  g.computeBoundingSphere();
  return g;
}

for (let cz=0; cz<CHUNKS; cz++) for (let cx=0; cx<CHUNKS; cx++){
  const lods = CHUNK_LOD_SEG.map(s => new THREE.Mesh(buildChunkGeo(cx,cz,s), terrainMat));
  for (const m of lods){ m.receiveShadow = true; m.visible = false; chunkGroup.add(m); }
  // tâm chunk để tính khoảng cách
  const cxm = HF.min + (cx+0.5)*CHUNK_SIZE, czm = HF.min + (cz+0.5)*CHUNK_SIZE;
  terrainChunks.push({ cx, cz, x:cxm, z:czm, lods, lod:-1 });
}
// Chốt an toàn: NaN trong bất kỳ thuộc tính nào cũng làm mảng đen, và nếu post-FX
// đang bật thì còn lan qua bloom. Quét một lần lúc khởi tạo, có thì báo ngay.
{
  let bad = 0, where = '';
  for (const c of terrainChunks) for (const m of c.lods){
    for (const nm of ['position','normal','color']){
      const a = m.geometry.getAttribute(nm).array;
      for (let i=0;i<a.length;i++) if (!Number.isFinite(a[i])){
        bad++; where = `${m.geometry.uuid.slice(0,6)}/${nm}[${i}]`; break; }
    }
  }
  if (bad) console.error('[terrain] LỖI: NaN/Infinity trong', bad, 'thuộc tính, vd', where);
  else console.info('[terrain] ✓ không NaN trong position/normal/color');
}
console.info('[terrain]', terrainChunks.length, 'chunk ×', CHUNK_LOD_SEG.length, 'LOD =',
            terrainChunks.length*CHUNK_LOD_SEG.length, 'mesh (chỉ 1 LOD/chunk hiện tại)');

// Chọn LOD theo khoảng cách. Chạy mỗi 6 khung: khoảng cách đổi chậm, không
// cần tính từng khung, và giữ được ngân sách CPU cho phần còn lại.
let _chunkTick = 0;
function updateChunkLOD(){
  const px = playerPos.x, pz = playerPos.z;
  let vis = 0, tris = 0;
  for (const c of terrainChunks){
    const d = Math.hypot(c.x - px, c.z - pz);
    let want;
    if      (d < CHUNK_LOD_DIST[0])              want = 0;
    else if (d < CHUNK_LOD_DIST[1])              want = 1;
    else if (d < CHUNK_LOD_DIST[2] + CHUNK_HYST) want = 2;
    else { c.lods[2].visible = false; if (c.lod!==-1){ c.lod=-1; } continue; }
    // hysteresis: khi đang ở mức cao hơn thì phải lùi xa hơn ngưỡng mới hạ mức
    if (c.lod > want && d < CHUNK_LOD_DIST[c.lod] + CHUNK_HYST) want = c.lod;
    if (c.lod !== want){
      c.lods.forEach((m,i)=> m.visible = (i===want));
      c.lod = want;
    }
    vis++;
    const s = CHUNK_LOD_SEG[want];
    tris += s*s*2;
  }
  return { vis, tris };
}
const terrain = { receiveShadow:true };   // giữ tên cho code cũ/tham chiếu debug

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
// Vật liệu landmark: dựng BẰNG autoMat() như xe và đất, không phải
// MeshStandardMaterial phẳng. Trước đây landmark là ngoại lệ — màu tối đơn
// sắc, không normal/roughness map — nên giữa đất sáng cam và đá gần như đen
// tím, đọc ra như vết bóng chứ không phải đá. Bị autoMat định nghĩa SAU
// nên phải để khai báo let và gán muộn (xem nơi gán, sau hàm autoMat).
let LM_MATS = null;
function makeLandmarkMats(){
  return {
    rock:    autoMat(0x9a6038, 0.0, 0.88, null, 'lm-rock'),
    rockLit: autoMat(0xb8794a, 0.0, 0.82, null, 'lm-rocklit'),
    dark:    autoMat(0x5a3320, 0.0, 0.93, null, 'lm-dark'),
    beacon:  new THREE.MeshStandardMaterial({ color:0xffcc33, emissive:0xffa500,
               emissiveIntensity:0.55, roughness:0.4 }),
  };
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
  } else if (kind === 'canyon') {
    // HÀO VALLES — chuỗi hào lớn: hai vách đối diện bậc thang, khe đen ở giữa.
    // Silhouette đọc là "khe hở thấp giữa hai khối", khác hẳn mesa (bàn) và
    // spire (tháp). Đây là dấu hiệu địa lý đặc trưng của Valles Marineris.
    const len = 300*scale, wid = 62*scale, depth = 44*scale;
    for (const s of [-1, 1]){
      // 5 bậc thang mỗi vách — vách bị bào mòn theo tầng, không phẳng
      for (let t=0;t<5;t++){
        const tt = t/5;
        const wdt = wid*(1 - tt*0.22);
        const h = depth*0.20;
        const step = new THREE.Mesh(new THREE.BoxGeometry(len*(1-tt*0.10), h, wdt),
          t%2 ? LM_MATS.rock : LM_MATS.rockLit);
        step.position.set(0, -depth*0.5 + (t+0.5)*h, s*(wid*0.5 + wdt*0.5 - tt*wid*0.11));
        step.castShadow = step.receiveShadow = true; g.add(step);
      }
    }
    // Đáy khe tối: có nền thật để đọc ra chiều sâu, không phải hố đen
    const floor = new THREE.Mesh(new THREE.BoxGeometry(len*0.92, 2, wid*0.55), LM_MATS.dark);
    floor.position.y = -depth*0.5; floor.receiveShadow = true; g.add(floor);
    // Gờ mảnh ven miệng hào
    for (const s of [-1, 1]){
      for (let i=0;i<5;i++){
        const tooth = new THREE.Mesh(new THREE.BoxGeometry((9+((i*13)%17))*scale, (5+((i*7)%6))*scale, 6*scale),
          i%2 ? LM_MATS.dark : LM_MATS.rock);
        tooth.position.set((i-2)*len*0.19, (7+((i*5)%4))*scale*0.5, s*wid*0.5);
        tooth.rotation.set(((i%3)-1)*0.13, (i*11)%7*0.19, ((i%4)-1.5)*0.11);
        tooth.castShadow = tooth.receiveShadow = true; g.add(tooth);
      }
    }
  } else if (kind === 'terrace') {
    // BÀN ĐÁ NHIỀU TẦNG — 3 phiến lớn chồng lệch, từ xa nhìn thành bậc thang.
    // Khác mesa: mesa đối xứng và có răng cưa; terrace LỆCH tầng và trơn.
    let w = 46*scale, y0 = 0;
    for (let i=0;i<3;i++){
      const h = (11+((i*5)%4))*scale;
      const slab = new THREE.Mesh(new THREE.CylinderGeometry(w*0.80, w, h, 7, 1),
        i%2 ? LM_MATS.rockLit : LM_MATS.rock);
      slab.position.set((i-1)*7*scale, y0 + h*0.5, (i%2?1:-1)*5*scale);
      slab.rotation.y = (i-1)*0.22;
      slab.castShadow = slab.receiveShadow = true; g.add(slab);
      y0 += h; w *= 0.78;
    }
    // Mỏm hành lang chéo tạo đường lên điểm nhìn
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(16*scale, 3.4*scale, 54*scale), LM_MATS.rockLit);
    ramp.position.set(26*scale, 9*scale, 14*scale);
    ramp.rotation.set(0, -0.34, 0.30);
    ramp.castShadow = ramp.receiveShadow = true; g.add(ramp);
  } else if (kind === 'bridge') {
    // CẦU ĐÁ TỰ NHIÊN — nhịp dày bắc ngang khe, dày hơn vòm 'arch', có trụ
    // giữa. Khoảng trống bên dưới chính là khe hào — đọc được ở silhouette.
    const span = 74*scale, legH = 26*scale;
    for (const s of [-1, 1]){
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(8*scale, 15*scale, legH, 6, 1), LM_MATS.rock);
      leg.position.set(s*span*0.44, legH*0.5, 0);
      leg.rotation.z = -s*0.05;
      leg.castShadow = leg.receiveShadow = true; g.add(leg);
    }
    // Nhịp cong võng: 5 phiến thay vì một thanh thẳng
    for (let i=0;i<5;i++){
      const t = (i/4 - 0.5);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(span*0.24, 7*scale, 13*scale),
        i%2 ? LM_MATS.rockLit : LM_MATS.rock);
      sl.position.set(t*span*0.92, legH + (1-Math.abs(t)*2)*1.6*scale, 0);
      sl.rotation.z = -t*0.13;
      sl.castShadow = sl.receiveShadow = true; g.add(sl);
    }
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(5*scale, 9*scale, legH*0.8, 6, 1), LM_MATS.rock);
    mid.position.set(0, legH*0.4, 0); mid.castShadow = mid.receiveShadow = true; g.add(mid);
    for (let i=0;i<4;i++){
      const ch = new THREE.Mesh(new THREE.BoxGeometry((4+((i*11)%7))*scale, 2.6*scale, 5*scale), LM_MATS.dark);
      ch.position.set((i-1.5)*span*0.17, legH - 3.8*scale, (i%2?1:-1)*6*scale);
      ch.rotation.set(0, (i%2?0.34:-0.28), 0);
      ch.castShadow = true; g.add(ch);
    }
  } else if (kind === 'vista') {
    // ĐIỂM NHÌN — bệ đá nhỏ trên chân trụ, đứng giữa vùng trống. Nhỏ, thấp,
    // nhưng beacon cao nên vẫn thấy từ xa: mốc "dừng lại ngắm" trong hành trình.
    const base = new THREE.Mesh(new THREE.CylinderGeometry(20*scale, 27*scale, 7*scale, 9, 1), LM_MATS.rock);
    base.position.y = 3.5*scale; base.castShadow = base.receiveShadow = true; g.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(17*scale, 20*scale, 4*scale, 9, 1), LM_MATS.rockLit);
    cap.position.y = 9*scale; cap.castShadow = cap.receiveShadow = true; g.add(cap);
    for (let i=0;i<3;i++){
      const a = -0.5 + i*0.5;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(1.1*scale, 1.6*scale, 7*scale, 5, 1), LM_MATS.dark);
      post.position.set(Math.cos(a)*16*scale, 14*scale, Math.sin(a)*16*scale);
      post.castShadow = true; g.add(post);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.7*scale, 0.9*scale, 22*scale, 5, 1), LM_MATS.dark);
    mast.position.y = 22*scale; mast.castShadow = true; g.add(mast);
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
  // Đế bệt tách nền/tiền cảnh và "neo" landmark xuống mặt đất (quy tắc 4).
  // Valles cần miệng hào THÔNG, nên đáy hào không có đế bệt.
  if (kind !== 'canyon') {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(46*scale, 58*scale, 1.6, 16), LM_MATS.dark);
    skirt.position.y = 0.4; skirt.receiveShadow = true; g.add(skirt);
  }

  // Beacon nhỏ trên đỉnh — điểm nhấn phát sáng, đọc được từ rất xa.
  const bx = new THREE.Mesh(new THREE.SphereGeometry(1.5*scale, 8, 6), LM_MATS.beacon);
  const topY = ({ mesa:17*scale, arch:30*scale, spire:66*scale, field:22*scale,
    canyon:16*scale, terrace:38*scale, bridge:29*scale, vista:33*scale })[kind] ?? 22*scale;
  bx.position.set(0, topY, 0); g.add(bx);
  const halo = new THREE.PointLight(0xffb060, 6, 120*scale, 2);
halo.layers.set(2);   // beacon thuộc phong cảnh (lớp xa)
  halo.position.copy(bx.position); g.add(halo);

  g.userData = { kind, x, z, beacon: bx, halo, baseY: y, topY };
  scene.add(g);
  landmarks.push(g);
  return g;
}

// Bố trí: 1 landmark LỚN trong tầm nhìn spawn Arcadia (0,0) — mục tiêu mốc thị giác.
// ════════════════════════════════════════════════════════════════════════════
// VẬT LIỆU PBR THỦ TỤC — Phase 2 Task 2.2
//
// Review ưu tiên #1: "Rover + mèo + camera — người chơi nhìn chúng MỌI LÚC".
// Nhưng: dự án static-first, không có pipeline DCC (Blender/bake glTF), nên
// thay vì mang asset glTF ngoài, ta nâng chất lượng bằng vật liệu PBR thủ tục —
// cùng bộ công cụ đã dùng cho terrain, nên nhất quán và không phụ thuộc asset.
//
// Ba thứ tạo cảm giác "premium" trên bề mặt kim loại sơn:
//   1. clearcoat    → lớp trong suốt tách biệt, cho highlight sắc trên sơn màu
//   2. roughnessMap → không bao giờ đồng đều toàn bộ vật liệu
//   3. xước + mòn cạnh + bụi bám → vật thể có "dấu sử dụng"
//
// Lưu ý: mọi dấu phải TẤT ĐỊNH (seed cố định) — nếu Math.random() thì mỗi
// lần tải lại vật liệu đổi, và bản ghi số trong probe trở nên vô nghĩa.
// ════════════════════════════════════════════════════════════════════════════
// (dùng lại mulberry32() đã khai báo ở khối mật độ môi trường — tránh khai báo trùng)
/**
 * Sinh roughnessMap + normalMap cho vật liệu kim loại sơn / nhựa kỹ thuật.
 * @param {object} o
 * @param {number} o.seed      seed tất định
 * @param {number} o.rough     roughness cơ sở (0..1)
 * @param {number} o.scratch   cường độ vệt xước
 * @param {number} o.dust      lượng bụi bám
 * @param {number} o.wear      mòn cạnh / sử dụng
 * @param {number} o.grain     độ mịn bề mặt
 */
function makeSurfaceMaps(o){
  const S = 256;
  const rnd = mulberry32(o.seed ?? 1337);
  const rough = o.rough ?? 0.4, scratch = o.scratch ?? 0.5;
  const dust = o.dust ?? 0.3, wear = o.wear ?? 0.35, grain = o.grain ?? 0.5;

  const hC = document.createElement('canvas'); hC.width = hC.height = S;
  const hx = hC.getContext('2d');
  hx.fillStyle = '#808080'; hx.fillRect(0,0,S,S);

  // 1) Vệt xước: đường thẳng mảnh, hướng ngẫu nhiên, mật độ thưa
  const nScr = Math.floor(26 * scratch) + 6;
  for (let i=0;i<nScr;i++){
    const x = rnd()*S, y = rnd()*S, a = rnd()*Math.PI*2, len = 14 + rnd()*70;
    hx.strokeStyle = `rgba(${rnd()<0.5?40:200},0,0,${0.05 + rnd()*0.16})`;
    hx.lineWidth = 0.6 + rnd()*1.5;
    hx.beginPath(); hx.moveTo(x,y);
    hx.lineTo(x + Math.cos(a)*len, y + Math.sin(a)*len); hx.stroke();
    // Vẽ lặp ở mép để texture tile liền
    hx.beginPath(); hx.moveTo(x-S,y); hx.lineTo(x-S+Math.cos(a)*len, y+Math.sin(a)*len); hx.stroke();
    hx.beginPath(); hx.moveTo(x,y-S); hx.lineTo(x+Math.cos(a)*len, y-S+Math.sin(a)*len); hx.stroke();
  }
  // 2) Hạt mịn: nhiễu mọn
  const img = hx.getImageData(0,0,S,S), d = img.data;
  for (let i=0;i<d.length;i+=4){
    const n = (rnd()-0.5) * 46 * grain;
    d[i] = d[i+1] = d[i+2] = Math.max(0, Math.min(255, d[i] + n));
  }
  hx.putImageData(img,0,0);

  // ── normalMap: lấy gradient từ trường cao ở trên ──
  const hgt = new Float32Array(S*S);
  for (let i=0;i<S*S;i++) hgt[i] = d[i*4]/255;
  const nC = document.createElement('canvas'); nC.width = nC.height = S;
  const nx = nC.getContext('2d');
  const nImg = nx.createImageData(S,S), nd = nImg.data;
  const STR = 2.6;
  for (let y=0;y<S;y++) for (let x=0;x<S;x++){
    const l = hgt[y*S + ((x-1+S)%S)], r = hgt[y*S + ((x+1)%S)];
    const u = hgt[((y-1+S)%S)*S + x], dn = hgt[((y+1)%S)*S + x];
    let vx = (l-r)*STR, vy = (u-dn)*STR, vz = 1;
    const len = Math.hypot(vx,vy,vz); vx/=len; vy/=len; vz/=len;
    const o2 = (y*S+x)*4;
    nd[o2]   = (vx*0.5+0.5)*255;
    nd[o2+1] = (vy*0.5+0.5)*255;
    nd[o2+2] = (vz*0.5+0.5)*255;
    nd[o2+3] = 255;
  }
  nx.putImageData(nImg,0,0);

  // ── roughnessMap: roughness cơ sở + xước (bóng hơn) + bụi (nhám hơn) + mòn (bóng) ──
  const rC = document.createElement('canvas'); rC.width = rC.height = S;
  const rx = rC.getContext('2d');
  const rImg = rx.createImageData(S,S), rd = rImg.data;
  const dr = mulberry32((o.seed ?? 1337) + 91);
  for (let y=0;y<S;y++) for (let x=0;x<S;x++){
    const i = y*S+x, h = hgt[i];
    // Bụi bám: các vệt mờ, tăng roughness mạnh
    const blot = Math.max(0, Math.sin(x*0.031 + Math.sin(y*0.017)*2.2) * 0.5 + 0.5 - 0.45) / 0.55;
    let r = rough;
    r += (h - 0.5) * 0.30 * scratch;          // vệt xước dối hai chiều
    r += blot * 0.42 * dust;                   // bụi rất nhám
    r += (dr() - 0.5) * 0.06;                  // hạt mịn
    r = Math.max(0.03, Math.min(1, r));
    const o2 = i*4;
    rd[o2] = rd[o2+1] = rd[o2+2] = r*255; rd[o2+3] = 255;
  }
  rx.putImageData(rImg,0,0);

  const mk = (cv, cs)=>{ const t=new THREE.CanvasTexture(cv);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=cs||THREE.NoColorSpace;
    t.anisotropy=4; return t; };
  return { normalMap: mk(nC), roughnessMap: mk(rC) };
}

const _matCache = new Map();
/**
 * Vật liệu PBR "tự động" theo màu — thay cho MeshStandardMaterial phẳng.
 * Dùng cho các mesh tạo inline: cùng màu = cùng material = ít draw call hơn.
 */
function autoMat(color, metalness=0.4, roughness=0.55, emissive=null, key=null){
  const ck = key || ('auto'+color+'_'+metalness+'_'+roughness+(emissive?'_e':''));
  if (_matCache.has(ck)) return _matCache.get(ck);
  const maps = makeSurfaceMaps({ seed: (color*2654435761)>>>0, rough: roughness,
    scratch: 0.45 + roughness*0.4, dust: 0.30 + roughness*0.6, wear: 0.30, grain: 0.6 });
  maps.normalMap.repeat.set(2,2); maps.roughnessMap.repeat.set(2,2);
  const m = new THREE.MeshPhysicalMaterial({
    color, metalness, roughness,
    normalMap: maps.normalMap, roughnessMap: maps.roughnessMap,
    normalScale: new THREE.Vector2(0.6,0.6),
    // clearcoat chỉ có ý nghĩa trên bề mặt sơn bóng, không phải vật liệu thô
    clearcoat: roughness < 0.55 ? 0.7 : 0.12,
    clearcoatRoughness: 0.15,
  });
  if (emissive !== null){ m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.9; }
  _matCache.set(ck, m);
  return m;
}
// Vật liệu + dựng landmark: đặt SAU autoMat vì phụ thuộc nó.
LM_MATS = makeLandmarkMats();

buildLandmark('mesa',  118,  96, 1.55);   // nhìn thấy ngay khi bắt đầu
buildLandmark('spire',-152, -88, 1.15);
buildLandmark('arch',   62, -168, 0.95);
buildLandmark('field', 236, -46, 1.30);
buildLandmark('field',-238, 168, 1.05);
buildLandmark('spire',  64, 292, 1.25);
buildLandmark('mesa', -108, 336, 1.40);
buildLandmark('arch',  332, 176, 0.85);
// ── KIT VALLES MARINERIS (Task 2.7) ──
// Valles nằm ở (420,-180), ngoài bán kính các landmark cũ → trước đó vùng này
// TRỐNG hoàn toàn, đi ngang chỉ thấy đất. Nay có chuỗi hào, bàn đá nhiều tầng,
// cầu đá tự nhiên và điểm nhìn — đọc được "đây là Valles" từ xa.
// Hào Valles đã có sẵn trong heightAt: trục x + 0.2z = 320, sâu tới 80m.
// Landmark phải đặt ĐÚNG trên trục đó (x = 320 - 0.2z) thì mới đọc thành
// miệng hào, đặt lệch thì thành một cục đá lạ lẫm nằm cạnh hào.
buildLandmark('canyon',  350, -150, 1.25);   // hào lớn nhất (x = 320+30)
buildLandmark('canyon',  372, -262, 0.95);   // hào nhánh phía bắc
buildLandmark('terrace',  300, -240, 1.10);   // bàn đá 3 tầng trên bờ hào
buildLandmark('bridge',   366,  -60, 1.00);   // cầu đá tự nhiên bắc ngang hào
buildLandmark('vista',    318,  -40, 0.90);   // điểm nhìn ngay bên mép hào
console.info('[landmark] dựng', landmarks.length, 'landmark');


/** Vật liệu hero: MeshPhysicalMaterial có clearcoat + bản đồ xước/bụi, có cache. */
function heroMat(key, o){
  if (_matCache.has(key)) return _matCache.get(key);
  const maps = makeSurfaceMaps(o);
  const n = maps.normalMap, r = maps.roughnessMap;
  const rep = o.repeat ?? 2;
  n.repeat.set(rep, rep); r.repeat.set(rep, rep);
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color, metalness: o.metalness ?? 0.5, roughness: o.roughness ?? 0.4,
    normalMap: n, roughnessMap: r,
    normalScale: new THREE.Vector2(o.normalScale ?? 0.8, o.normalScale ?? 0.8),
    clearcoat: o.clearcoat ?? 0.55,          // lớp sơn trong suốt
    clearcoatRoughness: o.clearcoatRoughness ?? 0.18,
    envMapIntensity: o.envMapIntensity ?? 0.8,
  });
  m.userData.surfaces = maps;
  _matCache.set(key, m);
  return m;
}

// ════════════════════════════════════════════════════════════════════════════
// KHÍ QUYỂN THEO BIOME — Giai đoạn 1 P0 Task 1.6
//
// Review: "bầu trời đỏ rất mạnh nhưng dễ làm toàn cảnh bị đơn sắc; foreground /

// Mỗi biome có bảng màu riêng cho: trời (top/mid/horizon), fog, và hệ số
// bão bụi. Chuyển cảnh bằng LERP mượt trong ~1.2s, không "nhảy" màu.
//
// Quy tắc (art-bible §5): fog LUÔN nhạt hơn hoặc bằng màu trời chân trời,
// nếu tối hơn thì cạnh lưới terrain lộ (đã dính lỗi này một lần).
// ════════════════════════════════════════════════════════════════════════════
const BIOME_ATMO = {
  arcadia:{ top:0x1a0f0a, mid:0xff7a3d, hor:0xffb07a, fog:0xc4713f, dust:1.00 },
  valles: { top:0x120806, mid:0x8e3416, hor:0xb05930, fog:0x8a4526, dust:0.85 },
  olympus:{ top:0x241009, mid:0xd4662e, hor:0xf0a061, fog:0xb06036, dust:0.90 },
  polar: { top:0x2a3a4a, mid:0xd8c8b8, hor:0xf0e6da, fog:0xc8bcb0, dust:0.45 },
  storm:  { top:0x1c0d06, mid:0x6d3311, hor:0x8f4c22, fog:0x6b3a1a, dust:2.20 },
};
const _atmoCur = {
  top:new THREE.Color(BIOME_ATMO.arcadia.top),
  mid:new THREE.Color(BIOME_ATMO.arcadia.mid),
  hor:new THREE.Color(BIOME_ATMO.arcadia.hor),
  fog:new THREE.Color(BIOME_ATMO.arcadia.fog),
};
const _atmoTo = {
  top:new THREE.Color(), mid:new THREE.Color(), hor:new THREE.Color(), fog:new THREE.Color(),
};
let atmoDust = 1.0, atmoDustTo = 1.0;
// Palette bão (lớp phủ mờ) + vector tạm dùng chung để không cấp phát mỗi khung.
const _STORM_TOP = new THREE.Color(0x1c0d06), _STORM_MID = new THREE.Color(0x6d3311);
const _STORM_HOR = new THREE.Color(0x8f4c22), _STORM_FOG = new THREE.Color(0x6b3a1a);
const _atmoSky = new THREE.Color(), _sunA = new THREE.Color(), _sunB = new THREE.Color();

/** Đặt đích khí quyển theo biome. Nội suy mượt trong updateAtmosphere(dt). */
function setBiomeAtmosphere(biomeId){
  const a = BIOME_ATMO[biomeId] || BIOME_ATMO.arcadia;
  _atmoTo.top.setHex(a.top); _atmoTo.mid.setHex(a.mid);
  _atmoTo.hor.setHex(a.hor);  _atmoTo.fog.setHex(a.fog);
  atmoDustTo = a.dust;
  if (lastBiomeId !== biomeId){
    lastBiomeId = biomeId;
    // Đổi preset đồ họa cũng phải giữ fog nhất quán: preset chỉ nhân mật độ.
    if (typeof applyGraphicsPreset === 'function' && GFX_PRESETS[gfxName]){
      scene.fog.density = FOG_BASE * GFX_PRESETS[gfxName].fogMul;
    }
  }
}

/**
 * Task 2.3 — dịch cả hộp shadow theo người chơi.
 * Cả sun.position LẪN sun.target phải dịch cùng một lượng, nếu không ánh sáng
 * sẽ xoay theo hướng khác nhau mỗi khung (bóng rung/rất nhiễu).
 */
function updateShadowFollow(){
  if (!renderer.shadowMap.enabled) return;
  const px = playerPos.x, pz = playerPos.z;
  const d = sun.position.clone().sub(sunTarget.position);   // hướng & độ dài hiện tại
  const dist = d.length();
  // far phải vượt quãng cách từ đèn tới người chơi, nếu không vật thể bị cắt khỏi
  // frustum và biến mất bóng khi nghiêng nắng thấp.
  const far = dist + 160;
  sunTarget.position.set(px, 0, pz);
  sunTarget.updateMatrixWorld();
  sun.position.set(px + d.x, sun.position.y, pz + d.z);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = far;
  sun.shadow.camera.updateProjectionMatrix();
  // Lớp xa dùng CHUNG hướng với lớp gần, nếu không hai nguồn lệch nhau và bóng
  // của cùng một vật sẽ chỉ ngược nhau.
  sunFarTarget.position.set(px, 0, pz);
  sunFarTarget.updateMatrixWorld();
  sunFar.position.set(px + d.x, sun.position.y, pz + d.z);
  sunFar.shadow.camera.near = 1; sunFar.shadow.camera.far = far;
  sunFar.shadow.camera.updateProjectionMatrix();
}

// ════════════════════════════════════════════════════════════════════════════
// GIỜ TRONG NGÀY — Phase 3 Task 3.2
//
// Trước đây `applyTime()` chỉ dịch mặt trời và đổi cường độ, còn MÀU hoàn toàn
// thuộc về biome. Hệ quả: bình minh và hoàng hôn trông y hệt nhau, và giữa
// đêm mặt trời vẫn trắng tanh — không khác "trưa" ngoài chỗ đứng.
//
// Nay có 4 mốc giờ (0 đêm · 0.25 bình minh · 0.5 trưa · 0.75 hoàng hôn) và
// nội suy mượt. Mỗi mốc mang:
//   sun/hemi  — màu + cường độ ánh sáng chính
//   skyTint   — màu phủ lên bầu trời biome (amt = mức phủ)
//   fogTint   — màu phủ lên sương mù biome
//   stars     — độ mờ sao
//
// SỞ HỮU: updateAtmosphere() vẫn là nơi DUY NHẤT ghi màu sky/fog/sun, giống
// Task 1.6. Lớp thời gian được TRỘN vào đó, không ghi đè. Thứ tự áp:
// biome → giờ trong ngày → bão. Nhờ vậy bão vẫn thắng, và đổi giờ không phá
// bão đang chạy.
// ════════════════════════════════════════════════════════════════════════════
const TIME_GRAD = [
  // sunI / hemiI là HỆ SỐ so với SUN_BASE_I (1.6) và AMB_BASE_I (0.85), không phải
  // cường độ tuyệt đối. Trước đây maybeStorm() gán `lerp(1.6,0.5,s) * SUN_BASE_I`
  // mỗi khung — tức nhân 1.6 hai lần (2.56 thay vì 1.6) VÀ ghi đè gradient giờ,
  // nên bình minh với trưa ra y hệt nhau. Nay cường độ do updateAtmosphere() sở
  // hữu một mình, giá trị tuyệt đối = hệ số × hằng số nền.
  { t:0.00, name:'Đêm',
    sun:0x4a5f86, sunI:0.10, hemiI:0.31, hemiSky:0x30425e, hemiGnd:0x141c2a,
    skyTint:0x0d1c38, skyAmt:0.80, fogTint:0x1a2740, fogAmt:0.72, stars:0.80 },
  // Đo thật từ ảnh cho thấy bản đầu (sunI 0.98/0.88) cho đất sáng gần bằng trưa
  // (Δ chỉ 3.1/255) — mốc giờ hỏng vì chỉ sát một mức, nhìn không ra khác biệt.
  // Hạ cường độ + tăng mức phủ màu để 4 mốc tách hẳn nhau.
  { t:0.25, name:'Bình minh',
    sun:0xffb070, sunI:0.42, hemiI:0.45, hemiSky:0xffd0b4, hemiGnd:0x2e1c14,
    skyTint:0xffa070, skyAmt:0.62, fogTint:0xffb890, fogAmt:0.56, stars:0.22 },
  { t:0.50, name:'Trưa',
    sun:0xfff0d0, sunI:1.00, hemiI:1.00, hemiSky:0xffd8b0, hemiGnd:0x1a0f0a,
    skyTint:0xffffff, skyAmt:0.00, fogTint:0xffffff, fogAmt:0.00, stars:0.00 },
  { t:0.75, name:'Hoàng hôn',
    sun:0xff5a28, sunI:0.375, hemiI:0.40, hemiSky:0xffa878, hemiGnd:0x34190c,
    skyTint:0xff4411, skyAmt:0.72, fogTint:0xff5a2a, fogAmt:0.64, stars:0.34 },
];
// Mốc nội suy, cấp phát một lần ở module scope (0 nội suy = chính bản thân mốc).
const _tgSun = new THREE.Color(), _tgHemiSky = new THREE.Color(), _tgHemiGnd = new THREE.Color();
const _tgSky = new THREE.Color(), _tgFog = new THREE.Color();
let _tg = { sunI:1, hemiI:1, skyAmt:0, fogAmt:0, stars:0, name:'' };

/** Nội suy 4 mốc giờ theo timeOfDay (0..1, quanh vòng). */
function sampleTimeGrade(t){
  const t1 = ((t % 1) + 1) % 1;
  let a = TIME_GRAD[TIME_GRAD.length-1], b = TIME_GRAD[0], k = 0;
  if (t1 < 0.25){ a = TIME_GRAD[0]; b = TIME_GRAD[1]; k = t1/0.25; }
  else if (t1 < 0.50){ a = TIME_GRAD[1]; b = TIME_GRAD[2]; k = (t1-0.25)/0.25; }
  else if (t1 < 0.75){ a = TIME_GRAD[2]; b = TIME_GRAD[3]; k = (t1-0.50)/0.25; }
  else { a = TIME_GRAD[3]; b = TIME_GRAD[0]; k = (t1-0.75)/0.25; }
  // bình minh tới hoàng hôn đi ngang qua "khuya" — cần mượt, nên dùng smoothstep
  k = k*k*(3-2*k);
  _tgSun.setHex(a.sun).lerp(_sunA.setHex(b.sun), k);
  _tgHemiSky.setHex(a.hemiSky).lerp(_sunA.setHex(b.hemiSky), k);
  _tgHemiGnd.setHex(a.hemiGnd).lerp(_sunA.setHex(b.hemiGnd), k);
  _tgSky.setHex(a.skyTint).lerp(_sunA.setHex(b.skyTint), k);
  _tgFog.setHex(a.fogTint).lerp(_sunA.setHex(b.fogTint), k);
  _tg.sunI   = THREE.MathUtils.lerp(a.sunI,  b.sunI,  k);
  _tg.hemiI  = THREE.MathUtils.lerp(a.hemiI, b.hemiI, k);
  _tg.skyAmt = THREE.MathUtils.lerp(a.skyAmt, b.skyAmt, k);
  _tg.fogAmt = THREE.MathUtils.lerp(a.fogAmt, b.fogAmt, k);
  _tg.stars  = THREE.MathUtils.lerp(a.stars,  b.stars,  k);
  _tg.name   = k < 0.5 ? a.name : b.name;
  return _tg;
}

function updateAtmosphere(dt){
  // Hệ số lerp: ~1.2s để đổi màu, nhưng phải tương đối độc lập framerate.
  const k = 1 - Math.exp(-dt * 3.2);
  _atmoCur.top.lerp(_atmoTo.top, k);
  _atmoCur.mid.lerp(_atmoTo.mid, k);
  _atmoCur.hor.lerp(_atmoTo.hor, k);
  _atmoCur.fog.lerp(_atmoTo.fog, k);
  atmoDust += (atmoDustTo - atmoDust) * k;
  // Lớp GIỜ TRONG NGÀY (Task 3.2): phủ tint lên màu biome đã nội suy.
  // Lấy mẫu ở đây để luôn chạy trước khi dùng — không phụ thuộc applyTime()
  // có được gọi hay không (đổi preset đồ họa hay gọi trực tiếp cũng đúng).
  const tg = sampleTimeGrade(timeOfDay);
  // Task 3.3: cường độ nhiễu nhiệt + cánh nắng theo mốc giờ. Ở đây vì đây đã biết
  // `tg`; để applyPostFX cấp thì 4 mốc sẽ dùng chung một giá trị cũ.
  if (hazePass && hazePass.enabled) hazePass.uniforms.uAmount.value = HAZE_BY_TIME[tg.name] ?? 0.5;
  if (raysPass && raysPass.enabled) raysPass.uniforms.uStrength.value = (RAYS_BY_TIME[tg.name] ?? 0.4) * 0.85;
  // Bão phủ thêm lớp màu bụi mịn lên trên màu biome (tương phản giảm, đỏ lên).
  // Dùng hệ số stormLevel nên bão vẫn chạy trên mọi biome, không phải chỉ vùng storm.
  const s = typeof stormLevel === 'number' ? stormLevel : 0;
  // Thứ tự áp: biome -> GIỜ TRONG NGÀY -> bão. Bão nằm ngoài cùng nên vẫn thắng,
  // đổi giờ không phá vỡ cơn bão đang chạy.
  _atmoSky.copy(_atmoCur.top).lerp(_STORM_TOP, s);
  if (tg.skyAmt > 0.001) _atmoSky.lerp(_tgSky, tg.skyAmt);
  skyMat.uniforms.top.value.copy(_atmoSky);
  _atmoSky.copy(_atmoCur.mid).lerp(_STORM_MID, s);
  if (tg.skyAmt > 0.001) _atmoSky.lerp(_tgSky, tg.skyAmt*0.75);
  skyMat.uniforms.mid.value.copy(_atmoSky);
  _atmoSky.copy(_atmoCur.hor).lerp(_STORM_HOR, s);
  if (tg.skyAmt > 0.001) _atmoSky.lerp(_tgSky, tg.skyAmt*0.55);
  skyMat.uniforms.horizon.value.copy(_atmoSky);
  _atmoSky.copy(_atmoCur.fog).lerp(_STORM_FOG, s);
  // Task 3.2: trộn màu giờ vào sương mù (sau bão để bão vẫn là lớp trên cùng)
  if (tg.fogAmt > 0.001) _atmoSky.lerp(_tgFog, tg.fogAmt);
  scene.fog.color.copy(_atmoSky);
  // Mặt trời & ánh sáng bị bụi hấp thụ: xanh/lam dịu dần, cực lạnh hơn.
  // Nền tảng theo biome + bão, rồi TRỘN màu giờ trong ngày (Task 3.2).
  // Trộn chứ không gán: giữ được sắc lạnh của polar và sự dịch của bão.
  _sunB.setHex(lastBiomeId==='storm' ? 0xd8a070 : 0xfff0d0).lerp(_sunA.setHex(0xd8906a), s);
  sun.color.lerp(_sunB.lerp(_tgSun, tg.skyAmt*0.9), k);
  sunFar.color.copy(sun.color);   // hai lớp cùng màu, nếu không cảnh bị hai tông
  _sunB.setHex(lastBiomeId==='polar' ? 0xdce8f0 : 0xffd8b0).lerp(_sunA.setHex(0xc98a5a), s);
  hemi.color.lerp(_sunB.lerp(_tgHemiSky, tg.skyAmt*0.8), k);
  _sunB.setHex(lastBiomeId==='polar' ? 0x4a5a68 : 0x1a0f0a).lerp(_sunA.setHex(0x2a1208), s);
  hemi.groundColor.lerp(_sunB.lerp(_tgHemiGnd, tg.skyAmt*0.6), k);
  // Cường độ do mốc giờ quyết định (Task 3.2), bão làm tối thêm.
  const wantSun = tg.sunI * SUN_BASE_I * (1 - s*0.55);
  const wantHemi= tg.hemiI * AMB_BASE_I * (1 - s*0.35);
  sun.intensity += (wantSun  - sun.intensity ) * k;
  sunFar.intensity = sun.intensity;
  hemi.intensity += (wantHemi - hemi.intensity) * k;
}

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
  // ĐÁ VỪA — mật độ chính, đọc được ở 60m.
  // shadow:false — lớp xa dùng 1024 texel phủ ±600m = 1.17 m/texel, nên đá 0.8m
  // nhỏ hơn MỘT texel: bóng của nó không phân giải nổi và xuất hiện thành các
  // TAM GIÁC ĐEN NHỌN rải rác trên mặt đất (đã thấy trong ảnh). Không dùng
  // texel shadow cho vật thể nhỏ hơn độ phân giải — đây là quy tắc chung, không
  // phải chỉnh riêng. Chỉ đá lớn (2.4–5.2m ≈ 2–4 texel) mới đáng đổ bóng.
  { name:'rock',    geo:new THREE.DodecahedronGeometry(1,0), mat:envMatLit, sMin:0.8, sMax:2.1, n: 900, y:0.30, shadow:false },
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
// ── BÃO BỤI 3 LỚP — Phase 2 Task 2.6 ──
// Trước đây MỘT lớp hạt kích thước 1.8: ở mọi khoảng cách đều trông như nhau,
// nên bão đọc ra "sương mờ" chứ không phải bão bụi Sao Hỏa. Ba lớp tách chiều:
//   A · hạt mịn lơ lửng  — cận, nhỏ, mờ, cuộn chậm
//   B · đám bụi trôi    — giữa cự ly, to, bay ngang nhanh, tạo vệt
//   C · tường bụi xa    — màn dày ở xa, đậy theo stormLevel, HÚT tầm nhìn
// Tầng C không chỉ cho đẹp: nó che rìa bản đồ, nên không cần vẽ địa hình tới
// 1400m nữa — cắt được draw distance mà không mất cảm giác không gian.
// Cả ba quanh người chơi, quấn theo modulo nên vô hạn trong bản đồ 1400m.
const DUST_BOX = 520;                     // bán kính hộp bọc theo người chơi
function makeDustLayer(n, box, size, color, opacity, yLo, yHi){
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n*3), spd = new Float32Array(n*2);
  for (let i=0;i<n;i++){
    pos[i*3]   = (Math.random()-0.5)*2*box;
    pos[i*3+1] = yLo + Math.random()*(yHi-yLo);
    pos[i*3+2] = (Math.random()-0.5)*2*box;
    spd[i*2]   = 0.6 + Math.random()*1.5;      // hướng + tốc độ ngang
    spd[i*2+1] = Math.random()*Math.PI*2;      // hướng góc
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aspd',    new THREE.BufferAttribute(spd, 2));
  const m = new THREE.PointsMaterial({ color, size, transparent:true, opacity:0,
    sizeAttenuation:true, depthWrite:false });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;                   // luôn bám người chơi, không cần cắt
  pts.renderOrder = 3;
  scene.add(pts);
  return { pts, geo:g, mat:m, n, box, pos, spd, base:opacity };
}
const dustA = makeDustLayer(2600,  55, 0.55, 0xffd2a0, 0.30,  0.2, 14);  // hạt mịn
const dustB = makeDustLayer( 420, 230, 4.20, 0xffbe86, 0.13,  1.0, 26);  // đám trôi
// Tầng C: vòng tròn bọc quanh người chơi ở 430m, dùng gradient mềm
const dustCTex = (()=>{
  const c=document.createElement('canvas'); c.width=64; c.height=64;
  const g=c.getContext('2d');
  // gradient PHẢI dùng RGB trắng, chỉ đổi alpha. MeshBasicMaterial tính
  // map.rgb × color, nên gradient đen sẽ cho ra mảng ĐEN đặc phủ kín màn hình
  // (đã dính: toàn màn hình thành đen khi bão). Muốn mảng ở đây là độ phủ
  // của BỤI, không phải màu của bụi — màu lấy từ `color` bên dưới.
  const grd=g.createRadialGradient(32,32,4, 32,32,32);
  grd.addColorStop(0,'rgba(255,255,255,0)');
  grd.addColorStop(0.55,'rgba(255,255,255,0.55)');
  grd.addColorStop(1,'rgba(255,255,255,0.92)');
  g.fillStyle=grd; g.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
})();
const dustC = new THREE.Mesh(
  new THREE.CylinderGeometry(430, 430, 210, 32, 1, true),
  new THREE.MeshBasicMaterial({ map:dustCTex, color:0xc4713f, transparent:true,
    opacity:0, side:THREE.BackSide, depthWrite:false, fog:false })
);
dustC.renderOrder = 2;
scene.add(dustC);
const DUSTC_R = 430;
// PHẢI là Color, không phải Vector3. Dùng nhầm Vector3 ở đây làm
// Color.copy() nhận sai kiểu -> mọi thành phần thành NaN -> '#000NaN' ->
// toàn màn hình ĐEN khi có bão. Đã dính và phát hiện qua dump màu vật thể.
const _dustTmp = new THREE.Color();

/** Cập nhật ba lớp bụi. `storm` 0..1, `turb` = mức xao động theo tốc độ. */
function updateDust(dt, storm, turb, atmo){
  // A — hạt mịn: cuộn chậm, bay lên nhẹ
  updateDustLayer(dustA, dt, 1.0 + turb*2.2, 0.0, 0.9);
  // B — đám bụi: bay ngang nhanh hơn nhiều, tạo cảm giác gió
  updateDustLayer(dustB, dt, 4.0 + turb*7.0, 0.0, 2.4);
  const dm = atmo ?? 1;
  dustA.mat.opacity = dustA.base * dm * (0.22 + storm*1.5 + turb*0.9);
  dustB.mat.opacity = dustB.base * dm * (0.10 + storm*2.2 + turb*0.7);
  // C — tường bụi: gần như vô hình khi trời, dày lên khi bão
  dustC.material.opacity = Math.min(0.92, storm*1.15) * dm * 0.85;
  dustC.material.color.copy(_dustTmp.set(0xc4713f)).lerp(scene.fog.color, 0.55);
  // Cả ba bám theo người chơi
  dustA.pts.position.set(playerPos.x, 0, playerPos.z);
  dustB.pts.position.set(playerPos.x, 0, playerPos.z);
  dustC.position.set(playerPos.x, 62, playerPos.z);
  dustC.visible = dustC.material.opacity > 0.01;
}

/** Trôi hạt theo gió rồi quấn về hộp quanh người chơi (modulo). */
function updateDustLayer(L, dt, windK, yLift, rise){
  const a = L.geo.attributes.aspd.array;
  const p = L.pos, b = L.box;
  const cx = playerPos.x, cz = playerPos.z;
  for (let i=0;i<L.n;i++){
    const i3 = i*3;
    let x = p[i3] + Math.cos(a[i*2+1]) * a[i*2] * windK * dt;
    let y = p[i3+1] + rise * dt;
    let z = p[i3+2] + Math.sin(a[i*2+1]) * a[i*2] * windK * dt;
    // quấn theo vị trí TƯƠNG ĐỐI với người chơi (đã cộng sẵn vào pts.position)
    if (x >  b) x -= 2*b; else if (x < -b) x += 2*b;
    if (z >  b) z -= 2*b; else if (z < -b) z += 2*b;
    if (y >  30) y -= 30; else if (y < 0) y += 30;
    p[i3] = x; p[i3+1] = y; p[i3+2] = z;
  }
  L.geo.attributes.position.needsUpdate = true;
  L.geo.attributes.aspd.needsUpdate = true;
}
// giữ tên cũ để code đang chạy không vỡ
const dustMat = dustA.mat, dustPoints = dustA.pts;

// ════════════════════════════════════════════════════════════════════════════
// CONTACT SHADOW + VỆT BÁNH — Giai đoạn 1 P0 Task 1.3
//
// Shadow map cho bóng đổ đúng hướng, nhưng bóng tiếp xúc dưới bánh thì yếu/không
// có vì bánh cách đất chỉ vài cm. Thiếu bóng tiếp xúc là lý do phương tiện
// trông như "lơ lửng" dù không xuyên đất. Ở đây vẽ một vệt tối mềm dưới MỖI
// bánh, neo theo cao độ đất thật + độ cao bánh (bánh càng cao → bóng càng nhạt
// và to). Vệt bánh là vòng tròn tái sử dụng (ring buffer) nên không phình vô hạn.
// ════════════════════════════════════════════════════════════════════════════
const contactTex = (()=>{
  const c=document.createElement('canvas'); c.width=c.height=64;
  const g=c.getContext('2d');
  const grd=g.createRadialGradient(32,32,0, 32,32,32);
  grd.addColorStop(0,   'rgba(0,0,0,0.85)');
  grd.addColorStop(0.45,'rgba(0,0,0,0.42)');
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  g.fillStyle=grd; g.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const contactMat = new THREE.MeshBasicMaterial({
  map:contactTex, transparent:true, depthWrite:false, opacity:0.55,
  blending:THREE.NormalBlending, color:0x1a0a04,
});
const contactPool=[];                     // pool dùng lại, không cấp phát mỗi khung
const CONTACT_MAX=10;
const contactGroup=new THREE.Group();
contactGroup.renderOrder=1;
scene.add(contactGroup);
for(let i=0;i<CONTACT_MAX;i++){
  // Mỗi vệt một material RIÊNG: opacity thuộc material, không phải mesh.
  // Dùng chung một material thì không fade riêng được từng bánh.
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1), contactMat.clone());
  m.rotation.x=-Math.PI/2; m.visible=false; m.renderOrder=1;
  contactGroup.add(m); contactPool.push(m);
}

// Vệt bánh: ring buffer ô đất bị nén, mờ dần theo quãng đường.
const TRAIL_MAX=760;   // 760 x 0.55m ≈ 418m vệt liên tục
const trailMat=new THREE.MeshBasicMaterial({
  map:contactTex, transparent:true, depthWrite:false, opacity:0.42, color:0x2a1008,
});
const trailGeo=new THREE.PlaneGeometry(1,1);
const trailIM=new THREE.InstancedMesh(trailGeo, trailMat, TRAIL_MAX);
trailIM.count=0; trailIM.frustumCulled=false; trailIM.renderOrder=1;
scene.add(trailIM);
const trailData=[];            // {x,z,y,age}
let trailHead=0;
let trailDist=0;             // quãng đường tích luỹ tới lần thả vệt kế tiếp
const _td=new THREE.Object3D();
const _ttmp=new THREE.Vector3();

/** Đặt vệt tối tiếp xúc dưới các bánh. Gọi mỗi khung hình. */
function updateContactShadows(){
  const conf=VEHICLES[vehicleType];
  const cy=Math.cos(playerYaw), sy=Math.sin(playerYaw);
  let n=0;
  player.updateMatrixWorld(true);
  for(let i=0;i<conf.wheels.length && n<CONTACT_MAX;i++){
    const [lx,lz]=conf.wheels[i];
    const wx=playerPos.x+(lx*cy-lz*sy);
    const wz=playerPos.z+(lx*sy+lz*cy);
    const gh=sampleHeight(wx,wz);
    // thực nhận bánh (world matrix) để biết bánh đang lơ lửng bao xa
    const wr=vRefs.wheels[i];
    let wy=playerPos.y;
    if(wr){ wr.getWorldPosition(_ttmp); wy=_ttmp.y; }
    const lift=Math.max(0, wy-gh);
    const m=contactPool[n++];
    // bánh càng cao → vệt càng nhạt + rộng (bóng đổ nhạt dần theo cự ly)
    const s=1.05+lift*1.5;
    m.position.set(wx, gh+0.035, wz);
    m.scale.set(s, s*0.72, 1);
    m.visible = lift < 0.75;
    m.material.opacity = 0.42*(1-Math.min(1, lift/0.75));
  }
  for(let i=n;i<CONTACT_MAX;i++) contactPool[i].visible=false;
}

/** Thả một vệt bánh xuống đất. Gọi khi bánh vừa lăn qua chỗ mới. */
function dropWheelTrail(){
  const conf=VEHICLES[vehicleType];
  const cy=Math.cos(playerYaw), sy=Math.sin(playerYaw);
  // Lấy bánh TRÁI và bánh PHẢI của cùng trục để có HAI vệt song song.
  // Rover: [[-1,0.68],[-1,-0.68],[1,0.68],[1,-0.68]] -> index 0 và 1 là hai bên.
  // (Trước đây lấy i+=2 tức 0 và 2 — cùng z=+0.68, chồng thành MỘT vệt.)
  for(let i=0;i<2 && i<conf.wheels.length;i++){
    const [lx,lz]=conf.wheels[i];
    const wx=playerPos.x+(lx*cy-lz*sy);
    const wz=playerPos.z+(lx*sy+lz*cy);
    const gh=sampleHeight(wx,wz);
    const prev=trailData[(trailHead-1+TRAIL_MAX)%TRAIL_MAX];
    if(prev && Math.abs(prev.x-wx)<0.55 && Math.abs(prev.z-wz)<0.55) continue;  // trùng ô
    trailData[trailHead]={x:wx,z:wz,y:gh,age:0};
    trailHead=(trailHead+1)%TRAIL_MAX;
  }
  rebuildTrail(0);
}

/** Dựng lại instance matrix của vệt bánh + fade theo tuổi. */
const TRAIL_LIFE = 46;   // giây
function rebuildTrail(dt){
  let n=0;
  for(let i=0;i<trailData.length;i++){
    const d=trailData[i];
    if(!d) continue;
    d.age += dt;
    if(d.age>TRAIL_LIFE){ trailData[i]=null; continue; }
    const fade=1-d.age/TRAIL_LIFE;
    // Fade bằng THU NHỎ chứ không bằng alpha: InstancedMesh dùng chung 1 material
    // nên không fade được từng ô riêng. Thu nhỏ trông tự nhiên hơn và rẻ hơn.
    const s=1.30*Math.sqrt(fade);
    _td.position.set(d.x, d.y+0.02, d.z);
    _td.rotation.set(-Math.PI/2, 0, 0);
    _td.scale.set(s, s*0.7, 1);
    _td.updateMatrix();
    trailIM.setMatrixAt(n++, _td.matrix);
  }
  trailIM.count=n;
  trailIM.instanceMatrix.needsUpdate=true;
}

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
// ════════════════════════════════════════════════════════════════════════════
// HERO ASSET — MÈO VÀNG GLB (Blender)
//
// Trước đây Mèo Vàng là procedural: 40+ khối Sphere/Capsule dựng trong JS.
// Nay có bản glTF dựng offline bằng Blender, giữ UV, tên node theo quy ước
// (body/head/arms/tail_1..5/tail_tip) để Three.js vẫn cử động được từng phần.
// Bản procedural GIỮ LẠI làm phương án dự phòng: nếu GLB lỗi (mạng, decode)
// game vẫn chạy được chứ không trắng màn.
//
// Toạ độ: gốc model = điểm ngồi trên yên → đặt tại local (0, 1.25, 0).
// Kiểm chứng: node 'head' dịch (0.30, 0.53, 0) → (0.30, 1.78, 0) — khớp đúng
// vị trí đầu của bản procedural.
const MEO_URL   = new URL('./assets/models/meo-vang.glb', document.baseURI).href;
const MEO_LIFT  = 1.25;          // gốc GLB (yên) nằm cao bao nhiêu so vất đất
let meoGLTF = null, meoUseGLB = false, meoLoadErr = null;

function loadMeoVang(){
  try {
    const draco = new DRACOLoader();
    draco.setDecoderPath(new URL('draco/', document.baseURI).href);
    new GLTFLoader().setDRACOLoader(draco).load(MEO_URL, (gltf) => {
      meoGLTF = gltf.scene;
      meoGLTF.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true;
        o.frustumCulled = true;
        // Gắn normal/roughness thủ tục GIỐNG xe & đất: GLB chỉ có màu phẳng,
        // không có map thì mèo sẽ trông lạc lõng giữa phần còn lại của game.
        const m = o.material;
        if (m && m.isMeshStandardMaterial && !m.userData.glossed){
          const maps = makeSurfaceMaps({ seed: (m.color.getHex() * 2654435761) >>> 0,
            rough: m.roughness ?? 0.6, scratch: 0.30, dust: 0.45, wear: 0.25, grain: 0.5 });
          maps.normalMap.repeat.set(3,3); maps.roughnessMap.repeat.set(3,3);
          m.normalMap = maps.normalMap; m.roughnessMap = maps.roughnessMap;
          m.normalScale = new THREE.Vector2(0.7, 0.7);
          m.userData.glossed = true;
        }
      });
      meoUseGLB = true;
      console.info('[meo] nạp GLB xong:', meoGLTF.children.length, 'node');
      applyMeoSource();                 // dựng lại phương tiện để dùng GLB
    }, undefined, (err) => {
      meoLoadErr = err && err.message ? err.message : String(err);
      console.warn('[meo] lỗi nạp GLB, dùng bản procedural:', meoLoadErr);
    });
  } catch (e) {
    meoLoadErr = e.message;
    console.warn('[meo] không khởi tạo được loader, dùng bản procedural:', meoLoadErr);
  }
}

/** Dựng bản sao GLB, map vRefs sang node theo tên để code cử động cũ chạy được. */
function buildMeoFromGLB(){
  const cat = meoGLTF.clone(true);
  cat.position.set(0, MEO_LIFT, 0);
  const N = {};
  cat.traverse(o => { if (o.name) N[o.name] = o; });
  // Ánh xạ: code cũ dùng vRefs.head / vRefs.tail / vRefs.arms / vRefs.selfBody
  vRefs.glbHead = N.head || null;
  vRefs.glbBody = N.body || null;
  vRefs.glbArms = N.arms || null;
  vRefs.glbLegs = N.legs || null;
  vRefs.glbTail = [N.tail_1, N.tail_2, N.tail_3, N.tail_4, N.tail_5, N.tail_tip].filter(Boolean);
  // selfBody = phần thân tĩnh, ẩn ở góc nhìn thứ nhất (ngực che tay khi lái rover)
  vRefs.glbSelf = [N.body, N.legs].filter(Boolean);

  // Kích hoạt animation mượt mà cho bản GLB: đầu nghiêng theo gió, đuôi vẫy sóng, ẩn đầu ở góc FPV
  if (N.head) vRefs.head = N.head;
  if (vRefs.glbTail.length) vRefs.tailSegs = vRefs.glbTail;
  if (vRefs.glbSelf.length) {
    vRefs.selfBody = {
      set visible(v){ for(const m of vRefs.glbSelf) m.visible = v; },
      get visible(){ return vRefs.glbSelf[0] ? vRefs.glbSelf[0].visible : true; }
    };
  }
  return cat;
}


/** Bật/tắt bản glTF. Gọi lại buildVehicle để áp dụng ngay. */
function applyMeoSource(useGLB){
  if (useGLB && !meoGLTF){
    meoUseGLB = false;
    console.warn('[meo] chưa có GLB, giữ bản procedural');
  } else {
    meoUseGLB = useGLB;
  }
  if (typeof buildVehicle === 'function' && vehicleType) buildVehicle(vehicleType);
}

// Gọi nạp GLB ở ĐÂY, không gọi cùng chỗ dựng landmark: hàm này đọc MEO_URL /
// MEO_LIFT / meoGLTF, mà các biến đó khai báo bằng const/let ở DƯỚI đây —
// gọi sớm hơn là rơi vào TDZ ("Cannot access 'X' before initialization") và
// game không boot được. Thứ tự khai báo quan trọng, không phải thứ tự đọc.
loadMeoVang();

// ════════════════════════════════════════════════════════════════════════════
// BỤI BÁM TRÊN XE — Phase 3 Task 3.3 (phần 3)
//
// Vấn đề sở hữu: autoMat() CACHE vật liệu theo key và dùng chung giữa các vật thể.
// Sơn xe, lông mèo và đá landmark cùng lấy từ một cache — nếu ghi thẳng .color
// để phủ bụi thì MÈO VÀ ĐÁ CŨNG BÁM BỤI theo. Thế nên ở đây clone ra instance
// riêng cho từng vật liệu trên xe. clone() giữ NGUYÊN tham số nên vẫn dùng
// chung shader program với bản gốc — không tốn thêm chương trình, chỉ thêm
// vài lần nạp uniform.
//
// Đặc tính: bụi làm mờ màu sơn VÀ tăng nhám (bụi không phản xạ gương), nên
// chỉ sơn mới bị ảnh hưởng rõ; kim loại và kính gần như không đổi.
// ════════════════════════════════════════════════════════════════════════════
const DUST_COLOR = new THREE.Color(0xb08464);   // màu bụi khí quyển
const _dustMats  = [];                            // {mat, base, baseR, baseC}
const _dustColor = new THREE.Color();
let dustLevel = 0;

/** Gom vật liệu trên xe, clone ra instance riêng để phủ bụi an toàn. */
function collectDustTargets(root){
  _dustMats.length = 0;
  const seen = new Set();
  root.traverse(o=>{
    if(!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if (seen.has(m.uuid)) return;
    seen.add(m.uuid);
    // Bỏ qua vật liệu KHÔNG PBR: MeshBasicMaterial (đĩa đổ bóng) không có
    // roughness, phủ bụi lên nó không có ý nghĩa.
    if (typeof m.roughness !== 'number') return;
    // Bỏ qua đèn phát sáng. PHẢI xem MÀU emissive, không được dùng
    // `if (m.emissive)` — Color là object nên LUÔN truthy, còn emissiveIntensity
    // mặc định 1.0: cách viết đó loại gần hết 30 vật liệu xe và chỉ còn lại 2.
    const em = m.emissive;
    if (em && (em.r + em.g + em.b) > 0.02) return;
    const c = m.clone();
    c.userData.__dustClone = true;   // clone riêng của xe -> phải dispose khi đổi xe
    o.material = c;
    _dustMats.push({ mat:c, base:c.color.clone(), baseR:c.roughness ?? 0.6,
                     baseC:c.clearcoat ?? 0 });
  });
  return _dustMats.length;
}

/** Cập nhật độ phủ bụi theo quãng đường đã đi. Gọi mỗi khung. */
function updateDustOnCar(dt){
  if (!_dustMats.length) return;
  // 600m là đủ để xe "đã bụi"; bão làm bụi bám nhanh hơn vì bụi mịn lơ lửng.
  const stormBoost = typeof stormLevel === 'number' ? stormLevel : 0;
  const target = THREE.MathUtils.clamp((distance + stormBoost*260) / 600, 0, 1);
  dustLevel += (target - dustLevel) * (1 - Math.exp(-dt*0.35));
  if (dustLevel < 0.002) return;
  for (const d of _dustMats){
    _dustColor.copy(d.base).lerp(DUST_COLOR, dustLevel*0.78);
    d.mat.color.copy(_dustColor);
    d.mat.roughness = Math.min(1, d.baseR + dustLevel*0.42);
    if (d.baseC) d.mat.clearcoat = Math.max(0, d.baseC*(1 - dustLevel*0.85));
  }
}

/**
 * Giải phóng tài nguyên của xe cũ TRƯỚC khi dựng xe mới.
 *
 * RÒ BỘ NHỚ (đo được): đi khắp bản đồ thì geometry dừng ổn ở 494 — có kiểm
 * soát. Nhưng đổi xe 6 lần thì lên 1515, +1021, KHÔNG BAO GIỜ giảm.
 * Nguyên nhân: buildVehicle() gỡ group cũ khỏi player bằng
 * `while(player.children.length) player.remove(...)` — remove khỏi scene KHÔNG
 * giải phóng buffer GPU. Mỗi lần đổi xe vứt ~175 geometry đi.
 *
 * CHỈ dispose geometry và các CLONE của collectDustTargets. Vật liệu gốc nằm
 * trong cache `autoMat` dùng chung với Mèo Vàng và đá landmark — dispose nó
 * là làm hỏng cả những thứ khác.
 */
function disposeVehicle(){
  if (!player) return;
  const clones = new Set();
  player.traverse(o=>{
    if (o.geometry) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) if (m && m.userData && m.userData.__dustClone) clones.add(m);
  });
  for (const m of clones) m.dispose();
}

function buildVehicle(type){
  disposeVehicle();
  while(player.children.length) player.remove(player.children[0]);
  // KHÔNG gán lại vRefs: mọi ref đã push vào object cũ, gán lại sẽ làm rỗng
  // wheels/disc/... và mọi logic bánh/đuôi im lặng. Chỉ xoá nội dung mảng.
  vRefs.wheels.length=0; vRefs.scarves.length=0;
  vRefs.dish=vRefs.mast=vRefs.tail=vRefs.head=vRefs.rim=null; vRefs.arms=[];
  const g=new THREE.Group();
  // Phase 2 Task 2.2 — vật liệu PBR có clearcoat + xước/bụi, thay 4 material phẳng.
  // clearcoat tách lớp sơn khỏi kim loại nền: highlight sắc, trông mới thay vì
  // nhựa dẻo. roughnessMap phá vỡ mặt phẳng đơn sắc của material cũ.
  const wheelMat=heroMat('wheel', {color:0x1a1a1a, metalness:0.15, roughness:0.86,
      scratch:0.75, dust:1.0, wear:0.5, grain:0.9, clearcoat:0.10, repeat:3});
  const frameMat=heroMat('frame', {color:0xffc227, metalness:0.42, roughness:0.34,
      scratch:0.55, dust:0.55, wear:0.42, grain:0.6, clearcoat:0.85,
      clearcoatRoughness:0.12, repeat:2});
  const chrome=heroMat('chrome', {color:0xc4ccd6, metalness:0.92, roughness:0.20,
      scratch:0.85, dust:0.22, wear:0.30, grain:0.45, clearcoat:0.35, repeat:2});
  // Sơn kỹ thuật tối (thân vỏ rover) — sạch hơn, bám bụi ít hơn vì có mái che
  const hullMat=heroMat('hull', {color:0xd8d2c8, metalness:0.35, roughness:0.46,
      scratch:0.40, dust:0.40, wear:0.30, grain:0.55, clearcoat:0.70, repeat:2});
  // Vỏ tối (panel, gầm) — nhám hơn, không sơn bóng
  const panelMat=heroMat('panel', {color:0x2a2f36, metalness:0.55, roughness:0.68,
      scratch:0.60, dust:0.65, wear:0.35, grain:0.75, clearcoat:0.25, repeat:2});
  // Áo phủ cáo bọc dây cáp / mềm
  const bootMat=heroMat('boot', {color:0x121418, metalness:0.08, roughness:0.88,
      scratch:0.30, dust:0.85, wear:0.25, grain:0.9, clearcoat:0.05, repeat:4});
  // Đĩa bóng dưới xe: trước đây r=2.2 / opacity 0.14. Khi đã có contact shadow
  // THEO TỪNG BÁNH (Task 1.3) thì đĩa này chỉ còn làm vệt bóng to và đặc,
  // và nó che luôn tiếp xúc bánh-mặt đất. Giảm còn lớp nền rất mờ.
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.7,20), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.055, depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=0.015; shadow.renderOrder=-1; g.add(shadow);
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
    const wicker=autoMat(0xc99a5b, 0.4, 0.9);
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
              autoMat(0xa87a42, 0.4, 0.9));
        band.position.set(dx,y,dz); band.rotation.y=ry; basket.add(band);
      }
    }
    // quai treo lên ghi đông
    for(const dz of [0.15,-0.15]){
      const handle=new THREE.Mesh(new THREE.TorusGeometry(0.10,0.014,5,12,Math.PI), autoMat(0x9c6f3c, 0.4, 0.9));
      handle.position.set(0,0.16,dz); handle.rotation.y=Math.PI/2; basket.add(handle);
    }
    // túi ngủ cuộn (xanh Sao Hỏa) nằm trong giỏ
    const bag=new THREE.Mesh(new THREE.CapsuleGeometry(0.085,0.26,4,12),
          autoMat(0x3fb0d8, 0.4, 0.75));
    bag.rotation.z=Math.PI/2; bag.position.set(0.02,0.02,0.02); basket.add(bag);
    for(const dz of [-0.09,0.09]){                       // dây buộc túi
      const strap=new THREE.Mesh(new THREE.TorusGeometry(0.088,0.011,5,12),
            autoMat(0xe23c2e, 0.4, 0.8));
      strap.position.set(0.02,0.02,dz); strap.rotation.y=Math.PI/2; basket.add(strap);
    }
    // bình nước bạc chụp lên thành giỏ
    const canteen=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.17,12),
          autoMat(0xd6dbe2, 0.8, 0.3));
    canteen.position.set(-0.15,0.08,-0.14); basket.add(canteen);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.032,0.035,8),
          autoMat(0xe23c2e, 0.4, 0.6));
    cap.position.set(-0.15,0.18,-0.14); basket.add(cap);
    // gương + ăngten gắn trên quai
    const mirror=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.012,12),
          autoMat(0xbfe6ff, 0.9, 0.05));
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
    const tank=new THREE.Mesh(new THREE.CapsuleGeometry(0.26,0.7,6,12), autoMat(0xff3b2f, 0.4, 0.3));
    tank.rotation.z=Math.PI/2; tank.position.set(0.15,0.95,0); body.add(tank);
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.16,0.42), autoMat(0x1a1a1a, 0.4, 0.8)); seat.position.set(-0.35,1.12,0); body.add(seat);
    const fork=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.85,8), chrome); fork.position.set(0.85,0.72,0); fork.rotation.z=-0.35; body.add(fork);
    // Ghi đông: thanh ngang + 2 tay cầm cong + nắp cao su
    const hbar=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.52,10), chrome);
    hbar.rotation.x=Math.PI/2; hbar.position.set(1.05,1.12,0); body.add(hbar);
    for(const dz of [0.24,-0.24]){
      const grip=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.13,10),
            autoMat(0x2a2a2e, 0.4, 0.9));
      grip.rotation.x=Math.PI/2; grip.position.set(1.05,1.12,dz); body.add(grip);
      const barEnd=new THREE.Mesh(new THREE.SphereGeometry(0.031,8,6), chrome);
      barEnd.position.set(1.05,1.12,dz*1.14); body.add(barEnd);
    }
    vRefs.barPos={x:1.05,y:1.12,z:0,halfW:0.25}; vRefs.barObj=body;
    const mkW=(x)=>{ const w=new THREE.Group(); const tire=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.115,8,18), wheelMat); tire.rotation.y=Math.PI/2; w.add(tire);
      for(let s=0;s<4;s++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.78,0.025), chrome); sp.rotation.z=s*Math.PI/4+0.4; w.add(sp);} w.position.set(x,0.45,0); w.userData.r=0.535; body.add(w); vRefs.wheels.push(w); return w; };
    mkW(-1.05); mkW(1.05);
    const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.9,8), chrome); pipe.rotation.z=Math.PI/2-0.08; pipe.position.set(-0.55,0.55,0.3); body.add(pipe);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8), autoMat(0xfff6a0, 0.4, 0.55, 0xfff176, "emis0xfff176_09")); lamp.position.set(1.12,0.98,0); body.add(lamp);
    // chắn bùn sau (bốc đầu chất chơi)
    const fender=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.05,6,12,Math.PI*0.9), autoMat(0xff3b2f, 0.4, 0.55)); fender.position.set(-1.05,0.45,0); fender.rotation.y=Math.PI/2; fender.rotation.x=0.4; body.add(fender);
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
    const chassis=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.42,1.15), autoMat(0xd9cfc0, 0.3, 0.5));
    chassis.position.set(0,1.02,0); body.add(chassis);
    // золотая foil belly
    const foil=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.1,1.0), autoMat(0xffd54f, 0.9, 0.3)); foil.position.set(0,0.78,0); body.add(foil);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.55,1.05), autoMat(0x7ec8e3, 0.1, 0.08));
    cabin.position.set(0.05,1.52,0); body.add(cabin); vRefs.cabin=cabin;
    const deck=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.07,1.0), autoMat(0x12324a, 0.6, 0.35)); deck.position.set(-0.85,1.3,0); body.add(deck); // panel pin
    // mast camera
    const mast=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.8,6), chrome); pole.position.y=0.4; mast.add(pole);
    const eyeBox=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.16,0.14), autoMat(0x222222, 0.4, 0.55)); eyeBox.position.y=0.82; mast.add(eyeBox);
    for(const dz of [-0.05,0.05]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6), autoMat(0x80deea, 0.4, 0.55, 0x00bcd4, "emis0x00bcd4_08")); eye.position.set(0.18,0.82,dz); mast.add(eye); }
    mast.position.set(0.55,1.28,-0.42); body.add(mast); vRefs.mast=mast;
    // ăng-ten dish
    const dishG=new THREE.Group();
    const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.5,5), chrome); stick.position.y=0.25; dishG.add(stick);
    const dish=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,6,0,Math.PI*2,0,Math.PI*0.45), autoMat(0xf5f5f5, 0.4, 0.55)); dish.position.y=0.52; dish.rotation.x=2.4; dishG.add(dish);
    dishG.position.set(-0.9,1.26,0.45); body.add(dishG); vRefs.dish=dishG;
    // đèn pha
    for(const dz of [0.35,-0.35]){ const l=new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8), autoMat(0xfff6a0, 0.4, 0.55, 0xfff176, "emis0xfff176_095")); l.position.set(1.18,1.0,dz); body.add(l); }
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
  const matFur   = autoMat(0xffc93c, 0.4, 0.84);
  const matFurD  = autoMat(0xe2961c, 0.4, 0.86); // sọc tabby
  const matCream = autoMat(0xfff3cf, 0.4, 0.88); // bụng/mõm
  const matPink  = autoMat(0xff9db0, 0.4, 0.5);
  const matWhite = autoMat(0xf6f6ef, 0.18, 0.34);
  const matGold  = new THREE.MeshPhysicalMaterial({color:0xffcb63, roughness:0.07, metalness:0.4,
                                                   transparent:true, opacity:0.34,
                                                   side:THREE.DoubleSide, depthWrite:false});
  const matChrome= autoMat(0xd6dbe2, 0.85, 0.28);
  const matRed   = autoMat(0xe23c2e, 0.4, 0.72);
  const matEyeW  = autoMat(0xfdfbf4, 0.4, 0.22);
  const matIris  = autoMat(0x5cc46e, 0.4, 0.18, 0x0e3a1a, "emis0x0e3a1a_04");
  const matPupil = autoMat(0x0a0a0a, 0.4, 0.1);
  const matGloss = new THREE.MeshBasicMaterial({color:0xffffff});
  const matDark  = autoMat(0x4a3418, 0.4, 0.8);

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
        autoMat(0x7dff9c, 0.4, 0.55, 0x22ff55, "emis0x22ff55_15"));
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
  const armMat = autoMat(0xffc93c, 0.4, 0.82);
  const pawMat  = autoMat(0xfff3cf, 0.4, 0.62);
  const clawMat = autoMat(0x3a2a18, 0.4, 0.5);
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
  // Đổi sang bản glTF nếu đã nạp xong. Gốc GLB = điểm ngồi nên nâng MEO_LIFT,
  // tương đương vị trí yên mà bản procedural đang ngồi.
  if (meoUseGLB && meoGLTF){
    cat.visible = false;                 // giữ procedural làm dự phòng, chỉ ẩn
    const g = buildMeoFromGLB();
    g.visible = true;
    catLift.add(g);
    vRefs.glbRoot = g;
  }
  catLift.add(cat);
  g.add(catLift);
  cat.name='cat';
  // Đèn phụ gắn theo xe: giữ Mèo & cánh tay luôn đủ sáng khi nhìn từ góc
  // thứ nhất, tránh bóng tối đọc không ra hình dạng.
  // Đèn gắn trên xe: phải thuộc LỚP GẦN, nếu không nó nằm ở layer 0 và không
// chiếu được vật thể nào (xe đã chuyển sang layer 1) → tay Mèo chìm tối.
const keyLight=new THREE.PointLight(0xffd9a0, 1.15, 6, 2);
keyLight.layers.set(1);
  keyLight.position.set(0.55, 2.4, 0.15);
  g.add(keyLight);
  const fillLight=new THREE.PointLight(0xffb877, 0.55, 5, 2);
fillLight.layers.set(1);
  fillLight.position.set(-0.5, 1.9, -0.5);
  g.add(fillLight);
  // Lớp ánh sáng GẦN: gán tại đây (sau khi dựng xong) để không phụ thuộc
  // thứ tự gọi so với markFar(scene) — nếu quên, xe sẽ thành mảng tối vì
  // không nguồn ánh sáng nào chiếu layer 0.
  g.traverse(o=>{ if(o.isMesh||o.isInstancedMesh||o.isPoints||o.isLine) o.layers.enable(1); });
  // Gom vật liệu để phủ bụi (Task 3.3). PHẢI làm trước auto-calibrate vì hàm đó
  // đo world matrix của bánh — không liên quan, nhưng clone vật liệu không đổi
  // hình học nên thứ tự vẫn an toàn. Đặt sau cùng để mọi mesh đã dựng xong.
  const nDust = collectDustTargets(g);
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
function updateRidingPose(now, dt, steerInput, speed, boosting){
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
const _cineAim=new THREE.Vector3();

// camera KHÔNG được chui xuống đất: nâng lên nếu thấp hơn mặt đất tại vị trí đó
function keepCamAboveGround(min=1.2){
  const g=sampleHeight(camera.position.x, camera.position.z)+min;
  if(camera.position.y < g) camera.position.y = g;
}
// ════════════════════════════════════════════════════════════════════════════
// CAMERA STATE THEO TỐC ĐỘ / ĐỊA HÌNH — Phase 3 Task 3.5
//
// Camera trước đây gắn cứng: fov 68 cố định, hướng nhìn bám thẳng vào xe.
// Không có gì báo cho người chơi biết mình đang nhanh cỡ nào, và mọi chuyển
// hướng đều tức thời nên xe không có quy mô (khối lượng).
//
// Bốn kênh, mỗi kênh độc lập:
//   1. FOV động      — trường nhìn nở ra khi nhanh / boost, hẹp lại khi chậm
//   2. Trễ hướng nhìn — camera quay về phía xe sau một hằng số thời gian
//   3. Rung chạm đất  — lấy trực tiếp xung ổ gi của Task 3.4
//   4. Chặn địa hình — không để camera chui vào sườn phía trước
//
// SỞ HỮU: đây là nơi DUY NHẤT ghi camera.fov, _camYawLag và camShake.
// ════════════════════════════════════════════════════════════════════════════
const CAM_BASE_FOV = 68, CAM_FOV_SPEED = 7, CAM_FOV_BOOST = 9;
const CAM_LAG_TAU   = 0.13;   // giây — trễ quay đầu (FOV/góc nhìn)
const CAM_CHASE_TAU = 0.20;   // giây — trễ vị trí camera người thứ ba
let _camYawLag = 0, _fovNow = CAM_BASE_FOV, camShake = 0, _shakeSeed = 0;
let _lastChaseK = 0, _lastDt = 0;
let _bumpForCam = 0;   // xung ổ gi, Task 3.4 ghi; camera chỉ ĐỌC

/**
 * Cập nhật FOV + trễ hướng nhìn + rung. Gọi MỘT LẦN mỗi khung ở đầu updateCamera,
 * trước khi dựng vị trí — để các nhánh camera sau dùng chung trạng thái đã mượt.
 */
function updateCameraFeel(dt, speedFrac, boosting){
  // 1) FOV động. Nội suy mũ để không giật khi đổi trạng thái boost.
  const wantFov = CAM_BASE_FOV + speedFrac*CAM_FOV_SPEED + (boosting ? CAM_FOV_BOOST : 0);
  _fovNow += (wantFov - _fovNow) * (1 - Math.exp(-dt/0.30));
  if (Math.abs(camera.fov - _fovNow) > 0.01){
    camera.fov = _fovNow;
    camera.updateProjectionMatrix();
  }
  // 2) Trễ hướng nhìn: nội suy về yaw của xe. Rẽ thì khung hình quay sau một nhịp
  //    rồi mới bám — đây là thứ cho cảm giác "xe có khối lượng". Offset cũng phải
  //    quấn về 0, nếu không chênh lệch góc tích luỹ và camera xoay 360° sau vài
  //    vòng đường cong.
  let d = playerYaw - _camYawLag;
  while (d >  Math.PI) d -= Math.PI*2;
  while (d < -Math.PI) d += Math.PI*2;
  _camYawLag += d * (1 - Math.exp(-dt/CAM_LAG_TAU));
  // 3) Rung chạm đất. Lấy xung ổ gi sẵn có thay vì dựng cảm biến riêng.
  if (_bumpForCam > camShake) camShake = _bumpForCam;
  camShake *= Math.exp(-dt*7.0);
  if (camShake > 0.002){
    _shakeSeed += dt*47;
    camera.position.x += Math.sin(_shakeSeed*1.7)*camShake*0.055;
    camera.position.y += Math.sin(_shakeSeed*2.3 + 1.1)*camShake*0.045;
    camera.rotation.z += Math.sin(_shakeSeed*1.3)*camShake*0.012;
  }
}

function updateCamera(dt){
  // Trạng thái camera dùng chung cho MỌI nhánh (FOV, trễ, rung) — gọi một lần ở
  // đây, trước khi dựng vị trí. Nhánh nào cũng thừa hưởng.
  const _mc = VEHICLES[vehicleType];   // conf chỉ có trong frame(), không có ở đây
  const _sf = _mc.speed ? Math.min(1, Math.abs(speedReal)/_mc.speed) : 0;
  updateCameraFeel(dt, _sf, !!input.boost);
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
    // HƯỚNG NHÌN CÓ TRỄ: fwd dùng _camYawLag (đã trễ), còn vị trí camera neo theo
    // yaw thật. Tách hai thứ này ra là camera vừa bám xe vừa có quy mô.
    const _yawLag = _camYawLag;
    const fwd=_camFwd.set(Math.cos(_yawLag),0,Math.sin(_yawLag));
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
    // Vị trí neo theo yaw THẬT: camera phải bám thân xe, còn hướng nhìn mới trễ.
    const fwdReal = _camFwd.clone().set(Math.cos(playerYaw),0,Math.sin(playerYaw));
    camera.position.copy(playerPos).addScaledVector(fwdReal, backH);
    camera.position.y = playerPos.y + upH;
    // Chặn địa hình: không chỉ chặn dưới, mà còn phía TRƯỚC. Camera thấp sau vai
    // mèo có thể bị sườn đồi phía trước nuốt mất nửa khung hình.
    //
    // PHẢI so với CAO ĐỘ LÝ TƯỞNG, không phải cao độ hiện tại. Bản đầu tính
    // độ nâng từ camera.position.y — mà biến này đã bị chính lệnh nâng khung trước
    // sửa rồi, nên mỗi khung lại nâng thêm một chút: RATCHET. Đo được camera bò
    // lên tới +12m so với xe, rồi rơi xuống -5m khi đi xuống dốc. Giữ riêng cao
    // độ lý tưởng rồi mới áp nâng lên CAO ĐỘ ĐÓ là hết.
    const idealY = playerPos.y + upH;
    let wantY = idealY;
    for(const [ao,bo] of [[0.9,-0.5],[2.4,-0.3],[4.5,0]]){
      const cx = camera.position.x + fwdReal.x*ao + right.x*bo;
      const cz = camera.position.z + fwdReal.z*ao + right.z*bo;
      const cl = sampleHeight(cx, cz) + 0.55;
      if (cl > wantY) wantY = cl;
    }
    // Nâng tối đa 1.6m: quá tay thì camera bay lên trời mất mất hình xe.
    if (wantY > idealY) wantY = Math.min(wantY, idealY + 1.6);
    camera.position.y = wantY;
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
    // KHOẢNH KHẮC KHÁM PHÁ (Task 3.6): trộn hướng nhìn về phía POI. Camera chỉ ĐỌC
    // cineFocus, không tự tính — khoảnh khắc sở hữu trọng số, camera sở hữu phép
    // áp nó lên hướng nhìn.
    if(cineFocus > 0.001 && cineTarget){
      _cineAim.set(cineTarget.pos.x, sampleHeight(cineTarget.pos.x, cineTarget.pos.z)+2.2, cineTarget.pos.z);
      _camLook.lerp(_cineAim, THREE.MathUtils.clamp(cineFocus,0,1)*0.85);
    }
    camera.lookAt(_camLook);
  } else {
    const r=camDist;
    const yaw = playerYaw + 0.15;
    // BÙ TRỄ BẰNG PHẦN DẪN TỐC ĐỘ.
    //
    // Camera nội suy sau một điểm đích đang di chuyển sẽ LUÔN tụt lại phía sau
    // ở trạng thái xác lập, và độ tụt TỈ LỆ VỚI TỐC ĐỘ — đo được 26m khi xe
    // chạy 6.2 m/s, tức xe nhỏ như một hạt sỏi trong khung hình. Giảm hằng số
    // trễ chỉ đổi con số, không triệt tiểu gốc rễ.
    //
    // Cách đúng: cho ĐÍCH đích dẫn trước đúng bằng v·τ. Ở trạng thái xác lập thì
    // độ trễ của phép nội suy (v·τ) và phần dẫn (v·τ) triệt tiêu nhau -> camera
    // đứng yên đúng chỗ mong muốn. Trong lúc tăng/giảm tốc độ vẫn còn độ trễ,
    // nên cảm giác xe nặng vẫn còn nguyên — đây là điều ta muốn.
    const vLead = CAM_CHASE_TAU * 12;     // conf.speed * 12 là hệ số quãng đường
    const vx = Math.cos(playerYaw)*speedReal*vLead;
    const vz = Math.sin(playerYaw)*speedReal*vLead;
    const x = playerPos.x - Math.cos(yaw)*r*0.95 + vx;
    const z = playerPos.z - Math.sin(yaw)*r*0.95 + vz;
    const y = sampleHeight(playerPos.x, playerPos.z)+ 2.8 + Math.sin(0.35)*1.2;
    // Trễ ĐỘC LẬP VỚI TỐC ĐỘ KHUNG HÌNH. Bản cũ dùng lerp hằng 0.08 mỗI KHUNG:
    // ở 60 FPS nghĩa là hằng số thời gian ~0.21s, nhưng ở 144 FPS chỉ ~0.09s —
    // camera bám chặt ở máy nhanh và bỏ rơi ở máy chậm. Đo được ở đây: xe chạy
    // 50m/s còn camera tụt 16m phía sau, độ cao lệch tới ±12m khi đi xuống dốc.
    // Hằng số thời gian mũ thì giống nhau ở mọi tần số.
    const k = 1 - Math.exp(-dt/CAM_CHASE_TAU);
    _lastChaseK = k; _lastDt = dt;
    const tx = THREE.MathUtils.lerp(camera.position.x, x, k);
    const tz = THREE.MathUtils.lerp(camera.position.z, z, k);
    const ty = THREE.MathUtils.lerp(camera.position.y, y, k);
    camera.position.set(tx,ty,tz);
    keepCamAboveGround(1.4);
    // Nhìn về phía trước một chút theo hướng ĐÃ TRỄ, không nhìn thẳng vào xe:
    // nhìn thẳng vào tâm xe làm khung hình đứng yên khi xe rẽ.
    _camLook.set(playerPos.x + Math.cos(_camYawLag)*1.6,
                 sampleHeight(playerPos.x, playerPos.z)+1.0,
                 playerPos.z + Math.sin(_camYawLag)*1.6);
    if(cineFocus > 0.001 && cineTarget){
      _cineAim.set(cineTarget.pos.x, sampleHeight(cineTarget.pos.x, cineTarget.pos.z)+2.2, cineTarget.pos.z);
      _camLook.lerp(_cineAim, THREE.MathUtils.clamp(cineFocus,0,1)*0.85);
    }
    camera.lookAt(_camLook);
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
  // Phím 1-4: nhảy thẳng tới Đêm / Bình minh / Trưa / Hoàng hôn (Task 3.2)
  if(k>='1' && k<='4' && !e.shiftKey && !e.ctrlKey && !e.metaKey
     && document.activeElement===document.body){
    setTimePreset(+k - 1);
  }
  // Phím F: bật/tắt ô đo FPS + preset đồ họa. Cần khi người chơi muốn tự
  // xem máy mình chịu được bao nhiêu — không đoán giúp được, phải đo trên
  // phần cứng thật.
  // Phím V: đổi Mèo Vàng giữa bản glTF dựng bằng Blender và bản procedural.
  if(k==='v' && !e.repeat){
    if (!meoGLTF){ showToast('🐱','Chưa có bản Blender','GLB chưa nạp xong — vẫn dùng bản procedural.'); }
    else { applyMeoSource(!meoUseGLB);
      showToast('🐱', meoUseGLB ? 'Mèo bản Blender' : 'Mèo bản procedural',
        meoUseGLB ? 'glTF + Draco từ scripts/build-meo-vang.py' : 'Bản dựng bằng code'); }
  }
  if(k==='f' && !e.repeat){
    const on = document.documentElement.dataset.perf === '1';
    document.documentElement.dataset.perf = on ? '0' : '1';
    perfUserOn = !on;
    // Bật lên thì áp lại chế độ HUD ngay, nếu không đang lái thì ô vẫn bị ẩn
    if (perfUserOn) applyHudDriveMode(hudDriveOn);
    perfFps = 0; perfAcc = 0; perfFrames = 0;
  }
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

/** Nhảy tới 1 trong 4 mốc giờ (Task 3.2). Nội suy vẫn chạy trong
 *  updateAtmosphere nên chuyển mốc không giật, chỉ mất ~1.2s để ổn định. */
function setTimePreset(idx){
  timeOfDay = ((idx % 4) + 4) % 4 * 0.25;
  applyTime();
  const n = TIME_GRAD[(idx%4+4)%4].name;
  if (hudTime) hudTime.textContent = n;
  showToast('\u{1F305}', `Giờ: ${n}`, n==='Đêm'
    ? 'Mặt trời lặn hẳn dưới chân trời — chỉ còn ánh trăng lạnh và sao.'
    : n==='Bình minh' ? 'Nắng đầu tiên ló lên, bóng đổ dài và ánh hồng nhạt trên mây.'
    : n==='Trưa' ? 'Nắng đứng trên đỉnh đầu, bóng ngắn nhất và màu trung tính nhất.'
    : 'Nắng xuống thấp, mọi thứ nghiêng sang đỏ và bóng đổ dài gấp đôi.');
}

// Nhãn giờ trên HUD. Cập nhật mỗi khung từ tên mốc gần nhất, nên đổi giờ bằng
// bất kỳ cách nào (phím 1-4, nút L, hay setTime trong console) đều khớp.
const hudTime = document.getElementById('hud-time');

function applyTime(){
  const t=timeOfDay;
  // sky
  skyMat.uniforms.t.value=t;
  const sunH = Math.sin(t*Math.PI*2 - Math.PI/2);
  const tg = sampleTimeGrade(t);
  sun.position.set(300*Math.cos(t*Math.PI*2), 120+ sunH*340, 100);
  sunFar.position.copy(sun.position);   // lớp xa đi cùng hướng với lớp gần
  // Cường độ ánh sáng KHÔNG tính tay ở đây nữa — thuộc mốc giờ (Task 3.2) và
  // được nội suy mượt trong updateAtmosphere(), nên đổi giờ không bị giật.
  // applyTime chỉ lo VỊ TRÍ (mặt trời phải đi ngay) + độ mờ sao theo giờ.
  stars.material.opacity = tg.stars;
  // KHÔNG ghi màu fog ở đây: updateAtmosphere() đã sở hữu màu (Task 1.6) và chạy
  // mỗi khung theo biome. Ghi đè ở đây là hai hệ tranh nhau — đúng lỗi đã dính
  // với maybeStorm(). Clear color vẫn cần, nhưng lấy từ fog hiện hành.
  renderer.setClearColor(scene.fog.color, 1);
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
  // Focus/tilt-shift CHỈ có ý nghĩa khi đứng yên chụp ảnh. Bật ở ngoài photo mode
  // thì cả lúc lái cũng mờ viền — tốn 9 mẫu/pixel mà không ai nhìn thấy tác dụng.
  // Chỗ bật/tắt DUY NHẤT: applyPostFX cũng không đụng vào biến này.
  if(focusPass) focusPass.enabled = photoMode;
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
document.getElementById('btn-light').onclick=()=>{ setTimePreset(Math.round(timeOfDay/0.25)); };
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
  // Mật độ fog TÍNH TỪ FOG_BASE × preset, không hardcode — trước đây ghi cứng
  // 0.0012 mỗi khung nên vô hiệu hoá cả bản sửa cạnh terrain lộ (Task 1.6).
  scene.fog.density = FOG_BASE * (GFX_PRESETS[gfxName]?.fogMul ?? 1) * (1 + s*2.4);
  // Cả MÀU lẫn CƯỜNG ĐỘ ánh sáng đều do updateAtmosphere() sở hữu (nó biết cả
  // biome, cả giờ trong ngày, cả stormLevel) — ở đây KHÔNG ghi đè, nếu không hai
  // hệ sẽ tranh nhau và hệ mới luôn thua vì chạy sau.
  // KHÔNG gán sun/hemi.intensity ở đây (Task 3.2). updateAtmosphere() đã sở hữu
  // cường độ: lấy hệ số theo giờ trong ngày × hằng số nền, rồi nhân (1-s*0.55) để
  // bão làm tối. Ở đây gán lại bằng giá trị TUYỆT ĐỐI (và nhân 1.6 hai lần) là
  // chủ sở hữu thứ hai — nó chạy sau nên luôn thắng, xoá sạch gradient giờ.
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
// ════════════════════════════════════════════════════════════════════════════
// DISCOVERY CINEMATIC — Phase 3 Task 3.6
//
// Trước đây đến POI là overlay bật lên ngẫu nhiên giữa đường: không có âm
// thanh, không có gì ở trong thế giới 3D, không có nhịp. Người chơi vừa đang
// lái thì bị một hộp thoại chặn ngang.
//
// Nay mỗi lần khám phá là một MỘT KHOẢNH KHÔNG GIAN dài ~2.6s:
//   0.00s  chuông chạm   · hạt bụi bật lên tại POI · camera bắt đầu quay
//   0.35s  thẻ trượt vào từ dưới
//   0.90s  POI được đánh dấu khám phá (ngay khi thẻ hiện, không phải khi đóng)
//   2.60s  hết khoảnh khắc
//
// NHỊP: mỗi 30–60s một lần. Discovery là món ăn chứ không phải đồ ăn vặt —
// nếu cứ vài giây một cái thì nó thành nhiễu và người chơi sẽ tắt luôn.
//
// SỞ HỮU: `cineT`/`cineTarget`/`cineFocus` chỉ gán trong đây. Camera chỉ ĐỌC
// `cineFocus` (Task 3.5) và áp nó như một trọng số thêm lên hướng nhìn.
// ════════════════════════════════════════════════════════════════════════════
const CINE_DUR = 2.6;
let cineT = -1;              // -1 = không chạy
let cineTarget = null;       // POI đang khám phá
let cineFocus = 0;           // 0..1 — trọng số camera nhìn sang POI
let cineCooldown = 12;       // chờ lần đầu sau khi bắt đầu chơi
let cineBurst = null;

// ---- 1. HẠT BỤI BẬT LÊN TẠI POI ----------------------------------------
// Một pool Points dùng lại cho mọi lần khám phá: 1 draw call, không cấp phát
// trong lúc chơi. Hạt bay lên trên rồi tụt, tắt dần — trông như bụi bị nâng lên
// bởi điều gì đó vừa xảy ra.
const BURST_N = 220;
function makeBurst(){
  const pos = new Float32Array(BURST_N*3);
  const vel = new Float32Array(BURST_N*3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    size: 0.55, color: 0xffd98a, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  p.visible = false;
  return { p, pos, vel, g, m, life: 0 };
}
function fireBurst(x, y, z){
  if (!cineBurst) cineBurst = makeBurst();
  const b = cineBurst, gy = sampleHeight(x, z);
  for (let i=0;i<BURST_N;i++){
    const a = Math.random()*Math.PI*2, r = Math.random()*3.2;
    b.pos[i*3  ] = x + Math.cos(a)*r;
    b.pos[i*3+1] = gy + 0.2 + Math.random()*1.2;
    b.pos[i*3+2] = z + Math.sin(a)*r;
    b.vel[i*3  ] = Math.cos(a)*(0.9+Math.random()*2.2);
    b.vel[i*3+1] = 1.9 + Math.random()*4.4;      // chủ yếu đi lên
    b.vel[i*3+2] = Math.sin(a)*(0.9+Math.random()*2.2);
  }
  b.g.attributes.position.needsUpdate = true;
  b.life = 1; b.p.visible = true; b.m.opacity = 1;
}
function updateBurst(dt){
  if (!cineBurst || cineBurst.life <= 0) return;
  const b = cineBurst;
  b.life -= dt/2.2;
  if (b.life <= 0){ b.life = 0; b.p.visible = false; b.m.opacity = 0; return; }
  for (let i=0;i<BURST_N;i++){
    b.vel[i*3+1] -= 4.2*dt;                    // trọng lực
    b.vel[i*3  ] *= (1 - 0.9*dt);
    b.vel[i*3+2] *= (1 - 0.9*dt);
    b.pos[i*3  ] += b.vel[i*3  ]*dt;
    b.pos[i*3+1] += b.vel[i*3+1]*dt;
    b.pos[i*3+2] += b.vel[i*3+2]*dt;
  }
  b.g.attributes.position.needsUpdate = true;
  b.m.opacity = Math.max(0, Math.min(1, b.life)) * 0.9;
}

// ---- 2. CHUÔNG CHẠM --------------------------------------------------------
// Tổng hợp trực tiếp bằng Web Audio, không cần file âm thanh. Ba nốt hợp âm
// ngũ cung (A4–C#5–E5) cộng một nốt trầm bên dưới: nghe như "tìm ra thứ gì
// đó" mà vẫn giữ chất thanh nhẹ của cả game.
function discoveryChime(){
  const ac = ensureAudio();
  if (!ac || !audioMaster) return;
  const t0 = ac.currentTime + 0.02;
  const notes = [440, 554.37, 659.25, 220];
  notes.forEach((f, i)=>{
    const o = ac.createOscillator();
    o.type = i===3 ? 'sine' : 'triangle';
    o.frequency.value = f;
    const g = ac.createGain();
    const st = t0 + i*0.075;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(i===3 ? 0.16 : 0.10, st + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 1.5);
    o.connect(g); g.connect(audioMaster);
    o.start(st); o.stop(st + 1.6);
  });
}

// ---- 3. KHOẢNH KHẮC --------------------------------------------------------
function startDiscoveryCine(poi){
  cineT = 0;
  cineTarget = poi;
  discoveryChime();
  fireBurst(poi.pos.x, 0, poi.pos.z);
  // Phải đổ DỮ LIỆU vào thẻ. Bản đầu chỉ bỏ class 'hidden' mà quên gọi
  // openDiscovery() -> thẻ hiện nguyên văn chữ sỗi: "Tiêu đề", "Fact",
  // "Mèo nói…". Chỉ lộ ra khi CHỤP ẢNH — đọc DOM thì thấy phase đúng, nội dung
  // sai hoàn toàn không ai để ý.
  openDiscovery(poi);
  // thẻ trượt vào sau một nhịp — vào ngay lập tức thì không kịp nhìn thấy nổ
  const el = document.getElementById('overlay-discovery');
  el.dataset.poi = poi.id;
  el.dataset.phase = 'beat';
  setTimeout(()=>{ if (cineT >= 0) el.dataset.phase = 'in'; }, 350);
  // Đánh dấu khám phá NGAY khi thẻ hiện, không đợi đóng. Đóng mà không lưu
  // thì người chơi mất thẻ mà không hề biết.
  setTimeout(()=>{
    if (!discovered.has(poi.id)){ discovered.add(poi.id); save(); renderJournalCards(); updateJournal(); updatePWAStatus(); }
  }, 900);
}
/** Đưa pool hạt vào scene. Gọi một lần lúc khởi tạo. */
function attachBurst(){
  if (!cineBurst) cineBurst = makeBurst();
  if (!cineBurst.p.parent) scene.add(cineBurst.p);
}
function updateDiscoveryCine(dt){
  if (cineT < 0) return;
  cineT += dt;
  // trọng số camera: lên nhanh 0.25s, giữ, xuống 0.5s
  if (cineT < 0.25)      cineFocus = cineT/0.25;
  else if (cineT < 1.9)  cineFocus = 1;
  else if (cineT < 2.6)  cineFocus = 1 - (cineT-1.9)/0.7;
  else {
    cineFocus = 0; cineT = -1; cineTarget = null;
    const el = document.getElementById('overlay-discovery');
    el.classList.add('hidden');
    el.dataset.phase = '';
    cineCooldown = 30 + Math.random()*30;   // 30–60 giây
  }
  // nhịp lặp lại cho tới hết khoảnh khắc
  if (cineT > 0.95 && cineT - dt <= 0.95 && cineTarget) fireBurst(cineTarget.pos.x, 0, cineTarget.pos.z);
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
  overlayDiscovery.dataset.phase='';
  // Đóng giữa chừng thì khoảnh khắc kết thúc luôn — nếu không, camera cứ nhìn
  // về POI thêm 2.6s sau khi người chơi đã đóng, trông như lỗi.
  cineT = -1; cineFocus = 0; cineTarget = null;
  cineCooldown = 30 + Math.random()*30;
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


// ════════════════════════════════════════════════════════════════════════════
// ANIMATION GRAPH — Phase 3 Task 3.4
//
// Trước đây phần cử động rải rác ngay trong frame(): đuôi vẩy theo sin(now*0.0035),
// tai đậy theo hai tần số, đầu nghiêng theo sin(now*0.004). Chúng không biết
// MÈO ĐANG LÀM GÌ — dù đang phanh hay đang rã mái thì đuôi cũng vẩy y hệt.
//
// Nay có máy trạng thái thật. Nguyên tắc: **trộn THAM SỐ, không trộn tư thế**.
// Mỗi trạng thái đẩy ra một bộ giá trị đích; chỉ có một bộ tham số đang chạy,
// nội suy về đích mỗi khung. Nhờ vậy chuyển trạng thái tự mượt, không cần
// blend weight giữa hai tư thế.
//
// SỞ HỮU: đây là nơi DUY NHẤT ghi các biến trong ANIM_P. Trong frame() chỉ
// ĐỌC chúng ra dùng. Tư thế xe theo địa hình (targetPitch/targetRoll) vẫn thuộc
// về settleToGround(); anim graph CỘNG thêm của mình, không ghi đè.
// ════════════════════════════════════════════════════════════════════════════
const ANIM_STATES = {
  //           pitch  roll   squat  tailLift tailSide earBack headTurn crouch scarf
  idle:      { pitch: 0.000, roll: 0.000, squat:0.00, tailLift: 0.10, tailSide:0.05, earBack:0.00, headTurn:0.00, crouch:0.00, scarf:0.05 },
  accel:     { pitch:-0.030, roll: 0.000, squat:0.06, tailLift:-0.18, tailSide:0.02, earBack:-0.55, headTurn:0.00, crouch:0.35, scarf:0.55 },
  cruise:    { pitch:-0.016, roll: 0.000, squat:0.03, tailLift: 0.34, tailSide:0.10, earBack:-0.18, headTurn:0.00, crouch:0.10, scarf:0.30 },
  // THẢ GA: xe còn đà mà không còn lệnh tăng tốc. Trước đây rơi vào 'accel' vì
  // ngưỡng chỉ xét tốc độ — nhưng coast và accel trông hật khác nhau: mèo thả lỏng,
  // đuôi hạ, không cúi như lúc mới rồ ga.
  coast:     { pitch: 0.006, roll: 0.000, squat:0.02, tailLift: 0.20, tailSide:0.08, earBack:-0.05, headTurn:0.00, crouch:0.05, scarf:0.15 },
  brake:     { pitch: 0.042, roll: 0.000, squat:0.14, tailLift: 0.55, tailSide:0.06, earBack:-0.70, headTurn:0.00, crouch:0.20, scarf:0.80 },
  turn:      { pitch: 0.000, roll: 0.000, squat:0.05, tailLift: 0.42, tailSide:0.00, earBack:-0.30, headTurn:0.00, crouch:0.22, scarf:0.45 },
  reverse:   { pitch: 0.020, roll: 0.000, squat:0.04, tailLift: 0.05, tailSide:0.04, earBack: 0.10, headTurn:0.00, crouch:0.15, scarf:0.20 },
};
const ANIM_KEYS = Object.keys(ANIM_STATES.idle);
const ANIM_P = {};
for (const k of ANIM_KEYS) ANIM_P[k] = ANIM_STATES.idle[k];

let animState = 'idle', animStateSince = 0, animRoll = 0;
// Tốc độ thật (đơn vị như conf.speed). Tách khỏi tốc độ lệnh để có quán tính.
let speedReal = 0;
const ACCEL_TAU = 0.40;   // giây — hết ~63% quãng trong 0.4s
const BRAKE_TAU = 0.22;   // phanh gọn hơn ga
// Phát hiện ổ gi: bánh rơi xuống đột ngột (giảm cao độ rõ rệt) → trạng thái bump.
let _bumpT = -999, _bumpMag = 0, _bumpInit = false;
let _prevY = 0, _dyAvg = 0;   // chỉ dùng cho jerk

/** Phân loại trạng thái từ input + vận tốc + địa hình. */
function classifyAnim(fwd, turn, speed, conf){
  const spd = Math.abs(speed), mx = conf.speed || 1;
  if (spd < mx*0.06) return 'idle';
  // Lệnh lùi khi ĐANG CHẠY TỚI = phanh. Đang đã lùi = lùi. Không được gộp:
  // bản đầu trả 'brake' cho cả hai nên trạng thái 'reverse' không bao giờ tới.
  if (fwd < -0.05) return speed > 0 ? 'brake' : 'reverse';
  if (Math.abs(fwd) < 0.05) return 'coast';   // thả ga, đang trôi
  if (Math.abs(turn) > 0.30 && spd > mx*0.15) return 'turn';
  // Ngưỡng 0.75 thay vì 0.45: xe tăng tốc trong ~0.4s nên 0.45 là quá ngắn,
  // accel lướt qua không kịp nhìn thấy.
  if (spd < mx*0.75) return 'accel';
  return 'cruise';
}

/**
 * Nhận diện ổ gi bằng JERK — gia tốc dọc đột ngột.
 *
 * Hai cách trước đều sai, và cả hai đều do đo chứng minh chứ không phải do đoán:
 *
 * 1) Ngưỡng trên lệch mỗi khung (dy < -5.5cm): ở 100 FPS, 15m/s thì xe chạy 15cm
 *    mỗi khung, nên chỉ cần dốc 20° là vượt ngưỡng -> bump bắn liên tục.
 * 2) Lệch với đường xu hướng (_smoothY): bộ lọc trễ tạo ra sai số TỈ LỆ VỚI TỐC ĐỘ
 *    LEO. Đo được p90 = 3.9m, max = 13.5m trên đường bằng — vô lý, vì đó là
 *    phép trễ chứ không phải địa hình.
 *
 * JERK = dy trừ đi bình quân gần đây. Dốc đều cho dy không đổi nên jerk = 0;
 * bậc đất, vấp đá thì dy đổi đột ngột nên jerk nhảy. Đo được: đứng yên p50=0,
 * đi thẳng p50=0.0006 p90=0.134 p99=0.455.
 *
 * Ngưỡng 0.22m ~ p95 trên đường gồ ghề: đi bằng phẳng hầu như không bắn, đi đá
 * thì rung — đúng cảm giác.
 */
function detectBump(now, rideY, dt){
  if (!_bumpInit){ _prevY = rideY; _dyAvg = 0; _bumpInit = true; return 0; }
  const dy = rideY - _prevY; _prevY = rideY;
  _dyAvg += (dy - _dyAvg) * (1 - Math.exp(-dt*10));
  const jerk = _dyAvg - dy;
  if (jerk > 0.22 && now - _bumpT > 0.55){
    _bumpT = now; _bumpMag = Math.min(1, jerk/0.55);
  }
  const age = now - _bumpT;
  if (age > 0.40) return 0;
  // Lên nhanh rồi tắt dần: cảm giác "bánh rơi xuống rồi hấp thụ lại"
  return _bumpMag * (1 - age/0.40);
}

/**
 * Cập nhật máy trạng thái. Gọi mỗi khung, trước khi áp tư thế.
 * `speed` là tốc độ dọc (m/frame-ish như conf.speed), `turn` đã chuẩn hoá -1..1.
 */
function updateAnimGraph(now, dt, fwd, turn, speed){
  const conf = VEHICLES[vehicleType];
  const bumpMag = detectBump(now, playerPos.y, dt);
  _bumpForCam = bumpMag;   // Task 3.5 chỉ ĐỌC xung này, không tự tính lại
  const want = classifyAnim(fwd, turn, speed, conf);

  if (want !== animState){ animState = want; animStateSince = now; }
  const tAge = Math.min(1, (now - animStateSince) / 0.22);   // trộn vào trạng thái mới
  const s = ANIM_STATES[animState];

  // Nghiêng khi rẽ: nghiêng VÀO phía rẽ. Hằng số dấu đảo được nếu hình ảnh ngược.
  animRoll += ((-turn) - animRoll) * (1 - Math.exp(-dt*6.0));
  const TURN_LEAN = 0.22;

  for (const k of ANIM_KEYS){
    let target = s[k];
    // Nhịp thở khi đứng yên: biên độ nhỏ, chỉ ở idle
    if (animState === 'idle' && k === 'squat'){
      target += Math.sin(now*0.0016)*0.012;
    }
    // XUNG Ổ GI phủ lên trạng thái nền. Đây là kênh độc lập: vạch đá xảy ra
    // giữa lúc đang cruise thì vẫn phải đọc ra cruise, không phải bump.
    if (k === 'squat')       target -= bumpMag * 0.26;
    else if (k === 'pitch')  target += bumpMag * 0.10 * Math.sin(now*0.05);
    else if (k === 'scarf')  target += bumpMag * 0.55;
    else if (k === 'earBack')target -= bumpMag * 0.45;
    else if (k === 'tailLift') target += bumpMag * 0.30;
    const k2 = 1 - Math.exp(-dt * (tAge >= 1 ? 7.0 : 14.0));
    ANIM_P[k] += (target - ANIM_P[k]) * k2;
  }
  ANIM_P.roll = animRoll * TURN_LEAN;
  return { state: animState, bump: +bumpMag.toFixed(3), age: +(now - animStateSince).toFixed(2) };
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
  const cmdSpeed = fwd * conf.speed * boost;

  // ---- QUÁN TÍNH: tốc độ THẬT nội suy về tốc độ LỆNH --------------------
  // Trước đây speed = fwd*conf.speed*boost dùng THẲNG làm tốc độ di chuyển:
  // bấm W là lên tốc độ tối đa ngay khung kế tiếp, buông là dừng sặc. Ngoài cảm
  // giác lái cứng, nó cắt mất hai trạng thái accel và brake của anim graph —
  // máy trạng thái không thể phân biệt "đang tăng tốc" với "đã đạt tốc độ".
  // Hằng số thời gian mũ nên ổn định ở mọi tần số khung hình.
  const tau = Math.abs(cmdSpeed) < Math.abs(speedReal) ? BRAKE_TAU : ACCEL_TAU;
  speedReal += (cmdSpeed - speedReal) * (1 - Math.exp(-dt / tau));
  if (Math.abs(speedReal) < 0.004) speedReal = 0;   // chết máy khi lỡ tay còn vương
  const speed = speedReal;
  speedKmh = Math.abs(speed*3.2);
  // ── HUD gọn khi lái (Task 1.5) ──
  // Đang di chuyển → ẩn gợi ý phím, thanh công cụ, bộ chọn phương tiện, pill
  // hiệu năng; chỉ giữ biome/tọa độ/tốc độ/minimap. Trễ 1.2s khi dừng để HUD
  // không nhấp nháy khi chạm phím rồi buông.
  const driving = fwd !== 0 || speedKmh > 1.5;
  hudIdleT = driving ? 0 : hudIdleT + dt;
  const wantCompact = driving || hudIdleT < 1.2;
  if (wantCompact !== hudDriveOn){ hudDriveOn = wantCompact; applyHudDriveMode(hudDriveOn); }


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
  // Khí quyển theo biome (Task 1.6): set đích khi đổi vùng, lerp mượt mỗi khung.
  setBiomeAtmosphere(biomeAt(playerPos.x, playerPos.z).biome.id);
  updateAtmosphere(dt);
  updateShadowFollow();
  updateContactShadows();
  // Vệt bánh: thả theo quãng đường, không theo khung hình (tránh dày đặc khi đứng yên)
  if(Math.abs(speed)>0.01){
    trailDist += Math.abs(speed)*dt*12;
    if(trailDist > 0.55){ trailDist=0; dropWheelTrail(); }   // 0.55m < bề rộng vệt 1.3m -> liền mạch
  }
  rebuildTrail(dt);
  // bob nhẹ (chỉ khi đang chạy)
  const bob = Math.abs(speed)>0.01 ? Math.sin(now*0.012*(Math.abs(speed)+1.2))*conf.bob*0.08*Math.abs(fwd) : 0;
  playerPos.y += Math.max(0,bob);
  player.position.copy(playerPos);
  // ══════ HƯỚNG XE: yaw đúng trục + nghiêng theo địa hình ══════
  // Lưu ý: mô hình có +X là hướng đi, nên yaw phải là -playerYaw
  // (Three.js rotateY dương đưa +X về +Z, còn phương đi là (cos,sin) ở XZ).
  // Máy trạng thái: chạy TRƯỚC khi áp tư thế để ANIM_P đã sẵn sàng.
  const _anim = updateAnimGraph(now, dt, fwd, turn, speed);
  // Tư th xe = NGHIÊNG ĐỊA HÌNH (settleToGround sở hữu) + ĐÓNG GÓP CỦA ANIM.
  // Cộng tại đúng một chỗ áp dụng, không ghi đè biến của nhau.
  player.rotation.set(targetPitch + ANIM_P.pitch, -playerYaw, targetRoll + ANIM_P.roll, 'YXZ');

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
  // Đuôi: góc Y cơ bản lấy từ ANIM_P (chỉ đích), cộng thêm sóng động.
  if(vRefs.tail) vRefs.tail.rotation.y = ANIM_P.tailLift + ANIM_P.tailSide
    + Math.sin(now*0.0035 + speedKmh*0.04)*(0.10 + Math.min(0.28, speedKmh*0.008));
  if(vRefs.dish) vRefs.dish.rotation.y = Math.sin(now*0.0012)*0.9;
  if(vRefs.mast) vRefs.mast.rotation.y = Math.sin(now*0.0008+1.3)*0.7;
  // Đầu: NGHIÊNG VỀ phía rẽ (headTurn) + run nhẹ. ANIM_P là nguồn duy nhất.
  if(vRefs.head){
    vRefs.head.rotation.y = ANIM_P.headTurn * 0.55;
    vRefs.head.rotation.z = Math.sin(now*0.004)*0.035 * (1 + Math.min(1, speedKmh*0.02))
      + ANIM_P.headTurn*0.12;
  }
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
  // Tai: gật theo trạng thái (earBack) + gió vẫy. Khi GA nhanh tai ép sát đầu —
  // đây là tín hiệu đọc được nhất khi đang phanh.
  if(vRefs.ears && vRefs.ears.length){
    const gust=Math.sin(now*0.0016)+0.5*Math.sin(now*0.0043+1.1);
    vRefs.ears[0].rotation.x = gust*0.10 - 0.10 + ANIM_P.earBack*0.5;
    if(vRefs.ears[1]) vRefs.ears[1].rotation.x = -gust*0.10 - 0.10 + ANIM_P.earBack*0.5;
  }
  // Sóng chạy dọc đuôi: biên độ do tailLift quyết định (đuôi dựng khi phanh).
  if(vRefs.tailSegs && vRefs.tailSegs.length){
    const amp = 0.05 + Math.abs(ANIM_P.tailLift)*0.30;
    for(let i=0;i<vRefs.tailSegs.length;i++)
      vRefs.tailSegs[i].rotation.y = ANIM_P.tailLift*0.5 + ANIM_P.tailSide
        + Math.sin(now*0.006 - i*0.7)*amp;
  }
  if(vRefs.helmet && vRefs.helmet.children.length>3){
    const ledM=vRefs.helmet.children[3];
    if(ledM.material) ledM.material.emissiveIntensity = 0.7 + 1.4*(0.5+0.5*Math.sin(now*0.006));
  }
  // Khăn: bay mạnh khi phanh/va chạm (scarf), gần như đứng yên khi đi chậm.
  if(vRefs.scarf) vRefs.scarf.rotation.y = Math.sin(now*0.0042)*(0.05 + ANIM_P.scarf*0.85);

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
  if (hudTime) hudTime.textContent = sampleTimeGrade(timeOfDay).name;
  hudPaws.textContent=collected.length;
  document.getElementById('j-dist') && (document.getElementById('j-dist').textContent=distance.toFixed(1));
  // minimap
  drawMini();
  // dust
  const isStorm = bi.id==='storm';
  // Bão bụi 3 lớp (Task 2.6). Thay khối cũ: khối cũ vừa ghi vị trí hạt theo
  // TOẠ ĐỘ TUYỆT ĐỐI vừa dịch cả Points theo playerPos → cộng hai lần, hạt bị
  // đẩy lệch gấp đôi. Nay hạt nằm trong hộp CỤC BỘ quanh người chơi.
  // Task 2.5: chọn LOD chunk mỗi 6 khung (khoảng cách đổi chậm).
  if(++_chunkTick % 6 === 0) updateChunkLOD();

  updateDust(dt, stormLevel, Math.min(1, speedKmh/55), atmoDust);
  updateDustOnCar(dt);          // Task 3.3: bụi bám trên sơn theo quãng đường

  // Phase 3: POI discovery — chạy khoảnh khắc cinematic (Task 3.6)
  if (cineT < 0 && cineCooldown > 0) cineCooldown -= dt;
  updateDiscoveryCine(dt);
  updateBurst(dt);
  if (cineT < 0 && !photoMode){
    const near = nearestPOI(playerPos.x, playerPos.z);
    if(near.poi && near.dist < 26 && !discovered.has(near.poi.id) && cineCooldown<=0){
      startDiscoveryCine(near.poi);
    }
  }
  maybeStorm(now);
  // Phase 3: audio + stars + journal
  if(audioEnabled) tickAudio(dt, speedKmh, bi.id);
  maybeShootingStar(now);
  updateJournalPhase3();

  // Động tác lái: cánh tay mèo bám ghi đông, xoay theo input.l-r thật
  updateRidingPose(now, dt, (input.l?1:0) - (input.r?1:0), speedKmh, input.boost);
// `now` PHẢI có trong chữ ký: bên trong dùng now cho nhịp rung cổ tay khi boost.
// Bản trước dùng `now` mà không nhận -> ReferenceError MỖI KHUNG khi bấm Shift,
// làm chết cả animation tay. Chỉ lộ ra khi probe bấm Shift; lái thường vẫn
// chạy bình thường nên dễ tưởng là không sao.
  updateCamera(dt);
  renderer.info.reset();   // đặt lại ở đầu khung, cộng dồn qua mọi pass
  // Post-FX: composer.render() tự lo tone mapping + chuyển không gian màu
  // qua OutputPass, nên không render thẳng nữa khi đang bật.
  if (postEnabled && composer) composer.render(dt);
  else renderer.render(scene, camera);
  if (gradePass) gradePass.uniforms.uTime.value = now * 0.001;
  // Task 3.3: nhiễu nhiệt + cánh nắng
  if (hazePass && hazePass.enabled) hazePass.uniforms.uTime.value = now * 0.001;
  updateSunScreen();
}

// ---------- Resize ----------
function onResize(){
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  resizePostFX();   // nếu quên, post-FX giữ kích thước cũ và méo khung hình
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
  if(loadP>=100){ clearInterval(loadIv); hideLoading(); applyTime(); setVehicle(vehicleType); attachBurst(); updateHint(); updateJournalPhase3(); drawMini(); drawBigMap(); renderJournalCards(); requestAnimationFrame(frame); }
}, 55);
loadText.textContent='Đang dựng đồng bằng Arcadia và đánh thức Mèo Vàng...';

// ════════════════════════════════════════════════════════════════════════════
// POST-FX — Phase 2 Task 2.4
//
// Ba thứ đắt nhất gộp vào MỘT shader pass để chỉ tốn một lượt toàn màn hình:
//   vignette + tương phản + bão hòa + split-tone + hạt phim
// Split-tone (vùng sáng ấm, vùng tối lạnh) là thứ cho cảm giác "cinematic"
// rẻ nhất — không cần mô hình PBR nào thêm.
//
// Bloom dùng NGƯỠNG SÁNG cao thay cho "selective bloom" 2 lượt: chỉ thứ thật
// sáng mới nở (beacon, đèn pha, mặt trời, đèn ghi công cụ). Rẻ hơn nhiều và
// đúng ý nghĩa — thứ tối không cần nở.
//
// Bật/tắt theo preset đồ họa: low không post gì, medium chỉ grade, high+ thêm
// FXAA và bloom. Không có post-FX thì render thẳng như cũ.
// ════════════════════════════════════════════════════════════════════════════
// FOCUS / TILT-SHIFT — chỉ bật ở PHOTO MODE (Task 3.5)
//
// KHÔNG phải DOF theo chiều sâu. DOF thật cần depth buffer; BokehPass của three.js
// render LẠI cảnh riêng để lấy depth, tức nhân đôi số draw call mỗi khung. Đổi lại
// lấy hiệu ứng mờ rất nhẹ ở chế độ chụp ảnh thì không đáng.
//
// Đây là tilt-shift: làm mờ dần từ ngoài vào, giữa khung hình sắc nét. Nhìn giống
// ảnh tilt-shift trên máy ảnh film, hợp với "chụp kỷ niệm" hơn là DOF nhân vật.
// Vẫn ghi "focus" trong UI để không gọi nhầm tên.
// ════════════════════════════════════════════════════════════════════════════
const FocusShader = {
  uniforms: { tDiffuse:{value:null}, uAmount:{value:0.0}, uFocus:{value:0.52}, uSoft:{value:0.42} },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAmount, uFocus, uSoft;
    varying vec2 vUv;
    void main(){
      if(uAmount < 0.002){ gl_FragColor = texture2D(tDiffuse, vUv); return; }
      // khoảng cách chuẩn hoá tới vùng tiêu cư
      float d = abs(vUv.y - uFocus) / max(uSoft, 0.001);
      float k = clamp(d*d*0.85, 0.0, 1.0) * uAmount;
      if(k < 0.004){ gl_FragColor = texture2D(tDiffuse, vUv); return; }
      // 9 mẫu theo hình thoi: 4 góc + 4 cạnh + 1 giữa
      vec2 px = vec2(k) * 0.0055;
      vec3 c = texture2D(tDiffuse, vUv).rgb * 0.20;
      c += texture2D(tDiffuse, vUv + vec2( px.x, 0.0)).rgb * 0.10;
      c += texture2D(tDiffuse, vUv + vec2(-px.x, 0.0)).rgb * 0.10;
      c += texture2D(tDiffuse, vUv + vec2(0.0,  px.y)).rgb * 0.10;
      c += texture2D(tDiffuse, vUv + vec2(0.0, -px.y)).rgb * 0.10;
      c += texture2D(tDiffuse, vUv + vec2( px.x*0.7,  px.y*0.7)).rgb * 0.08;
      c += texture2D(tDiffuse, vUv + vec2(-px.x*0.7,  px.y*0.7)).rgb * 0.08;
      c += texture2D(tDiffuse, vUv + vec2( px.x*0.7, -px.y*0.7)).rgb * 0.07;
      c += texture2D(tDiffuse, vUv + vec2(-px.x*0.7, -px.y*0.7)).rgb * 0.07;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

const GradeShader = {
  uniforms: {
    tDiffuse:   { value: null },
    uVignette:  { value: 0.42 },   // độ sâu vignette
    uContrast:  { value: 1.09 },
    uSaturation:{ value: 1.12 },
    uWarm:      { value: 0.10 },   // tương phản vùng sáng (ngả vàng)
    uCool:      { value: 0.06 },   // tương phản vùng tối (ngả xanh)
    uGrain:     { value: 0.030 },
    uTime:      { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVignette, uContrast, uSaturation, uWarm, uCool, uGrain, uTime;
    varying vec2 vUv;
    // nhiễu 0..1 không cần hạt phim toán học: đủ để phá dải màu phẳng
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));   // độ sáng nhận thức

      // split-tone: giữ tối lạnh, sáng ấm — đọc ra chiều sâu
      c += uWarm * l * vec3( 1.00, 0.72, 0.34);
      c += uCool * (1.0 - l) * vec3(0.26, 0.52, 1.00);

      // tương phản quanh trung tính 0.5, không làm trôi điểm đen/trắng
      c = (c - 0.5) * uContrast + 0.5;
      // bão hòa quanh độ sáng gốc để vùng tối không bị chảy màu
      c = mix(vec3(l), c, uSaturation);

      // vignette mượt, tính theo bán kính chuẩn hoá để không méo theo tỉ lệ khung
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.92);
      float vig = smoothstep(0.78, 0.22, length(d));
      c *= mix(1.0, vig, uVignette);

      // hạt phim: cộng trước rồi kẹp, đừng nhân (nhân làm vùng tối bị đen hẳn)
      c += (hash(vUv * 1024.0 + uTime) - 0.5) * uGrain;

      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }
  `,
};


// ════════════════════════════════════════════════════════════════════════════
// NHIỄU NHIỆT + CÁNH NẮNG — Phase 3 Task 3.3
//
// Cả hai đều là pass toàn màn hình, nên chúng nằm trong composer sẵn có thay vì
// thêm mesh vào scene (mesh sẽ tốn draw call và không thuận khi camera xoay).
//
// NHIỄU NHIỆT: trên Sao Hỏa, khí gần mặt đất nóng nhất nên không khí phía trên
// rung. Hiệu ứng chỉ nên xuất hiện ở vùng THẤP khung hình (gần chân người chơi)
// và mạnh nhất khi trời nắng — ban đêm phải sạch tuyệt đối.
//
// CÁNH NẮNG: kỹ thuật volumetric scattering của Kenny Mitchell — lấy phần
// sáng của cảnh rồi làm nhòe từ hướng vị trí mặt trời trên màn hình, cộng dồn
// lại. Rẻ hơn nhiều so vì dựng thể tích thật, và đúng những gì cần cho cảnh.
//
// CẢ HAI đều cần một lượng uAmount/uStrength do updateAtmosphere() cấp dựa trên
// mốc giờ (Task 3.2) — chúng KHÔNG tự tính "nắng mạnh hay yếu".
// ════════════════════════════════════════════════════════════════════════════

const HeatHazeShader = {
  uniforms: {
    tDiffuse:{ value:null },
    uTime:   { value: 0 },
    uAmount: { value: 0 },      // 0 = sạch, ~1 = rung rõ
    uBand:   { value: 0.62 },    // trên vUv.y này là không rung (chỉ vùng sát đất)
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAmount, uBand;
    varying vec2 vUv;
    void main(){
      // Chỉ vùng sát đất rung. Mượt cả hai đầu để không thấy mép ngang.
      float band = 1.0 - smoothstep(uBand*0.28, uBand, vUv.y);
      if (band <= 0.001 || uAmount <= 0.001){
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      float t = uTime;
      // Hai tần số lệch pha: tần thấp cho cơn chớp, tần cao cho vi lăn vặn
      float n1 = sin(vUv.x*34.0 + t*1.6) * cos(vUv.y*21.0 - t*1.05);
      float n2 = sin(vUv.x*79.0 - t*2.4) * cos(vUv.y*57.0 + t*1.8);
      float n  = n1 + 0.45*n2;
      // Biên độ tăng dần về gần chân khung — chỗ "chân trời" ổn định nhất
      float amp = uAmount * band * band;
      vec2 off = vec2(n*0.0022, n*0.0013) * amp;
      // Lấy mẫu 2 lần, lệch nhẹ theo chiều dọc để dày không "đứng yên"
      vec3 c = texture2D(tDiffuse, vUv + off).rgb;
      c = mix(c, texture2D(tDiffuse, vUv + off*0.45).rgb, 0.5);
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

const GodRaysShader = {
  uniforms: {
    tDiffuse:  { value:null },
    uSunUV:    { value:null },   // vị trí mặt trời ở toạ độ màn hình, set mỗi khung
    uSunVis:   { value:0 },      // 0 = mặt trời sau lưng/ngoài khung -> tắt hẳn
    uStrength: { value:0 },
    uDensity:  { value:0.62 },
    uDecay:    { value:0.955 },
    uThreshold:{ value:0.72 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2  uSunUV;
    uniform float uSunVis, uStrength, uDensity, uDecay, uThreshold;
    varying vec2 vUv;
    const int RAY_SAMPLES = 20;
    void main(){
      vec3 scene = texture2D(tDiffuse, vUv).rgb;
      if (uSunVis <= 0.001 || uStrength <= 0.001){
        gl_FragColor = vec4(scene, 1.0);
        return;
      }
      // Bước lùi từ điểm ảnh về phía mặt trời: đoạn thẳng mỗi điểm tạo một vệt
      vec2 delta = (vUv - uSunUV) * (uDensity / float(RAY_SAMPLES));
      vec2 coord = vUv;
      float illum = 1.0;
      vec3 rays  = vec3(0.0);
      for (int i = 0; i < RAY_SAMPLES; i++){
        coord -= delta;
        vec2 s = clamp(coord, vec2(0.0), vec2(1.0));
        vec3 c = texture2D(tDiffuse, s).rgb;
        // CHỈ lấy phần sáng. Lấy cả vùng tối thì cả khung hình bị nhoè mờ.
        float l = max(0.0, dot(c, vec3(0.2126,0.7152,0.0722)) - uThreshold);
        c *= smoothstep(0.0, 0.42, l);
        rays += c * illum * illum;
        illum *= uDecay;
      }
      rays *= uStrength / float(RAY_SAMPLES);
      gl_FragColor = vec4(scene + rays, 1.0);
    }
  `,
};

function initPostFX(){
  if (composer) return;
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.62, 0.86);
  composer.addPass(bloomPass);
  fxaaPass = new ShaderPass(FXAAShader);
  composer.addPass(fxaaPass);
  gradePass = new ShaderPass(GradeShader);
  focusPass = new ShaderPass(FocusShader);
  focusPass.enabled = false;   // chỉ bật ở photo mode
  composer.addPass(gradePass);
  // Task 3.3. Thứ tự: grade -> haze -> rays -> output. Haze và rays cộng vào
  // ảnh ĐÃ tone-map, nên đặt sau grade để chúng không bị grade nén lại.
  hazePass = new ShaderPass(HeatHazeShader);
  composer.addPass(hazePass);
  raysPass = new ShaderPass(GodRaysShader);
  raysPass.uniforms.uSunUV.value = new THREE.Vector2(0.5, 0.5);
  composer.addPass(raysPass);
  composer.addPass(focusPass);
  composer.addPass(new OutputPass());
}

/** Bật/tắt từng pass theo preset. low -> không post gì, render thẳng. */
// ── Task 3.3: cấp cường độ cho haze + rays, và vị trí mặt trời trên màn hình ──
// Cảnh Sao Hỏa: bụi khí quyển mỏng nhưng ĐẶC. Cánh nắng rõ nhất khi mặt trời
// thấp (bình minh / hoàng hôn) — đúng lúc người chơi hay dừng lại ngắm cảnh.
// Đêm phải tắt hẳn, nếu không vệt sáng sẽ hiện trên nền tối và trông như lỗi.
const RAYS_BY_TIME = { 'Đêm':0.00, 'Bình minh':1.00, 'Trưa':0.45, 'Hoàng hôn':1.00 };
const HAZE_BY_TIME = { 'Đêm':0.00, 'Bình minh':0.55, 'Trưa':0.85, 'Hoàng hôn':0.70 };
const _sunNDC = new THREE.Vector3();
let _sunScreen = { x:0, y:0, z:0, vis:0 };   // chỉ để probe đọc

/** Vị trí mặt trời trên màn hình (0..1) + mức nhìn thấy. Gọi mỗi khung. */
function updateSunScreen(){
  if (!raysPass || !raysPass.enabled) return;
  _sunNDC.copy(sun.position).project(camera);
  // z > 1 = nằm sau mặt phẳng camera; w<=0 là phía sau lưng
  const behind = _sunNDC.z > 1;
  const uv = raysPass.uniforms.uSunUV.value;
  uv.set(_sunNDC.x*0.5 + 0.5, _sunNDC.y*0.5 + 0.5);
  // Mặt trời lọt ra ngoài khung vẫn để vệt chạy vào từ mép — chỉ tắt khi
  // thực sự ở sau lưng, vì tắt sớm sẽ làm vệt bật/tắt khi xoay camera.
  // Mặt trời lọt ra ngoài khung VẪN để vệt chạy vào từ mép — chỉ tắt khi thực sự
  // ở sau lưng. Tắt sớm làm vệt bật/tắt chớp nhoè mỗi lần xoay camera.
  const inFront = !behind;
  const dist = Math.hypot(uv.x - 0.5, uv.y - 0.5);
  raysPass.uniforms.uSunVis.value = (inFront && dist < 1.7) ? 1 : 0;
  raysPass.uniforms.uSunUV.value.set(uv.x, uv.y);
  _sunScreen = { x:+uv.x.toFixed(3), y:+uv.y.toFixed(3), z:+_sunNDC.z.toFixed(2), vis:raysPass.uniforms.uSunVis.value };
}

function applyPostFX(gfxName){
  const level = { low:0, medium:1, high:2, cinematic:3 }[gfxName] ?? 1;
  postEnabled = level > 0;
  if (!postEnabled){ return false; }
  initPostFX();
  gradePass.enabled = true;
  gradePass.uniforms.uGrain.value = level >= 3 ? 0.038 : 0.026;
  gradePass.uniforms.uVignette.value = level >= 3 ? 0.50 : 0.40;
  fxaaPass.enabled = level >= 2;
  bloomPass.enabled  = level >= 2;
  bloomPass.strength = level >= 3 ? 0.72 : 0.48;
  if (fxaaPass.enabled){
    const pr = renderer.getPixelRatio();
    fxaaPass.material.uniforms.resolution.value.set(1/(innerWidth*pr), 1/(innerHeight*pr));
  }
  // Task 3.3: nhiễu nhiệt từ `high` trở lên; cánh nắng chỉ ở `cinematic` vì
  // 20 vòng lấy mẫu mỗi pixel là pass đắt nhất trong chuỗi.
  hazePass.enabled = level >= 2;
  raysPass.enabled = level >= 3;
  // KHÔNG cấp giá trị uAmount/uStrength ở đây: applyPostFX chỉ chạy khi ĐỔI PRESET,
  // còn giờ trong ngày thì đổi liên tục — cấp ở đây nghĩa là 4 mốc giờ dùng chung
  // một cường độ. Giá trị do updateAtmosphere() cấp mỗi khung (dòng dưới).
  return true;
}

function resizePostFX(){
  if (!composer) return;
  composer.setSize(innerWidth, innerHeight);
  const pr = renderer.getPixelRatio();
  if (fxaaPass && fxaaPass.enabled)
    fxaaPass.material.uniforms.resolution.value.set(1/(innerWidth*pr), 1/(innerHeight*pr));
}

// ═══ Gán layer ánh sáng cho cascade 2 lớp (Task 2.3) ═══
// Gọi MỘT LẦN sau khi mọi vật thể đã được dựng và thêm vào scene.
//  · Phong cảnh (đất, đá, hố, silt, landmark, núi xa) → layer 2, bóng từ sunFar
//  · Xe + Mèo Vàng → layer 1, bóng sắc từ sun
// Vật thể nào CHƯA gán thì rơi về layer 0 = không nguồn nào chiếu → thành mảng tối.
markFar(scene);
player.traverse(o=>{ o.layers.enable(1); });
// Dust / sao / sky không cần ánh sáng nên giữ layer 0.

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
// Trạng thái HUD: gọn (đang lái) / đầy (đứng yên)
let hudDriveOn = false, hudIdleT = 99;
const HUD_HIDE_SEL = ['#hud-hint', '#hud-tools', '#vehicle-switch', '#hud-perf-pill'];
// Người chơi bấm F = đang CHỦ ĐỘNG muốn nhìn số đo. Khi đó quy tắc "HUD gọn
// khi lái" không được giấu ô đo đi — mà lúc đang lái mới là lúc cần nhìn FPS
// nhất. Trước đây #hud-perf-pill nằm trong danh sách ẩn vô điều kiện, nên bấm F
// xong đi vài bước là ô biến mất; đã tách: chỉ ẩn khi perfUserOn = false.
let perfUserOn = false;
function applyHudDriveMode(on){
  for (const sel of HUD_HIDE_SEL){
    if (perfUserOn && sel === '#hud-perf-pill') continue;
    const el = document.querySelector(sel);
    if (el) el.classList.toggle('hud-drive-hidden', on);
  }
  document.getElementById('hud')?.classList.toggle('hud-compact', on);
}
let perfAcc = 0, perfFrames = 0, perfFps = 0, perfLow = 0, perfAutoOff = false;
function updatePerfHud(dt){
  if (!perfEl) return;
  perfAcc += dt; perfFrames++;
  if (perfAcc < 0.5) return;
  perfFps = Math.round(perfFrames / perfAcc);
  perfAcc = 0; perfFrames = 0;
  const i = renderer.info.render;
  // Chốt an toàn: không đo được hiệu năng thật của thiết bị người chơi, nên nếu
  // FPS trụt dưới ngưỡng 3 lần liên tiếp thì tự tắt post-FX thay vì để máy
  // khó chơi. Người chơi có thể bật lại tay ở dropdown đồ họa.
  perfLow = perfFps < 45 ? perfLow+1 : 0;
  if (postEnabled && perfLow >= 3){
    postEnabled = false;
    perfAutoOff = true;
    console.warn('[perf] tự tắt post-FX: FPS thấp (' + perfFps + ')');
  }
  perfEl.textContent = perfFps + ' FPS · ' + i.calls + ' draw · ' +
                        Math.round(i.triangles/1000) + 'k tri · ' + gfxName +
                        (perfAutoOff && !postEnabled ? ' · post tắt(tự động)' : '');
}

// expose for debug
window.__yc={ THREE, scene, player, camera, renderer, BIOMES, POIS, heightAt, sampleHeight, slopeAt, discovered, VEHICLES, setPlayerPos(x,z){ playerPos.x=x; playerPos.z=z; playerPos.y=sampleHeight(x,z)+VEHICLES[vehicleType].ride; settleToGround(); player.position.copy(playerPos); player.rotation.set(targetPitch, -playerYaw, targetRoll, 'YXZ'); player.updateMatrixWorld(true); },
  setVehicle(t){ setVehicle(t); },
  // KHÔNG thêm renderer/scene/camera ở đây: window.__yc={...} dạng gọn ở cuối
  // file đã khai báo chúng là OBJECT, và gán sau sẽ đè lên hàm → probes cũ
  // đọc __yc.renderer.info là undefined. Chỉ thêm tên chưa có.
  composer:()=>composer, postFXOn:()=>postEnabled, HF:()=>HF,
  sunScreen:()=>_sunScreen,
  camMode:()=>camMode, focusOn:()=>!!(focusPass&&focusPass.enabled),
  discoveredCount:()=>discovered.size,
  closeDiscovery:(m)=>closeDiscovery(m),
  cineInfo:()=>({ t:+cineT.toFixed(2), focus:+cineFocus.toFixed(3),
    target: cineTarget? cineTarget.id : null, cooldown:+cineCooldown.toFixed(1),
    burst: !!cineBurst, burstVisible: !!(cineBurst&&cineBurst.p.visible),
    burstLife: cineBurst? +cineBurst.life.toFixed(3):0,
    phase: document.getElementById('overlay-discovery').dataset.phase || '' }),
  startCine:(id)=>{ const p = POIS.find(q=>q.id===id); if(p) startDiscoveryCine(p); return !!p; }, camFovNow:()=>_fovNow, camDist:()=>camDist, speedKmh:()=>speedKmh,
  camChaseTau:()=>CAM_CHASE_TAU, chaseK:()=>_lastChaseK, lastDt:()=>_lastDt,
  camInfo:()=>({ fov:+camera.fov.toFixed(2), baseFov:CAM_BASE_FOV,
    yawLag:+_camYawLag.toFixed(4), yawErr:+((playerYaw-_camYawLag)*180/Math.PI).toFixed(2),
    shake:+camShake.toFixed(4), bump:+_bumpForCam.toFixed(3),
    camY:+camera.position.y.toFixed(3) }),
  animInfo:()=>({ state:animState, age:animStateSince, bump:_bumpMag,
    P:Object.fromEntries(Object.entries(ANIM_P).map(([k,v])=>[k,+v.toFixed(4)])),
    turn:+animRoll.toFixed(3), terrainPitch:+targetPitch.toFixed(4), terrainRoll:+targetRoll.toFixed(4) }),
  animStates:()=>Object.keys(ANIM_STATES),
  animState:()=>animState,
  setDust(v){ dustLevel = THREE.MathUtils.clamp(v,0,1); return dustLevel; },
  dustInfo(){ const d=_dustMats[0];
    const num = v => (typeof v === 'number' && isFinite(v)) ? +v.toFixed(3) : null;
    return { level:num(dustLevel), mats:_dustMats.length, distance:num(distance),
      mauDau: d&&d.base?'#'+d.base.getHexString():null,
      mauNay: d&&d.mat&&d.mat.color?'#'+d.mat.color.getHexString():null,
      roughDau: d?num(d.baseR):null, roughNay: d&&d.mat?num(d.mat.roughness):null,
      kieu: d? (d.mat?d.mat.type:'no-mat') : 'no-target' }; },
  chunkInfo(){ const s=updateChunkLOD();
    return { chunks:terrainChunks.length, visible:s.vis, tris:s.tris,
             lodSegs:CHUNK_LOD_SEG.slice(), dists:CHUNK_LOD_DIST.slice(),
             perLod:terrainChunks.reduce((a,c)=>{ if(c.lod>=0){const s=CHUNK_LOD_SEG[c.lod]; a[s]=(a[s]||0)+1;} return a; },{}),
             meshCount:chunkGroup.children.length,
             y:terrainChunks.map(c=>c.x+','+c.z+','+c.lod).slice(0,8) }; },
  meoInfo(){ return { useGLB: meoUseGLB, loaded: !!meoGLTF, err: meoLoadErr,
    nodes: meoGLTF ? meoGLTF.children.map(c=>c.name) : null }; },
  setMeoSource(u){ applyMeoSource(u); return { useGLB: meoUseGLB }; },
  // Danh sách landmark cho probe: kind, vị trí, chiều cao beacon, số mesh con.
  landmarkInfo(){ return landmarks.map(l=>({ kind:l.userData.kind, x:Math.round(l.userData.x),
    z:Math.round(l.userData.z), topY:+l.userData.topY.toFixed(1), meshes:l.children.length })); },
  setCam(m){ camMode=m; },
  // Đặt góc orbit để probe chụp cận cảnh / góc thấp một cách tất định.
  setOrbit(pitch, dist, yaw){ camMode=2; camPitch=pitch; camDist=dist; if(yaw!==undefined) camYaw=yaw; return {camMode, camPitch, camDist, camYaw}; },
  terrainMat(){ const t=terrain; return t ? { hasMap:!!t.material.map, hasNormal:!!t.material.normalMap,
                 hasRoughMap:!!t.material.roughnessMap, roughness:t.material.roughness,
                 nScale:[t.material.normalScale.x, t.material.normalScale.y] } : null; },
  /**
   * Ngân sách GPU (Task 3.7). renderer.info KHÔNG cho biết texture nặng bao
   * nhiêu byte — nó chỉ đếm SỐ texture. Ở đây duyệt scene, gom texture theo
   * uuid và tính đúng byte/kênh.
   *
   *   bytes = w·h·(mip ? 4/3 : 1)·channels,  channels = 4 (RGBA8) hoặc 8 (HalfFloat)
   *
   * Hệ số 4/3 là chuỗi mip đầy đủ: 1 + 1/4 + 1/16 + … = 4/3.
   * Đây là con số xấp xỉ — GPU còn phải nhân bản sang layout khác, padding,
   * và texture chưa tải xong vẫn được tính. Nhưng đủ để bắt được "thêm một
   * texture 2K mà không ai nhớ" — thứ mà renderer.info nhìn thấy là "số texture
   * tăng từ 40 lên 41".
   */
  gpuBudget(){
    const seen = new Map();
    const bump = (t)=>{
      if (!t || seen.has(t.uuid)) return;
      const img = t.image;
      const w = img?.width  || 0, h = img?.height || 0;
      if (!w || !h){ seen.set(t.uuid, { w:0, h:0, bytes:0, name:t.name||'' }); return; }
      // RGBA = 4 byte/kênh; HalfFloat = 2 byte/kênh -> gấp đôi
      const half = (t.type === THREE.HalfFloatType);
      const mip  = t.generateMipmaps !== false;
      const bytes = w*h*(half?8:4)*(mip?4/3:1);
      seen.set(t.uuid, { w, h, bytes, half, name:t.name||'' });
    };
    scene.traverse(o=>{
      const mats = o.material ? (Array.isArray(o.material)?o.material:[o.material]) : [];
      for (const m of mats){
        for (const k in m){ const v = m[k]; if (v && v.isTexture) bump(v); }
        // bản đồ phụ trong shader (aoMap/normalMap đã nằm trong m, nhưng
        // lightMap/shadow dùng tên riêng)
        for (const k of ['lightMap','envMap','aoMap','bumpMap','displacementMap','specularMap']){
          if (m[k] && m[k].isTexture) bump(m[k]);
        }
      }
    });
    let bytes = 0, n2k = 0, n4k = 0, n1k = 0, biggest = null, bigBytes = 0;
    for (const t of seen.values()){
      bytes += t.bytes;
      if (t.w >= 2048) n2k++; else if (t.w >= 1024) n1k++;
      if (t.bytes > bigBytes){ bigBytes = t.bytes; biggest = t; }
    }
    // instanced: draw call = 1 cho cả lũ, tam giác thì nhân với count
    let instanced = 0, instTri = 0;
    scene.traverse(o=>{ if (o.isInstancedMesh && o.visible){
      instanced += o.count;
      const g = o.geometry; const n = g?.index ? g.index.count : (g?.attributes.position?.count||0);
      instTri += (n/3) * o.count;
    }});
    return {
      textures: seen.size,
      textureMB: +(bytes/1048576).toFixed(2),
      n1024: n1k, n2048: n2k,
      biggest: biggest ? `${biggest.name||'(không tên)'} ${biggest.w}×${biggest.h}` : null,
      biggestMB: +(bigBytes/1048576).toFixed(2),
      geometries: renderer.info.memory.geometries,
      instancedCount: instanced,
      instancedTriangles: Math.round(instTri),
    };
  },
  rendererInfo(){ const i=renderer.info; return { textures:i.memory.textures, geometries:i.memory.geometries,
                 calls:i.render.calls, triangles:i.render.triangles, programs:i.programs?.length ?? null }; },
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
  setPostEnabled(on){ postEnabled=!!on; if(postEnabled) initPostFX(); return postEnabled; },
  setPass(n,on){ const m={grade:gradePass,bloom:bloomPass,fxaa:fxaaPass,render:renderPass}[n]; if(m) m.enabled=!!on; return !!m; },
  postState(){ return { enabled:postEnabled, hasComposer:!!composer, bloom:!!(bloomPass&&bloomPass.enabled), fxaa:!!(fxaaPass&&fxaaPass.enabled), grade:!!(gradePass&&gradePass.enabled) }; }, get gfxName(){ return gfxName; }, get hf(){ return HF; }, setTime(t){ timeOfDay=t; applyTime(); return timeOfDay; }, get timeOfDay(){ return timeOfDay; }, forceStorm(){ stormTarget=0.9; stormEndsAt=performance.now()+30000; stormBanner.style.display='flex'; }, galleryList, refreshGalleryCache, openDiscovery, saveState(){ save(); return { distance, collected, discovered:[...discovered], playTimeSec }; } };
