# Đánh giá đồ họa — Yellow Cat Loves Mars

**URL đã trải nghiệm:** https://nongtiensonpro.github.io/Yellow-Cat-Loves-Mars/  
**Ngày đánh giá:** 27/09/2026  
**Phạm vi:** Trải nghiệm màn hình giới thiệu, chọn phương tiện, gameplay Arcadia Planitia, bão bụi, camera orbit tự do, photo mode, bản đồ, nhật ký, trợ giúp và kiểm tra bundle WebGL công khai.

## Kết luận nhanh

Đây là một **prototype stylized có bản sắc tốt**, không phải sản phẩm thiếu ý tưởng. Mèo vàng, Sao Hỏa, rover/xe máy/xe đạp, bản đồ quỹ đạo và hệ thống nhật ký tạo được “hook” riêng. Nhưng nếu lấy game AAA làm chuẩn hình ảnh, phiên bản hiện tại còn cách rất xa ở **độ phong phú của thế giới, chất lượng asset, vật liệu, animation, ánh sáng, hiệu ứng khí quyển, camera và độ hoàn thiện cảnh**.

- **Bản sắc / art direction:** 7/10
- **Độ đọc hình ảnh và UI:** 6.5/10
- **Chất lượng model/texture hiện tại:** 3.5/10
- **Chiếu sáng / vật liệu / không khí:** 3.5/10
- **Mật độ và độ phong phú môi trường:** 2.5/10
- **Mức gần AAA về đồ họa:** 2.5/10
- **Tiềm năng sau khi nâng cấp đúng hướng:** 7.5–8.5/10 trên WebGL; AAA thực thụ cần engine/native pipeline, ngân sách asset và tối ưu lớn hơn.

> Điểm nghẽn lớn nhất không phải là “thiếu một hiệu ứng”, mà là **cảnh đang được cảm nhận như một mặt phẳng procedural trống với vài vật thể minh họa**. Cần nâng cấp composition, silhouette, vật liệu, landmark và ánh sáng theo hệ thống.

## Những gì đang làm tốt

1. **Concept dễ nhớ:** “Mèo vàng yêu Sao Hỏa” có nhận diện tốt hơn một sci-fi generic.
2. **Bảng màu nhất quán:** cam/đỏ/nâu tạo mood Mars ngay lập tức.
3. **UI có ngôn ngữ riêng:** thẻ kính tối, vàng nhấn, icon và microcopy tiếng Việt tạo cảm giác sản phẩm có chủ đích.
4. **Gameplay loop có nền tảng:** khám phá, dấu chân, thẻ khám phá, vùng đất, ảnh, phương tiện và nhật ký.
5. **Có nền tảng kỹ thuật tốt:** WebGL renderer dùng antialiasing, `powerPreference: "high-performance"`, pixel ratio giới hạn 2, shadow map và tone mapping kiểu ACES; có InstancedMesh, Standard/Physical/Shader material trong bundle.
6. **Có biến thiên trạng thái:** bão bụi, đổi giờ, camera, photo mode giúp cảnh không hoàn toàn tĩnh.

## Vấn đề quan sát trực tiếp

### 1. Mặt đất và địa hình

- Mặt đất chiếm gần như toàn bộ viewport nhưng đọc như một texture/procedural pattern lặp, thiếu macro-form và micro-detail có ý nghĩa.
- Đường chân trời phẳng; silhouette địa hình chưa tạo cảm giác Arcadia Planitia, Olympus Mons hay Valles Marineris.
- Thiếu đá lớn, miệng hố, vệt bánh xe, lớp trầm tích, cồn bụi, đá bazan và biến đổi độ cao để tạo scale.
- Bóng của rover có nhưng còn mềm/đơn giản; tiếp xúc bánh–đất chưa đủ nặng.

**Ưu tiên:** tạo 3 lớp địa hình: macro heightfield, decal/vertex detail trung bình, normal/roughness detail cận cảnh. Mỗi biome phải có silhouette riêng trước khi thêm shader.

### 2. Vật liệu và texture

- Các asset đang thiên về màu phẳng và hình học low-poly; phù hợp stylized nhưng chưa đủ “premium”.
- Chưa thấy biểu hiện rõ của PBR hoàn chỉnh: albedo, normal, roughness, AO, height/displacement theo vật liệu.
- Rover là điểm nhìn trung tâm nhưng thiếu bevel/edge highlight, kính cabin, kim loại sơn, bụi bám, vết xước và phân tách vật liệu.
- Mèo phi hành gia chưa có lông/cloth/visor/decals đủ chi tiết ở cự ly gần.

