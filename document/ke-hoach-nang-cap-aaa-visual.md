# AAA Visual Upgrade — Yellow Cat Loves Mars — Kế hoạch chi tiết

> **For Hermes:** Dùng skill `subagent-driven-development` để triển khai kế hoạch này theo từng task (kèm 2 vòng review: spec compliance → code quality). Mỗi Phase là một epic; mỗi Task 2–5 phút.

**Goal:** Nâng toàn bộ chất lượng đồ họa từ mức hiện tại ~2.5/10 (gần AAA) lên **stylized cinematic premium 7.5–8.5/10 trên WebGL**, giữ bản sắc "Mèo Vàng yêu Sao Hỏa" — không biến thành photorealistic nặng, nhưng mọi khung hình phải đọc được như sản phẩm hoàn thiện, không còn cảm giác prototype trống.

**Architecture:** Stylized cinematic Mars — hình học vẫn low-poly có cá tính, nhưng vật liệu/PBR + ánh sáng/khí quyển + mật độ landmark + camera/post-FX đạt chuẩn premium. Toàn bộ nâng cấp nằm trong stack hiện có (Three.js 0.160 + Vite, static-first, không backend) và phải giữ 60 FPS/1080p High, 30–45 FPS mobile. Thứ tự đầu tư theo review: silhouette & composition → hero assets → PBR/material → lighting/atmosphere → environment density → animation/feedback → post-processing → optimization.

**Tech Stack:** Three.js 0.160 (WebGLRenderer, PCFSoftShadowMap, ACESFilmicToneMapping, InstancedMesh, ShaderMaterial), Vite 5, Service Worker (đã sửa 3 lỗi precache/CORS), Playwright smoke.

---

## Bối cảnh đã xác minh (không đoán)

- **Nguồn review:** `document/yellow-cat-loves-mars-aaa-visual-review.md` — trải nghiệm live Pages 27/09/2026, đã chạy thật (spawn, chọn phương tiện, Arcadia, bão bụi, orbit, photo, map, journal, bundle).
- **Điểm số review:** Bản sắc 7/10, UI 6.5/10, Model/texture 3.5/10, Lighting/material/atmosphere 3.5/10, Environment density 2.5/10, Gần AAA 2.5/10. Nguyên nhân gốc: "mặt phẳng procedural trống với vài vật thể minh họa".
- **Hiện trạng code (đã đọc `app/main.js` 125KB/2266 dòng, `app/boot.js`, `styles/main.css`):**
  - Renderer: `antialias:true, powerPreference:'high-performance'`, `setPixelRatio(min(dpr,2))`, `PCFSoftShadowMap`, `ACESFilmicToneMapping exposure 1.05`.
  - Ánh sáng: 1 DirectionalLight (sun 2048×2048, bias -0.0005, frustum 600), 1 HemisphereLight. Chưa có cascade/contact shadow, chưa có rim/bounce tách lớp.
  - Sky: ShaderMaterial sphere 2000 (32×22) — gradient top/mid/horizon + sun glow `pow(...,64)*0.35`. Một màu, chưa có LUT/theo giờ/biome.
  - Fog: `FogExp2(0x2a140a, 0.0012)` duy nhất, đơn sắc.
  - Terrain: `MeshStandardMaterial { vertexColors, map:CanvasTexture(256×256 procedural), roughness 0.92 }` — thiếu macro variation / normal / AO / height.
  - Rocks: `InstancedMesh(Dodecahedron, StandardMaterial 0x6b3a22)` ×520 phân bố ngẫu nhiên 900 thử — không có đá lớn/crater/sediment kit theo biome.
  - Dust: Points 900 hạt `PointsMaterial size 1.8 opacity 0` — overlay đơn giản, không volumetric.
  - Cat: procedural (không GLTF), helmet/visor/basket đã có nhưng vật liệu còn phẳng.
  - Boot: lazy import `main.js` — landing HTML/CSS hiện tức thì.
  - Đã sửa: SW precache manifest (plugin `injectSwManifest`), top-level await, CORS+gzip+vary, bỏ es-module-shims/importmap.

