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

## 12. Khí quyển & vệt bánh (sửa 27/09/2026)

### Bảng khí quyển theo biome (mỗi vùng một chất khí quyển riêng)

| Biome | trời zenith | trời mid | trời chân trời | fog | bụi |
|---|---|---|---|---|---|
| Arcadia | `#1a0f0a` | `#ff7a3d` | `#ffb07a` | `#c4713f` | 1.00 |
| Valles | `#120806` | `#8e3416` | `#b05930` | `#8a4526` | 0.85 |
| Olympus | `#241009` | `#d4662e` | `#f0a061` | `#b06036` | 0.90 |
| Polar | `#2a3a4a` | `#d8c8b8` | `#f0e6da` | `#c8bcb0` | 0.45 |
| Storm | `#1c0d06` | `#6d3311` | `#8f4c22` | `#6b3a1a` | 2.20 |

Chuyển cảnh bằng **lerp mượt** `1 - exp(-dt*3.2)` (≈1.2s), không nhảy màu.

### ⚠️ Bẫy đã gặp: hai hệ cùng ghi một thuộc tính

`maybeStorm()` (hệ cũ) ghi `sun.color`, `skyMat.*`, `scene.fog.density`
**mỗi khung hình**. Khi thêm khí quyển theo biome, hệ mới luôn thua vì chạy sau —
và mật độ fog bị hardcode `0.0012` âm thầm vô hiệu hoá bản sửa cạnh terrain lộ.

**Quy tắc bắt buộc:**
1. **Một thuộc tính chỉ có một chủ sở hữu.** Ở đây `updateAtmosphere()` sở hữu
   MÀU; `maybeStorm()` chỉ được điều biến CƯỜNG ĐỘ.
2. Mọi hằng số vật lý đặt **một chỗ** (`FOG_BASE`, `GFX_PRESETS[].fogMul`) và
   tính từ đó — **không hardcode** số trong vòng lặp.
3. Bão vẫn chạy trên **mọi** biome: `updateAtmosphere` trộn thêm palette bão theo
   `stormLevel`, thay vì bão chỉ hoạt động ở vùng storm.

### Vệt bánh & contact shadow (Task 1.3)

- **Contact shadow**: vệt tối mềm dưới **từng bánh**, neo theo cao độ đất thật;
  bánh càng cao → vệt càng nhạt và rộng. Đây là thứ khiến phương tiện không
  trông "lơ lửng" dù không xuyên đất.
- **Vệt bánh**: ring buffer **760 ô**, thả mỗi **0.55 m** quãng đường (nhỏ hơn
  bề rộng vệt 1.3 m → **liền mạch**), sống **46 s** rồi biến mất.
- **Fade bằng THU NHỎ, không bằng alpha** — `InstancedMesh` dùng chung một material
  nên không fade được từng ô riêng; thu nhỏ trông tự nhiên hơn và rẻ hơn.
- Pool contact shadow: **mỗi vệt một material riêng** — `opacity` thuộc
  `material`, đặt vào `mesh` không có tác dụng.
- Lấy bánh **index 0 và 1** (trái/phải cùng trục). Rover có
  `[[-1,0.68],[-1,-0.68],[1,0.68],[1,-0.68]]`; lấy `i+=2` là 0 và 2 → cùng
  `z=+0.68` → chồng thành **một** vệt. Đã dính lỗi này một lần.

## 13. Cascade shadow 2 lớp (Task 2.3, 2026-09-27)

| Lớp | Ánh sáng | Hộp | mapSize | Độ phân giải | Phủ |
|---|---|---|---|---|---|
| Gần | `sun` (layer 1) | ±40 m | 2048 | **0.020 m/texel** | xe + Mèo Vàng |
| Xa | `sunFar` (layer 2) | ±600 m | 1024 | 1.17 m/texel | đất, đá, landmark |

**Tách theo LAYER, không theo khoảng cách** — layer tĩnh nên mép ghép không
trôi theo người chơi. Mỗi vật thể chỉ bật **một** layer ánh sáng, nên không bao
giờ bị chiếu sáng đôi. `hemi.layers.enableAll()` — nếu không, vật thể chỉ nhận
đúng một nguồn trong hai sẽ thành mảng tối.

### ⚠️ Bẫy đã gặp

1. **`markFar()` phải bỏ qua đèn.** Bản đầu gọi `enable(2)` cho mọi thứ trong
   scene và đã bật layer cho chính các đèn: `sun` đổi `mask 2 → 6`, tức nó sáng
   cho cả hai lớp → **mọi vật thể lớp xa bị chiếu sáng đôi**. Layer quyết định
   *vật thể nào* được đèn nào soi, đèn không tự thuộc về lớp nào.
2. **Đèn gắn trên xe phải theo lớp của xe.** `keyLight`/`fillLight` ở tay Mèo
   Vàng rơi vào layer 0 trong khi xe ở layer 1 → tay chìm tối. Beacon → layer 2.
3. **Đừng đổ bóng cho vật thể nhỏ hơn độ phân giải.** Đá 0.8–2.1m so với
   1.17 m/texel của lớp xa → bóng không phân giải nổi, xuất hiện thành **tam
   giác đen nhọn** rải rác trên mặt đất. Quy tắc chung, không chỉnh riêng.
4. **Hai hệ cùng ghi một thuộc tính** (xem §12) — `applyTime()` từng ghi đè màu
   fog, đã bỏ; `updateAtmosphere()` là chủ sở hữu.

### Bảng đồ vùng ảnh: thời gian mặc định đã sửa

`timeOfDay = 0` **không phải bình minh**:
```
t=0.00 → sunH=-1  NỬA ĐÊM      t=0.50 → sunH=+1  TRƯA
t=0.25 → sunH= 0  BÌNH MINH    t=0.75 → sunH= 0  HOÀNG HÔN
```
(sunH = sin(t·2π − π/2)). Mặc định cũ đặt mặt trời **220 m dưới mặt đất**.
Nay dùng `0.33`. Dùng `__yc.setTime(t)` khi chụp ảnh — nếu không mỗi lần chụp
có thể rơi vào thời điểm khác và không so sánh được.

## 14. Post-FX (Task 2.4, 2026-09-27)

