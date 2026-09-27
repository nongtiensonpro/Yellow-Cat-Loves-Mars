# Art Bible — Yellow Cat Loves Mars

> **Nguồn chân lý cho mọi quyết định đồ họa.** Đọc file này TRƯỚC khi tạo bất kỳ asset,
> material hay hiệu ứng nào. Mọi số trong đây đã được đo từ code thật (`app/main.js`),
> không phải ước lượng.
>
> **Nguyên tắc:** nếu một thứ đẹp nhưng vi phạm quy tắc ở đây, thì nó **sai**.

**Định hướng:** *Stylized cinematic Mars* — hình học low-poly có cá tính, nhưng vật liệu,
ánh sáng, khí quyển và bố cục đạt chuẩn premium. **KHÔNG** phô photorealistic.
Mèo = điểm đáng yêu · Rover = "đồ chơy cao cấp" · Sao Hỏa = sân khấu lớn có scale.

---

## 1. Scale tham chiếu (đơn vị: mét, khớp code)

| Vật thể | Kích thước thật | Nguồn |
|---|---|---|
| Bản đồ | **1400 × 1400 m** | `TERRAIN_SIZE=1400` |
| Ô lưới terrain | **8.75 m** (160×160 seg) | `SEG=160` |
| Đá | bán kính **0.5 – 2.3 m** | `s=0.5+Math.random()*1.8`, Dodecahedron r=1 |
| Đầu Mèo Vàng | **≈0.42 m** đường kính | `HEAD_S=0.72`, skull `SphereGeometry(0.29)` |
| Thân Mèo (ngồi) | **≈1.2 m** chiều cao | `headG.position.y=1.78`, `BODY_LIFT` |
| Wheelbase xe đạp | **1.89 m** | `wheels x = -0.92 … +0.97` |
| Wheelbase xe máy | **2.14 m** | `wheels x = -1.07 … +1.07` |
| Rover | **2.0 m** dài × **1.36 m** rộ | `wheels x=±1.0, z=±0.68` |
| Đường chân trời nhìn thấy | ~**700 m** (bán kính bản đồ) | — |
| Camera | FOV **68°**, far **3000** | `PerspectiveCamera(68, …, 0.1, 3000)` |

### Tốc độ (ảnh hưởng composition & motion blur)
`bike 4.2 m/s` · `moto 10.5 m/s` · `rover 7.0 m/s`

**→ Quy tắc thị giác:** ở tốc độ chạy, người chơi đi hết **1/3 bản đồ trong ~1.5 phút**.
Landmark phải **đọc được ở 200 m**, và phải có **mốc thị giác mới mỗi 30–60 giây** di chuyển.

---

## 2. Palette (đã trích từ code — dùng đúng giá trị này)

### Nền tảng Sao Hỏa
| Vai trò | Hex | Ở đâu |
|---|---|---|
| Đất trung tính | `#6b3a22` | `rockMat` (đá) |
| Đất sáng / cát | `#c47a3a` | biome Arcadia |
| Đất tối / sườn | `#8b3a18` | biome Valles |
| Đất núi lửa | `#a85a2a` | biome Olympus |
| Băng cực | `#d8c8b8` | biome Polar |
| Bão bụi | `#7a3d1a` | biome Storm |
| Trời zenith | `#1a0f0a` | `skyMat.top` — **rất tối, gần nâu đen** |
| Trời mid | `#ff7a3d` | `skyMat.mid` |
| Trời chân trời | `#ffb07a` | `skyMat.horizon` |
| Fog | `#2a140a` | `FogExp2(0x2a140a, 0.0012)` |

### Ánh sáng
| Vai trò | Hex |
|---|---|
| Mặt trời | `#fff0d0` (DirectionalLight 1.6) |
| Trời bão (hemi sky) | `#ffd8b0` |
| Đất bounce (hemi ground) | `#1a0f0a` |
| Ánh đèn pha | `#ffc08a` |

### Nhân vật & phương tiện
| Vai trò | Hex |
|---|---|
| Vàng Mèo Vàng | `#ffcc33` → highlight `#fff6a0` / `#ffc93c` |
| Vàng kim loại | `#ffcb63` (MeshPhysical, roughness 0.07) |
| Khăn đỏ | `#e23c2e` / `#ff3b2f` |
| Kính visor | `#3fb0d8` → `#7ec8e3` (chỉ dùng cho công nghệ) |
| Thân tàu | `#bfc7d0`, `#d6dbe2` (kim loại) |
| Đèn / phát sáng | `#ffa500` / `#fff176` / `#ffd54f` |

