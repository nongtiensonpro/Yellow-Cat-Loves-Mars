// Yellow Cat Loves Mars — Service Worker (offline PWA)
//
// Vấn đề đã gặp (v0.5): danh sách precache ghi cứng đường dẫn SOURCE
// (./app/main.js, ./styles/main.css…) trong khi Vite build ra tên có HASH
// (/assets/main-Bxxxx.js). Trên `vite preview` các URL sai đó trả về index.html
// (SPA fallback) nên cache "thành công" nhưng toàn HTML; trên GitHub Pages
// không có fallback -> 404 -> caches.addAll() từ chối -> SW KHÔNG BAO GIỜ
// cài được -> mất offline.
//
// Cách sửa: danh sách precache do Vite plugin (inject-sw-manifest) sinh ra ở
// thời điểm build từ output thật, nạp qua PRECACHE_MANIFEST_URL. Nếu không có
// manifest (chạy dev) thì SW bỏ qua bước precache và chỉ cache khi runtime.

const CACHE = 'yc-mars-v6';
const BUILD_ID = '__BUILD_ID__';

// Danh sách file thật của bản build, do plugin sinh (mảng đường dẫn tương đối).
// LƯU Ý: không dùng top-level await ở đây — service worker script mặc định là
// script CỰC (classic), không phải ES module, nên `await` ở top-level sẽ ném
// SyntaxError và SW không bao giờ cài được. Vì vậy việc đọc manifest nằm
// trong event 'install'.
// Vite gắn thuộc tính `crossorigin` cho <script type="module"> và <link> trong
// index.html, nên các request đó có mode='cors'. Response lưu trong cache được
// SW fetch bằng request same-origin nên KHÔNG có header CORS — trả lại nguyên
// trạng sẽ bị trình duyệt chặn (net::ERR_FAILED) dù cache có dữ liệu.
// Bọc lại response kèm header CORS khi phục vụ từ cache.
// <script type="module"> LUÔN có mode='cors' (theo spec, không phụ thuộc thuộc
// tính crossorigin). Response SW trả về phải vượt kiểm tra CORS, nên ta đóng gói
// sẵn bản sao có header ACAO ngay lúc CÀI (dùng blob để buffer đầy đủ, tránh
// vấn đề ReadableStream bị "disturbed" khi dựng Response từ body đã đọc).
async function withCors(res) {
  const h = new Headers(res.headers);
  h.set('access-control-allow-origin', '*');
  // PHẢI bỏ content-encoding / content-length.
  // Khi SW fetch, trình duyệt GIẢI NÉN body rồi đưa vào cache, nhưng header
  // `content-encoding: gzip` vẫn còn nguyên. Lúc phục vụ lại, trình duyệt thấy
  // header gzip và thử giải nén body đã giải nén -> hỏng -> net::ERR_FAILED.
  // Đây chính là lý do PWA "đăng ký SW thành công" nhưng vẫn hỏng khi offline.
  h.delete('content-encoding');
  h.delete('content-length');
  h.delete('transfer-encoding');
  // Bỏ `vary`: server dev hay gửi `vary: Origin`. Khi đó Cache API so khớp
  // request theo header Origin, mà request của <script type="module"> khác
  // request SW dùng lúc cài -> cache.match() TRƯỢT -> SW rơi về network ->
  // offline thì ERR_FAILED.
  h.delete('vary');
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: h });
}

async function loadPrecache() {
  try {
    const res = await fetch('./precache.json', { cache: 'reload' });
    if (res.ok) return await res.json();
  } catch { /* dev hoặc offline: bỏ qua precache */ }
  return [];
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const precache = await loadPrecache();
    const cache = await caches.open(CACHE);
    // Ghi từng mục riêng: một URL hỏng KHÔNG được làm hỏng cả SW install.
    await Promise.all(precache.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        // Chỉ nhận đúng nội dung thật — chặn SPA fallback trả HTML cho JS/CSS.
        // (index.html là ngoại lệ: nó CẦN được cache để chạy offline.)
        const ct = res.headers.get('content-type') || '';
        const isHtml = /text\/html/.test(ct);
        const isDoc = /\.html$|^\/$/.test(url);
        if (res.ok && (isHtml === isDoc)) await cache.put(url, await withCors(res.clone()));
      } catch { /* bỏ qua mục lỗi */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Điều hướng: network-first rồi mới về cache, để luôn nhận bản mới khi online.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', res.clone());
        return res;
      } catch {
        const cache = await caches.open(CACHE);
        const hit = await cache.match('./index.html');
        return hit || Response.error();
      }
    })());
    return;
  }

  // Tài nguyên cùng origin: cache-first (tên file có hash nên an toàn).
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      let hit = await cache.match(req, { ignoreSearch: true });
      if (!hit) hit = await cache.match(req);          // fallback: so khớp chuẩn
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && !/text\/html/.test(res.headers.get('content-type') || '')) {
          cache.put(req, await withCors(res.clone()));
        }
        return res;
      } catch (err) {
        // Offline: thử bỏ qua query string rồi tìm lại trong cache.
        const alt = await cache.match(req, { ignoreSearch: true });
        if (alt) return alt;
        throw err;
      }
    })());
  }
});
