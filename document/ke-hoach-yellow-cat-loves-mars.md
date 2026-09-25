# 🪐 Kế Hoạch Dự Án: Yellow Cat Loves Mars — Website Tĩnh Khám Phá Sao Hỏa

> **Slogan:** *“Mèo Vàng đạp xe trên Sao Hỏa — một hành trình không cần tên lửa.”*
> **Loại hình:** Website tĩnh (Static Website) — Không backend, không database
> **Trọng tâm công nghệ:** WebGL / WebGPU + JavaScript + 3D + Bản đồ + Procedural Generation
> **Trạng thái:** Giai đoạn lập kế hoạch — v0.1

---

## 1. Tầm Nhìn & Tinh Thần Dự Án

### 1.1. Ý tưởng cốt lõi
Biến một website tĩnh thành một **“thế giới mở mini”** trên Sao Hỏa, nơi người dùng vào vai **Mèo Vàng (Yellow Cat)** — một nhà thám hiểm đáng yêu — tự do di chuyển trên bề mặt hành tinh đỏ bằng những phương tiện rất đời thường: **xe đạp, xe máy, ô tô / rover**. Sự tương phản giữa phương tiện trái đất và địa hình ngoài hành tinh tạo nên chất thơ, hài hước và cảm giác phiêu lưu độc đáo.

Không phải game bắn súng, không phải mô phỏng khô khan — đây là **trải nghiệm thiền định + khám phá (zen exploration)**.

### 1.2. Mục tiêu trải nghiệm
- Người dùng cảm thấy **đang thực sự ở trên Sao Hỏa**: chân trời cong, bầu trời cam hồng, bão bụi, hẻm núi khổng lồ.
- Cảm giác **tự do tuyệt đối**: không nhiệm vụ bắt buộc, không giới hạn thời gian — chỉ có bản đồ và sự tò mò.
- Có thể chạy mượt ngay trên trình duyệt, không cần cài đặt, không cần đăng nhập.

### 1.3. Giá trị khác biệt
- **Lấy cảm hứng từ dữ liệu thật** (địa hình NASA) nhưng được kể lại bằng ngôn ngữ nghệ thuật và procedural generation.
- **Static-first**: toàn bộ thế giới được đóng gói thành file tĩnh, có thể host ở bất kỳ đâu (GitHub Pages, Cloudflare Pages, Vercelle, Netlify) với chi phí gần như bằng 0.
- **Tính biểu tượng**: Mèo Vàng là linh vật xuyên suốt, tạo bản sắc thương hiệu.

---

## 2. Đối Tượng Người Dùng

| Nhóm | Nhu cầu |
|------|---------|
| **Người yêu vũ trụ / Sao Hỏa** | Muốn “đặt chân” lên Sao Hỏa theo cách trực quan, không cần đọc báo cáo khoa học khô khan |
| **Học sinh - sinh viên** | Khám phá địa hình, học về Olympus Mons, Valles Marineris qua trải nghiệm tương tác |
| **Người yêu mèo / aesthetic** | Bị thu hút bởi hình tượng Mèo Vàng cute trên nền không gian hùng vĩ |
| **Dev / Designer tò mò** | Muốn xem cách WebGL/WebGPU biến website tĩnh thành thế giới 3D |

---

## 3. Trải Nghiệm Cốt Lõi (Core Loop)

```
Vào trang → Chọn phương tiện (xe đạp / xe máy / rover) → Xuất hiện trên bề mặt Sao Hỏa
→ Tự do di chuyển (WASD / Joystick / Vuốt) → Khám phá địa điểm → Thu thập “Dấu chân Mèo” → Mở khóa thông tin / góc nhìn mới
→ Chụp ảnh (Photo Mode) → Chia sẻ
```

Không có “thua cuộc”. Chỉ có **đi càng xa, thấy càng nhiều**.

---

## 4. Thế Giới Sao Hỏa — Thiết Kế Địa Hình

### 4.1. Triết lý địa hình: “Thật làm gốc, mơ làm cánh”
- **Gốc thật:** Lấy cảm hứng từ dữ liệu độ cao thực tế của NASA:
  - **MOLA (Mars Orbiter Laser Altimeter)** — bản đồ độ cao toàn cầu.
  - **HiRISE / CTX** — texture chi tiết cho khu vực tiêu biểu.
  - Không cần tải toàn bộ hành tinh — chỉ chọn **3–5 vùng biểu tượng** để tái hiện thu nhỏ.
- **Cánh mơ:** Dùng **Procedural Generation** để lấp đầy chi tiết: đồi cát, đá rải rác, hẻm nứt, cồn bụi — giúp thế giới vừa chân thực vừa vô hạn mà không tốn dung lượng.

