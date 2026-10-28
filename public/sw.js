/**
 * Kasthuri Poultry Farm (KPF) - Service Worker
 * Secure PWA caching strategy:
 * - Caches static UI assets (icons, manifests, styles, fonts, app shell)
 * - NEVER caches authenticated API responses, financial ledgers, or mutation requests
 */

const CACHE_NAME = 'kpf-pwa-v6';

const STATIC_PRECACHE = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.registration.unregister())
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. SECURITY: Only handle GET requests. All mutations go directly to network
  if (request.method !== 'GET') {
    return;
  }

  // 2. SECURITY & FRESHNESS: Never cache sensitive API endpoints, auth, or Next.js build chunks
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.hostname.includes('supabase.co') ||
    request.headers.get('Authorization')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Navigation Requests (HTML Pages): Network-first with cached shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Kasthuri Poultry Farm is offline. Please check your network connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
    );
    return;
  }

  // 4. Static Image/Icon Assets: Cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Default network-first fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
