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