| Preset | grade | FXAA | bloom | Ghi chú |
|---|---|---|---|---|
| `low` | ✗ | ✗ | ✗ | render thẳng, không tạo composer |
| `medium` | ✓ | ✗ | ✗ | rẻ nhất, vẫn có màu |
| `high` | ✓ | ✓ | ✓ | |
| `cinematic` | ✓ | ✓ | ✓ | grade mạnh hơn, grain nhiều hơn |

Một `ShaderPass` gộp **vignette + tương phản + bão hòa + split-tone + hạt phim** —
ba thứ đắt nhất gộp làm một lượt toàn màn hình. Split-tone (sáng ấm / tối lạnh)
là cách rẻ nhất để có cảm giác cinematic: không cần thêm mô hình PBR nào.

**Bloom dùng ngưỡng sáng cao, không dùng selective bloom 2 lượt.** Chỉ thứ thật
sáng mới nở (beacon, đèn pha, mặt trời). Rẻ hơn nhiều và đúng ý — thứ tối không
cần nở.

### Đo được (cùng preset `cinematic`, chỉ bật/tắt post-FX)

| | mean | p5 | p95 | contrast | dark% |
|---|---|---|---|---|---|
| tắt | 59.1 | 16.2 | 114.0 | 97.7 | 11.3 |
| bật | 57.5 | 11.5 | **149.0** | **137.5** | 16.9 |

Dải động +39.7, đỉnh sáng +35, độ sáng trung bình giữ nguyên (-1.6).

### ⚠️ Chi phí thật: FPS 102 → 47.6

Đo bằng **SwiftShader (render phần mềm)** — môi trường probe không có GPU thật,
nơi pass toàn màn hình đắt bất thường. Số này có thể quá thận trọng, cũng có
thể đúng trên máy yếu. **Không đo được phần cứng thật của người chơi.**

Vì vậy có **chốt an toàn**: FPS < 45 liên tiếp 3 lần → tự tắt post-FX, HUD ghi
`post tắt(tự động)`, bật lại tay ở dropdown đồ họa.

### Bẫy đo: `renderer.info` mặc định vô dụng khi có composer

`autoReset` mặc định reset info ở **mỗi** `renderer.render()`. Lượt render cuối
của composer chỉ là hình vuông hậu kỳ → info chỉ còn "1 draw, 1 tri". Đã đặt
`autoReset = false` + `reset()` thủ công đầu khung; giờ số là **tổng** của cảnh
+ các pass.

### Bẫy TDZ

`applyGraphicsPreset()` chạy lúc khởi tạo và gọi `applyPostFX()`. Khai báo
`let composer` **sau** nó → `ReferenceError`, app không boot. Khai báo trạng thái
post-FX phải nằm trước hàm đó.

## 15. Bão bụi 3 l�ớp + đo FPS (Task 2.6, 2026-09-27)

| Lớp | Số hạt | Cỡ | Bán kính hộp | Vai trò |
|---|---|---|---|---|
| A · hạt mịn | 2600 | 0.55 | 55 m | bụi lơ lửng sát xe |
| B · đám trôi | 420 | 4.2 | 230 m | vệt bụi bay ngang, cảm giác gió |
| C · tường bụi | — | — | 430 m | đậy theo bão, **che rìa bản đồ** |

Trước đây MỘT lớp hạt cỡ 1.8 — ở mọi khoảng cách đều trông như nhau, nên bão
đọc ra "sương mờ" chứ không phải bão bụi Sao Hỏa. Tầng C không chỉ cho đẹp: nó
cho phép cắt draw distance mà không mất cảm giác không gian.

### ⚠️ Ba bẫy đã dính, tất cả đều ra "màn hình đen"

1. **Gradient của tầng C phải tô TRẮNG, chỉ đổi alpha.** `MeshBasicMaterial`
   tính `map.rgb × color`; gradient đen cho ra mảng **đen đặc** phủ kín màn hình.
   Muốn *độ phủ* chứ không phải *màu* → gradient trắng.
2. **Biến tạm cho `Color` phải là `Color`, không phải `Vector3`.** Dùng nhầm thì
   `Color.copy()` nhận sai kiểu → mọi thành phần thành `NaN` → `'#000NaN'` → đen.
   Sửa lỗi 1 xong vẫn đen; phải **đo lại** mới thấy lỗi 2.
3. **Lỗi có sẵn từ trước:** khối update bụi cũ ghi vị trí hạt theo **toạ độ tuyệt
   đối** rồi lại `dustPoints.position.copy(playerPos)` → **cộng hai lần**, hạt bị
   đẩy lệch gấp đôi. Nay hạt nằm trong hộp cục bộ quanh người chơi.

**Bài học chung:** một triệu chứng ("đen màn hình") có thể do nhiều nguyên nhân
chồng nhau. Sửa một lỗi rồi **đo lại** thay vì kết luận là xong.

### Đo FPS trên máy thật: phím `F`

Mọi số liệu trong tài liệu này đều đo bằng **SwiftShader (render phần mềm)** —
không đại diện cho phần cứng người chơi. Bấm `F` để bật ô
`FPS · draw · tri · preset`, đo bằng máy thật rồi mới quyết có hạ ngưỡng
post-FX (Task 2.4) hay không.

## 16. Kit Valles Marineris (Task 2.7, 2026-09-27)

Valles nằm ở (420,-180), **ngoài bán kính 8 landmark cũ** → trước đó vùng này
trống hoàn toàn, đi ngang chỉ thấy đất. Nay 13 landmark / **8 silhouette**.

| Loại | Số | Silhouette đọc được là |
|---|---|---|
| mesa | 2 | bàn: đỉnh phẳng, răng cưa viền |
| spire | 2 | tháp nhọn xoắn |
| arch | 2 | vòm có lỗ khuyết |
| field | 2 | cả lũy tháp nhỏ |
| **canyon** | 2 | **khe hở thấp giữa hai khối** |
| **terrace** | 1 | **bậc thang lệch tầng** |
| **bridge** | 1 | **nhịp dày bắc ngang, có trụ giữa** |
| **vista** | 1 | **bệ thấp + cột cao** |

### Nguyên tắc: đặt landmark ĐÚNG trên trục hào

