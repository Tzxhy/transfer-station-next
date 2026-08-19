/* 传送站 Service Worker */
const CACHE_NAME = 'transfer-station-v1';

// 预缓存的应用外壳
const PRECACHE_URLS = [
  '/',
  '/login/',
  '/text',
  '/bookmark',
  '/file',
  '/short',
  '/manifest.json',
  '/icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return; // 只处理 GET 请求

  const url = new URL(request.url);
  // 接口与短链跳转不参与缓存
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/s/')) return;

  // 页面导航：网络优先，失败时回退到缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // 同源静态资源：缓存优先，同时后台更新
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => hit);
        return hit || fetchPromise;
      })
    );
  }
});