- **Ràng buộc dự án (từ `document/ke-hoach-*.md` + commit history):**
  - Static-first, không backend; asset không tải NASA lúc chạy (MOLA nhúng local).
  - Ổ D: `write_file`/terminal có thể hỏng do Windows ASLR/bash fork 0xC0000142 — workflow ổn định là `execute_code` Python; gọi node/vite trực tiếp qua `node.exe + node_modules/vite/bin/vite.js`.
  - Không được tuyên bố hoàn tất nếu chưa build + probe trình duyệt + ảnh thực tế + ride probe + smoke test.
  - Không deploy GitHub Pages bừa (lần trước SW precache sai hash đã làm PWA chết thật).

- **Mục tiêu kỹ thuật WebGL từ review (giữ nguyên):** Desktop 60 FPS/1080p High, Mobile 30–45 FPS scale 0.7–0.9, frame <16.6ms desktop, texture KTX2/Basis mipmap 1K/2K (hero 4K), shadow 2048, instancing + culling + LOD.

---

## Định hướng mỹ thuật (khóa trước khi code)

**Stylized cinematic Mars** — quyết định này ảnh hưởng mọi Phase:

- Giữ low-poly silhouette có cá tính; nâng "premium" bằng texture/PBR + lighting, không bằng polygon vô hạn.
- Mèo = điểm đáng yêu, rover = "đồ chơi cao cấp", Sao Hỏa = sân khấu lớn có scale.
- Palette mở rộng: đỏ/cam chủ đạo + tím lạnh trong bóng + xanh xám đá + vàng sulfur + trắng băng + teal rất tiết chế cho tech.
- Mỗi landmark phải đọc được ở **silhouette trước**, texture sau.
- Photo mode là "bằng chứng hoàn thiện" — mọi nâng cấp phải đẹp hơn khi chụp.

---

## Cấu trúc kế hoạch

- **Phase 0 — Foundation & Art Bible** (khóa mỹ thuật + pipeline, không đồ họa mới)
- **Phase 1 — P0 "Không còn cảm giác prototype trống"** (1–2 tuần theo review)
- **Phase 2 — P1 "Stylized premium"** (3–6 tuần)
- **Phase 3 — P2 "Cinematic WebGL"** (6–12 tuần)
- **Phase 4 — Polish, Performance & Launch Readiness**

Mỗi Phase có Definition of Done + Task nhỏ (2–5 phút/task, TDD khi có logic).

---

## Phase 0 — Foundation & Art Bible (làm trước, không bỏ qua)

**Mục tiêu:** Khóa quyết định mỹ thuật và pipeline trước khi vẽ asset, tránh làm lại.

### Task 0.1 — Lập Art Bible 1 trang
**Files:** `document/art-bible.md` (tạo mới)
**Nội dung:** Scale tham chiếu (mèo/rover/đá/crater theo mét), palette 7 màu + mã hex, roughness range theo vật liệu (đá 0.85–0.95, sơn rover 0.25–0.45, kính 0.05–0.15, vải 0.9), lighting reference (sun angle, shadow softness, fog color theo biome), silhouette rules (landmark đọc được ở 200m).
**Verify:** File tồn tại + được review duyệt trước khi sang Phase 1.

### Task 0.2 — Chuẩn hóa pipeline asset
**Files:** `document/asset-pipeline.md`, `vite.config.js` (thêm xử lý GLTF/KTX2 nếu cần)
**Nội dung:** Quy ước thư mục `assets/models/`, `assets/textures/`, đặt tên, Draco/Meshopt, KTX2/Basis khi nào dùng, LOD naming, checklist import (scale, pivot, normal, AO).
**Verify:** `npm run build` vẫn xanh; `vite.config.js --check` pass.