Hào Valles đã có sẵn trong `heightAt`: trục `x + 0.2z = 320`, sâu tới 80m.
Đặt landmark lệch trục → thành cục đá lạ lẫm nằm cạnh hào, không đọc ra
"miệng hào". Mọi landmark Valles đều đặt theo `x = 320 - 0.2z`.
*(Sửa 1 lần: ban đầu đặt lệch 74m, trông như mọi cục đá khác.)*

### Váy hào KHÔNG có đế bệt

Đế bệt tròn (46→58m) của mọi landmark khác sẽ **bịt kín miệng hào**. Riêng
`canyon` bỏ đế bệt.

### ⚠️ Sửa chất liệu: landmark là ngoại lệ của Task 2.2

Task 2.2 đưa xe lên PBR `autoMat()` nhưng **bỏ sót landmark** — vẫn là
`MeshStandardMaterial` phẳng màu tối. Giữa đất sáng cam và đá gần như đen
tím, đọc ra như vết bóng chứ không phải đá. Sửa bằng cách dựng `LM_MATS`
qua `autoMat()` — phải đặt **sau** hàm `autoMat` vì phụ thuộc nó.

| Vị trí | Trước | Sau |
|---|---|---|
| đáy hào | TB 39.1 | **75.6** |
| bàn đá | TB 33.6 · đen 20.2% | **40.9 · 4.0%** |
| đồng bằng (spawn) | TB 55.8 | **80.6** |

### ⚠️ Bẫy probe: ảnh chụp có thể là GIAO DIỆN, không phải cảnh

Popup chọn xe mở ngay sau `#btn-start`. Quên đóng → `page.screenshot()` chụp
đúng cái popup, đo ra "sáng 50, đen 0%" trong khi cảnh 3D thì tối sậm.
Đã dính **hai lần**. Nay `clean()` đóng mọi overlay + **xác nhận
`display:none`** trước khi chụp, và in cảnh báo nếu còn sót.

Tương tự: camera orbit tính từ **đáy hào** với `dist=26` bị chôn trong vách →
ảnh đen 100%, nhưng đó là lỗi probe, không phải lỗi cảnh. Lùi ra
`dist=120` là ảnh sáng bình thường. **Ảnh đen phải kiểm bằng cách lùi
camera trước khi kết luận cảnh hỏng.**

## 17. Giờ trong ngày (Task 3.2, 2026-09-27)

`timeOfDay` chạy vòng tròn 0..1. Bốn mốc: **0.00 Đêm · 0.25 Bình minh · 0.50 Trưa · 0.75 Hoàng hôn**.
Phím `1`–`4` nhảy thẳng tới từng mốc; nút 🌅 (phím `L`) xoay qua lại 4 mốc có tên.

| Mốc | Mặt trời | `sunI` × | `hemiI` × | Màu trời phủ | Màu sương mù phủ | Sao |
|---|---|---|---|---|---|---|
| Đêm | `#4a5f86` lạnh | 0.100 | 0.31 | `#0d1c38` · 0.80 | `#1a2740` · 0.72 | 0.80 |
| Bình minh | `#ffb070` đào | 0.420 | 0.45 | `#ffa070` · 0.62 | `#ffb890` · 0.56 | 0.22 |
| Trưa | `#fff0d0` | 1.000 | 1.00 | — (không phủ) | — | 0.00 |
| Hoàng hôn | `#ff5a28` đỏ sâu | 0.375 | 0.40 | `#ff4411` · 0.72 | `#ff5a2a` · 0.64 | 0.34 |

`sunI`/`hemiI` là **hệ số so với `SUN_BASE_I` (1.6) và `AMB_BASE_I` (0.85)**, không phải cường độ tuyệt đối.
Cường độ thực = hệ số × hằng số nền × `(1 - stormLevel·0.55)` (mặt trời) hoặc `× (1 - stormLevel·0.35)` (bán cầu).

**Thứ tự lớp áp** (bắt buộc, không được đảo):
```
biome  →  giờ trong ngày  →  bão
```
Bão nằm ngoài cùng nên vẫn thắng, và đổi giờ không phá vỡ cơn bão đang chạy.

### Sở hữu màu & cường độ

`updateAtmosphere()` là chủ duy nhất của: màu sky (3 tầng), màu fog, màu `sun`/`sunFar`, màu `hemi`/`hemi.groundColor`,
và **cường độ** `sun`/`sunFar`/`hemi`. Nó chạy mỗi khung và lấy mẫu giờ bằng `sampleTimeGrade()` ngay trong hàm
— nên đổi giờ bằng bất kỳ cách nào (phím, nút, `setTime()` trong console) cũng cho kết quả như nhau.

`applyTime()` chỉ lo **vị trí** mặt trời (phải đi ngay, không nội suy chậm) và độ mờ sao.

### ⚠️ Bẫy đã gặp lần thứ ba: hai hệ cùng ghi một thuộc tính

`maybeStorm()` từng gán `sun.intensity = lerp(1.6, 0.5, s) * SUN_BASE_I` **mỗi khung**. Hai hỏng cùng lúc:

1. **Nhân đôi**: `1.6 × SUN_BASE_I (1.6) = 2.56` thay vì 1.6 — ánh sáng sáng hơn `dự định 60%` suốt từ trước.
2. **Xoá sạch gradient giờ**: hệ chạy sau nên luôn thắng, khiến 4 mốc giờ ra y hệt nhau.

Đo được trước khi sửa: bình minh và trưa lệch nhau Δ đất **4.0/255** — không nhìn ra khác biệt.
Sau khi gỡ: Δ đất bình minh↔trưa = **98.4**, và cả 6 cặp mốc đều > 15.

**Quy tắc:** bất kỳ thuộc tính nào của ánh sáng/sương mù/bầu trời cũng chỉ được **một** chủ sở hữu.
Hệ nào cần biến đổi thì **biến đổi trong `updateAtmosphere()`**, tuyệt đối không gán từ hệ khác.

Probe chốt: `tests/_probe_time.mjs` assert `sun.intensity` phải có **≥ 3 giá trị khác nhau** trong 4 mốc
(`[0.16, 0.672, 1.6, 0.6]`) — nếu lỡ quay lại chủ sở hữu thứ hai thì probe báo đỏ chứ không im lặng.

