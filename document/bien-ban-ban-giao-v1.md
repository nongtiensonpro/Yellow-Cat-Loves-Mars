# Bàn giao v1 — Yellow Cat Loves Mars

Ngày: 27/09/2026 · Phase 0 → 4 hoàn thành · commit `06f566e`

Một website tĩnh WebGL: Mèo Vàng đạp xe trên địa hình Sao Hỏa dựng từ dữ liệu
MOLA thật (NASA). Không backend. Chạy offline.

> *"Mèo Vàng đạp xe trên Sao Hỏa — một hành trình không cần tên lửa."*

---

## 1. Chạy dự án

```bash
npm ci
npm run dev            # http://localhost:5173
npm run build
npm run preview        # http://localhost:4173
```

**Trên Windows, `npx` hay hỏng** (`WinError 2` khi Node 3.14 tìm `npx.cmd`).
Gọi thẳng:

```bash
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173
```

Mọi script kiểm thử **có sẵn** `TARGET` mặc định là `http://127.0.0.1:4173/`, nên
chạy được không cần biến môi trường:

```bash
node tests/smoke-phase3.mjs
```

Chạy sai chỗ thì nó báo đúng nguyên nhân và thoát `2` (khác với lỗi dữ liệu):

```
✗ Không gọi được http://127.0.0.1:4173/ (fetch failed)
  Khởi động server trước:  node node_modules/vite/bin/vite.js preview ...
  Hoặc trỏ sang nơi khác:   TARGET=http://... node tests/<probe>.mjs
```

> Trước bản bàn giao này thiếu `TARGET` là chết với
> `url: expected string, got undefined` — thông báo không liên quan gì tới việc
> thật sự sai. Tài liệu bàn giao chỉ có giá trị nếu chính nó chạy được; đã vá
> 67 script và kiểm lại bằng cách chạy lại đúng các lệnh trong mục 2.

Cần Chromium/Edge có sẵn. Script tự dò đường dẫn trên cả Windows lẫn Linux và
fallback về Chromium của Playwright — **đừng viết lại phần này thành chỉ-Windows,
xem mục 4.1**.

---

## 2. Checklist bàn giao — chạy từng dòng, không bỏ dòng nào

> Quy tắc của dự án này: **không tuyên bố xong nếu chưa chạy đủ các dòng dưới.**

### 2.1 Build

```bash
npm run build
node --check app/main.js && node --check app/boot.js && node --check vite.config.js
```

- [ ] build exit 0
- [ ] `node --check` cả 3 file exit 0
- [ ] `dist/precache.json` tồn tại
- [ ] `dist/.nojekyll` tồn tại
- [ ] `dist/sw.js` chứa `BUILD_ID = '…'` đã thay, không còn `__BUILD_ID__`
- [ ] `grep -rlE 'unpkg\.com|jsdelivr|cdnjs\.' dist` → **không có kết quả**

### 2.2 Chạy thật (Three.js chỉ hỏng lúc chạy, `node --check` không thấy)

```bash
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 &
TARGET=http://127.0.0.1:4173/ node tests/smoke-phase3.mjs
```

- [ ] `ERRORS: 0`
- [ ] smoke kiểm tra cả PWA: precache đủ, IndexedDB journal, discovery

### 2.3 Probe bắt buộc

| lệnh | kỳ vọng |
|---|---|
| `node tests/_probe_ride.mjs` | `chìm nặng nhất = 0.000 m` — **âm = XUYÊN ĐẤT** |
| `node tests/_probe_offline.mjs` | `OFFLINE failed : []` |
| `node tests/perf-baseline.mjs` | ghi `perf-latest.json`, không đỏ |
| `node tests/perf-budget.mjs` | `NGÂN SÁCH ĐẠT`, exit 0 |

- [ ] ride `0.000 m`
- [ ] offline `failed=[]`
- [ ] ngân sách đạt
- [ ] `node tests/_probe_geo.mjs` → `KHÔNG rò` (đổi xe 15 lần phải chỉ +3 geometry)
- [ ] `node tests/_probe_mip.mjs` → `DETECTOR BẮT ĐƯỢC`
- [ ] `node tests/_probe_dof.mjs` → `ERRORS: 0`, `depthValid` có số
- [ ] `node tests/_probe_map.mjs` → route > 0, vùng khám phá > 0
- [ ] `node tests/_probe_cine.mjs` → cooldown trong 30–60 s

### 2.4 Ảnh — bắt buộc, không thay bằng số đo

