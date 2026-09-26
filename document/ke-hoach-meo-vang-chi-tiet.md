# Kế hoạch: Mèo Vàng — dựng lại toàn diện (Giai đoạn 4.5)

## 1. Vấn đề từ ảnh tham chiếu
Ảnh `image_6aac91.png` cho thấy mô hình hiện tại rất sơ sài:
- Đầu là quả cầu trơn, **có vết nứt** (sọc SphereGeometry cắt qua đầu).
- **Không có mặt**: không mắt, không mũi, không miệng, không ria.
- Mũ bảo hiểm là quả cầu trong suốt phủ kín mặt, mờ và vô nghĩa.
- Thân là `CapsuleGeometry` trơn, không có ngực/hông.
- Chân là ống trụ, bàn chân không có ngón.
- Chiếc thùng hộp gắn trên ghi đông (không rõ tác dụng).
- Tổng thể: "quả cầu + vài nón".

## 2. Mục tiêu
Dựng Mèo Vàng chi tiết nhất có thể bằng procedural geometry thuần Three.js
(không thêm asset ngoài — giữ nguyên triết lý static, 0 request runtime).
Ưu tiên **độ đọc được dưới góc nhìn thứ nhất**: những chi tiết phải nằm đúng
chỗ camera nhìn thấy (mặt, hai tai, tay nắm ghi đông).

## 3. Danh mục chi tiết (nhóm → thành phần)

### 3.1 Đầu (mục tiêu số 1 — FPV nhìn thấy)
| Chi tiết | Hình học |
|---|---|
| Hộp sọ | Sphere scaled dẹt (không còn là quả cầu thô) |
| Mõm (muzzle) | Khối bo tròn riêng, nhô về trước |
| Mũi | Hình tam giác/nón nhỏ màu hồng mực |
| Miệng | Vòng cung mảnh (Torus cung) + đường cười |
| Mắt | Nhãn cầu trắng + đồng tử dọc (mèo!) + mống xanh + lòng sáng |
| Mi mắt | Vòng cung trên/dưới, màu lông tối |
| Ria | 3-4 sợi mỗi bên, dùng `Line` mảnh, cong theo hướng |
| Tai | Nón có trong tai (màu hồng) + chùm lông tai + méo nhẹ khi chạy |
| Mũ phi hành | Vỏ cứng + **kính vàng phía trước** + vành + ống thở + đèn LED |
| Bộ lông đầu | Các cụm cầu nhỏ tạo tua rua ở thái dương + má |

### 3.2 Thân
- Ngực/bụng tách khối, hông mở rộng, lưng cong.
- Sọc mèo tabby: dải cong ôm theo thân (không cắt qua đầu).
- Bụng lông nhạt (màu kem) tạo độ tương phản.
- Cổ áo/khăn đỏ có nếp gấp + đuôi khăn vẩy theo tốc độ.
- Huy hiệu "Mèo Vàng" trên ngực.

### 3.3 Chân & bàn chân
- Chân trước: đùi + ống + bàn chân có **3 ngón + đệm ngón**.
- Chân sau: bắp đùi + bắp chân + bàn chân vuốt.
- Bàn chân đặt đúng lên bàn đạp (bike) / sàn cabin (moto, rover).

### 3.4 Đuôi
- 5 đốt xích khớp, xoay động lập.
- Đuôi dày, có sọc, đầu đuôi trắng.
- Thè lưỡi khi tốc độ cao.

### 3.5 Chi tiết phụ (tăng "chất Mèo")
- Bảng tên/gọi trên cổ áo.
- Dây đeo túi nhỏ bên hông.
- Bụi Sao Hỏa bám trên lông (vệt nhạt trên vai).

## 4. Kỹ thuật
- Tái dùng `vRefs.head`, `vRefs.tail` (đã có animation gắn sẵn ở L1761/L1764).
- Thêm `vRefs.ears`, `vRefs.eyes`, `vRefs.helmetVisor` cho animation.
- Không dùng `Line` cho ria (WebGL linewidth = 1, khó thấy) → dùng
  `CylinderGeometry` mảnh, bẻ cong bằng nhiều khúc.
- Mũ: thay quả cầu trong suốt bằng **vỏ cứng + kính vàng bán phẳng** để
  đọc ra "đây là mũ phi hành", không phải "bong bóng".
- Sọc: dùng `TorusGeometry` cung cắt + `CylinderGeometry` mảnh bám theo
  thân, đặt ngoài vỏ bán kính lông để không sinh z-fighting.