### Bảng đồ vùng ảnh mốc giờ
- `tests/tg-dem.png` · `tests/tg-binhminh.png` · `tests/tg-trua.png` · `tests/tg-hoanghon.png`

## 18. Nhiễu nhiệt · cánh nắng · bụi bám (Task 3.3, 2026-09-27)

Ba hiệu ứng của Task 3.3, cùng một nguyên tắc: **không thêm mesh vào scene** —
cả hai hiệu ứng toàn màn hình nằm trong composer sẵn có, còn bụi bám là biến
đổi vật liệu. Draw call gần như không đổi.

### 18.1 Nhiễu nhiệt + cánh nắng (pass toàn màn hình)

Thứ tự trong composer: `RenderPass → bloom → FXAA → grade → haze → rays → OutputPass`.
Haze và rays **sau grade** để không bị grade nén lại lần nữa.

| preset | haze | rays |
|---|---|---|
| `low` | tắt (render thẳng) | tắt |
| `medium` | tắt | tắt |
| `high` | **bật** | tắt |
| `cinematic` | **bật** | **bật** |

Cánh nắng dùng kỹ thuật volumetric scattering (20 vòng lấy mẫu mỗi pixel) —
đắt nhất chuỗi nên chỉ bật ở `cinematic`.

Cường độ **không tự tính**, lấy từ mốc giờ (Task 3.2):

| Giờ | `uAmount` (haze) | `uStrength` (rays) |
|---|---|---|
| Đêm | 0.00 | 0.00 |
| Bình minh | 0.55 | 0.85 |
| Trưa | 0.85 | 0.38 |
| Hoàng hôn | 0.70 | 0.85 |

Đêm tắt hẳn — để lại sẽ hiện vệt sáng trên nền tối và trông như lỗi.
Haze chỉ rung ở vùng **dưới** `uBand` (0.62) vì khí gần mặt đất nóng nhất;
`uSunVis` tắt khi mặt trời ở sau lưng, nhưng **vẫn giữ khi lọt ra ngoài khung**
để vệt chạy vào từ mép — tắt sớm làm vệt nhấp nháy mỗi lần xoay camera.

### 18.2 Bụi bám trên xe

`autoMat()` cache vật liệu và **dùng chung giữa xe, mèo, đá landmark**. Ghi thẳng
`.color` để phủ bụi thì cả ba cùng bám. Nên `collectDustTargets()` **clone** ra
instance riêng cho từng vật liệu trên xe — `clone()` giữ nguyên tham số nên vẫn
dùng chung shader program, chỉ tốn vài lần nạp uniform.

Bỏ qua khi thu thập:
- Vật liệu không PBR (`typeof roughness !== 'number'`) — đĩa đổ bóng `MeshBasicMaterial`.
- Vật liệu phát sáng — đèn pha phải sáng, bụi không làm đèn to lên.

Đặc tính: `level = clamp((distance + stormLevel·260)/600, 0, 1)`, bão làm bám nhanh
hơn vì bụi mịn lơ lửng. Tác dụng: màu trộn 78% về `#b08464` **và** roughness
tăng 0.42, clearcoat giảm 85%. Tăng nhám là phần quan trọng — bụi không phản xạ
gương, nên chỉ đổi màu sẽ trông như "xe sơn màu khác" chứ không phải "bụi bám".

### ⚠️ Bẫy đã gặp: `if (m.emissive)` luôn đúng

`THREE.Color` là **object** nên `m.emissive` luôn truthy kể cả khi đen, còn
`emissiveIntensity` mặc định `1.0`. Bộ lọc `if (m.emissive && m.emissiveIntensity > 0.5)`
loại **28 trên 30 vật liệu** xe, chỉ còn lại 2 — bụi gần như không thấy.
Phải kiểm tra **màu** phát sáng thật: `em.r + em.g + em.b > 0.02`.

Số đo: bike 25 / moto 20 / rover 22 vật liệu được phủ bụi (sau khi sửa).
Kiểm tra rò: 446 mesh ngoài xe giữ nguyên vật liệu gốc.

## 19. Máy trạng thái cử động (Task 3.4, 2026-09-27)

Trước đây phần cử động rải rác thẳng trong `frame()`: đuôi vẩy theo
`sin(now*0.0035 + tốc độ*0.04)`, tai đậy theo hai tần số, đầu nghiêng theo
`sin(now*0.004)`. Chúng **không biết mèo đang làm gì** — đang phanh hay đang rã
mái thì đuôi cũng vẩy y hệt, chỉ khác biên độ.

### 19.1 Bảy trạng thái

| trạng thái | khi nào | tín hiệu đọc được |
|---|---|---|
| `idle` | đứng yên | thở nhẹ, đuôi đung đưa |
| `accel` | ga, còn dưới 75% tốc độ tối đa | mũi cúi, mèo chồm, tai ép |
| `cruise` | giữ tốc độ | đuôi dựng, thẳng lưng |
| `coast` | **thả ga còn đà** | mèo thả lỏng, đuôi hạ |
| `turn` | rẽ | nghiêng vào phía rẽ, đầu ngoái theo |
| `brake` | đang chạy tới mà lệnh lùi | mũi ngẩng, mèo chống, khăn văng |
| `reverse` | đang lùi | lùi chậm, đuôi thấp |

Nguyên tắc: **trộn THAM SỐ, không trộn tư thế**. Mỗi trạng thái đẩy ra một bộ
giá trị đích (`ANIM_STATES`); chỉ có một bộ đang chạy (`ANIM_P`) nội suy về
đích. Nhờ vậy chuyển trạng thái tự mượt, không cần blend weight giữa hai tư thế.

Sở hữu: `ANIM_P` chỉ được ghi trong `updateAnimGraph()`. Trong `frame()` chỉ đọc.
Tư thế theo địa hình (`targetPitch`/`targetRoll`) vẫn thuộc `settleToGround()` —
anim **cộng thêm** tại đúng một chỗ áp dụng, không ghi đè biến của nhau.

### 19.2 Quán tính — phát hiện bắt buộc

Hai trạng thái `accel` và `brake` **không tồn tại được** nếu xe không có quán
tính. Bản đầu dùng `speed = fwd * conf.speed * boost` làm thẳng tốc độ di
chuyển: bấm W là tối đa ngay khung sau, buông là dừng sặc. Máy trạng thái thấy
tốc độ nhảy thẳng 0 → 100% nên không bao giờ ở lại `accel`.

