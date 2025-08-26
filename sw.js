/**
 * NexusRank Pro - Service Worker
 * Provides offline functionality and caching for the AI SEO toolkit
 * Fixed redirect handling for proper navigation
 */

const CACHE_NAME = 'nexusrank-pro-v2.0.0';
const API_CACHE_NAME = 'nexusrank-api-v2.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/pages/about.html',
  '/pages/contact.html',
  '/pages/privacy.html',
  '/pages/terms.html',
  '/pages/cookie-policy.html',
  // External resources
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Segoe+UI:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints that can be cached (non-AI endpoints only)
const CACHEABLE_API_PATTERNS = [
  /\/health$/,
  /\/status$/
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v2.0.0');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v2.0.0');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with proper redirect handling
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

/**
 * Check if request is for a static resource
 */
function isStaticResource(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com'
  );
}

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/ai/') || 
         url.pathname.startsWith('/api/') ||
         url.pathname === '/health';
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

/**
 * Handle static resource requests with cache-first strategy
 */
async function handleStaticResource(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network with redirect: 'follow'
    const networkResponse = await fetch(request, { 
      redirect: 'follow',
      mode: 'cors'
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static resource fetch failed:', error);
    
    // Return offline fallback for essential files
    if (request.url.includes('style.css')) {
      return new Response(`
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #000; 
          color: #fff; 
          text-align: center; 
          padding: 2rem; 
        }
        .offline-message { 
          max-width: 600px; 
          margin: 0 auto; 
        }
      `, {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    throw error;
  }
}

/**
 * Handle API requests - network first, limited caching
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // AI endpoints should not be cached (always fresh data)
  if (url.pathname.startsWith('/ai/')) {
    try {
      return await fetch(request, { 
        redirect: 'follow',
        mode: 'cors'
      });
    } catch (error) {
      console.error('[SW] AI API request failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'AI service is currently unavailable. Please check your connection and try again.',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Other API endpoints (like health checks) can be cached briefly
  if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    try {
      const networkResponse = await fetch(request, { 
        redirect: 'follow',
        mode: 'cors'
      });
      
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        const cacheResponse = networkResponse.clone();
        
        // Set cache expiry (5 minutes for API responses)
        const headers = new Headers(cacheResponse.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());
        
        const cachedResponse = new Response(cacheResponse.body, {
          status: cacheResponse.status,
          statusText: cacheResponse.statusText,
          headers: headers
        });
        
        cache.put(request, cachedResponse);
      }
      
      return networkResponse;
    } catch (error) {
      // Try to serve from cache if network fails
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
        const age = Date.now() - parseInt(timestamp || '0');
        
        // Serve cached response if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          return cachedResponse;
        }
      }
      
      throw error;
    }
  }
  
  // For all other API requests, just try network with redirect handling
  return fetch(request, { 
    redirect: 'follow',
    mode: 'cors'
  });
}

/**
 * Handle navigation requests with network first, fallback to cache
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first with redirect: 'follow'
    const networkResponse = await fetch(request, { 
      redirect: 'follow',
      mode: 'navigate'
    });
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Navigation network failed, trying cache:', error.message);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try to serve index.html for SPA routing
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Last resort: offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - NexusRank Pro</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #ffffff; 
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .offline-container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #00ffff;
          }
          h1 { 
            color: #00ffff; 
            margin-bottom: 1rem;
            font-size: 2rem;
          }
          p { 
            color: #cccccc; 
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }
          .retry-btn {
            background: linear-gradient(45deg, #00ffff, #b967ff);
            color: #000;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s;
          }
          .retry-btn:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">🚀</div>
          <h1>You're Offline</h1>
          <p>It looks like you're not connected to the internet. Some features of NexusRank Pro may not be available.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Handle other requests with network-only strategy
 */
async function handleOtherRequests(request) {
  try {
    return await fetch(request, { 
      redirect: 'follow',
      mode: 'cors'
    });
  } catch (error) {
    console.error('[SW] Other request failed:', error);
    throw error;
  }
}

/**
 * Background sync for failed requests (future enhancement)
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementation for retrying failed requests
  // This could be used for queuing AI requests when offline
  console.log('[SW] Performing background sync');
}

/**
 * Push notification handling (future enhancement)
 */
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

/**
 * Message handling for communication with main thread
 */
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service Worker v2.0.0 script loaded - Fixed redirect handling');
