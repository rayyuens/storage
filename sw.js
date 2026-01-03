const CACHE_NAME = 'whatsup-pro-v4.4'; // 每次更新 code 就改呢個名
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    // 清理舊版本嘅 cache，呢點對 iOS 好重要
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim(); // 強制即時接管所有頁面
});

self.addEventListener('fetch', (e) => {
  // 針對 Supabase 嘅 API call 唔做緩存，確保資料即時
  if (e.request.url.includes('supabase.co')) {
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
