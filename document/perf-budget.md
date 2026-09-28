# Ngân sách hiệu năng — Phase 3 Task 3.7

> Số trong bảng dưới là **đo thật**, không phải ước lượng.
> Nguồn: `tests/perf-budget.mjs`, chạy trên `dist` qua preview tĩnh.
> Đo lại bằng: `node tests/perf-budget.mjs` (tự ghi `tests/perf-budget-latest.json`).

## Cách đo

Bốn preset đồ họa × ba vị trí (spawn · Valles Marineris · đồng bằng trống),
đợi 1.8s cho khung hình ổn định rồi đọc `renderer.info`.

- **draw call** — `renderer.info.render.calls`. Đặt `info.autoReset = false` và
  `reset()` đầu mỗi khung, nên đây là tổng qua **mọi pass** của composer, kể cả
  bloom/haze/rays. Đây là con số đáng tin — cài đặt mặc định của three.js chỉ báo
  số của pass cuối.
- **tam giác** — `renderer.info.render.triangles`, cùng cách đo.
- **biến thể shader** — `renderer.info.programs.length`.
- **bộ nhớ texture** — `__yc.gpuBudget()` duyệt scene, gom texture theo `uuid`,
  tính `w·h·(mip ? 4/3 : 1)·kênh`. `renderer.info` **không** cho biết texture nặng
  bao nhiêu byte — nó chỉ đếm số lượng.

## Số đo thật

| preset | draw call | tam giác | shader | texture | bộ nhớ | geometry |
|---|---|---|---|---|---|---|
| `low` | 340 | 100 045 | 39 | 61 | 22.71 MB | 462 |
| `medium` | 346 | 97 797 | 40 | 61 | 22.71 MB | 493 |
| `high` | 361 | 97 812 | 41 | 61 | 22.71 MB | 494 |
| `cinematic` | **362** | 97 813 | **42** | 61 | 22.71 MB | 494 |

Vị trí tệ nhất trong cả bốn preset đều là **spawn**. Valles `~262`, đồng bằng trống `~240`.

Texture lớn nhất: `512×512` = 1.33 MB (bản đồ địa hình dựng thủ công). Không có
texture 2K nào — đó là chủ đích, xem `document/asset-pipeline.md`.

## Ngân sách (đặt trong code, CI kiểm)

| hạng mục | hiện tại | trần | dự phòng |
|---|---|---|---|
| draw call | 364 | **460** | +26% |
| tam giác | 100 045 | **135 000** | +35% |
| biến thể shader | 42 | **56** | +33% |
| số texture | 61 | **80** | +31% |
| bộ nhớ texture | 22.71 MB | **32 MB** | +41% |
| geometry | 498 | **560** | +12% |

Dự phòng cố tình rộng: ngân sách phải bắt được *"ai đó thêm 100 draw call mà
không ai nhớ"* chứ không phải *"nó tăng 5%"*. Một CI đỏ vì run-to-run variance
là một CI bị dính, và người ta sẽ tắt nó.

**Nhưng không rộng đến mức che được rò bộ nhớ.** Trần `geometries` đã hạ từ 620
xuống 560 sau khi phát hiện lý do (xem bên dưới) — một ngân sách rộng có thể
biến thành nơi trú ẩn của chính những thứ nó sinh ra để bắt.

## RÒ BỘ NHỚ ĐÃ TÌM RA VÀ SỬA — chỉ nhờ có ngân sách

Đo đường đi vòng khắp bản đồ cho thấy hai pha rất khác nhau:

| hành động | geometry trước | geometry sau |
|---|---|---|
| đi 13 chặng khắp bản đồ | 341 | 495 — **có kiểm soát, dừng lại** |
| đổi xe 6 lần | 495 | **1515** (+1021) |

Terrain chunk tự giải phóng đúng. **Xe thì không.** `buildVehicle()` gỡ group cũ
bằng `while(player.children.length) player.remove(...)` — nhưng `remove()` chỉ
gỡ khỏi scene, **không** giải phóng buffer GPU. Mỗi lần đổi xe vứt ~175
geometry đi vĩnh viễn. Người chơi đổi xe 20 lần là rò 3400 geometry.

Sửa bằng `disposeVehicle()` gọi trước khi dựng: dispose geometry, và dispose
**chỉ** các clone của `collectDustTargets` (đánh dấu `userData.__dustClone`).
Vật liệu gốc trong cache `autoMat` dùng chung với Mèo Vàng và đá landmark —
dispose nó là làm hỏng cả những thứ khác, nên tuyệt đối không đụng.

