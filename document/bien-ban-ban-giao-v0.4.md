# 📦 Biên Bản Bàn Giao — Yellow Cat Loves Mars v0.4 (Giai đoạn 4 — Đánh bóng & Ra mắt)

> Ngày: 2026-09-25 · Trạng thái: **SMOKE TEST PASS 0 lỗi (exit 0)** · GitHub Pages: **tạm hoãn theo yêu cầu**

## 1. Địa hình từ dữ liệu MOLA THẬT (nâng cấp trung tâm)

- Nguồn: **NASA/JPL/GSFC PIA02031** (MOLA topography, public domain) qua Wikimedia Commons — file `assets/textures/_src_pia02031.jpg`.
- Quy trình hiệu chỉnh (tất cả đo bằng code, lưu `document/mola-validation.json`):
  1. Quét content bounding box bằng độ bão hòa hue → bbox chuẩn 2180×1244.
  2. Phép chiếu Mercator ±70°, kinh 0E ở tâm — **kiểm chứng**: Hellas(−45°,70°E) = 99% pixel xanh dương đậm; Syrtis(8°,70°E)= cam; Tharsis(0°,247°E)= dải đỏ.
  3. Ramp hue→mét **fit từ độ cao công bố** của 12 địa danh (Hellas −7200, Isidis −4300, Argyre −3400, Syrtis +1500, Elysium +3000, Tharsis +6500…).
  4. Trích 5 cửa sổ 56×56 (0.25°/ô) cho 5 vùng → `biome-patches.png` (9.4KB) nhúng base64 vào `app/mola-patches.js` (static, 0 request ngoài).
- Trong game: `heightAt()` = base procedural **+ blended MOLA patch** (trọng số theo khoảng cách đa vùng, smooth 3×3) + noise; relief 38–135m theo vùng.
- **Hold-out validation** (địa danh KHÔNG dùng để fit): Amazonis 1668m, Solis 7513m, Arabia −2395m, Noachis −2142m — đúng tinh thần tương quan (bản đồ relative-elevation nên sai số tuyệt đối ±2km là chấp nhận được; **hình dạng thật** là thứ đưa vào game).
- Probe runtime: `heightAt(-380,420)=213m` (sườn Olympus), trench Valles 89m, ngoài cửa sổ về đúng procedural cũ.

## 2. Texture bề mặt
Canvas 256² procedural: hạt cát (RGB jitter) + 26 gợn gió sine + 130 đá vụn → `MeshStandardMaterial.map` repeat 90×90, nhân vertex color. Không asset ngoài.

## 3. Mèo & xe chi tiết hơn (không cần glTF)
- Đạp: khung kim cương 6 thanh, 2 bánh **nan hoa** quay, bàn đạp quay theo tốc, giỏ + cá có vây.
- Moto: bình xăng capsule, càng trước nghiêng, pô crôm, chắn bùn cong, đèn pha.
- Rover: 6 bánh **rocker-bogie** (vành có vân chống trượt), bụng foil vàng, ăng-ten **dish xoay chậm**, **mast camera quét**, 2 đèn pha.
- Mèo: sọc lưng, vành mũ crôm, **đuôi ve vẩy theo tốc độ**, đầu gật gù, tai (bike có 2 chân đạp).
- Animation qua `vRefs` (refs trực tiếp) — bỏ traverse-per-frame của v0.2.

## 4. Code-split — landing tức thì
- `app/boot.js` (2.3KB, 0 dependency) = entry mới; `index.html` load nó.
- `main.js` (Three + world) = dynamic `import()` khi: click Start (gate chặn + replay click), hover/touch Start, hoặc `requestIdleCallback` ≤6s.
- **dist/**: `index-*.js` 3.18KB **gzip 1.58KB** + CSS 3.65KB ≈ **5.2KB gzip lần đầu** (trước: 139.7KB). World 154.3KB gzip tải nền.
- Error handling: fail → nút hiện “⚠️ Tải lại thử nhé”, reset promise để bấm lại được.

## 5. Bão bụi toàn cầu động
Sự kiện ngẫu nhiên mỗi 1.5–3.5 phút, 22–48s: `stormLevel` glide 0.012/frame → fog 0.0012→0.0087, sun dim+đỏ hóa, sky top/horizon shift, bụi +0.5 opacity, **banner HUD** + pill “Bão bụi: TOÀN CẦU/TRUNG BÌNH/NHẸ”, toast fact Opportunity 2018.
- Verify pixel: banner đỏ-cam chiếm 39.1% vùng đo (bão) vs 3.5% (không bão). Debug hook `window.__yc.forceStorm()`.

## 6. SEO/social
- og:type/title/description + twitter card; `og-image.png` 1200×630 = **screenshot render thật** (photo mode) + caption strip — không ảnh bịa.
- File nằm `public/og-image.png` → tự vào `dist/`.

## 7. Kiểm chứng cuối (vite preview + Playwright Edge headless, exit 0)
```
instant landing OK (loader ẩn tức thì — boot tĩnh)
lazy world chunk tách riêng (index 3.2KB vs main 556KB)  ✓
HUD/Phase3/Phase4 DOM đầy đủ, SW ✓, POI 12 ✓
drive 2.5s: 211m, 22 km/h ✓  discovery + persist ✓  gallery IDB 1 ✓
ERRORS (0)
```
Pixel stats 4 screenshot (arcadia/valles/olympus/storm): RGB trung bình đúng tông Mars, lumstd ~31 (không flat/black frame). Screenshots: `tests/v04-*.png`.

## 8. File thay đổi
MỚI: `app/boot.js`, `app/mola-patches.js`, `assets/textures/biome-patches.png`, `scripts/build-mola-height.py`, `document/mola-validation.json`, `public/og-image.png`, `tests/_probe_lazy.mjs`, `tests/_probe_mola.mjs`
SỬA: `app/main.js` 68.7→**83KB** (MOLA height, albedo, buildVehicle+refs, storm, boot gate, forceStorm debug), `index.html` (boot entry, OG, storm pill), `sw.js` v4 (+cache boot/mola), `README.md`, test.

## 9. Bug bắt được ở giai đoạn này
1. **`N is not defined`** trong `decodePatches()` (file sinh tự động) — ReferenceError runtime mà `node --check` không phát hiện; bắt nhờ probe lazy. Đã sửa + build lại.
2. `FileNotFoundError` khi spawn `npx.cmd` — Python 3.14 cần path .cmd tuyệt đối; dùng thẳng `node.exe + vite/bin/vite.js`.

## 10. Còn treo (theo yêu cầu)
- ❖ Deploy GitHub Pages (user giữ).
- Tùy chọn sau: ảnh gốc độ phân giải cao 0.125° (17MB) cho texture superscale, glTF khi cần chi tiết model, WebGPU renderer upgrade.