Nay dùng hằng số thời gian mũ (ổn định ở mọi tần số khung hình):

```js
const tau = Math.abs(cmdSpeed) < Math.abs(speedReal) ? BRAKE_TAU : ACCEL_TAU;
speedReal += (cmdSpeed - speedReal) * (1 - Math.exp(-dt / tau));
```

`ACCEL_TAU = 0.40s` (hết ~63% quãng), `BRAKE_TAU = 0.22s` (phanh gọn hơn ga).

### 19.3 Ổ gi: JERK, và bump là XUNG chứ không phải trạng thái

`bump` **không phải** một trạng thái ngang hàng. Nó là một xung 0.4s phủ lên
trạng thái nền — vạch đá giữa lúc đang cruise thì vẫn phải đọc ra `cruise`.
Có bảng riêng thì vẫn phải tách, nhưng bảng đã bỏ hẳn `bump` khỏi
`ANIM_STATES` để không bao giờ ghi đè trạng thái nền.

Ba cách nhận diện, hai cách đầu **đều sai và đều bị đo chứng minh**:

| cách | vấn đề | số đo |
|---|---|---|
| ngưỡng trên lệch mỗi khung `dy < -5.5cm` | ở 100 FPS, 15m/s thì xe chạy 15cm/khung — chỉ cần dốc **20°** là vượt ngưỡng | `bump` bắn liên tục khi đi trên đất bằng |
| lệch với đường xu hướng `_smoothY` | sai số của bộ lọc trễ **tỉ lệ với tốc độ leo** | p90 = **3.9m**, max = **13.5m** trên đường bằng |
| **JERK = dy − bình quân gần đây** ✅ | dốc đều cho `dy` không đổi nên jerk = 0 | đứng yên p50=0; đi thẳng p50=0.0006 p90=0.134 p99=0.455 |

Ngưỡng chọn `jerk > 0.22` (~p95 trên đường gồ ghề) và cooldown 0.55s. Đo được:
đi thẳng **cruise 100%** thời gian, đứng yên **idle 100%**; xung bump phủ ~43%
— tức là địa hình này thật sự gồ ghề, đúng cảm giác muốn.

### 19.4 Phân biệt phanh với lùi

`fwd < 0` nghĩa là **cả** phanh **lẫn** lùi. Bản đầu trả `'brake'` cho cả hai nên
`reverse` không bao giờ tới. Phải xét **hướng đang chạy thật**:

```js
if (fwd < -0.05) return speed > 0 ? 'brake' : 'reverse';
```

Và `fwd ≈ 0` còn đà là `coast` — trạng thái này **không có trong kế hoạch**, lộ ra
khi probe bấm S mà vẫn giữ W: `fwd` triệt tiêu về 0 và rơi nhầm vào `accel`.

## 20. Camera state theo tốc độ / địa hình (Task 3.5, 2026-09-27)

Camera trước đây gắn cứng: `fov 68` bất biến, hướng nhìn bám thẳng vào xe, không
có gì cho người chơi biết mình đang nhanh cỡ nào — và mọi chuyển hướng đều tức
thời nên xe không có quy mô.

### 20.1 Bốn kênh

| kênh | làm gì | hằng số |
|---|---|---|
| FOV động | nở ra khi nhanh / boost | `+7` theo tốc độ, `+9` khi boost |
| Trễ hướng nhìn | camera quay về phía xe sau một hằng số thời gian | `CAM_LAG_TAU = 0.13s` |
| Rung chạm đất | lấy **trực tiếp** xung ổ gi của Task 3.4 | tắt dần `e^(-7t)` |
| Chặn địa hình | dò 3 điểm phía trước, nâng tối đa 1.6m | |

Đo được: FOV `68 → 75` (cruise) → `84` (boost); trễ góc lên tới `15.9°` khi rẽ rồi
về `0`; rung đỉnh `0.46`; clearance FPV thấp nhất `1.99m` trên 135 mẫu, **0 khung**
sát đất dưới 0.5m.

Sở hữu: `camera.fov`, `_camYawLag`, `camShake`, `focusPass.enabled` chỉ được gán
ở đúng một chỗ mỗi cái. `applyPostFX()` **không** đụng vào chúng.

### 20.2 RATCHET — bẫy tự tạo, đã sửa

Bản đầu chặn địa hình phía trước tính độ nâng từ `camera.position.y`:

```js
if (cl > camera.position.y) needLift = max(needLift, cl - camera.position.y);
```

Biến này **đã bị chính lệnh nâng khung trước sửa rồi**, nên mỗi khung lại nâng
thêm một chút. Đo được camera bò lên `+12m` so với xe rồi rơi xuống `-5m` khi đi
xuống dốc — nhìn như camera bị lỗi hay điên. Sửa: giữ riêng cao độ lý tưởng
`idealY = playerPos.y + upH`, dò địa hình so với **đó**, rồi áp nâng lên `idealY`.

### 20.3 Trễ camera người thứ ba: giảm hằng số KHÔNG triệt tiểu gốc rễ

`lerp(a, b, 0.08)` mỗi khung nghĩa là hằng số thời gian phụ thuộc tần số khung
(0.21s ở 60 FPS, 0.09s ở 144 FPS) — camera bám chặt ở máy nhanh, bỏ rơi ở máy chậm.

Đổi sang hằng số thời gian mũ (`CAM_CHASE_TAU = 0.20s`) là đủ để giống nhau ở mọi
tần số. Nhưng đo được trễ vẫn là **25.9m** ở tốc độ 6.2 m/s.

Lý do: bất kỳ phép nội suy sau một điểm đích **đang di chuyển** nào cũng tụt lại ở
trạng thái xác lập, và độ tụt **tỉ lệ với tốc độ**. Giảm `τ` chỉ đổi con số.

Cách đúng là **bù trễ bằng phần dẫn tốc độ**: cho đích dẫn trước đúng `v·τ`. Ở trạng
thái xác lập, độ trễ của phép nội suy (`v·τ`) và phần dẫn (`v·τ`) triệt tiêu nhau.
Trong lúc tăng/giảm tốc độ vẫn còn trễ, nên **cảm giác xe nặng vẫn còn nguyên** —
đây mới là điều ta muốn, chứ không phải camera cứng như đá.