### UI (từ `styles/main.css`)
Nền `#1a0f0a` / `#0f0a08` · nhấn `#c1440e` · chữ `#ff9a5c` / `#fff7ec` · thành công `#4ade80`
> ⚠️ UI **không được** lấn sang cảnh. Accent `#c1440e` dùng cho nút, không dùng làm vật liệu.

### Mở rộng palette (được phép, có kiểm soát)
Review khuyến nghị thêm **tím lạnh trong bóng** · **xanh xám ở đá** · **vàng sulfur** · **trắng băng** · **teal rất tiết chế cho tech**.
→ Cho phép nhưng **chỉ 10–15% diện tích khung hình**; màu chủ đạo vẫn là đỏ/cam/nâu.

---

## 3. Vật liệu — roughness range (bắt buộc)

| Vật liệu | roughness | metalness | Ghi chú |
|---|---|---|---|
| Đất / bụi | **0.88 – 0.96** | 0.02 | matte tuyệt đối, không bao giờ bóng gương |
| Đá bazan | **0.75 – 0.90** | 0.00 | thêm normal map để có mặt |
| Bụi bám trên kim loại | **0.80 – 0.95** | 0.05 | phủ lên sơn, phá vỡ specular |
| Sơn rover/moto | **0.25 – 0.45** | 0.15 – 0.30 | có **bevel + edge highlight** |
| Kim loại mạ | **0.08 – 0.20** | 0.70 – 0.95 | chỉ ăngten, kính cabin |
| Kính visor/cabin | **0.05 – 0.12** | 0.00 | thêm `transmission`/`clearcoat` |
| Vải khăn | **0.88 – 0.95** | 0.00 | có fabric normal map |
| Lông Mèo Vàng | **0.70 – 0.85** | 0.00 | **KHÔNG** dùng `transmission` |
| Đèn / LED | — | — | `emissive` + `emissiveIntensity 0.4 – 0.6`, **chỉ** nguồn sáng |

**Cấm tuyệt đối:** `transmission` trên lông hoặc đất · `metalness > 0.6` trên bất kỳ thứ gì không phải kim loại thật · vật liệu `roughness < 0.2` ngoài kim loại/kính.

---

## 4. Quy tắc silhouette (điều kiện để một landmark "làm được")

Một landmark chỉ được tính là xong khi **đọc được ở 200 m, ở mọi hướng nhìn, vào cả lúc trời tối**:

1. **Đỉnh chính ≥ 1.6× chiều cao phương tiện** (tức ≥ 3.2 m) — nhỏ hơn thì xe nuốt mất.
2. **Không có đường thẳng nào dài quá 60 m trong silhouette** — tránh cảm giác "hộp".
3. **Có tối thiểu 2 tầng đọc:** khối chính + chi tiết phá vỡ đường viền (khe, răng, hàm).
4. **Đổ bóng đọc được** trên mặt đất → hình khối phải có chiều sâu, không phải tấm phẳng.
5. **Không lặp lại:** 2 landmark cạnh nhau không được cùng hình dạng.

**Về mật độ:** review chỉ ra gameplay đầu tiên "trống" vì chỉ có vài vật thể. Mỗi biome cần:
- **1** landmark lớn (chi tiết 8–12 prop nhỏ đi kèm) · **3** landmark vừa · **8–12** prop nhỏ.
- Phân bố **có chủ đích theo biome**, không phun ngẫu nhiên như hiện tại (`Math.random()` toàn cục).

---

## 5. Ánh sáng & khí quyển

**Hiện trạng:** 1 DirectionalLight (`#fff0d0`, 1.6, shadow 2048², bias `-0.0005`, frustum ±600) + 1 HemisphereLight (`#ffd8b0`/`#1a0f0a`, 0.85). Fog đơn `FogExp2(#2a140a, 0.0012)`.

