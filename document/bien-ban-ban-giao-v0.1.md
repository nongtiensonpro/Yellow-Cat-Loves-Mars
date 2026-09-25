# 📦 Biên Bản Bàn Giao — Yellow Cat Loves Mars v0.1 (MVP Giai đoạn 1–2)

> Ngày: 2026-09-25
> Trạng thái: **MVP chạy được — đã build thành công, preview/dev server đều OK**

---

## 1. Đã hoàn thành gì

### Thế giới 3D (WebGL qua Three.js r160)
- **Địa hình procedural** 1400×1400, 160×160 segment, height = `biome influence (MOLA-like) + fbm noise + crater + Valles trench + Olympus cone`. Màu vertex theo độ cao/độ dốc + tint riêng cho cực băng & bão bụi.
- **5 vùng đất** (BIOMES): Arcadia Planitia, Valles Marineris, Olympus Mons, Planum Australe, Dust Storm Zone — chuyển vùng mượt, phát hiện vào vùng mới → toast.
- **520 đá** (InstancedMesh), 18 **Dấu Chân Mèo** (Sphere + emissive) có animation bồng bềnh, nhặt → lưu LocalStorage, hiệu ứng biến mất.
- **Bầu trời shader** (gradient horizon→mid→top + sun glow + stars), sao 2200 điểm, bão bụi 900 hạt (Points, opacity theo vùng & tốc độ).
- **Ánh sáng**: HemisphereLight + DirectionalLight có shadow 2048, FogExp2, toneMapping ACES.

### Phương tiện
- 3 loại: **Xe đạp** (4.2, bob 0.9, giỏ cá), **Xe máy** (10.5, vệt bụi), **Rover** (7.0, cabin kính, đèn pha, 4 bánh trụ) — buildVehicle() sinh mesh thuần Three.js, không cần model ngoài.
- Chuyển tức thì qua bottom switch hoặc overlay chọn xe; lưu lựa chọn.
- Vật lý: giới hạn dốc theo xe, chậm khi leo dốc, bobbing, vệt bánh + wheel spin.

### Điều khiển & Camera
- **WASD/Arrow + Shift boost**, **C đổi camera** (first/third/orbit), **M bản đồ**, **P photo**, **L đổi giờ**, **H help**.
- **Orbit camera** khi photo/orbit mode (kéo chuột xoay, cuộn zoom).
- **Joystick ảo** (mobile) ở góc trái, hỗ trợ touch + mouse.

### HUD & Overlay
- HUD: biome hiện tại, tọa độ, tốc độ km/h, số dấu chân, tên xe, mini-map 168px, hint.
- **Mini-map** (canvas 2D) + **Big orbit map** (640×520) với zoom/pan, click chọn biome, nút dịch chuyển nhanh.
- **Landing** + **Vehicle Select** + **Orbit Map** overlays, loading bar giả lập.
- **Photo Mode** bar: chụp ảnh (toDataURL → download PNG), thoát Esc.
- **Toast/Discovery** cho biome mới & nhặt dấu chân.
- **Nhật ký** (distance, paws, biomes) + LocalStorage (`yc_mars_v1_*`).

### Build & Deploy (Static-only)
- `npm run dev` (5173), `npm run build` → `dist/` (10KB html + 10KB css + 508KB js gz 132KB), `npm run preview` (5174) — đã verify HTTP 200.
- `three@0.160.0` cài local cho vite bundle; `index.html` giữ `es-module-shims` + importmap CDN để mở trực tiếp `index.html` bằng Live Server vẫn chạy (không cần build).
- Không backend, không DB — host bất kỳ: GitHub Pages, Cloudflare Pages, Netlify, Vercel.

---

## 2. Cấu trúc file

```
D:\Yellow cat loves Mars\
├── index.html          # Entry — importmap + HUD + overlays
├── styles/main.css     # 10.5KB — HUD, landing, joysticks, toast, responsive
├── app/main.js         # 38KB (~834 dòng) — toàn bộ logic 3D
├── assets/             # (dự phòng cho texture/model tương lai)
├── document/
│   ├── ke-hoach-yellow-cat-loves-mars.md
│   └── bien-ban-ban-giao-v0.1.md (file này)
├── package.json        # vite + three
├── vite.config.js      # base './'
└── dist/               # build output tĩnh
```

---

## 3. Cách chạy

```bash
cd "D:\Yellow cat loves Mars"
npm install        # lần đầu
npm run dev        # http://localhost:5173
npm run build      # ra dist/
npm run preview    # http://localhost:5174 (serve dist)
```

Mở trực tiếp: dùng **Live Server** (VS Code) mở `index.html` — không mở bằng `file://` thuần vì ES modules cần http.

---

## 4. Điều khiển

| Phím | Chức năng |
|------|-----------|
| W/A/S/D, ↑↓←→ | Di chuyển |
| Shift | Tăng tốc 1.6× |
| C | Đổi camera (first → third → orbit) |
| M | Bật/tắt bản đồ quỹ đạo |
| P | Photo mode (kéo xoay, cuộn zoom, nút Chụp ảnh) |
| L | Đổi giờ (bình minh→trưa→hoàng hôn→đêm) |
| H / ? | Trợ giúp |
| Esc | Thoát photo/map |
| Joystick (mobile) | Góc trái, vuốt di chuyển |

---

## 5. Giới hạn hiện tại & Roadmap tiếp

**Đã có (MVP):** 1 địa hình gộp 5 biome, 3 xe, thu thập, bản đồ, photo, ngày/đêm, bụi, sao.

**Chưa có (Giai đoạn 3–4 trong kế hoạch):**
- Texture thật từ MOLA/HiRISE (hiện dùng vertex color + procedural)
- Model glTF chi tiết cho Mèo & xe (hiện là primitive)
- Adaptive audio theo vùng/tốc độ
- PWA offline cache
- Discovery Cards với ảnh NASA thật + popup tri thức
- Chia sẻ ảnh kèm tọa độ (Web Share API)
- Tối ưu LOD/chunk cho thế giới lớn hơn

---

## 6. Ghi chú kỹ thuật

- Terrain height lấy qua `heightAt()` (biome influence + fbm + crater + special). Shadow map 2048, fog 0.0012, toneMappingExposure 1.05.
- Dữ liệu tiến trình: `localStorage` keys `yc_mars_v1_vehicle|paws|dist|biomes`.
- Video/ảnh chụp: `renderer.domElement.toDataURL('image/png')`.
- Import: `three` qua node_modules (vite) + CDN importmap (live server) — cả hai đều trỏ `three@0.160.0`.

---

*Build verified: `vite build` ✓ 5 modules, 508KB js. Preview & dev server HTTP 200 ✓*
