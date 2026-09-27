import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import { createHash } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Plugin: sinh precache manifest cho Service Worker từ OUTPUT THẬT của Vite.
//
// Vì sao cần: tên file sau build có HASH (/assets/main-Bxxxx.js). Danh sách
// precache ghi cứng đường dẫn source sẽ 404 trên GitHub Pages → caches.addAll()
// từ chối → SW không bao giờ cài được → mất offline. Plugin này liệt kê file
// thật trong dist/ sau khi build rồi ghi ra dist/precache.json.
// ─────────────────────────────────────────────────────────────────────────────
function injectSwManifest() {
  let outDir = 'dist';
  return {
    name: 'inject-sw-manifest',
    apply: 'build',
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      const root = join(process.cwd(), outDir);
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          if (name === 'precache.json') continue;
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push('./' + posix.join(relative(root, full).split('\\').join('/')));
        }
      };
      walk(root);
      files.sort();

      // BUILD_ID = hash nội dung → đổi bất kỳ file nào thì cache SW cũ bị hạ.
      const buildId = createHash('sha1')
        .update(files.map((f) => f + ':' + statSync(join(root, f.slice(2))).size).join('|'))
        .digest('hex').slice(0, 12);

      writeFileSync(join(root, 'precache.json'), JSON.stringify(files, null, 2));

      // Bỏ thuộc tính `crossorigin` khỏi <script>/<link> trong index.html.
      // Lý do: asset cùng origin không cần CORS, nhưng Vite vẫn gắn
      // crossorigin -> request có mode='cors'. Khi offline, Service Worker trả
      // response từ cache (fetch bằng request same-origin, không kèm header
      // CORS) -> trình duyệt chặn với net::ERR_FAILED dù cache có dữ liệu.
      const idxPath = join(root, 'index.html');
      const html = readFileSync(idxPath, 'utf8')
        .replace(/\s+crossorigin(=["'][^"']*["'])?(?=[\s/>])/g, '');
      writeFileSync(idxPath, html);
      const swPath = join(root, 'sw.js');
      writeFileSync(swPath, readFileSync(swPath, 'utf8').replace('__BUILD_ID__', buildId));

      // eslint-disable-next-line no-console
      console.log(`\n  sw-manifest: ${files.length} file, build id ${buildId}`);
    },
  };
}

// Yellow Cat Loves Mars — cấu hình Vite
//
// `base: './'` giữ asset path tương đối nên build chạy được ở cả
// https://<user>.github.io/Yellow-Cat-Loves-Mars/ lẫn file mở trực tiếp.
// `strictPort` báo lỗi ngay thay vì tự nhảy port; `hmr` khai báo tường minh
// host/port/protocol nên client luôn nối đúng chỗ, kể cả khi mở bằng IP LAN.
export default defineConfig({
  base: './',
  plugins: [injectSwManifest()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: { host: 'localhost', port: 5173, protocol: 'ws' },
  },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: { target: 'es2020' },
});
