# Kế hoạch Phase 4 — Polish, Performance & Launch Readiness

Bắt đầu: 27/09/2026 · sau khi Phase 3 đóng tại `03fed4b` (CI xanh).

## Nguyên tắc giữ nguyên từ Phase 0–3

1. **Đo trước, sửa sau.** Mọi nhận định về hiệu năng đều từ `perf-budget.mjs`.
2. **Ảnh là bằng chứng.** Không tuyên bố xong nếu chưa chụp và nhìn.
3. **Một biến, một chủ sở hữu.** Đặc biệt post-FX — `updateAtmosphere()` giữ
   cường độ theo giờ/thời tiết, `applyGraphicsPreset()` giữ bật/tắt pass.
4. **Không bịa số liệu.** Không có số đo thật thì ghi "chưa đo", không ghi ước lượng.

---

## Task 4.1 — UI polish + photo mode nâng cấp

### Hiện trạng (đã khảo sát, không đoán)

| | đã có | thiếu |
|---|---|---|
| Photo mode | orbit tự do, cuộn zoom, tilt-shift | DOF thật, exposure, focal length, vignette, LUT, pose |
| Bản đồ | tô bóng cao độ, biome list, marker POI | đường đồng mức, route, vùng đã khám phá |

Photo mode hiện dùng `camMode === 2` với `lerp(0.12)` cố định — trục `lerp`
cứng nên zoom không mượt, và **không có** khung hình nào cho người dùng chỉnh.

### 4.1a — Bảng điều khiển máy ảnh (photo panel)

Panel trượt ra khi vào photo mode, mỗi slider gắn đúng một uniform:

| điều khiển | phạm vi | tác động |
|---|---|---|
| Phơi sáng (EV) | −2 … +2 | `uExposure` — nhân trước tone-map |
| Tiêu cự (mm) | 14 … 200 | đổi `camera.fov` theo cảm ứng 35mm |
| Khẩu độ f/ | 1.4 … 22 | `uBlur` — độ mờ ngoài vùng nét |
| Khoảng cách nét | 2 … 120 m | `uFocus` — mặt phẳng lấy nét |
| Vignette | 0 … 1 | tối bốn góc |

Tiêu cự phải **thật sự** đổi FOV, không phải đổi con số trên khung: ánh xạ
`fov = 2·atan(24/(2·f))` (sensor 24mm ngang), kẹp 12°–105°.

Lưu ở `localStorage` — người dùng chỉnh một lần là giữ.

### 4.1b — DOF thật bằng depth cache

Tôi đã **cố tình** không làm DOF thật ở Task 3.5 vì `BokehPass` render lại cảnh
mỗi khung. Ở photo mode camera **đứng yên**, nên phải trả giá một lần:

- dựng `depthRT` khi vào photo mode hoặc khi camera ngừng chuyển động >0.4s
- `MeshDepthMaterial` với `depthPacking` để lấy chiều sâu
- `focusPass` đọc `depthRT`, so với `uFocus` → mờ dần theo `|d − focus|`

Phải render lại khi: đổi preset, đổi vị trí xe (vật cản tiến gần), đổi exposure.
Không render lại mỗi khung — đó là toàn bộ ý nghĩa của việc chỉ dùng ở photo mode.

Nếu đo thấy `depthRT` làm giảm FPS quá 20% thì giữ tilt-shift và ghi rõ trong
art-bible, không giả vờ đó là DOF.

### 4.1c — Bản đồ: đồng mức, route, vùng đã khám phá  ✅ (art-bible §24)

- **Đường đồng mức**: vẽ đường đẳng cao trên `bigmap` mỗi 10 m, đậm mạch chính
  (100 m). Dùng marching squares trên lưới mẫu thưa, không quét 640×520 pixel.
- **Route**: breadcrumb ghi mỗi 12 m, giữ tối đa 900 điểm, lưu `localStorage`.
  Vẽ bằng nét liền mảnh dần theo tuổi (càng xưa càng mờ).
- **Vùng đã khám phá**: lưới ô 40 m; ô sáng lên khi người chơi vào bán kính 90 m.
  Vẽ lên trước, sau đó mới vẽ đường đồng mức và POI — lớp fog-of-war phải
  **dưới** mọi thứ khác.

### Kiểm chứng 4.1

Ảnh: cùng một góc, 4 thiết lập khác nhau — phải phân biệt được bằng mắt.
Probe: đổi từng slider, đọc uniform, khẳng định giá trị đổi đúng chiều.
`perf-budget.mjs` phải vẫn xanh.

---

## Task 4.2 — KTX2/Basis + mipmap + texture budget

Đo trước: hiện có 61 texture, 22.71 MB, lớn nhất 512×512. **Chưa có texture
2K/4K nào** — nên "nén hero 2K/4K" trong kế hoạch đang mô tả thứ chưa tồn tại.

Việc cần làm thật:
- kiểm texture nào thực sự được sinh ra ở kích thước nào và dùng ở đâu
- chỉ đưa sang KTX2 những cái **lớn và dùng nhiều**; 61 texture tổng 22 MB thì
  thêm KTX2/Basis decoder chỉ để tiết kiệm vài MB là đánh đổi âm
- siết mipmap + `anisotropy` cho texture mặt đất vạt

**ĐÃ KẾT LUẬN 27/09/2026: không cần KTX2.** Đo được 100% texture sinh lúc chạy từ canvas, 0 texture từ file, không có 2K/4K. Mipmap 61/61 dùng thật, lãng phí 0 MB. Đã thêm guard `mipWastedMB` phải = 0.

---

## Task 4.3 — QA checklist + bàn giao

`document/bien-ban-ban-giao-v1.md`: checklist chạy được từng dòng, kèm
`screenshot trước/sau` và các lỗi đã từng vỡ (precache, CORS, Nhánh người thứ
ba rò bộ nhớ…) để người sau không phải tìm lại.

---

## Một đề xuất ngoài kế hoạch

`perf-budget.md` đã đo: **xe ăn 175–190 draw call, gần bằng một nửa cảnh**
(174–189 mesh, mỗi cái một geometry). Đây là ứng viên hàng đầu cho Phase 5:
gộp bằng `mergeGeometries` cho khung gắn cứng, `InstancedMesh` cho nhóm lặp.

Chưa nằm trong Phase 4 — nêu ở đây để không mất, quyết định sau.
