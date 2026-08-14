// 八中重开模拟器 Service Worker
// 页面导航：网络优先（部署更新即时生效），失败回退缓存
// 静态资源（assets/cities）：缓存优先 + 后台更新（哈希文件名保证正确性）
const CACHE_PREFIX = 'bj8z-cache-';
const CACHE_VERSION = 'v2';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const STATIC_PATTERNS = [/^\/assets\//, /^\/cities\//];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(['/']))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== location.origin || event.request.method !== 'GET') return;

    // 页面导航
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put('/', copy));
                    return res;
                })
                .catch(() => caches.match('/'))
        );
        return;
    }

    // 静态资源
    if (STATIC_PATTERNS.some((p) => p.test(url.pathname))) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                const fetched = fetch(event.request)
                    .then((res) => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
                        }
                        return res;
                    })
                    .catch(() => cached);
                return cached || fetched;
            })
        );
    }
});
