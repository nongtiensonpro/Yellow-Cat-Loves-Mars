# Asset Pipeline — Yellow Cat Loves Mars

Quy ước chuẩn cho mọi asset đưa vào game. Đọc kèm `document/art-bible.md`.

## Cấu trúc thư mục

```
assets/
  models/         # GLTF/GLB — hero asset có rig
  textures/       # albedo, normal, roughness, ao, mask
  textures/_src/  # ảnh gốc (NASA, Wikimedia) + attribution
  audio/          # âm thanh
scripts/          # pipeline dựng asset (python)
```

## Nguyên tắc

1. **Không tải asset ngoài lúc chạy.** Mọi thứ phải nằm trong bundle/Pages. CI có bước
   chặn CDN — thêm CDN là CI đỏ.
2. **Tên file có hạ tầng phụ thuộc.** Tên file trong `dist/` có hash → **không bao giờ**
   ghi cứng đường dẫn asset vào code hay `sw.js`. Plugin `injectSwManifest` tự sinh
   `dist/precache.json` từ output thật.
3. **Dữ liệu NASA phải kèm attribution.** Giữ file gốc trong `textures/_src/` kèm
   nguồn (URL + tên sứ mệnh) trong `textures/ATTRIBUTION.md`.

## GLTF cho hero asset

- **Định dạng:** `.glb` (binary), Draco hoặc Meshopt nén.
- **Scale:** 1 unit = 1 mét. Pivot = giữa đáy (đặt được lên heightfield).
- **Tên node theo quy ước:** `body`, `head`, `tail1..tail5`, `wheel_FL/FR/RL/RR`,
  `armL/R`, `handL/R`, `visor`, `lamp_*`.
- **LOD:** `name_LOD0`, `name_LOD1`, `name_LOD2`. LOD0 dưới 20 m, LOD1 dưới 60 m,
  LOD2 xa hơn. Không dùng `THREE.LOD` nếu profile cho thấy overhead lớn hơn lợi ích.
- **Animation:** clip `idle`, `ride`, `turnL`, `turnR`, `boost`. Tên clip phải khớp
  hẳn với state machine trong `app/main.js`.

## Texture

| Loại | Kích thước | Ghi chú |
|---|---|---|
| Albedo | 2K (hero 4K) | sRGB, không nhúng normal vào alpha |
| Normal | 2K | OpenGL convention (+Y up) |
| Roughness | 1K | dùng kênh G nếu ORM packing |
| AO | 1K | nhân riêng, không bake vào albedo |
| ORM packing | 1 texture | R=AO, G=Roughness, B=Metal — giảm draw call |

- **Nén:** KTX2/Basis (`ktx` CLI). Mipmap **bắt buộc** — thiếu mipmap là nguyên nhân
  số 1 của hụt FPS khi camera quay.
- Anisotropy: `min(8, maxAnisotropy)`.

## Kiểm tra trước khi commit

```
npm run build
node --check app/main.js
node tests/smoke-phase3.mjs      # ERRORS 0
node tests/_probe_ride.mjs       # chìm nặng nhất 0.000m
node tests/_probe_offline.mjs    # OFFLINE failed []
node tests/perf-baseline.mjs     # không vượt budget trong art-bible.md
```

Không có ảnh chụp thật của asset mới thì coi như chưa xong.

## Kết quả thực đo — Mèo Vàng (Blender 5.2.2 LTS, 2026-09-27)

| Mục | Số đo |
|---|---|
| Mesh trước khi gộp | 77 |
| Mesh sau khi gộp theo nhóm cử động | **10** |
| Tam giác | 17 376 |
| GLB **có Draco** | **103 KB** |
| GLB **không Draco** | 852 KB |
| Bộ giải mã Draco (wasm + wrapper) | 336 KB, chép tự động vào `dist/draco/` |
| Bundle JS | 622 KB → 720 KB |
| Draw call (so với procedural) | 287 → **186** |

**Draco rõ ràng đáng dùng:** 495 KB (GLB + decoder) so với 852 KB không Draco.

### Node gộp theo phần cần cử động

`body` · `head` · `arms` · `legs` · `tail_1..5` · `tail_tip` — giữ pivot đúng xương
để Three.js cử động từng phần. 77 mesh rời = 77 draw call chỉ riêng con mèo;
gộp còn 10.

### ⚠️ Bẫy Blender đã dính (3 lỗi, cùng một hệ quả)

1. **Node rỗng KHÔNG tự làm mesh thành con.** Code tạo `head`/`helmet`/`armL`/`armR`
   rồi đặt mesh ở toạ độ cục bộ quanh node — nhưng quên gán `.parent`. Kết quả:
   **cả đầu, mũ và hai tay nằm chồng lên gốc toạ độ thế giới**. Lộ ra khi in
   bounds từng nhóm: `head z[-0.204, 0.259]` thay vì `z[0.333, 0.789]`.
2. **`smart_project` cần EDIT-mode context.** Gọi ở OBJECT mode với nhiều object
   chọn sẵn → `poll() failed`. Phải vào EDIT mode từng mesh một.
3. **Xoá node rỗng SAU khi join** → mesh gộp bị đổi tên `head.001`, Three.js không
   tìm được node theo tên quy ước. Phải xoá **trước** khi join.

### Bài học về kiểm chứng

Hai vòng đầu tôi nhìn ảnh và đoán sai. Phải **in bounds từng nhóm từ Blender** và
**đo bounding box thế giới trong Three.js** mới thấy đầu lệch 0.41m. Ảnh render
vẫn "trông như mèo" dù sai hẳn — mắt không đủ để phát hiện lệch vị trí.

### Thứ tự khai báo quan trọng trong JS

`loadMeoVang()` phải gọi **sau** khi `const MEO_URL` / `let meoGLTF` khai báo.
Gọi sớm ở chỗ khác → TDZ → game không boot. Thứ tự đọc dễ nhầm với thứ tự khai báo.