### 4.2. Các vùng đất đề xuất (Biomes Sao Hỏa)

| Vùng | Cảm hứng thực tế | Đặc trưng trải nghiệm |
|------|-------------------|------------------------|
| **Đồng bằng Arcadia** | Vùng đồng bằng phía bắc bằng phẳng | Nơi khởi đầu lý tưởng cho xe đạp — bình minh cam hồng, đường chân trời vô tận |
| **Hẻm Valles Marineris** | Hẻm núi lớn nhất hệ mặt trời (dài ~4000km) | Vực sâu, vách đá dựng đứng — thử thách cho xe máy leo dốc, cảm giác choáng ngợp |
| **Núi Olympus Mons** | Núi lửa cao nhất (22km) | Chinh phục đỉnh — càng lên cao, bầu trời càng sẫm, tầm nhìn càng hùng vĩ |
| **Cực Băng Nam (Planum Australe)** | Chỏm băng CO2 | Địa hình trắng - cam kỳ ảo, hiệu ứng băng phản chiếu |
| **Sa mạc Bão Bụi (Dust Storm Zone)** | Vùng thường có bão bụi toàn cầu | Hiệu ứng bão bụi che mờ, tầm nhìn giảm — tăng tính điện ảnh |

> Mỗi vùng là một “chapter” trên bản đồ, người dùng có thể dịch chuyển nhanh (fast travel) bằng bản đồ quỹ đạo.

### 4.3. Chi tiết vi mô (Procedural)
- Đá đủ hình dạng rải ngẫu nhiên, vết bánh xe lưu lại trên cát.
- Cồn cát gợn sóng theo hướng gió.
- Hố va chạm (crater) lớn nhỏ với vành đá văng.
- Bầu trời chuyển màu theo giờ (bình minh → trưa → hoàng hôn → đêm sao).

---

## 5. Phương Tiện — Linh Hồn Của Sự Tự Do

| Phương tiện | Tốc độ | Cảm giác | Địa hình phù hợp | Đặc điểm vui |
|-------------|--------|----------|-------------------|--------------|
| **🚲 Xe đạp Mèo Vàng** | Chậm, chill | Thư thái, nghe tiếng xích kêu, ngắm cảnh | Đồng bằng, cồn cát nhẹ | Có giỏ mây phía trước chở “bình oxy hình cá” |
| **🏍️ Xe máy Sao Hỏa** | Trung bình - nhanh | Phiêu lưu, lướt gió bụi | Hẻm núi, dốc vừa | Để lại vệt bụi dài, có thể “bốc đầu” nhẹ khi leo dốc |
| **🚙 Rover / Ô tô thám hiểm** | Ổn định, chậm hơn xe máy nhưng bám đường tốt | An toàn, như nhà thám hiểm thực thụ | Mọi địa hình, đặc biệt dốc cao Olympus | Có ăng-ten, đèn pha, cabin kính nhìn thấy Mèo Vàng đội mũ phi hành |

**Cơ chế chung:**
- Chuyển đổi phương tiện tức thì tại “Trạm Mèo” rải rác trên bản đồ (không cần load lại trang).
- Mỗi phương tiện có âm thanh riêng, rung lắc riêng, và góc camera riêng.
- Có chế độ **Góc nhìn thứ nhất (First-person)** và **Góc nhìn thứ ba (Third-person)**.

---

## 6. Tính Năng Chính (Feature List)

### 6.1. Nhóm Khám Phá
- **Di chuyển tự do** bằng bàn phím / joystick ảo / vuốt trên mobile.
- **Bản đồ quỹ đạo mini-map:** Nhìn từ trên cao toàn bộ vùng, hiển thị vị trí hiện tại, các điểm quan tâm (POI).
- **Hệ thống “Dấu Chân Mèo” (Paw Prints):** Thu thập các điểm sáng rải rác — mỗi điểm mở khóa một thẻ thông tin thú vị về Sao Hỏa (ví dụ: “Olympus Mons cao gấp 3 lần Everest”).
- **Chế độ Photo Mode:** Tạm dừng, xoay camera tự do, chụp ảnh màn hình kèm khung “Yellow Cat on Mars”.

### 6.2. Nhóm Giáo Dục Nhẹ
- **Thẻ tri thức (Discovery Cards):** Khi đến gần địa danh, hiện popup nhỏ với hình ảnh thật từ NASA + 1-2 câu fact thú vị, giọng văn đáng yêu của Mèo Vàng.
- **So sánh Trái Đất - Sao Hỏa:** Nút “Nếu ở Trái Đất…” cho thấy cùng địa hình đó trên Trái Đất sẽ trông thế nào.

