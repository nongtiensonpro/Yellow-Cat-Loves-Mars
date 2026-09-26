# Yellow Cat Loves Mars 🪐🐱

Website tĩnh khám phá Sao Hỏa — Mèo Vàng đạp xe đạp / xe máy / rover trên địa hình dựng từ **dữ liệu độ cao MOLA thật của NASA** (PIA02031, public domain), procedural generation, nhạc adaptive, thẻ khám phá, photo mode, PWA offline. Không backend, không database.

## v0.4 — Giai đoạn 4 (Đánh bóng & Ra mắt)

- 🗺️ **Địa hình MOLA THẬT**: độ cao 5 vùng tải từ bản topo NASA PIA02031, hiệu chỉnh hue→mét theo số liệu công bố (Hellas −7.2km, Olympus +22km…), kiểm chứng hold-out + blend đa vùng. (`app/mola-patches.js`, repro bằng `scripts/build-mola-height.py`)
- 🏜️ **Texture bề mặt**: cát hạt + gợn gió + đá vụn (canvas procedural, nhân vertex color).
- 🐱 **Mèo & xe nâng cấp**: mâm nan hoa, khung kim cương, bàn đạp quay; moto giảm xóc/ pô/ chắn bùn; rover 6 bánh rocker-bogie + đĩa ăng-ten xoay + mast camera; mèo có đuôi ve vẩy + sọc + vành mũ.
- 🚀 **Code-split**: landing **tức thì** — entry `boot.js` 1.6KB gzip; Three+world (154KB gzip) chỉ tải khi bấm Bắt đầu/hover/idle.
- 🌪️ **Bão bụi toàn cầu động**: fog/sun/sky/banner HUD glide 8s, sự kiện ngẫu nhiên 1.5–3.5 phút.
- 🔗 **SEO/social**: og:title/description + `og-image.png` (screenshot render thật, có caption).

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # ra dist/ (tĩnh, host đâu cũng chạy)
npm run preview
```

Test tự động (Playwright + Edge headless):

```bash
node node_modules/vite/bin/vite.js preview --port 5176 &
node tests/smoke-phase3.mjs   # TARGET=http://127.0.0.1:5176/
```

## Điều khiển
WASD/Arrows · Shift boost · C camera · M bản đồ · P photo · J nhật ký · G gallery · L giờ · H help · Esc · Mobile: joystick góc trái.

## Dữ liệu & bản quyền
- Địa hình: NASA/JPL/GSFC **PIA02031** (MOLA, public domain) qua Wikimedia Commons. Hiệu chỉnh & kiểm chứng: `document/mola-validation.json`.
- Build lại bản đồ độ cao: `python scripts/build-mola-height.py` (cần Pillow).

Deploy tĩnh: upload `dist/` (GitHub Pages / Cloudflare Pages / Netlify…).