### Task 0.3 — Baseline đo hiệu năng
**Files:** `tests/perf-baseline.mjs` (probe mới), `document/perf-baseline.json`
**Nội dung:** Ghi FPS, frame time, draw calls, triangles, texture memory, shader compile time trên preset hiện tại (dùng `renderer.info`, `performance.now()`). Làm mốc so sánh cho mọi Phase sau.
**Verify:** `node tests/perf-baseline.mjs` in ra JSON hợp lệ; lưu vào `document/perf-baseline.json`.

### Task 0.4 — Preset đồ họa + HUD debug
**Files:** `app/main.js` (thêm preset Low/Med/High/Cinematic), `index.html` (selector), `styles/main.css`
**Nội dung:** Preset điều khiển: renderScale, shadow map size, fog density, dust count, post-FX on/off, hiển thị FPS/draw calls/triangles.
**Verify:** Chuyển preset không crash; `window.__yc` expose preset hiện tại.

---

## Phase 1 — P0 "Không còn cảm giác prototype trống" (1–2 tuần)

**DoD:** Spawn nhìn thấy landmark lớn trong 2s; đi 30–60s gặp discovery mới; HUD gọn; đất không còn là mảng cam đồng nhất; không regression smoke/ride/offline.

### Task 1.1 — Landmark lớn tại spawn
**Files:** `app/main.js` (thêm landmark kit), `assets/models/` (1 GLTF hoặc procedural nâng cấp)
**Nội dung:** 1 landmark silhouette mạnh (ví dụ: mesa/cột đá/hang dung nham) đặt trong tầm nhìn từ spawn Arcadia. Có LOD, castShadow, beacon nhẹ.
**Verify:** Ảnh spawn (smoke screenshot) thấy landmark; `window.__yc` có landmark pos.

### Task 1.2 — Mật độ môi trường theo biome
**Files:** `app/main.js` (rock/crater/debris instancing)
**Nội dung:** Tăng từ 520 → phân bố có chủ đích theo biome: đá lớn (ít, silhouette), đá vừa, vụn, crater rim, sediment. Mỗi biome 8–12 prop loại, dùng InstancedMesh + seed deterministic.
**Verify:** Probe đếm instance theo biome; FPS vẫn ≥55 trên preview.

### Task 1.3 — Decal & AO giả lập
**Files:** `app/main.js` (thêm decal mesh/vertex AO), `styles/main.css` nếu cần
**Nội dung:** Vệt bánh xe (decal theo trail), bụi bám, crater decal, vertex AO bake cho terrain (darken khe/hốc).
**Verify:** Ảnh cận đất thấy variation; không thêm draw call quá 2.

### Task 1.4 — Làm lại material đất
**Files:** `app/main.js` (terrainMat), `assets/textures/` (albedo/normal/roughness nếu có)
**Nội dung:** Macro color variation (3–4 tone theo height/slope/biome), normal detail cận cảnh, roughness variation. Chuyển CanvasTexture 256 → 512 hoặc procedural multi-octave + normal map. Giữ `vertexColors` để blend biome.
**Verify:** So sánh ảnh before/after terrain ở 3 khoảng cách (xa/trung/gần).

### Task 1.5 — Giảm HUD khi lái
**Files:** `index.html`, `styles/main.css`, `app/main.js`
**Nội dung:** Khi đang lái: chỉ giữ tốc độ, tọa độ, mục tiêu, minimap tối giản; ẩn chip/nút thừa. Có toggle "HUD gọn/đầy".
**Verify:** Ảnh gameplay trước/sau HUD; không che nhân vật.

### Task 1.6 — Cân lại bầu trời để đất nổi
**Files:** `app/main.js` (skyMat uniforms, fog)
**Nội dung:** Giảm bão hòa horizon, thêm band tím lạnh ở zenith, tách fog theo biome (Arcadia ấm, polar lạnh). Sky gradient có LUT 1D đơn giản hoặc 3-stop mới.
**Verify:** Ảnh so sánh sky trước/sau; đất không chìm vào cam.