**Mục tiêu:** 3 lớp phải tách được nhau trong mọi khung hình.
1. **Foreground** — đối tượng chính, tương phản cao, bóng đọc rõ.
2. **Midground** — đá/cồn, giảm tương phản nhẹ, bắt đầu hòa vào fog.
3. **Background** — landmark xa, chỉ còn **silhouette**, gần như thành 1 mảng màu.

**Quy tắc cụ thể:**
- Bóng phải **có gradient**, không đen tuyệt đối → luôn có bounce đỏ từ mặt đất (hemi ground đã cấu hình `#1a0f0a`, Phase sau sẽ nâng).
- Fog phải **đổi màu theo biome** — hiện là 1 màu chung cho cả bản đồ. Đây là nguyên nhân chính khiến cảnh bị "một mảng cam đồng nhất".
- **Không dùng** overlay hạt đơn lớp làm bão. Bão = 3 lớp: hạt gần / haze trung / silhouette xa.
- Tuyệt đối **không** để mặt đất chìm vào cùng tông với bầu trời.

---

## 6. Camera & khung hình

- FOV cơ sở **68°** (đã dùng). FPV và chase dùng thông số riêng đã chốt sau probe.
- **Không** đặt camera quá sát → phải luôn thấy **chân trời + đường đi phía trước** trong 2/3 trên khung hình.
- Horizon nằm ở **1/3 trên** khi đi (tạo cảm giác scale), không phải chính giữa.
- Không bao giờ để UI che vật thể chính (Mèo Vàng, rover).

---

## 7. Ràng buộc kỹ thuật (không được phá vỡ)

| Hạng mục | Ngưỡng |
|---|---|
| Desktop | 60 FPS @ 1080p, preset High |
| Mobile | 30–45 FPS, render scale 0.7–0.9 |
| Frame time | < 16.6 ms desktop · < 25–33 ms mobile |
| Texture | KTX2/Basis + mipmap; 1K/2K, chỉ hero asset dùng 4K |
| Shadow | 2048 cho sun |
| Cảnh | Instancing, frustum culling, chunk + LOD |

**Trước khi coi một Phase là xong, chạy đủ:**
```
npm run build
node --check app/main.js && node --check vite.config.js
TARGET=http://127.0.0.1:4173/ node tests/smoke-phase3.mjs    # ERRORS 0
TARGET=http://127.0.0.1:4173/ node tests/_probe_ride.mjs     # chìm nặng nhất 0.000m
TARGET=http://127.0.0.1:4173/ node tests/_probe_offline.mjs  # OFFLINE failed []
```
Ba probe này đã bắt được lỗi thật trước đây (xuyên đất, PWA chết do precache/CORS). Không được bỏ qua.

---

## 8. Danh sách cấm (anti-pattern đã gặp thật)

| Sai lầm đã xảy ra | Quy tắc chống lại |
|---|---|
| Sọc cắt qua hình cầu → vết nứt | Mọi chi tiết bám theo bề mặt phải **ôm mặt cắt ellipsoid**, không dùng sphere cắt qua |
| Khối tròn trơn trông vô nghĩa | Mọi vật thể phải có **ý nghĩa đọc được**; nếu không giải thích được nó là gì → bỏ |
| Che mặt / che bánh bằng phụ kiện | Phụ kiện **không được** lọt vào tầm nhìn lái xe ở góc thứ nhất |
| Precache ghi đường dẫn source | Luôn để plugin `injectSwManifest` sinh manifest từ `dist/` thật |
| Hạt HUD chồng lên cảnh | Giữ HUD gọn khi lái |

---

*Bản này khóa sau Phase 0. Mọi thay đổi phải ghi lý do vào cuối file.*

---

## 9. Số đo mật độ môi trường (đo được 27/09/2026, sau Giai đoạn 1)

Bản đồ **1400×1400 m = 1.64 triệu m²**. Mật độ phải đủ để mặt đất **không đọc
thành một mảng màu phẳng**, nhưng phải có nhịp — không phun đều.

| Lớp | Số lượng | Cỡ | Mục đích |
|---|---:|---|---|
| Đá lớn (boulder) | 260 | 2.4–5.2 m | silhouette giữa cảnh |
| Đá vừa | 900 | 0.8–2.1 m | đọc được ở 60 m |
| Vụn (pebble) | 3000 | 0.16–0.55 m | chi tiết cận cảnh |
| Bột/sét (silt) | 320 | 2.5–8.0 m | phá vỡ mảng màu đất |
| Hố (crater) | 95 | 3.2–9.5 m | đường viền + bóng |
| Cụm đá | 90 | r 10–34 m | **có hướng**, không phun đều |

