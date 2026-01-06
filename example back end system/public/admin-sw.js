// Hook Admin Service Worker
const CACHE_NAME = 'hook-admin-v1'

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/admin',
        '/admin-icon.svg'
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('hook-admin') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API calls and external resources
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
      })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  let data = { title: 'Hook Admin', body: 'You have a new notification' }
  
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    console.error('Failed to parse push data:', e)
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/admin-icon.svg',
    badge: '/admin-icon.svg',
    vibrate: [200, 100, 200],
    silent: false,
    tag: data.tag || 'hook-admin-notification',
    renotify: true,
    data: {
      url: data.url || '/admin',
      tab: data.tab,
      rego: data.rego
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hook Admin', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data || {}
  let targetUrl = notificationData.url || '/admin'

  // Add tab and rego params if provided
  if (notificationData.tab || notificationData.rego) {
    const params = new URLSearchParams()
    if (notificationData.tab) params.set('tab', notificationData.tab)
    if (notificationData.rego) params.set('rego', notificationData.rego)
    targetUrl += `?${params.toString()}`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing admin window
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Open a new window if none found
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