---

## Phase 2 — P1 "Stylized premium" (3–6 tuần)

**DoD:** Hero assets PBR hoàn chỉnh; shadow/contact shadow rõ; post-FX nhẹ có kiểm soát; draw distance tăng mà FPS giữ; bão bụi nhiều lớp.

### Task 2.1 — Hero asset: Mèo phi hành gia (PBR)
**Files:** `assets/models/cat.glb` (+ textures), `app/main.js` (thay procedural cat)
**Nội dung:** High-poly sculpt → bake normal/AO → PBR 2K (albedo/normal/roughness/AO), visor có clearcoat/transmission, cloth khăn có fabric normal, LOD0/LOD1, rig cơ bản (tail, tai, idle).
**Verify:** Ảnh cận mặt/visor/đuôi ở 3 preset; LOD switch không pop.

### Task 2.2 — Hero asset: Rover + Xe máy (PBR)
**Files:** `assets/models/rover.glb`, `assets/models/moto.glb`, `app/main.js`
**Nội dung:** Bevel/edge highlight, kính cabin (transmission), sơn kim loại, bụi bám, vết xước, decal số hiệu. Wheel rotation đúng tốc độ, suspension giả lập.
**Verify:** Ảnh rover/moto cận cảnh; wheel rotation khớp speedKmh.

### Task 2.3 — Shadow nâng cấp
**Files:** `app/main.js` (shadow map, contact shadow)
**Nội dung:** Shadow 2048 cho sun, bias tuning theo biome; contact shadow dưới bánh (decal tối theo khoảng cách đất). Cân nhắc cascade/region-aware nếu FPS cho phép.
**Verify:** Ảnh bóng rover trên đất gồ ghề; contact shadow hiện khi bánh gần đất.

### Task 2.4 — Post-processing nhẹ (có kiểm soát)
**Files:** `app/main.js` (EffectComposer hoặc pass thủ công), `vite.config.js` nếu cần import
**Nội dung:** RenderTarget → FXAA/TAA (chọn 1), SSAO nhẹ (chỉ near), bloom chọn lọc (visor/đèn/beacon), vignette, color grading (LUT 3D nhỏ hoặc curve), TAA jitter nếu thêm.
**Verify:** Ảnh before/after post-FX ở 2 cảnh (ngày/bão); FPS drop <4ms.

### Task 2.5 — Terrain chunk + LOD
**Files:** `app/main.js` (terrain chunking), `assets/textures/` nếu cần
**Nội dung:** Chia terrain thành chunk (streaming), LOD theo khoảng cách, deterministic seed, frustum culling. Tăng draw distance cảm nhận mà không tăng triangle khung hình.
**Verify:** `renderer.info.render.triangles` giảm ở xa; không pop chunk.

### Task 2.6 — Bão bụi nhiều lớp
**Files:** `app/main.js` (dust system)
**Nội dung:** 3 lớp: hạt gần (Points nhanh, sizeAttenuation), haze trung (shader quad depth fade), silhouette xa (fog color shift). Không dùng 1 overlay đồng nhất.
**Verify:** Video 10s bão: gần/trung/xa đọc khác nhau; FPS ổn.

### Task 2.7 — Landmark kit Valles Marineris
**Files:** `app/main.js`, `assets/models/` (canyon kit)
**Nội dung:** 1 landmark lớn (canyon wall), 3 vừa, 8–12 prop nhỏ cho Valles; silhouette đọc được từ xa.
**Verify:** Ảnh vista Valles; minimap có contour/landmark mới.

---

## Phase 3 — P2 "Cinematic WebGL" (6–12 tuần)

**DoD:** Sky/atmosphere theo giờ+thời tiết; volumetric-looking light; animation graph; discovery presentation cinematic; performance budget đạt.

