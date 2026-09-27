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
