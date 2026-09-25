# 🪐 Giai đoạn 3 — Cảm Xúc & Chia Sẻ (Yellow Cat Loves Mars v0.2)

> Tiếp nối v0.1 (địa hình + xe + bản đồ + photo cơ bản). Giai đoạn 3 biến thế giới tĩnh thành nơi **có nhạc, có chuyện, có ký ức**.

## 3.1 Mục tiêu

- Người chơi **nghe** được Sao Hỏa: nhạc nền tự đổi theo vùng/tốc độ, tiếng gió/bão.
- Người chơi **học** được điều gì đó: mỗi vùng/điểm POI mở một Discovery Card (fact NASA, giọng Mèo Vàng).
- Người chơi **giữ lại** được hành trình: Nhật Ký + Bộ Sưu Tập ảnh (Gallery) lưu LocalStorage/IndexedDB, xem lại, chia sẻ.
- Cảm giác **sống động**: sao băng, bụi xoáy, hiệu ứng ánh sáng theo giờ.
- **Offline-first**: lần 2 mở không cần mạng (Service Worker + Cache).

## 3.2 Nhạc nền Adaptive (Web Audio, không file ngoài)

- **Engine**: Web Audio API + OscillatorNode/BufferSource, hoàn toàn tĩnh (không fetch mp3). 3 lớp:
  - *Pad* (sine/triangle, low-pass) — nền ấm, đổi hợp âm theo biome.
  - *Arp/Pluck* (sine + envelope) — nhịp nhanh khi đi nhanh, lặng khi đứng yên.
  - *Wind/Bụi* (filtered noise) — to khi ở Dust Storm / khi boost.
- **Biome → hợp âm**: Arcadia Amaj7 (ấm), Valles Em7 (huyền), Olympus Dmaj9 (hùng vĩ), Polar Cmaj7sus (lạnh), Storm F#m7 (căng).
- **Tốc độ → nhịp/độ mở filter**: 0 km/h = pad thưa, 12 km/h = arp 80bpm, 40 km/h = arp 120bpm + hi-hat noise.
- **Điều khiển**: nút 🔈/🔇 trên HUD, slider volume, lưu mute vào LocalStorage. Autoplay sau first user gesture (click Bắt đầu). Tắt mặc định trên mobile để tránh khó chịu.
- **Fallback**: nếu AudioContext bị block, UI vẫn chạy, chỉ không có âm.

## 3.3 Discovery Cards & POI

- **12 POI** rải theo biome (ví dụ: Arcadia — Dune Field, Frost Hollow; Valles — Candor Chasma Overlook; Olympus — Caldera Rim; Polar — Ice Cliff; Storm — Dust Devil Alley).
- Mỗi POI là vùng tròn bán kính ~28m. Khi vào → toast + mở card (overlay):
  - Tiêu đề + icon + ảnh minh họa (CSS gradient + emoji, không ảnh ngoài để giữ tĩnh).
  - 1 fact khoa học (ngắn, có nguồn NASA) + 1 lời Mèo Vàng (“Mèo thấy…”).
  - Nút “Đã hiểu” → đánh dấu đã đọc.
- **Tiến trình**: `yc_mars_v1_discovered` (Set<poiId>), hiện số đã mở / tổng. Chưa mở thì POI nhấp nháy trên mini-map.
- **So sánh Trái Đất**: mỗi card có dòng “Nếu ở Trái Đất…” (ví dụ: Valles = 10× Grand Canyon).

## 3.4 Nhật Ký Mèo Vàng & Bộ Sưu Tập

- **Nhật Ký** (Journal overlay): km đã đi, số dấu chân, số vùng đã thăm, số card đã mở, thời gian chơi (tích lũy). Dòng tóm tắt: “Hôm nay Mèo đã …”.
- **Gallery** (Bộ Sưu Tập):
  - Ảnh chụp từ Photo Mode → lưu **IndexedDB** (key `yc_mars_gallery`, mỗi ảnh là dataURL + tọa độ + biome + timestamp).
  - Lưới thumbnail, click xem lớn, nút Xóa / Tải xuống / Chia sẻ (Web Share API + clipboard fallback: copy tọa độ + text “Tôi vừa ở … cùng Mèo Vàng!”).
  - Giới hạn ~30 ảnh (LRU, báo khi đầy).
  - Đồng bộ với Discovery Cards: gallery hiện badge “📖 đã mở” nếu ảnh chụp gần POI.

## 3.5 Hiệu ứng sống động

- **Sao băng**: mỗi 8–18s ngẫu nhiên, vệt sáng bay ngang trời (Line + additive blending), kèm tiếng “vút” nhẹ nếu audio bật.
- **Bụi xoáy**: ở Storm zone, thêm xoáy bụi nhỏ (particle swirl) quanh player.
- **Ánh sáng theo giờ**: đã có L (0/0.25/0.5/0.75). Thêm chuyển mượt theo thời gian thực (tùy chọn “Ngày/đêm tự động”).

## 3.6 PWA Offline

- **Service Worker** (`sw.js`): cache-first cho `index.html`, `styles/main.css`, `app/main.js`, `assets/*`. Version `yc-mars-v3`.
- **Manifest** (`manifest.json`): name, icons (emoji data URL), display standalone, theme #c1440e.
- **Offline indicator**: pill nhỏ “● Offline sẵn sàng” khi SW active.
- Không cần Workbox — SW thuần ~60 dòng, tự đăng ký trong `app/main.js`.

## 3.7 HUD & Phím mới

- Thêm nút HUD: 🔈 Audio, 📖 Journal, 🖼️ Gallery (cùng hàng với 🛰️📸🌅?).
- Phím: `J` Journal, `G` Gallery, `M` Map (đã có), `P` Photo (đã có).
- Mobile: bottom sheet cho Journal/Gallery (cuộn được).

## 3.8 Tiêu chí nghiệm thu

- [ ] Audio đổi rõ khi chuyển biome và khi tăng tốc, có mute.
- [ ] Đi qua 12 POI đều mở được card, tiến trình lưu lại sau reload.
- [ ] Chụp 3 ảnh → Gallery hiện 3 thumbnail, reload vẫn còn, chia sẻ/copy hoạt động.
- [ ] Sao băng xuất hiện đều, không ảnh hưởng FPS.
- [ ] Lần 2 mở bằng offline (DevTools → Offline) vẫn chạy.
- [ ] `vite build` pass, `dist/` chứa `sw.js` + `manifest.json` + assets.

## 3.9 Rủi ro & giảm thiểu

- Autoplay bị chặn → chỉ play sau click Bắt đầu.
- IndexedDB đầy → LRU 30 ảnh, nén dataURL (scale 0.6 trước khi lưu).
- SW cache cũ → version bump + skipWaiting.

## 3.10 Thứ tự triển khai

1. Audio engine (Web Audio) + HUD toggle.
2. POI + Discovery Cards (data + vùng + toast + overlay + mini-map marker).
3. Journal overlay (số liệu + thời gian chơi).
4. Gallery (IndexedDB + Photo hook + share).
5. Sao băng + bụi xoáy.
6. PWA (manifest + sw.js + register).
7. Build verify + ghi bien-ban v0.2.
