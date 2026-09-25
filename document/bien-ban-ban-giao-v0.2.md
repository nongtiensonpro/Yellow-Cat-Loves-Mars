# 📦 Biên Bản Bàn Giao — Yellow Cat Loves Mars v0.2 (Giai đoạn 3)

> Ngày: 2026-09-25 · Trạng thái: **TÍNH NĂNG LIVE + SMOKE TEST PASS (0 lỗi console, exit 0)**

## 1. Tính năng mới (so với v0.1)

| Nhóm | Chi tiết |
|------|----------|
| 🎵 Nhạc adaptive | Web Audio thuần (không file mp3): pad 2-osc + arp pluck + wind noise qua lowpass. Hợp âm riêng 5 vùng (BIOME_CHORDS). Nhịp arp & tốc độ gió bám tốc độ xe. Toggle 🔈 + slider volume, tự resume sau user gesture. |
| 📖 Discovery Cards | 12 POI theo vùng (Cánh đồng cồn cát, Hõm sương giá, Candor Chasma, Mê cung Melas, Vành Caldera, Ống dung nham, Vách băng, Cồn cát băng, Hẻm lốc bụi, Mắt bão, Hồ miệng hố, Sống núi gió). Bán kính 28m, tự mở, fact NASA + lời Mèo + so sánh Trái Đất. Lưu `yc_mars_v1_discovered`. |
| 🖼️ Gallery | Photo Mode → thumbnail JPEG 640×400 (q0.62) vào IndexedDB `yc_mars_gallery/photos` kèm biome + tọa độ + xe. Lưới thumb, lightbox, xóa, Web Share/clipboard, LRU 30. |
| 📖 Nhật ký | Tab Tổng quan / Thẻ / Thống kê: km, 18 dấu chân, 5 vùng, 12 thẻ, ảnh, phút chơi; nút chia sẻ hành trình + reset. |
| ☄️ Sống động | Sao băng DOM-animated 8–20s + âm vút Web Audio; sao băng/POI vẽ trên mini & big map (未mở = vàng nhấp nháy). |
| 📴 PWA | manifest.json (icon SVG data-URL) + sw.js cache-first `yc-mars-v3` (network-first cho CDN three). Register + trạng thái SW/Online trong Nhật ký. |

## 2. Sửa lỗi tìm được khi test THẬT

1. **TDZ crash** — `DISCOVERED_KEY` tham chiếu `STORAGE_KEY` trước khi khai báo (const, cùng cấp) → hardcode chuỗi.
2. **Web Audio API sai thứ tự tham số** — `linearRampToValueAtTime(value, endTime)` bị đảo trong `tickAudio` → sửa; không sẽ throw khi bật nhạc.
3. **Late-binding btn-start** — handler bind reference cũ trước khi `startJourney` được reassign → rebind sau reassign (audio không bật khi Bắt đầu nếu không sửa).
4. **favicon.ico 404** — thêm `<link rel="icon">` SVG data-URL.

## 3. Kiểm chứng (Playwright + Edge headless, chạy trên bản build dist)

```
HUD: Arcadia · Rover ✓          landing → vehicle-select → explore ✓
POIS: 12, sw controller: true   journal + status (SW✓/Audio/thẻ/ảnh) ✓
drive W 2.5s: coord 0→212, 22 km/h ✓ (frame loop + GL hoạt động)
teleport POI[0] → Discovery card TỰ MỞ đúng title ✓ → OK → discovered=1 ✓
Photo Mode: bar hiện, Chụp ảnh → IndexedDB rows = 1 ✓
Reload: discovered=1 persist ✓
Audio ON (headless): không pageerror — AudioContext + ramp + tick an toàn ✓
Screen pixel verify: trời cam RG>B đúng Mars, không màn hình đen ✓
ERRORS: 0 — exit code 0 ✓
```

Screenshot: `tests/ingame-arcadia.png`, `tests/ingame-olympus.png` (thấy toast “Đã tới Olympus Mons!” + minimap + HUD), `tests/ingame-night.png`.

## 4. File thay đổi/thêm mới

- `app/main.js` 38KB→**68.7KB / 1300 dòng** (+audio engine, POI, gallery IDB, journal, sao băng, wiring, boot, `window.__yc` debug hooks)
- `index.html` +manifest/favicon/HUD nút mới/3 sheet/lightbox
- `styles/main.css` +4.8KB (sheet, gallery grid, discovery card, lightbox, poi pulse)
- MỚI: `manifest.json`, `sw.js` (+ bản copy `public/`), `tests/smoke-phase3.mjs`, `tests/_inshot.mjs`, `tests/_probe404.mjs`

## 5. Việc còn lại (Giai đoạn 4 — Đánh bóng & Ra mắt)

- [ ] Texture MOLA/HiRISE thật thay vertex color (chuyển vùng có “thật hơn”)
- [ ] Model glTF Mèo + xe chi tiết (hiện primitive — phong cách low-poly giữ được)
- [ ] Code-split để JS < 200KB gzip (three chiếm ~130KB) — dynamic import khi nhấn Bắt đầu để lần tải đầu nhẹ
- [ ] Bão bụi toàn cục động (fog density biến thiên theo thời gian thực)
- [ ] SEO/social meta (og:image render 1 screenshot tĩnh) + deploy GitHub Pages thật

## 6. Cách chạy & test

```bash
npm install && npm run dev      # 5173
npm run build && npm run preview
node tests/smoke-phase3.mjs     # TARGET=http://127.0.0.1:<port>/
```
