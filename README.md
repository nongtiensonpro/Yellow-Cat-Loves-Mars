# Yellow Cat Loves Mars 🪐🐱

Website tĩnh khám phá Sao Hỏa — Mèo Vàng đạp xe đạp / xe máy / rover trên địa hình procedural lấy cảm hứng NASA MOLA/HiRISE. Không backend, không database.

## v0.2 — Giai đoạn 3 (Cảm xúc & Chia sẻ)

- 🎵 **Nhạc nền adaptive** — tổng hợp bằng Web Audio (pad + arp + gió), đổi hợp âm theo vùng, nhịp theo tốc độ. Nút 🔈, volume trong Nhật ký.
- 📖 **12 Discovery Cards** — POI thực tế (Olympus caldera, Candor Chasma, ống dung nham, lốc bụi…) với fact NASA + lời Mèo + so sánh Trái Đất. Tự mở khi lại gần, lưu tiến trình.
- 🖼️ **Gallery** — ảnh Photo Mode lưu IndexedDB (kèm tọa độ + vùng), xem/xóa/chia sẻ (Web Share + clipboard), LRU 30 ảnh.
- 📖 **Nhật Ký Mèo Vàng** — km, dấu chân, vùng, thẻ, ảnh, thời gian chơi + chia sẻ hành trình.
- ☄️ **Sao băng** ngẫu nhiên kèm âm “vút”, 🌪️ bụi xoáy theo vùng.
- 📴 **PWA offline** — manifest + Service Worker cache-first, trạng thái SW/Offline trong Nhật ký.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # ra dist/ (tĩnh, host đâu cũng chạy)
npm run preview    # thử bản build
```

Test tự động (Playwright + Edge headless):
```bash
npx vite preview --port 5176 &
node tests/smoke-phase3.mjs   # TARGET=http://127.0.0.1:5176/
```

## Điều khiển
WASD/Arrows · Shift boost · C camera · M bản đồ · P photo · **J nhật ký** · **G gallery** · L giờ · H help · Esc thoát · Mobile: joystick góc trái.

Deploy tĩnh: upload `dist/` lên GitHub Pages / Cloudflare Pages / Netlify.