> Số đo bắt được thứ **có số**. Ảnh bắt được thứ **sai mà vẫn chạy**.
> Nhiều lỗi nghiêm trọng nhất của dự án đều thuộc loại thứ hai.

```bash
node tests/_probe_dof.mjs     # t41-*.png   — 4 thiết lập máy ảnh
node tests/_probe_map.mjs     # t41c-*.png  — bản đồ: đồng mức/route/sương
node tests/_probe_cam.mjs     # t35-*.png   — camera
```

- [ ] `t41-noblur.png` sắc nét toàn cảnh
- [ ] `t41-f14-far.png` — **nền xa sắc, xe gần mờ** (đúng chiều DOF)
- [ ] `t41-void.png` — LUT khác rõ bằng mắt
- [ ] `t41c-map.png` — mép vùng đã khám phá **mềm**, không blocky
- [ ] không ảnh nào có popup/toast che

> Chụp WebGL phải dùng `page.screenshot()`. `drawImage(canvas)` ra ảnh **đen**
> vì không bật `preserveDrawingBuffer`.

### 2.5 CI

- [ ] job `Build + smoke test + ngân sách` → success
- [ ] job `Phát hành lên GitHub Pages` → success
- [ ] trang live mở được, không lỗi console

---

## 3. Bản đồ kiến trúc — ai giữ cái gì

> Nguyên tắc số 1 của dự án: **một runtime property chỉ có một chủ sở hữu.**
> Mọi lỗi "giá trị bị ghi đè" đều bắt nguồn từ đây.

| thứ | chủ sở hữu DUY NHẤT |
|---|---|
| `sun.intensity`, sky, fog, sao, haze, sun-shaft | `updateAtmosphere()` |
| bật/tắt pass hậu kỳ | `applyGraphicsPreset()` |
| **toàn bộ thiết lập photo** (EV, tiêu cự, khẩu, LUT, vignette) | `applyPhoto()` |
| FOV khi đang lái | `updateCameraFeel()` — **có `if (!photoMode)`** |
| vignette nền (ngoài photo mode) | `applyGraphicsPreset()` qua `gradeVignetteBase` |
| `footSeen` (vùng đã khám phá) | `revealFootprint()` |
| `route` | `pushRoute()` |
| `contourCache` | `buildContours()` |

Probe đọc `window.__yc`. Thêm accessor thứ hai cùng ghi vào `window.__yc` là
nguyên nhân kinh điển của `renderer.info` báo `undefined`.

---

## 4. Bẫy đã vấp — đừng vấp lại

Đây là phần giá trị nhất của tài liệu. Mọi mục dưới đây **đã xảy ra thật và đã
được sửa**; tên dòng/số đo là thật.

### 4.1 Guard đỏ sai lý do

`tests/perf-budget.mjs` ban đầu tìm trình duyệt trong danh sách **chỉ có đường
dẫn Windows**, rồi `process.exit(1)`. CI trên Ubuntu **đỏ** — tưởng vượt ngân
sách, thật ra là không tìm thấy trình duyệt.

Cách sửa: liệt kê cả đường dẫn Linux và fallback về Chromium của Playwright,
giống hệt `smoke-phase3.mjs`.

> **Bài học dùng được mọi lúc:** một guard phải **thử đỏ có chủ đích** trước khi
> tin vào nó. Ở đây việc đó tốn đúng một lần hạ trần tạm. Guard chưa từng chạy
> cũng nguy hiểm ngang guard đỏ nhầm — cả hai đều dạy người ta bỏ qua CI.

### 4.2 Đổi tên một nửa

Tôi đổi `FocusShader` → `PhotoShader` và `focusPass` → `photoPass` bằng hai lần
thay thế riêng. Một cách sót `FocusShader`, app **không boot** với
`FocusShader is not defined` + `Cannot access 'u0' before initialization`.

Nếu đổi tên hàng loạt, hãy dùng một lượt thay thế duy nhất rồi `grep` lại.

### 4.3 Bitmask 32-bit

Bản đồ có 35×35 = **1225 ô**. Tôi lưu bằng `footMask & (1<<bit)`. Toán tử `&`/`<<`
của JS chỉ **32 bit** → mọi ô từ bit 32 trở đi đọc sai ô, và `|=` còn làm hỏng ô
khác.

**Nguy hiểm vì nó không trông sai**: bản đồ vẫn có sương, vẫn 0 lỗi. Chỉ là vùng
tối đặt ở ngẫu nhiên. Đo mới lộ:

| | `pctDark` | `pctBright` |
|---|---|---|
| bitmask | 40% | 17% |
| `Uint8Array` | **85%** | **0%** |