Đo lại: **đổi xe 15 lần chỉ +3 geometry**, và chơi vẫn bình thường sau khi
dispose.

Câu chuyện này chính là lý do Task 3.7 tồn tại. Không có ngân sách thì "đổi xe
rò 175 geometry mỗi lần" là loại lỗi **không bao giờ biểu hiện** — game chạy
mượt, không đỏ, không đụng, chỉ chậm dần sau mười phút chơi.

## Điểm yếu còn lại: XE ĂN MỘT NỬA DRAW CALL

Đo trực tiếp bằng cách ẩn xe rồi so sánh:

| | có xe | ẩn xe | xe tốn |
|---|---|---|---|
| `bike` | 353 | 178 | **175** |
| `rover` | 364 | 174 | **190** |

Cả thế giới (terrain chunk + đá + landmark + bụi) chỉ tốn **~175 draw call**.
Xe một mình tốn gần bằng thế. Nguyên nhân: mỗi bộ phận là một `Mesh` với
geometry riêng — `bike` có **174 mesh / 174 geometry**, `rover` **189 / 189**.
Không có `InstancedMesh`, không có `mergeGeometries`.

Hệ quả trực tiếp: đây là ngân sách dễ vỡ nhất trong toàn bộ Phase 3, và là
ứng viên hàng đầu cho Phase 4. Đường đi: gộp các bộ phận tĩnh theo vật liệu
(`mergeGeometries` cho khung gắn cứng, giữ riêng bánh/đèn/bàn tay), hoặc
`InstancedMesh` cho nhóm lặp như bộ lọc gió, then chắn, ốp khí.

## Thời gian khung hình

**Không kiểm bằng CI được, và đây là giới hạn thật của tự động hoá.**

CI chạy trên SwiftShader — bộ dựng phần mềm. Số đo ở đó (58–60 FPS) chỉ phản
ánh tốc độ bộ dựng phần mềm, **không liên quan gì** tới card đồ hoạ. Đặt ngưỡng
thời gian khung hình vào CI sẽ tạo cảm giác an toàn giả.

Số thật do **người chơi đo trên máy thật**:

| | |
|---|---|
| FPS ổn định | **144 FPS**, giữ ổn định trên 100 |
| Ghi nhận | có HUD FPS, bật/tắt bằng phím `F` |

Có cơ chế tự bảo vệ trong game: nếu FPS dưới 45 trong 3 khung liên tiếp thì tắt
post-FX (`low`/`medium` không bật, `high`/`cinematic` có). Người chơi vẫn có thể
bật lại từ dropdown.

## Ngân sách dành cho mobile

Chưa có ngân sách riêng và **chưa nên bịa ra**. Số liệu mobile thật chỉ có được
khi đo trên thiết bị thật; con số giả sẽ thành cam kết hứa hụt.

Trước mắt preset `low` là đường dự phánh duy nhất — không có post-FX, LOD ở mức
thấp nhất, không có bóng đổ xa. Khi có máy thật để đo, bổ sung cột này.

## Guard đỏ sai lý do cũng là một loại guard hỏng

Lần chạy CI đầu tiên: job `verify` đỏ, deploy bị skip — đúng như thiết kế. Nhưng
**không phải vì vượt ngân sách.**

Nguyên nhân: `perf-budget.mjs` tìm trình duyệt trong danh sách chỉ có đường dẫn
**Windows**, rồi `process.exit(1)` nếu không thấy. Runner Ubuntu không có đường
dẫn nào trong danh sách.

| | |
|---|---|
| kết quả mong muốn | đỏ vì vượt trần |
| kết quả thực tế | đỏ vì không tìm thấy trình duyệt |

Nguy hiểm không kém gì guard không bao giờ chạy: cả hai đều dạy người ta
"bỏ qua CI đi". Đã sửa — liệt kê cả đường dẫn Linux, và fallback về Chromium
có sẵn của Playwright, giống hệt `smoke-phase3.mjs`.

Bài học cho mọi việc tự động hoá: **một guard phải thử đỏ một cách có chủ đích
trước khi tin vào nó.** Ở đây việc đó tốn đúng một lần hạ trần tạm — và nó
bắt ra cả lỗi lần chạy đầu.