## 5. Kiểm chứng
1. `node --check app/main.js` — cú pháp.
2. `npm run build` — build thật.
3. `tests/_probe_fpv.mjs` — chụp 6 ảnh FPV (3 xe × trái/phải), `ERRORS: 0`.
4. Ảnh so sánh trước/sau bằng vision.
5. `tests/smoke-phase3.mjs` — exit 0, 0 lỗi.
6. Kiểm tra clearance không hồi quy (`_probe_ride.mjs` → 0.000m).
7. Commit.

## 6. Rủi ro
- Tăng số mesh → giảm fps. Dùng chung material, giữ dưới ~90 mesh Mèo.
- `vRefs.head.rotation.z` ở L1764 sẽ xoay cả nhóm đầu — ta gắn mọi chi tiết
  mặt vào `head` để chúng xoay theo.


## 7. Kết quả thực thi (Giai đoạn 4.5)

### 7.1 Mèo Vàng — chi tiết đã dựng
| Nhóm | Chi tiết |
|---|---|
| Đầu | hộp sọ dẹt, má phồng ×2, mõm, sống mũi, mũi hồng, miệng chữ W, cằm |
| Mắt | nhãn cầu + mống xanh + **đồng tử dọc** + 2 lòng sáng + mi mắt |
| Ria | 4 sợi mỗi bên, bẻ cong bằng `aim()` (không dùng `Line` vì linewidth=1) |
| Tai | nón ngoài + trong tai hồng + 3 chùm lông, nhô khỏi mũ |
| Mũ | vỏ trắng cứng + kính vàng + vành cổ + bản lề + LED + ăngten + huy hiệu |
| Thân | ngực, bụng kem, hông, bắp đùi, 5 sọc tabby ôm mặt cắt ellipsoid, sọc đùi |
| Trang phục | khăn đỏ có nút + đuôi khăn bay, huy hiệu ngực |
| Chân sau | đùi + cẳng + bàn chân 3 ngón + vuốt + đệm ngón hồng |
| Đuôi | 5 đốt xích khớp, sọc nối đốt, đầu trắng, sóng chạy theo tốc độ |
| Tay lái | bắp vai + cánh trên + cẳng + bàn tay 4 ngón + vuốt + ngón cái + đệm hồng |

### 7.2 Gốc rễ đã sửa (đo bằng world matrix, không đoán)
1. `fur is not defined` — khối chân đạp cũ dùng biến đã bị xóa khi dựng lại Mèo.
2. `BODY_LIFT` TDZ — `let` khai báo sau `buildVehicle()`; chuyển lên đầu module, dùng `var`.
3. `isRover is not defined` — biến chỉ có trong `updateCamera`, dùng ở frame loop.
4. **Tay không chạm ghi đông**: đo thực tế `wrist.y=1.85` vs ghi đông `y=1.06` — chênh 0.75m; vai `y=2.56` còn cao hơn đầu. Nguyên nhân: `updateRidingPose` hard-code `sy=1.72` trong khi Mèo đã nâng `BODY_Y=0.13` và tay neo theo `hx` (độ lệch bên) thay vì `bar.x`.
5. Hai tay chồng nhau ở `z=0` — thiếu `bar.halfW*s`.

### 7.3 Góc nhìn thứ nhất (cockpit view)
Nguyên tắc: **camera đặt tại mắt Mèo và nhìn xuống ~19°**; đầu/mũ được ẩn
(self-head) vì chính chúng che tay — đúng như game lái xe thật.

| Xe | Cách neo camera | Kết quả |
|---|---|---|
| bike/moto | `upH = handY + 0.34 - playerPos.y`, `backH = handX - playerPos.x - 1.15` | 2 bàn tay ở góc dưới, tầm nhìn thoáng |
| rover | `upH = 2.20`, `backH = -0.80` (chọn qua probe 6 phương án) | 2 bàn tay nắm vô-lăng |

Ẩn thêm ở camMode 0: `vRefs.cabin` (vỏ bao quanh người lái rover) và
`vRefs.selfBody` (thân Mèo che tay khi ngồi sau vô-lăng rover).

### 7.4 Kiểm chứng
- `npm run build` → 0 lỗi, `main-*.js` 574 KB (gz 161 KB)
- `tests/_probe_cat.mjs` (6 ảnh FPV/chase) → `ERRORS: 0`
- `tests/_probe_ride.mjs` → **chìm nặng nhất 0.000 m** (không xuyên đất)
- `tests/smoke-phase3.mjs` → exit 0, `ERRORS: 0`, chạy 211 m, 12 POI, discovery + IndexedDB OK
