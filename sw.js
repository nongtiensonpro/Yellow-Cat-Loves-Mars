// Yellow Cat Loves Mars — offline SW (cache-first, static only)
const CACHE = 'yc-mars-v3';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './app/main.js',
  './manifest.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  // only GET
  if(req.method!=='GET') return;
  // CDN three — network first, fallback cache
  if(req.url.includes('unpkg.com') || req.url.includes('jsdelivr')){
    e.respondWith(fetch(req).then(r=>{ const c=r.clone(); caches.open(CACHE).then(cache=> cache.put(req,c)); return r; }).catch(()=> caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(cached=> cached || fetch(req).then(res=>{
    // cache successful same-origin
    if(res.ok && req.url.startsWith(self.location.origin)){
      const clone=res.clone();
      caches.open(CACHE).then(cache=> cache.put(req, clone));
    }
    return res;
  }).catch(()=> cached)));
});