## Khi nào CI đỏ

`tests/perf-budget.mjs` trả về mã thoát khác 0 khi vượt bất kỳ trần nào. Job
`verify` trong `.github/workflows/deploy.yml` chạy nó, nên **PR vượt ngân sách sẽ
không được deploy**.

Trước khi tăng trần, hãy trả lời: ngân sách đang bảo vệ điều gì? Tăng trần để
cho một thay đổi hợp lý qua là tốt. Tăng trần để một thay đổi *không* ai nghĩ
tới là mất hết ý nghĩa của cả hệ thống.

---

# Ngân sách texture — Task 4.2

## Kết luận trước: KHÔNG dùng KTX2/Basis, và đây là lý do

Kế hoạch ghi *"nén texture hero 2K/4K → KTX2/Basis"*. Đo thật thì trong dự án
**không có texture 2K nào, cũng không có texture nào từ file**.

Đo bằng `tests/_probe_tex.mjs` trên scene thật:

| | số |
|---|---|
| tổng texture | 61 |
| tổng bộ nhớ | 22.71 MB |
| **nguồn: sinh lúc chạy từ `<canvas>`** | **61 / 61 (100%)** |
| từ file | **0** |
| kích thước có trong scene | `512² · 256² · 64²` |
| texture ≥ 1K | 0 |

KTX2/Basis nén **file** texture. Ở đây không có file nào để nén: pixel được
**tính lúc chạy** bởi mã procedural, vẽ vào `<canvas>`, rồi bọc bằng
`CanvasTexture`. Cơ chế nén file không có gì để nén.

Thêm `KTX2Loader` + Basis transcoder còn tệ hơn: thêm khoảng 500 KB wasm+js vào
bundle để giải mã… không có gì, đồng thời thêm một đường giải mã có thể hỏng và
một phụ thuộc phải bundle cục bộ cho PWA offline.

**Đây là kết luận hợp lệ dựa trên số đo, không phải bỏ sót.** Nếu sau này có
texture lấy từ file (ảnh chụp NASA, atlas thủ công…), hãy đo lại rồi mới quyết.

## Phần "mipmap" của Task 4.2: đã đúng sẵn, giờ được canh giữ

| | kết quả |
|---|---|
| texture sinh chuỗi mip | 61 / 61 |
| **texture thực sự DÙNG chuỗi mip** | **61 / 61** |
| bộ nhớ mip sinh ra mà không dùng | **0 MB** |
| `minFilter` | toàn bộ là `MipmapLinearFilter` |
| texture dùng chung cho nhiều mesh | 46 / 61 |

Bản đồ địa hình 512² (`map` / `normalMap` / `roughnessMap`) dùng chung cho
**192 mesh** (64 chunk × 3 LOD) — không nhân bản.

### Lỗi mà guard này bắt

Đặt `generateMipmaps = true` nhưng để `minFilter = LinearFilter`. Đây là một
trong những lỗi lãng phí **im lặng** đắt nhất:

- vẫn cấp phát ~4/3 bộ nhớ cho cả chuỗi mip
- rồi **không dùng tới** — mỗi pixel lấy từ tầng 0
- mặt đất **rung/rét ở xa** vì không lọc mip
- không có triệu chứng nào khác. FPS vẫn đẹp, không đỏ, không đụng.

`gpuBudget()` giờ đếm `mipWastedMB`; `perf-budget.mjs` đặt trần **= 0**, nên ai
đó thêm texture sai kiểu thì CI đỏ ngay.

**Đã chứng minh detector bắt được:** cố tình đặt `minFilter = LinearFilter` lên 3
texture 512² → báo đúng `4 MB / 3 chiếc` (trước đó là `0 MB / 0`).

## Trần texture

| hạng mục | hiện tại | trần |
|---|---|---|
| số texture | 61 | 80 |
| bộ nhớ texture | 22.71 MB | 32 MB |
| texture ≥ 1K | 0 | 0 |
| **mip bị lãng phí** | **0 MB** | **0 MB** |

Cột "texture ≥ 1K" bằng 0 là có chủ đích: hiện dùng bản đồ 512² cho địa hình vạt
rộng. Nâng lên 1K chỉ đáng khi đo thấy địa hình vạt bị rõ. Khi đó trần phải được
mở **cùng lúc** với ngân sách bộ nhớ — không mở trần rồi hy vọng vẫn ổn.