### 4.4 Rò bộ nhớ khi đổi xe

`buildVehicle()` gỡ group cũ bằng `while(player.children.length) player.remove(...)`.
`remove()` **gỡ khỏi scene, không giải phóng buffer GPU**. Đổi xe 6 lần → geometry
tăng từ 495 lên **1515** (+1021), không bao giờ giảm.

Đã sửa bằng `disposeVehicle()`: chỉ dispose geometry và **clone** của
`collectDustTargets` (đánh dấu `userData.__dustClone`). **Không** đụng cache
`autoMat` — nó dùng chung với Mèo Vàng và đá landmark, dispose là hỏng cả.

Loại rò này **không bao giờ biểu hiện** cho tới khi chơi lâu: không đỏ, không
đụng, vẫn mượt, chỉ chậm dần sau mười phút.

### 4.5 Lỗi im lặng của texture

`generateMipmaps = true` nhưng `minFilter = LinearFilter`: vẫn cấp phát ~4/3 bộ
nhớ cho chuỗi mip rồi **không dùng**, đồng thời mặt đất rung ở xa. Không có triệu
chứng nào khác.

Bắt bằng `gpuBudget().mipWastedMB`, trần `= 0` trong `perf-budget.mjs`.

### 4.6 Phạm vi tên ở runtime — `node --check` không bắt

`updateRidingPose()` dùng `now` mà không nhận `now`. Bấm Shift → `ReferenceError`
**mỗi khung** (357 lần / 5 giây). Lái thường vẫn chạy nên rất dễ tưởng không sao.

Phải tìm bằng cách cô lập (bấm phím rồi đếm lỗi), không đọc code được.

### 4.7 `THREE.Color` luôn truthy

```js
if (m.emissive && m.emissiveIntensity > 0.5) return;   // SAI — luôn truthy
```

`emissiveIntensity` mặc định `1.0`, nên lọc hết vật liệu phát sáng. Số liệu: chỉ
`2/30` vật liệu được thu bụi thay vì 20–25. Phải kiểm tra **màu** phát sáng thật.

### 4.8 Bump detector phụ thuộc frame rate

So `dy` từng khung: phụ thuộc FPS, bắn liên tục khi đang cruise. So lệch với
đường xu hướng: sinh lag (`p90=3.9m`, max `13.5m`). Dùng **jerk** (`dy` trừ trung
bình động) → hợp lệ.

Bump là **xung phủ lên trạng thái nền**, không phải một state — nếu là state thì
địa hình gồ ghề sẽ phá `cruise` vĩnh viễn.

### 4.9 Camera: hai loại chết camera

**(1) Ratchet.** Chặn địa hình tính độ nâng từ `camera.position.y` — nhưng biến đó
*đã bị chính lệnh nâng khung trước sửa rồi*, nên mỗi khung lại nâng thêm. Camera
bò lên `+12m` so với xe rồi rơi xuống `-5m`.

**(2) Trễ trong trạng thái xác lập.** Camera người thứ ba tụt **25.9m** ở 6.2 m/s.
Bất kỳ phép nội suy sau một điểm đích *đang di chuyển* nào cũng tụt tỉ lệ với
tốc độ. Sửa đúng cách: cho đích **dẫn trước** `v·τ`, hai phép triệt tiêu nhau ở
xác lập nhưng lúc tăng/giảm tốc vẫn còn trễ. Kết quả `25.9m → 7.5m`.

### 4.10 Cổng điều kiện đặt sai chỗ

```js
if (mapOpen) { pushRoute(); revealFootprint(); }   // SAI
```

Bản đồ **đóng** suốt lúc lái → không bao giờ ghi được gì (`footCells` đứng 0).
Chi phí mỗi khung vốn gần bằng 0 vì hàm tự từ chối khi không có gì mới.

### 4.11 PWA — đã vỡ 3 lần

1. `precache` 7/8 mục: thiếu `index.html`. Sinh manifest **từ `dist`**, không
   phải từ danh sách viết tay.
2. Service worker `SyntaxError`: bỏ top-level `await`.
3. Offline module `net::ERR_FAILED`: phải trả CORS response đúng và loại
   `content-encoding`, `content-length`, `transfer-encoding`, `vary`.

**Không sửa `public/sw.js` trừ khi thêm asset mới vào precache manifest.**

### 4.12 Ảnh WebGL

- `page.screenshot()` — dùng cái này.
- `drawImage(canvas)` → **đen**, vì không bật `preserveDrawingBuffer`.
- Phải đóng popup discovery / toast / modal trước khi chụp, nếu không ảnh bị che.
- Đo trên render target HalfFloat bằng `readRenderTargetPixels()` cho số toàn 0 —
  **phương pháp đọc đó không đáng tin**. Cô lập pass rồi chụp ảnh.

