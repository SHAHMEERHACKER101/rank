/**
 * NexusRank Pro - FINAL Service Worker
 * Secure, reliable offline support — no external resource failures
 */

const CACHE_NAME = 'nexusrank-pro-v1.0.0';
const API_CACHE_NAME = 'nexusrank-api-v1.0.0';

// ✅ Clean list of static files (no external URLs)
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/sw.js',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/pages/about.html',
  '/pages/contact.html',
  '/pages/privacy.html',
  '/pages/terms.html',
  '/pages/cookie-policy.html'
];

// ✅ API endpoints that can be cached (non-AI only)
const CACHEABLE_API_PATTERNS = [
  /\/health$/,
  /\/status$/
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Failed to cache:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET or chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(fetch(request));
  }
});

// ✅ Check if request is for a static resource
function isStaticResource(url) {
  const pathname = url.pathname;
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf')
  );
}

// ✅ Check if request is for an API endpoint
function isAPIRequest(url) {
  return url.pathname.startsWith('/ai/') || 
         url.pathname.startsWith('/api/') ||
         url.pathname === '/health';
}

// ✅ Check if request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// ✅ Handle static resource requests (cache-first)
async function handleStaticResource(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Static fetch failed:', error);
    throw error;
  }
}

// ✅ Handle API requests (network-first)
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  // ✅ AI endpoints: always network, no cache
  if (url.pathname.startsWith('/ai/')) {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'AI service unavailable. You are offline.',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'text/json' }
      });
    }
  }

  // ✅ Health/status: cache with TTL
  if (CACHEABLE_API_PATTERNS.some(p => p.test(url.pathname))) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        const headers = new Headers(response.headers);
        headers.set('sw-cache-time', Date.now().toString());
        const cloned = response.clone();
        const cached = new Response(cloned.body, {
          status: cloned.status,
          statusText: cloned.statusText,
          headers
        });
        cache.put(request, cached);
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      const age = Date.now() - parseInt(cached?.headers.get('sw-cache-time') || '0');
      if (cached && age < 5 * 60 * 1000) return cached;
      throw error;
    }
  }

  return fetch(request);
}

// ✅ Handle navigation (network-first, fallback to cache)
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const index = await caches.match('/index.html');
    if (index) return index;

    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Offline - NexusRank Pro</title>
        <style>
          body { background: #000; color: #fff; text-align: center; padding: 2rem; font-family: sans-serif; }
          .offline-icon { font-size: 4rem; color: #00ffff; }
          h1 { color: #00ffff; }
          .retry-btn { background: #00ffff; color: #000; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">🚀</div>
          <h1>You're Offline</h1>
          <p>Some features may not be available without internet.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}

// ✅ Message handling
self.addEventListener('message', event => {
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      break;
  }
});

console.log('[SW] Service Worker loaded and ready');
