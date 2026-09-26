import { defineConfig } from 'vite';

// Yellow Cat Loves Mars — cấu hình Vite
// `strictPort` để báo lỗi ngay thay vì tự nhảy port (tránh tranh chấp với
// các tiến trình preview còn sót).  `hmr` khai báo tường minh host/port/protocol
// nên client luôn nối đúng chỗ, kể cả khi trang được mở bằng IP LAN.
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: { host: 'localhost', port: 5173, protocol: 'ws' },
  },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: { target: 'es2020' },
});