### Task 3.1 — Chuẩn hóa art bible v2 + scale/palette lock  ✅ 27/09/2026 (`document/art-bible.md` §17)
**Files:** `document/art-bible.md` (cập nhật)
**Nội dung:** Khóa scale, palette, roughness range, lighting ref sau khi hero asset xong.

### Task 3.2 — Sky/Atmosphere system theo giờ & thời tiết  ✅ 27/09/2026 (4 mốc giờ, phím 1-4)
**Files:** `app/main.js` (sky/atmosphere), `assets/textures/` (LUT nếu cần)
**Nội dung:** Sun angle ảnh hưởng bóng/màu/fog; 3–4 preset thời gian (bình minh/trưa/hoàng hôn/đêm) + bão; sky LUT theo biome.

### Task 3.3 — Volumetric-looking lighting + heat haze + dust accumulation  ✅ 27/09/2026 (art-bible §18)
**Files:** `app/main.js` (shader, particle)
**Nội dung:** Sun shafts nhẹ (god rays fake bằng quad + depth), heat haze trên đất nóng, bụi bám trên rover theo quãng đường.

### Task 3.4 — Animation graph  ✅ 27/09/2026 (art-bible §19) (phương tiện + nhân vật)
**Files:** `app/main.js`, `assets/models/*.glb` (rig)
**Nội dung:** State: idle → accel → cruise → brake → turn lean → bump. Mèo look-at, tai/đuôi phản hồi tốc độ/địa hình.

### Task 3.5 — Camera state theo tốc độ/địa hình  ✅ 27/09/2026 (art-bible §20)
**Files:** `app/main.js` (updateCamera)
**Nội dung:** Framing theo tốc độ (FOV động khi boost), lag có kiểm soát, va chạm địa hình, rung nhẹ khi bánh chạm đất, DOF nhẹ ở photo mode.

### Task 3.6 — Discovery presentation cinematic  ✅ 27/09/2026 (art-bible §21)
**Files:** `app/main.js`, `assets/audio/` nếu cần
**Nội dung:** Đến landmark: âm thanh + particle burst + camera focus + journal card animation. Mỗi 30–60s có moment.

### Task 3.7 — Performance budget & profiling
**Files:** `tests/perf-budget.mjs`, `document/perf-budget.md`
**Nội dung:** Budget: draw calls, triangles, texture memory, shader variants, frame time laptop/mobile. Tự động fail CI nếu vượt.

---

## Phase 4 — Polish, Performance & Launch Readiness

### Task 4.1 — UI polish + photo mode nâng cấp
**Files:** `index.html`, `styles/main.css`, `app/main.js`
**Nội dung:** Photo mode: DOF, exposure, focal length, vignette, LUT, pose camera. Map: contour, landmark, route, vùng đã khám phá.

### Task 4.2 — KTX2/Basis + mipmap + texture budget
**Files:** `assets/textures/`, `vite.config.js`
**Nội dung:** Nén texture hero 2K/4K → KTX2/Basis, mipmap, kiểm tra memory.

### Task 4.3 — QA checklist + release
**Files:** `document/bien-ban-ban-giao-v*.md`
**Nội dung:** Checklist: build, smoke, ride probe, offline probe, screenshot trước/sau, perf budget, Pages deploy verify (precache/CORS đã từng vỡ).

---

## Hồ sơ sẽ thay đổi (tóm tắt)

- Tạo mới: `document/art-bible.md`, `document/asset-pipeline.md`, `document/perf-baseline.json`, `tests/perf-baseline.mjs`, `tests/perf-budget.mjs`, `assets/models/*.glb`, `assets/textures/*` (KTX2/Basis).
- Sửa chính: `app/main.js` (terrain, material, light, sky, fog, dust, hero assets, camera, post-FX, chunk LOD), `app/boot.js` (nếu thêm loader), `vite.config.js` (GLTF/KTX2), `index.html` + `styles/main.css` (HUD, preset, photo mode).
- Không chạm: `public/sw.js` (vừa sửa 3 lỗi precache/CORS, chỉ thêm asset mới vào precache manifest), `.github/workflows/deploy.yml` (đã xanh).