Đo được: trễ `25.9m → 7.5m` (mục tiêu là 9.5m phía sau theo `camDist`).

### 20.4 Focus ở photo mode: tilt-shift, KHÔNG phải DOF

Tên trong UI là "focus" nhưng nó **không dùng chiều sâu**. DOF thật cần depth
buffer; `BokehPass` của three.js render **lại cảnh riêng** để lấy depth, tức nhân
đôi số draw call mỗi khung. Đổi lại lấy hiệu ứng mờ rất nhẹ ở chế độ chụp ảnh thì
không đáng.

Đây là tilt-shift: mờ dần từ ngoài vào theo trục dọc, giữa khung sắc nét — giống
ảnh tilt-shift trên máy ảnh film, hợp với "chụp kỷ niệm" hơn là DOF nhân vật.

Chỉ bật ở photo mode: bật lúc lái thì cả khung hình mờ viền, tốn 9 mẫu/pixel mà
không ai nhìn thấy tác dụng. `togglePhoto()` là nơi bật/tắt duy nhất.

### 20.5 Bug có sẵn: `now` không có trong chữ ký

`updateRidingPose(dt, steerInput, speed, boosting)` dùng `now` cho nhịp rung cổ
tay khi boost mà không nhận `now`. Bấm Shift là `ReferenceError` **mỗi khung**
(đo được 287 lần trong 5 giây), chết cả animation tay.

Chỉ lộ ra khi probe bấm Shift — lái thường vẫn chạy bình thường nên rất dễ tưởng
là không sao. `node --check` cũng không bắt, vì đây là lỗi runtime trong phạm vi
tên, không phải lỗi cú pháp.

Quy tắc: **mọi tham số dùng bên trong hàm phải nằm trong chữ ký hoặc khai báo
ở module scope.** `now` là tham số của `frame()` nên không thuộc phạm vi đó.

## 21. Discovery cinematic (Task 3.6, 2026-09-27)

Trước đây đến POI là overlay bật lên ngẫu nhiên giữa đường: không có âm thanh,
không có gì ở trong thế giới 3D, không có nhịp. Người chơi vừa đang lái thì bị
một hộp thoại chặn ngang.

### 21.1 Trình tự 2.6 giây

| thời điểm | việc |
|---|---|
| `0.00s` | chuông chạm · hạt bụi bật lên tại POI · camera bắt đầu quay |
| `0.35s` | thẻ trượt vào từ dưới |
| `0.90s` | POI **được đánh dấu khám phá** · hạt bật thêm một lần |
| `1.90s` | camera bắt đầu trả lại |
| `2.60s` | hết khoảnh khắc · cooldown mới |

Đánh dấu khám phá ở `0.90s` chứ không đợi đóng: đóng mà không lưu thì người
chơi mất thẻ mà không hề biết.

### 21.2 NHỊP: 30–60 giây

`cineCooldown = 30 + Math.random()*30` sau mỗi lần. Discovery là **món ăn, không
phải đồ ăn vặt** — cứ vài giây một cái thì nó thành nhiễu và người chơi sẽ tắt
luôn. Bản cũ dùng `poiCooldown = 4.0` và bán kính 28m.

### 21.3 Thẻ phải là thanh dưới, KHÔNG được che kín màn hình

Bản đầu dùng chung class `.overlay` — fullscreen + `backdrop-filter: blur(2px)`.
Hạt bụi bật lên nằm ngay **sau** lớp phủ đó, nên khoảnh khắc mà cả hệ thống cố
tạo ra **không hề nhìn thấy**.

Giờ `#overlay-discovery` là panel dưới: nền gradient trong suốt ở 26% trên, thẻ
trượt lên từ dưới, `pointer-events:none` trên nền để vẫn tương tác được thế giới.
Ở màn rộng ≥760px chuyển sang bố cục ngang (ảnh 150px · thân nội dung) để thẻ
thấp, chừa nhiều cảnh. Đo được: thẻ chiếm ~35% chiều cao ở 1280×720.

### 21.4 Bug lớn nhất: quên đổ dữ liệu vào thẻ

`startDiscoveryCine()` bỏ class `hidden` nhưng **không gọi `openDiscovery()`** —
thẻ hiện nguyên văn chữ sỗi: *"Tiêu đề"*, *"Fact"*, *"Mèo nói…"*.

Chỉ lộ ra khi **chụp ảnh**. Probe đọc DOM thấy `phase` đúng, `focus` đúng, 0 lỗi
console — mà nội dung thẻ sai hoàn toàn. Không có assertion nào bắt được, vì
đây không phải lỗi kỹ thuật, chỉ là **quên một lệnh gọi**.

Bài học chung cho toàn dự án: nhiều lỗi nghiêm trọng nhất từng gặp đều **không
đỏ, không đụng, không sai số** — chúng chỉ sai khi nhìn. Số đo chỉ bắt được phần
có số; mắt bắt được phần còn lại.

### 21.5 Hạt và âm thanh

Hạt: một pool `Points` 220 hạt dùng lại cho mọi lần khám phá — 1 draw call, không
cấp phát trong lúc chơi, gắn vào scene một lần lúc boot. Hạt bay lên rồi tụt với
trọng lực 4.2, ma sát ngang, tắt dần trong 2.2s.

Chuông: tổng hợp trực tiếp bằng Web Audio, không cần file âm thanh. Bốn nốt
`A4–C#5–E5–A3` (hợp âm ngũ cung) với envelope 1.5s. Nốt trầm ở cuối cho trọng lượng.

Sở hữu: `cineT` / `cineTarget` / `cineFocus` chỉ gán trong hệ cinematic. Camera
chỉ **đọc** `cineFocus` và áp nó như trọng số thêm lên hướng nhìn (Task 3.5).
Đóng thẻ giữa chừng sẽ hủy khoảnh khắc ngay — không thì camera cứ nhìn về POI
thêm 2.6s sau khi người chơi đã đóng, trông như lỗi.

Có `prefers-reduced-motion`: tắt toàn bộ animation thẻ.

## 22. Ngân sách hiệu năng (Task 3.7, 2026-09-27)

