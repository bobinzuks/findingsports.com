// Service Worker for Finding Sports PWA
// Version: 1.0.0
// Features: Offline support, message caching, background sync, push notifications

const CACHE_VERSION = 'finding-sports-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MESSAGE_CACHE = `${CACHE_VERSION}-messages`;
const SYNC_QUEUE = 'message-sync-queue';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/social-feed-critical.css',
  '/css/social-feed-enhanced.css',
  '/css/social-feed-mobile.css',
  '/css/social-feed-animations.css',
  '/css/dark-mode-maps.css',
  '/css/background-enhancement.css',
  '/js/app.js',
  '/js/social-feed.js',
  '/js/websocket.js',
  '/js/api.js',
  '/js/auth.js',
  '/images/logo2.png',
  '/manifest.json',
  // Offline fallback page
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[ServiceWorker] Install failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('finding-sports-') && !cacheName.includes(CACHE_VERSION))
            .map(cacheName => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetchAndUpdateCache(request);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-ok responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseToCache));
            
            return response;
          })
          .catch(() => {
            // Network failed, serve offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Data may be outdated.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for failed messages
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'send-messages') {
    event.waitUntil(sendQueuedMessages());
  }
});

// Send queued messages when online
async function sendQueuedMessages() {
  const db = await openMessageDB();
  const tx = db.transaction('pending_messages', 'readwrite');
  const store = tx.objectStore('pending_messages');
  const messages = await store.getAll();
  
  for (const message of messages) {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${message.token}`
        },
        body: JSON.stringify(message.data)
      });
      
      if (response.ok) {
        // Remove from pending queue
        await store.delete(message.id);
        
        // Notify client of successful send
        await notifyClients('message-sent', {
          tempId: message.tempId,
          messageId: (await response.json()).id
        });
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to send message:', error);
    }
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received:', event);
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New message in Finding Sports',
    icon: '/images/logo2.png',
    badge: '/images/badge.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Finding Sports', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'reply') {
    // Handle quick reply (future feature)
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/social-feed') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // App not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/social-feed.html');
        }
      })
  );
});

// Message from client
self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message from client:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper functions

// Fetch and update cache in background
function fetchAndUpdateCache(request) {
  fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(request, response));
      }
    })
    .catch(() => {
      // Silently fail - we already served from cache
    });
}

// Open IndexedDB for message storage
function openMessageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FindingSportsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('pending_messages')) {
        db.createObjectStore('pending_messages', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cached_messages')) {
        const messageStore = db.createObjectStore('cached_messages', { keyPath: 'id' });
        messageStore.createIndex('channel', 'channel', { unique: false });
        messageStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Notify all clients
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type,
      data
    });
  });
}

// Periodic background sync (future feature)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-new-messages') {
    event.waitUntil(checkForNewMessages());
  }
});

async function checkForNewMessages() {
  try {
    const response = await fetch('/api/messages/check-new');
    if (response.ok) {
      const data = await response.json();
      if (data.hasNew) {
        await notifyClients('new-messages-available', data);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to check for new messages:', error);
  }
}