**Ưu tiên:** làm lại 3 hero asset trước: Mèo, rover, xe máy. Mỗi asset cần high-poly sculpt → bake normal/AO → texture PBR 2K/4K → LOD → animation rig.

### 3. Ánh sáng, màu và không khí

- Bầu trời đỏ rất mạnh nhưng dễ làm toàn cảnh bị đơn sắc; foreground/background chưa tách đủ lớp.
- Chưa có cảm giác ánh sáng mặt trời Sao Hỏa với bóng dài, rim light, bounce đỏ/cam và tương phản theo thời gian.
- Bão bụi hiện đọc như overlay/particle đơn giản hơn là thể tích khí quyển.
- Bundle có fog, shadow map, ACES exposure nhưng không thấy bloom hoặc post-processing pipeline đáng kể; đây là khoảng trống lớn cho cảm giác cinematic.

**Ưu tiên:** thêm color grading theo biome/thời điểm, volumetric dust giả lập bằng layered particles + depth fade, sun shafts nhẹ, contact shadow, sky gradient/LUT và bloom chỉ dùng cho nguồn sáng/visor/đèn rover.

### 4. Môi trường và storytelling bằng hình ảnh

- Gameplay đầu tiên rất trống: rover đứng giữa mặt đất rộng, ít điểm hút mắt ngoài bản thân xe.
- Các địa danh được giới thiệu ở landing page nhưng chưa hiện diện đủ mạnh trong gameplay.
- Cần tạo “vista” và mục tiêu thị giác: núi xa, thung lũng, beacon, trạm nghiên cứu, xác tàu, hang dung nham, cột đá, hẻm vực.
- Mỗi 30–60 giây di chuyển nên có một discovery hoặc landmark mới.

**Ưu tiên:** xây 5 biome như 5 bộ kit môi trường độc lập, mỗi bộ có 1 landmark lớn, 3 landmark vừa, 8–12 prop nhỏ, decal và palette riêng.

### 5. Animation, camera và cảm giác điều khiển

- Camera thứ ba hiện hữu ích nhưng chưa đạt cảm giác quay phim AAA: cần framing theo tốc độ, va chạm địa hình, camera lag có kiểm soát, FOV động khi boost và rung rất nhẹ khi bánh chạm đất.
- Phương tiện cần suspension, wheel rotation đúng tốc độ, dust trail phụ thuộc lực kéo, body lean khi rẽ và phản hồi khi va chạm.
- Mèo cần idle animation, look-at, phản ứng khi tăng tốc/đổi địa hình/chụp ảnh.
- Photo mode là nền tảng tốt; cần thêm DOF, exposure, focal length, vignette, LUT và pose camera.

### 6. UI/UX trực quan

- UI có cá tính nhưng nhiều chip/nút cùng lúc làm viewport bị cạnh tranh, nhất là trên gameplay.
- Trợ giúp/journal/map tốt cho prototype nhưng cần trạng thái mở/đóng nhất quán và tránh che nhân vật trong lúc chơi.
- Minimap đang hữu ích nhưng chưa kể được địa hình; nên có contour, landmark, route và vùng đã khám phá.
- Cần preset đồ họa: Low / Medium / High / Cinematic, cùng hiển thị FPS và render scale.

## Lộ trình nâng cấp theo tác động

### P0 — 1–2 tuần: “Không còn cảm giác prototype trống”

1. Đặt 1 landmark lớn nhìn thấy ngay từ điểm spawn.
2. Tăng mật độ đá/đá vụn/địa hình theo vùng, dùng instancing nhưng phân bố có chủ đích.
3. Thêm decal vệt bánh, bụi, đá, crater và ambient occlusion giả lập.
4. Làm lại material đất với macro color variation + normal detail + roughness variation.
5. Giảm HUD khi đang lái; giữ tốc độ, tọa độ, mục tiêu và minimap tối giản.
6. Cân lại bầu trời để đất không bị chìm vào một mảng cam đồng nhất.

### P1 — 3–6 tuần: “Stylized premium”

1. Hero asset rover/mèo/xe máy với PBR, bevel, LOD và animation.
2. Cascaded shadow hoặc ít nhất shadow theo vùng quan trọng; contact shadow dưới xe.
3. Post-processing nhẹ: SSAO/SSGI giả lập, bloom chọn lọc, vignette, color grading, TAA/FXAA.
4. Terrain chunk streaming và LOD để tăng draw distance mà vẫn giữ FPS.
5. Bão bụi nhiều lớp: hạt gần, haze trung, silhouette xa; không dùng một overlay đồng nhất.
6. Landmark kit cho Arcadia và một khu Valles Marineris có canyon silhouette rõ.

### P2 — 6–12 tuần: “Cinematic WebGL”