Toàn bộ số liệu, trần và phương pháp nằm ở `document/perf-budget.md`. Ở đây chỉ
ghi những điều quyết định nên thuộc về nguyên tắc.

### 22.1 Rò bộ nhớ tìm ra nhờ có ngân sách

Đo đường đi vòng khắp bản đồ cho thấy hai pha rất khác nhau:

| hành động | geometry trước | geometry sau |
|---|---|---|
| đi 13 chặng khắp bản đồ | 341 | 495 — **có kiểm soát** |
| đổi xe 6 lần | 495 | **1515** (+1021) |

Terrain chunk tự giải phóng đúng. Xe thì không:
`while(player.children.length) player.remove(...)` gỡ group khỏi scene nhưng
`remove()` **không** giải phóng buffer GPU. Mỗi lần đổi xe vứt ~175 geometry đi
vĩnh viễn.

`disposeVehicle()` chỉ dispose geometry và clone của `collectDustTargets`
(đánh dấu `userData.__dustClone`). **Không** đụng vật liệu trong cache
`autoMat` — nó dùng chung với Mèo Vàng và đá landmark, dispose là hỏng cả.

Đo lại: đổi xe 15 lần chỉ `+3` geometry.

Đây chính là lý do Task 3.7 tồn tại. Rò bộ nhớ loại này **không bao giờ biểu
hiện** cho tới khi chơi lâu: không đỏ, không đụng, game vẫn mượt, chỉ chậm dần
sau mười phút.

### 22.2 Trần phải hẹp, nhưng không hẹp tới mức che rò

Trần `geometries` đã hạ 620 → 560 **sau khi** hiểu vì sao lần đo đầu nhảy tới
683. Nếu giữ 620 và gọi đó là "dao động bình thường" thì ngân sách đã tự bảo vệ
chính thứ nó sinh ra để bắt. Dự phòng hợp lý là 12–35% cho các hạng mục ổn
định thật.

### 22.3 Xe ăn một nửa draw call

Ẩn xe rồi đo lại:

| | có xe | ẩn xe | xe tốn |
|---|---|---|---|
| `bike` | 353 | 178 | **175** |
| `rover` | 364 | 174 | **190** |

Cả thế giới chỉ tốn ~175 draw call; xe một mình tốn gần bằng thế, vì mỗi bộ
phận là một `Mesh` + geometry riêng (368 draw call tổng ở vị trí
tệ nhất). Ứng viên hàng đầu cho Phase 4: `mergeGeometries` cho khung gắn cứng,
giữ riêng bánh/đèn/bàn tay; `InstancedMesh` cho nhóm lặp.

### 22.4 KHÔNG đặt ngưỡng FPS vào CI

Runner GitHub dùng SwiftShader — dựng phần mềm. Ngưỡng thời gian khung hình trên
đó là **cảm giác an toàn giả**. Số thật do người chơi đo trên máy thật: 144 FPS,
ổn định trên 100, có HUD bật/tắt bằng `F`.

Tương tự, chưa đặt ngân sách mobile: số liệu mobile chỉ có được khi đo trên
thiết bị thật, và con số bịa ra thành cam kết hứa hụt.

## 23. Photo mode như một máy ảnh thật (Task 4.1a+b, 27/09/2026)

### 23.1 DOF THẬT, và vì sao bây giờ mới rẻ được

Task 3.5 tôi đã **cố tình** dùng tilt-shift thay DOF, và ghi rõ lý do: `BokehPass`
của three.js render lại toàn bộ cảnh **mỗi khung** chỉ để lấy depth. Gấp đôi chi
phí vẽ.

Giờ làm được vì một điều đặc biệt của photo mode: **camera đứng yên**. Nên cái giá
đó trả được *một lần*:

- `photoDepthRT` — render target `FloatType`/`RedFormat`, cỡ bằng drawing buffer
- `refreshPhotoDepth()` dựng lại khi: vào photo mode · đổi preset · xe đã chạy
  xa quá 1.5 m tính từ lần dựng gần nhất
- **không** dựng mỗi khung. Đó là toàn bộ ý nghĩa của việc chỉ bật DOF ở đây.

Tự viết shader thay vì `MeshDepthMaterial`: đó là depth packing vào RGBA rồi
phải giải mã ở shader. Ta chỉ cần khoảng cách, nên ghi thẳng số float view-space
vào một kênh. Rẻ hơn, và không có đoạn giải mã nào có thể sai.

Độ mờ theo công thức quang học `CoC ∝ |1/z − 1/f|·(f/N)`, quy ra bán kính px.
Kiểm chứng bằng mắt: **f/22 nét từ gần đến xa · f/1.4 lấy nét 90 m thì xe ở 10 m
mờ rõ còn nền xa sắc** — đúng chiều.

### 23.2 Thứ tự pass quyết định EV có đúng hay không

`grade → haze → rays → photo → OutputPass`. Tất cả nằm **trước** `OutputPass`,
tức là làm việc trên giá trị **tuyến tính (HDR)**, chưa tone-map.

Nên `uExposure` nhân ở đây là **đúng chỗ**: `exp2(EV)` trên tuyến tính. Cộng
sau tone-map là cái sai kinh điển — bị nén lại, EV+2 chỉ ra một chút sáng.

### 23.3 Hai chủ sở hữu tôi phải sửa

**(1) FOV.** `updateCameraFeel()` gán `camera.fov` theo tốc độ **mỗi khung**
(Task 3.5). Nó giữ tiêu cự về 37.8° trong khoảng một khung rồi kéo về 68° —
thanh trượt "tiêu cự" trở nên vô dụng. Sửa: `if (!photoMode)` quanh khối gán đó.

Rời photo mode phải trả FOV về ngay, không chờ khung sau — nếu không người chơi
thấy cảnh vòng rộng đột ngột sau khi thoát.

**(2) Vignette.** Có hai cái: của `GradeShader` (theo preset) và của photo pass
(theo slider). Chồng nhau thì slider điều khiển *một* trong hai — hiển thị sai so
với thực tế. Sửa: ở photo mode tắt vignette của grade, slider là chủ duy nhất.

### 23.4 Một đối tượng, một đường gán