**Ngưỡng kiểm tra (đo bằng `tests/_probe_density.mjs`):** trong bán kính **40 m**
quanh người chơi phải có **≥ 1 boulder, ≥ 8 đá vừa, ≥ 25 vụn**. Trước khi sửa:
**0 / 0 / 0** → đúng lý do cảnh đọc như "mặt phẳng procedural trống".

**Quy tắc hình học theo cỡ:** đá ≥ 0.8 m dùng `Dodecahedron` (36 tam giác, đọc
được faceted). Vụn < 0.6 m dùng `Tetrahedron` (4 tam giác) — ở cỡ này người
chơi không phân biệt, nhưng tiết kiệm ~96k triangles/khung hình. **Không dùng
hình học đắt cho vật nhỏ.**

**Budget hình học:** sau Giai đoạn 1 — **143k triangles, 207 draw calls** (mốc
cũ: 97.5k / 195). InstancedMesh giữ draw call gần như không đổi khi tăng số vật.

## 10. Fog & đường chân trời (sửa 27/09/2026)

Bản đồ chỉ 1400 m nên nhìn ra rìa sẽ thấy **cạnh lưới terrain như một đường
ngang tối** — đúng lỗi review chỉ ra.

- **Màu fog phải hòa vào trời ở chân trời.** Cũ: fog `#2a140a` (rất tối) vs trời
  `#ffb07a` → tương phản mạnh, cạnh lưới lộ rõ. Nay: fog `#c4713f`, gần màu
  trời chân trời nhưng tối hơn để giữ chiều sâu.
- **Mật độ fog 0.0025** → ở 700 m (bán kính bản đồ) đã ~95 % mờ; ở 100 m chỉ ~6 %.
  Mật độ cũ 0.0012 chỉ mờ 50 % ở 700 m → không đủ che cạnh lưới.
- **Dãy núi xa:** 46 đỉnh ở bán kính 1050 m, cao 34–144 m, tắt shadow (quá xa).
  Tạo tầng "background" mà art-bible §5 yêu cầu — chỉ còn silhouette.

**Quy tắc:** bất kỳ thay đổi nào ở fog/sky phải kiểm bằng ảnh chụp ở **3 khoảng
cách** (gần / 100 m / 400 m) — nếu thấy đường ngang ở chân trời là hỏng.

## 11. Material đất — vì sao phải có normal map (sửa 27/09/2026)

Bản cũ chỉ có `vertexColors` + albedo 256². **Không có normal map thì bề mặt
không đổi sắc độ theo hướng ánh sáng** → đọc như một mặt phẳng, đúng lỗi
"mặt phẳng procedural trống". Thêm normal map là thay đổi tác động lớn nhất
trên mặt đất.

Ba map sinh từ **cùng một trường cao fbm** (tất định, không `Math.random()`):

| Map | Công thức | Giá trị |
|---|---|---|
| normal | gradient trường cao × `STRENGTH` | 512², repeat 60 (≈22 px/m), normalScale 1.00 |
| albedo | cát + vệt gió + mảng lớn | `0.90 + h*0.24` |
| roughness | biến thiên theo độ cao cục bộ | 0.59 – 0.85 |

**Quy tắc:**
- `roughness` của material đặt **1.0** để `roughnessMap` chi phối, không đặt 0.92
  cứng (khi đó map bị bóp).
- `STRENGTH` **không vượt 1.75**. Thử 2.35 → mặt đất thành *vũng bùn* vì bóng
  đổ trên normal map quá tương phản, giảm sáng trung bình của cả mặt đất.
- Vân sóng gió **phải domain-warp** trước khi lấy `sin`. Không warp thì các vân
  song song đều tăm tắp, lặp theo tile và nhìn rõ là hoa văn nhân tạo khi lái xa.
- Kiểm bằng ảnh ở **3 khoảng cách** (3 m / 8 m / 11 m) — normal map chỉ thấy
  được gần, xa sẽ dày đặc thành nhiễu.
