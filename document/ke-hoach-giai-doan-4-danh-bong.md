# 🪐 Giai đoạn 4 — Đánh bóng & Ra mắt (không deploy GitHub Pages)

> Nối tiếp v0.2. Mục tiêu: chân thực hơn (dữ liệu thật), nhẹ hơn khi tải lần đầu, mô hình đẹp hơn, meta chuẩn mạng xã hội. Test tự động phải pass trước khi bàn giao.

## 4.1 Địa hình từ dữ liệu MOLA THẬT
- Tải bản đồ topo MOLA toàn cầu (USGS/NASA, public domain) dạng JPEG từ Wikimedia Commons.
- **Kiểm chứng số liệu thật trước khi dùng**: mẫu pixel tại Olympus Mons (phải rất cao) và Hellas Planitia (rất thấp) — nếu sai thứ hạng độ cao thì KHÔNG dùng.
- `heightAt()` mới: độ cao = decode ramp màu→cao độ (m) trên patch kinh vĩ độ thật của từng biome (Olympus 18.4N 226.4E, Valles 14S 59W, cực nam, Arcadia 47N 177W, vùng bão 10N 80E) + noise chi tiết + hồ sơ riêng của xe. Fallback về procedural cũ nếu tải/lỗi.
- Texture albedo procedural (canvas: vân cát + vết nứt + hạt) phủ lên vertex color.

## 4.2 Mô hình Mèo & xe chi tiết hơn
- Xe đạp: nanhoa bánh, khung kim cương, bàn đạp quay theo tốc.
- Xe máy: giảm xóc, ống xả, đèn pha nón sáng khi đêm.
- Rover: 6 bánh càng độc lập (rocker-bogie kiểu Perseverance), ăng-ten Dish, mast camera quay.
- Mèo: đuôi động (swing theo tốc), tai rung khi sao băng, chân đạp theo tốc (bike).
- Lý do không xuất .glb: giữ repo tĩnh 0 asset lớn, mọi thứ nằm trong bundle; kiến trúc vẫn cho phép swap glTF sau.

## 4.3 Code-split — lần tải đầu nhẹ
- Tách `app/main.js` → `main.js` (boot/UI, không Three) + `world.js` (toàn bộ 3D).
- Three (~528KB) chỉ tải khi bấm “Bắt đầu” / “Xem bản đồ” → landing mở tức thì, preload khi hover nút.

## 4.4 Bão bụi động
- Sự kiện ngẫu nhiên: fog density + bụi tăng dần 10–25s, tầm nhìn giảm, màu trời đổi — “bão bụi toàn cầu” điện ảnh.

## 4.5 SEO/mạng xã hội
- og:title/description/image (dùng screenshot render thật), twitter card, canonical note.

## 4.6 Kiểm chứng
- Smoke test cập nhật cho luồng lazy-load; kiểm tra chunk dist tách three; kiểm tra chiều cao thật tại 2 điểm đã verify; 0 console error; build pass.

## 4.7 Tiêu chí
- [ ] Terrain dùng dữ liệu MOLA thật (có bằng chứng mẫu pixel) + fallback.
- [ ] Chunk index ban đầu không chứa Three (đọc tên file dist).
- [ ] Mô hình mới không phá FPS (smoke drive được).
- [ ] og image là ảnh render thật, không bịa.