### 4.13 Vật liệu có `autoMat()` dùng chung

`autoMat` cache dùng chung giữa xe, Mèo Vàng và landmark. Khi cần biến thể riêng
( ví dụ thu bụi) phải `clone()` — `clone()` vẫn **dùng chung shader program** nên
không tốn thêm biến thể shader. Nhưng phải đánh dấu clone để `disposeVehicle()`
biết cái nào được phép dispose.

### 4.14 Xe là nút thắt draw call

Đo bằng cách ẩn xe:

| | có xe | ẩn xe | xe tốn |
|---|---|---|---|
| `bike` | 353 | 178 | **175** |
| `rover` | 364 | 174 | **190** |

Cả thế giới chỉ tốn ~175 draw call; xe một mình tốn gần bằng thế — 174 mesh / 174
geometry, không có `InstancedMesh`, không có `mergeGeometries`. Đây là hướng tối ưu
rõ ràng nhất còn lại.

---

## 5. Debug API

```js
window.__yc = {
  rendererInfo(),   // draw call, tam giác, shader, texture
  gpuBudget(),      // + mipWastedMB, allRuntimeCanvas, sharedTextures
  mapInfo(),        // số mạch đồng mức, ô đã khám phá, độ dài route
  photoUniforms(),  // EV, tiêu cự, FOV, khẩu, khoảng nét, LUT
  depthValid(),     // đọc vài pixel bộ đệm chiều sâu
  setGfx(n), setVehicle(v), setPlayerPos(x,z), setTime(0..1),
  cineInfo(),       // trạng thái discovery cinematic
  animInfo(), camInfo(), chunkInfo(), landmarks(), env(),
  perf(),           // FPS, P95
};
```

---

## 6. Số liệu hiện tại

| | |
|---|---|
| máy thật (người chơi đo) | **144 FPS**, ổn định trên 100 · HUD bật/tắt bằng `F` |
| CI (SwiftShader, dựng phần mềm) | ~57–60 FPS — **không đại diện phần cứng** |
| draw call | 366 (trần 460) |
| tam giác | 100 485 (trần 135 000) |
| biến thể shader | 42 (trần 56) |
| texture | 61 chiếc · 22.71 MB · **100% sinh lúc chạy** · 0 từ file |
| geometry | 493 (trần 560) |
| ride clearance | 0.000 m |
| offline | `failed=[]` |

**Không có ngân sách mobile** — chưa đo trên thiết bị thật, và không nên bịa.

---

## 7. Việc chưa làm

- **KTX2/Basis** — đã kết luận **không cần**, có số đo kèm
  (`perf-budget.md` §Task 4.2). Nếu sau này có texture từ file thì đo lại.
- **Ngân sách mobile** — cần thiết bị thật.
- **Gộp draw call của xe** — hướng rõ nhất, xem mục 4.14.
- **Bản đồ dùng cho điều hướng tới POI** — hiện có nút "đi tới" nhưng chưa tìm
  đường.
- **Giọng nói / kể chuyện** — ngoài phạm vi.

---

## 8. Tài liệu khác

| file | nội dung |
|---|---|
| `document/ke-hoach-nang-cap-aaa-visual.md` | roadmap tổng, Phase 0–4 |
| `document/ke-hoach-phase-4.md` | kế hoạch chi tiết Phase 4 |
| `document/art-bible.md` | nguyên tắc mỹ thuật, §1–25 |
| `document/perf-budget.md` | ngân sách + cách đo + texture budget |
| `document/asset-pipeline.md` | quy trình dựng asset (GLB/Draco/Blender) |

---

## 9. Vệ sinh kho

- `tests/*.png` đã gitignore. Bộ đệm cục bộ hiện ~100 MB / 176 ảnh — xoá được
  thoải mái, chỉ mất ảnh so sánh.
- 71 file `_probe_*.mjs` là **probe lịch sử**, không phải bộ kiểm thử. Chỉ 3 test
  thật chạy trong CI: `smoke-phase3.mjs`, `perf-baseline.mjs`, `perf-budget.mjs`.
  Mỗi lần thêm tính năng nên thêm hoặc nâng một probe vào nhóm 2.3 ở mục 2.
- Không xoá `public/sw.js` hay sửa `.github/workflows/deploy.yml` nếu không có
  lý do rõ ràng — cả hai đã vỡ nhiều lần và đã ổn.