### 6.3. Nhóm Cảm Xúc & Nghệ Thuật
- **Nhạc nền động (Adaptive Audio):** Nhạc ambient thay đổi theo tốc độ và vùng đất — chậm rãi khi đạp xe ngắm hoàng hôn, dồn dập khi lao xuống hẻm núi.
- **Hiệu ứng thời tiết:** Bão bụi bất chợt, sao băng đêm, mặt trời xanh lúc hoàng hôn (hiện tượng có thật trên Sao Hỏa).
- **Nhật ký Mèo Vàng:** Một cuốn sổ nhỏ trong giao diện, ghi lại “Hôm nay Mèo đã đi được X km, thấy Y điều kỳ diệu”.

### 6.4. Nhóm Kỹ Thuật Tĩnh
- **Không cần đăng nhập:** Tiến trình lưu bằng LocalStorage (quãng đường, ảnh chụp, thẻ đã mở).
- **Chia sẻ:** Nút chia sẻ ảnh chụp + tọa độ (“Tôi vừa đạp xe qua Valles Marineris cùng Mèo Vàng!”).
- **Tối ưu offline:** Toàn bộ tài nguyên có thể cache (PWA) để lần sau vào lại không cần tải lại.

---

## 7. Thiết Kế Giao Diện & Nghệ Thuật

### 7.1. Phong cách thị giác
- **Tông màu:** Cam đất, nâu đỏ, hồng bụi, vàng ấm — đúng màu Sao Hỏa, kết hợp điểm nhấn vàng - trắng của Mèo Vàng.
- **Mèo Vàng:** Thiết kế chibi / low-poly đáng yêu, đội mũ phi hành trong suốt, khăn quàng bay trong gió.
- **UI tối giản, trong suốt:** Các nút điều khiển mờ, không che cảnh quan. Font chữ tròn, mềm.

### 7.2. Layout website
1.  **Màn hình Chào (Landing):** Toàn cảnh Sao Hỏa từ quỹ đạo, Mèo Vàng vẫy tay, nút “Bắt đầu hành trình”.
2.  **Màn hình Chọn Phương Tiện:** 3 thẻ xe với animation xoay 360°.
3.  **Thế giới 3D chính:** Canvas toàn màn hình + HUD tối giản (tốc độ, mini-map, la bàn).
4.  **Bản đồ Quỹ Đạo (Overlay):** Mở bằng phím M / nút góc phải.
5.  **Bộ sưu tập (Collection):** Xem lại các Discovery Cards và ảnh đã chụp.

### 7.3. Responsive
- Desktop: Điều khiển WASD + chuột xoay camera.
- Mobile/Tablet: Joystick ảo + vuốt xoay, nút bấm lớn, giảm chi tiết 3D để giữ mượt.

---

## 8. Công Nghệ — Định Hướng (Không Đi Sâu Code)

- **Nền tảng:** Website tĩnh thuần túy (HTML/CSS/JS), build ra các file tĩnh, host bất kỳ đâu.
- **Đồ họa 3D:**
  - Ưu tiên **WebGL** (độ phủ rộng) với khả năng nâng cấp **WebGPU** khi trình duyệt hỗ trợ.
  - Thư viện 3D phổ biến (ví dụ Three.js / Babylon.js) để dựng địa hình, phương tiện, bầu trời.
  - Địa hình dạng **Heightmap + Shader** — biến ảnh độ cao thành núi đồi 3D.
- **Procedural Generation:** Thuật toán nhiễu (noise) tạo chi tiết địa hình vô hạn từ một vài texture gốc — giúp website nhẹ nhưng thế giới vẫn rộng.
- **Tối ưu hiệu năng:**
  - Chia địa hình thành các ô (chunk) — chỉ tải ô gần người chơi.
  - Giảm chi tiết ở xa (LOD).
  - Nén texture, dùng định dạng hiện đại (WebP, KTX2).
- **Âm thanh:** Web Audio API.
- **Lưu trữ cục bộ:** LocalStorage / IndexedDB cho tiến trình.

> Toàn bộ tài nguyên (model, texture, âm thanh) được đóng gói sẵn lúc build — không cần server.

---

## 9. Cấu Trúc Website Đề Xuất

```
yellow-cat-loves-mars/
├── index.html              # Trang chính - thế giới 3D
├── assets/
│   ├── textures/           # Texture Sao Hỏa, bầu trời
│   ├── models/             # Model Mèo, xe đạp, xe máy, rover (glTF)
│   ├── heightmaps/         # Ảnh độ cao MOLA đã tối ưu
│   └── audio/              # Nhạc nền, hiệu ứng
├── styles/                 # Giao diện
├── app/                    # Logic JavaScript (module)
└── document/               # Tài liệu (thư mục hiện tại)
```