`PHOTO` giữ toàn bộ thiết lập. **Mọi** thay đổi đi qua `applyPhoto()` — kể cả nút
🎯 Nét. Không chỗ nào gán thẳng vào uniform. Nhờ vậy số trên thanh trượt không
bao giờ lệch với giá trị thực sự dùng.

Lưu `localStorage` — chỉnh một lần là giữ.

### 23.5 Bốn kiểu màu

`Sao Hỏa · Hoàng hôn · Chân không · Tương phản` — mỗi kiểu chỉ là bộ số cho
`GradeShader` (tương phản, bão hoà, nhiệt sáng/lạnh), **không phải LUT 3D thật**.
Ghi vậy trong tài liệu để không ai tưởng có bảng tra cứu màu 3D.

### 23.6 Bộ nhớ

`photoDepthRT` = `w·h·4` byte. Ở 1080p khoảng 3.5 MB; ở 4K khoảng 33 MB. Cấp
phát một lần, giữ lại giữa các lần vào/ra photo mode để khỏi cấp phát lại.
Không tính vào `gpuBudget()` vì đó là render target, không phải texture.

## 24. Bản đồ: đồng mức, route, vùng đã khám phá (Task 4.1c, 27/09/2026)

### 24.1 Đường đồng mức — marching squares, có cache

Lưới 72×72 trên toàn bộ 1400 m, kẻ mỗi **12 m**, mạch chính mỗi **60 m** (dày và
sáng hơn). Đo ra **3412 mạch**, trong đó **736 mạch chính**, cao độ −26.9 … +207.3 m.

Trường hợp 4 điểm giao (bồn cầu) nối thành **hai** đoạn, không nối chéo — nối chéo
tạo đường đồng mức giả băng ngang đỉnh.

Terrain là procedural với seed **cố định**, không đổi trong phiên — nên đo **một
lần** rồi cache `contourCache`. Quét lại mỗi lần mở bản đồ là 5329 lời gọi
`sampleHeight` vô ích.

### 24.2 Lỗi 32-bit — loại lỗi nguy hiểm nhất của tôi ở Phase này

Bản đồ có 35×35 = **1225 ô**. Tôi lưu trạng thái bằng bitmask số nguyên: `footMask & (1<<bit)`.

Toán tử `&` và `<<` của JS chỉ **32 bit**. `1 << 100` rơi về `1 << 4`.

Hệ quả: mọi ô từ bit 32 trở đi đọc **sai ô**, và khi gán `|=` còn **làm hỏng ô khác**.

Nguy hiểm ở chỗ nó **không trông sai**. Bản đồ vẫn có sương, vẫn có vùng sáng, vẫn
chạy không lỗi. Chỉ là vùng tối đặt **ở ngẫu nhiên**. Đo mới lộ ra:

| | `pctDark` | `pctMid` | `pctBright` |
|---|---|---|---|
| bitmask 32-bit | 40% | 43% | **17%** |
| `Uint8Array` | **85%** | 14% | **0%** |

Khi mới khám phá 2%, bản đồ đúng phải gần như toàn tối.

Sửa: `Uint8Array(1225)` — 1225 byte, không đáng gì. Lưu xuống `localStorage` thành
chuỗi `'0'/'1'`.

Bài học chung cho cả Phase 3 lẫn Phase 4: **số đo và ảnh chụp bắt được thứ mắt
thường bỏ sót.** Ở đây mắt thường sẽ nói "ổn, có fog mà", và nó đúng — có fog,
chỉ là sai chỗ.

### 24.3 Ghi mọi lúc, không nhốt sau `mapOpen`

Bản đầu tôi viết `if (mapOpen) { pushRoute(); revealFootprint(); }` — tưởng để tiết
kiệm. Nhưng bản đồ thì **đóng** suốt lúc lái, nên không bao giờ ghi được gì:
`footCells` đứng ở 0 sau cả chặng lái.

Sửa: ghi **luôn**. Chi phí mỗi khung gần như bằng 0 — `pushRoute` tự từ chối khi
chưa đi đủ 12 m, `revealFootprint` trả `false` khi không có ô nào mới.

### 24.4 Sương mềm, và một draw call thay vì 1225

Không vẽ 1225 `fillRect`. Vẽ vào canvas nhỏ **đúng bằng số ô** (35×35), làm mờ
`filter: blur(1.1px)`, rồi `drawImage` nâng cỡ toàn bản đồ.

Kết quả mép mềm — đọc được là sương, không phải ô vuông. Trước đó mép blocky rõ
rệt khi nhìn ảnh. Và tốn **một** `drawImage` thay vì 1225 `fillRect`.

### 24.5 Route và tiến độ

Breadcrumb ghi mỗi **12 m**, giữ tối đa 900 điểm, vẽ nét mờ dần theo tuổi (càng
xưa càng nhạt) — đọc được hướng đã đi. Lưu `localStorage`.

Góc trên trái có thanh tiến độ **ĐÃ KHÁM PHÁ %** kèm số điểm khám phá và số bước
đã đi. Đo được: lái xong **263 ô (21%)**, giữ nguyên sau khi đóng/mở lại bản đồ.

Độ dài route lưu mỗi 4 s (`saveFoot`), không ghi `localStorage` mỗi khung.

## 25. Texture budget — vì sao KHÔNG có KTX2 (Task 4.2, 27/09/2026)

Đo: 61 texture · 22.71 MB · **100% sinh lúc chạy từ `<canvas>`** · **0 texture từ
file** · kích thước chỉ `512² · 256² · 64²` · không có 2K/4K nào.

KTX2/Basis nén file texture. Không có file nào ở đây — pixel được *tính* lúc
chạy. Thêm Basis transcoder (~500 KB) là thêm chi phí để nén không gì.

Mipmap: 61/61 sinh chuỗi, **61/61 dùng thật**, lãng phí **0 MB**. Bản đồ địa hình
512² dùng chung cho **192 mesh**.

Guard mới: `mipWastedMB` phải bằng **0**. Bắt lỗi `generateMipmaps=true` +
`minFilter=LinearFilter` — cấp phát 4/3 bộ nhố mip rồi không dùng, mặt đất rung ở
xa, mà không có triệu chứng nào khác. Đã chứng minh bắt được: phá 3 texture →
báo `4 MB / 3 chiếc`.

Chi tiết và số liệu: `document/perf-budget.md`.