1. Chuẩn hóa art bible: scale, palette, roughness range, lighting reference, silhouette rules.
2. Tạo sky/atmosphere system theo giờ và thời tiết; sun angle ảnh hưởng bóng, màu và fog.
3. Thêm volumetric-looking lighting, heat haze nhẹ, dust accumulation trên xe.
4. Animation graph cho phương tiện và nhân vật; camera state theo tốc độ/địa hình.
5. Discovery presentation: âm thanh, particle burst, camera focus và journal card khi đến landmark.
6. Performance budget: draw calls, triangles, texture memory, shader variants, frame time trên laptop/mobile.

## Mục tiêu kỹ thuật đề xuất cho WebGL

| Hạng mục | Mục tiêu thực tế |
|---|---:|
| Desktop target | 60 FPS ở 1080p, preset High |
| Mobile target | 30–45 FPS, render scale động 0.7–0.9 |
| Frame time | <16.6 ms desktop; <25–33 ms mobile |
| Texture | KTX2/Basis, mipmap, ưu tiên 1K/2K; chỉ hero asset 4K |
| Shadow | 2048 cho hero light; cascade/region-aware nếu có thể |
| Cảnh | Instancing, frustum culling, chunk streaming, LOD/HLOD |
| Post FX | TAA/FXAA + AO nhẹ + bloom chọn lọc; tránh stack hiệu ứng nặng |
| Lighting | PBR + environment/sky lighting + contact shadow |
| Debug | GPU timing, draw calls, triangles, texture memory, shader compile |

## Kiến trúc rendering nên giữ và nên bổ sung

**Nên giữ:** Three.js/WebGL, instancing, procedural generation, shadow map, ACES tone mapping, giới hạn pixel ratio, tải module gameplay lười (lazy load). Đây là lựa chọn hợp lý cho một game web nhẹ.

**Nên bổ sung:**

- KTX2/Basis texture compression và mipmaps.
- GLTF/GLB pipeline cho hero asset, kèm Draco/Meshopt nếu cần.
- Material authoring có roughness/normal/AO rõ ràng.
- Render target cho post-processing có kiểm soát.
- Terrain chunk + LOD + deterministic seed.
- TAA/temporal jitter hoặc FXAA tùy thiết bị.
- GPU profiling và preset chất lượng.

## Định hướng mỹ thuật khuyến nghị

Không nên biến trò chơi thành bản sao photorealistic nặng nề. Hướng phù hợp nhất là **stylized cinematic Mars**:

- Hình học vẫn có chút low-poly để giữ cá tính.
- Texture và lighting đạt độ giàu chi tiết như game premium.
- Mèo là điểm đáng yêu, rover là vật thể “đồ chơi cao cấp”, còn Sao Hỏa là sân khấu lớn có scale.
- Palette không chỉ đỏ/cam: thêm tím lạnh trong bóng, xanh xám ở đá, vàng sulfur, trắng băng và teal rất tiết chế cho công nghệ.
- Mỗi landmark phải đọc được ở silhouette trước, sau đó mới cần texture.

## Thứ tự đầu tư nếu nguồn lực hạn chế

1. **Rover + mèo + camera** — người chơi nhìn chúng mọi lúc.
2. **Địa hình và landmark** — quyết định cảm giác thế giới có thật hay không.
3. **Ánh sáng và atmosphere** — rẻ hơn tạo hàng trăm asset nhưng tác động toàn cảnh.
4. **Đất/đá PBR và decal** — nâng chất lượng cận cảnh.
5. **Animation/feedback** — biến di chuyển từ “đang trượt” thành “đang lái”.
6. **UI polish và photo mode** — củng cố cảm giác sản phẩm hoàn thiện.

## Kết luận cuối

Yellow Cat Loves Mars có nền móng đáng nâng cấp: concept rõ, UI có cá tính, gameplay loop đã hình thành và renderer có các tính năng cơ bản cần thiết. Để tiến tới chuẩn AAA về **cảm nhận đồ họa**, không cần bắt đầu bằng việc tăng polygon mọi thứ. Cần làm theo thứ tự:

> **Silhouette & composition → hero assets → PBR/material → lighting/atmosphere → environment density → animation/feedback → post-processing → optimization.**

Nếu hoàn thành P0 và P1, trò chơi có thể chuyển từ **prototype procedural** sang **stylized premium WebGL**. Muốn đạt hình ảnh AAA photorealistic tương đương console/PC hiện đại, nên cân nhắc Babylon.js/WebGPU hoặc Unreal/Unity native cho bản desktop; còn bản web nên lấy mục tiêu **AAA-inspired art direction với ngân sách hiệu năng rõ ràng**, thay vì cố mô phỏng toàn bộ pipeline AAA.