---

## 10. Lộ Trình Phát Triển (Roadmap)

### Giai đoạn 1 — Nền Móng (MVP) ⏱️ 2–3 tuần
- [ ] Dựng canvas 3D toàn màn hình, bầu trời Sao Hỏa, ánh sáng.
- [ ] Tạo một đồng bằng procedural đơn giản (Arcadia) có thể di chuyển.
- [ ] Thêm 1 phương tiện (Rover) với điều khiển cơ bản.
- [ ] Mini-map và la bàn.

### Giai đoạn 2 — Thế Giới Sống Động ⏱️ 3–4 tuần
- [ ] Thêm xe đạp & xe máy, chuyển đổi phương tiện.
- [ ] Mở rộng 3 vùng đất (Valles Marineris, Olympus Mons).
- [ ] Hiệu ứng bụi, vết bánh xe, đá procedural.
- [ ] Discovery Cards + âm thanh theo vùng.

### Giai đoạn 3 — Cảm Xúc & Chia Sẻ ⏱️ 2–3 tuần
- [ ] Photo Mode, chia sẻ ảnh.
- [ ] Nhật ký Mèo Vàng, hệ thống Dấu Chân.
- [ ] Nhạc nền adaptive, bão bụi, sao băng.
- [ ] Tối ưu mobile + PWA offline.

### Giai đoạn 4 — Đánh Bóng & Ra Mắt ⏱️ 1–2 tuần
- [ ] Tối ưu hiệu năng, nén tài nguyên, kiểm thử đa trình duyệt.
- [ ] Landing giới thiệu + trailer ngắn.
- [ ] Deploy lên hosting tĩnh, gắn domain.

---

## 11. Tiêu Chí Thành Công

| Tiêu chí | Mục tiêu |
|----------|----------|
| **Cảm giác** | Người dùng thốt lên “đẹp quá” trong 10 giây đầu |
| **Hiệu năng** | 60 FPS trên laptop phổ thông, 30+ FPS trên điện thoại tầm trung |
| **Dung lượng** | Lần tải đầu < 15MB, lần sau < 2MB (nhờ cache) |
| **Khả năng chia sẻ** | Người dùng chụp và chia sẻ ảnh là hành vi tự nhiên |
| **Tính tĩnh** | Có thể chạy hoàn toàn bằng cách mở file `index.html` hoặc host tĩnh bất kỳ |

---

## 12. Rủi Ro & Cách Ứng Phó

| Rủi ro | Ứng phó |
|--------|---------|
| Địa hình quá nặng, load chậm | Chỉ chọn vùng tiêu biểu, dùng heightmap nén + procedural thay vì tải toàn bộ NASA data |
| Thiết bị yếu không chạy nổi 3D | Có chế độ “Nhẹ” — giảm chất lượng bóng, tắt procedural chi tiết |
| Người dùng lạc, không biết đi đâu | Thêm “Mũi tên Mèo” chỉ hướng đến POI gần nhất + bản đồ luôn hiển thị |
| Thiếu cảm giác chân thực | Tham khảo ảnh thật HiRISE, mời cộng đồng góp ý, thêm fact khoa học đáng tin |

---

## 13. Nguồn Cảm Hứng & Tham Khảo

- Dữ liệu: **NASA Mars Trek, MOLA Science Team, HiRISE**
- Trải nghiệm: *Journey, Firewatch, Tiny Wings* (tinh thần zen exploration)
- Kỹ thuật: Các demo WebGL terrain, procedural planet

---

## 14. Ghi Chú Cho Giai Đoạn Triển Khai

- File kế hoạch này **không mô tả code chi tiết** theo yêu cầu — mọi quyết định kỹ thuật cụ thể sẽ được ghi trong tài liệu kỹ thuật riêng khi bắt đầu code.
- Khi bắt đầu code, cần tuân thủ nguyên tắc: **“Tĩnh tuyệt đối, mượt là ưu tiên số 1, đẹp là ưu tiên số 2”**.
- Linh vật Mèo Vàng cần được thiết kế nhất quán từ đầu (bộ nhận diện: màu lông, mũ, khăn).

---

*Người lập kế hoạch: Hermes Agent — theo yêu cầu “Yellow Cat Loves Mars”*
*Ngày tạo: 2026-09-25*
*Vị trí lưu: `D:\Yellow cat loves Mars\document\ke-hoach-yellow-cat-loves-mars.md`*