---

## Kiểm thử & xác minh (bắt buộc mỗi Phase)

```bash
# Build + kiểm cú pháp
npm run build
node --check app/main.js && node --check vite.config.js

# Smoke trên preview (giống CI)
npx serve dist -l 4173
TARGET=http://127.0.0.1:4173/ node tests/smoke-phase3.mjs  # expect: ERRORS 0

# Ride probe (chống xuyên đất — đã từng vỡ)
TARGET=http://127.0.0.1:4173/ node tests/_probe_ride.mjs   # expect: chìm nặng nhất 0.000m

# Offline probe (PWA — đã từng vỡ 3 lần)
TARGET=http://127.0.0.1:4173/ node tests/_probe_offline.mjs # expect: OFFLINE failed []

# Perf baseline (từ Phase 0)
node tests/perf-baseline.mjs

# Ảnh thực tế (không tuyên bố hoàn tất nếu thiếu)
# - Spawn vista, terrain cận/trung/xa, rover/mèo close-up, bão 3 lớp, HUD gọn, sky mới
```

---

## Rủi ro, đánh đổi & câu hỏi mở

| Rủi ro | Giảm thiểu |
|---|---|
| GLTF hero asset nặng → FPS tụt | LOD + Draco/Meshopt + KTX2, budget triangle/texture, đo `renderer.info` mỗi Phase |
| Post-FX làm mobile chết | Preset Low tắt post-FX; đo frame time <25–33ms mobile |
| Terrain chunk pop | Deterministic seed + morph LOD, test ở 3 khoảng cách |
| Scope creep (muốn làm hết cùng lúc) | Khóa Phase 0 art bible; mỗi Phase có DoD, không sang Phase sau nếu chưa đạt |
| Ổ D: write_file/terminal hỏng | Dùng `execute_code` Python cho mọi ghi file/build probe (đã ghi trong memory) |
| SW precache lại vỡ khi thêm asset | Plugin `injectSwManifest` đã tự liệt kê `dist/` — chỉ cần không ghi cứng đường dẫn source |

**Đánh đổi đã chọn:** Stylized cinematic thay vì photorealistic — rẻ hơn 10× asset/lighting nhưng vẫn đạt 7.5–8.5/10 cảm nhận; AAA photorealistic thực thụ cần WebGPU/Unreal/Unity native (review cũng khuyến nghị).

**Câu hỏi mở (quyết trước Phase 2.1):**
1. Mèo/rover dùng GLTF thuê ngoài hay procedural nâng cấp tiếp? (quyết sau khi xem art bible + budget)
2. Có tự host font để offline 100% không? (hiện `fonts.googleapis.com` còn sót — đã ghi trong README)
3. Mục tiêu mobile cụ thể: iPhone/Android nào là baseline?

---

## Thứ tự đầu tư nếu nguồn lực hạn chế (từ review)

1. Rover + mèo + camera (nhìn mọi lúc)
2. Địa hình + landmark (quyết định thế giới có thật không)
3. Ánh sáng + atmosphere (rẻ nhưng tác động toàn cảnh)
4. Đất/đá PBR + decal (cận cảnh)
5. Animation/feedback (từ "trượt" → "lái")
6. UI polish + photo mode (cảm giác hoàn thiện)

---

## Phụ lục — Trích review gốc (điểm nghẽn)

> "Điểm nghẽn lớn nhất không phải là 'thiếu một hiệu ứng', mà là cảnh đang được cảm nhận như một mặt phẳng procedural trống với vài vật thể minh họa. Cần nâng cấp composition, silhouette, vật liệu, landmark và ánh sáng theo hệ thống."

> Thứ tự đúng: Silhouette & composition → hero assets → PBR/material → lighting/atmosphere → environment density → animation/feedback → post-processing → optimization.

