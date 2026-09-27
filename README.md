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

---

## 🚀 CI/CD — GitHub Pages

Workflow: `.github/workflows/deploy.yml` (nhánh **`master`**).

| Job | Khi nào chạy | Việc |
|---|---|---|
| `verify` | push / PR vào `master` | `npm ci` → kiểm cú pháp → build → **kiểm precache SW** → **chặn phụ thuộc CDN** → **smoke test Chromium** → upload artifact |
| `deploy` | push vào `master`, **chỉ khi verify xanh** | build lại → `configure-pages` → `upload-pages-artifact` → `deploy-pages` |

Tách 2 job để **smoke test bắt lỗi runtime trước khi phát hành** — Three.js hỏng
lúc chạy mà `node --check` không thấy.

### Bật lần đầu (một lần)

Trong repo → **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
Sau đó mọi lần push lên `master` sẽ tự phát hành tại:

```
https://nongtiensonpro.github.io/Yellow-Cat-Loves-Mars/
```

Phát hành thủ công: tab **Actions → Deploy Pages → Run workflow**.

### Ba lỗi PWA chỉ lộ ra khi lên Pages (đã sửa)

1. **Precache trỏ nhầm đường dẫn source.** `sw.js` ghi cứng `./app/main.js`,
   `./styles/main.css` trong khi Vite build ra tên có hash
   (`/assets/main-BhKm1z7R.js`). Trên `vite preview` các URL sai đó trả về
   `index.html` (SPA fallback) nên cache "thành công" nhưng **toàn HTML**; trên
   GitHub Pages không có fallback → 404 → `caches.addAll()` từ chối → **SW không
   bao giờ cài được** → mất offline.
   → Sửa: plugin `inject-sw-manifest` trong `vite.config.js` liệt kê file thật
   của `dist/` sau khi build, ghi ra `dist/precache.json` + thay `__BUILD_ID__`
   bằng hash nội dung (đổi file nào là cache cũ bị hạ).

2. **Top-level `await` trong Service Worker.** SW script mặc định là script
   *classic*, không phải ES module → `await` ở top-level là `SyntaxError` →
   SW không cài được. Việc đọc `precache.json` phải nằm trong event `install`.

3. **Response trong cache giữ header sai → `net::ERR_FAILED` khi offline.**
   - `content-encoding: gzip`: SW fetch thì trình duyệt đã giải nén body nhưng
     header vẫn còn `gzip`; lúc phục vụ lại trình duyệt giải nén lần hai → hỏng.
   - `vary: Origin`: Cache API so kh���p request theo header `Origin`, request của
     `<script type="module">` khác request SW dùng lúc cài → `cache.match()`
     trượt → rơi về network → offline là fail.
   → Sửa: `withCors()` bỏ `content-encoding` / `content-length` /
     `transfer-encoding` / `vary`, và thêm `access-control-allow-origin: *`.

### Kiểm chứng cục bộ (giống hệt CI)

```bash
npm run build
npx serve dist -l 4173          # hoặc npm run preview
TARGET=http://127.0.0.1:4173/ node tests/smoke-phase3.mjs
```

Kiểm tra offline: mở trang → đợi SW cài xong → tắt mạng → tải lại → thế giới
vẫn phải chạy được (`tests/_probe_offline.mjs`).

### Ghi chú

- `base: './'` giữ asset tương đối → build chạy được ở cả Pages lẫn mở file
  trực tiếp. Plugin build gỡ thuộc tính `crossorigin` khỏi `<script>`/`<link>`
  (không cần cho asset cùng origin, và là nguyên nhân của lỗi CORS ở trên).
- `public/.nojekyll` chặn Jekyll bỏ qua file/thư mục bắt đầu bằng `_`.
- `three@0.160.0` được Vite bundle sẵn → không còn request `unpkg.com` lúc chạy.
  CI có bước chặn nếu CDN quay lại.
- Còn `fonts.googleapis.com` (web font). Muốn offline 100% thì cần tự host font
  trong `public/fonts/`.
