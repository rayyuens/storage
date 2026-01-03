const CACHE_NAME = 'whatsup-pro-v4.4'; // 每次改 index.html 內容時，請手動增加呢個版本號
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event: 下載基礎資源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching offline assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // 強制新 SW 進入等待狀態後直接跳到激活階段
});

// Activate Event: 清理舊版快取 (對 iOS 更新極之重要)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim(); // 確保新 SW 即時接管所有頁面
});

// Fetch Event: 網絡優先策略，成功後自動更新快取
self.addEventListener('fetch', (e) => {
  // 1. 排除 Supabase API 同埋第三方 CDN (唔做 Cache 確保資料即時)
  if (
    e.request.url.includes('supabase.co') || 
    e.request.url.includes('google-analytics') ||
    e.request.method !== 'GET'
  ) {
    return; // 唔攔截，直接放行去網絡
  }

  // 2. 針對靜態資源 (HTML/JS/CSS) 採用網絡優先
  e.respondWith(
    fetch(e.request).then(response => {
      // 如果網絡正常，將最新版本存入快取
      if (response && response.status === 200 && response.type === 'basic') {
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, respClone);
        });
      }
      return response;
    }).catch(() => {
      // 斷網或者網絡極差時，先至用快取
      return caches.match(e.request);
    })
  );
});
