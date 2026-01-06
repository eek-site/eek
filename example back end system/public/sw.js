// Eek Mechanical Service Worker
const CACHE_NAME = 'hook-towing-v1'

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/icon.svg'
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
          .filter((name) => name !== CACHE_NAME)
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
  let data = { title: 'Eek Mechanical', body: 'You have a new notification' }
  
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    console.error('Failed to parse push data:', e)
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    silent: false,
    tag: data.tag || 'hook-towing-notification',
    renotify: true,
    data: {
      url: data.url || '/portal',
      jobId: data.jobId,
      tab: data.tab
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Eek Mechanical', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data || {}
  let targetUrl = notificationData.url || '/portal'

  // Add job and tab params if provided
  if (notificationData.jobId) {
    const separator = targetUrl.includes('?') ? '&' : '?'
    targetUrl += `${separator}job=${notificationData.jobId}`
    if (notificationData.tab) {
      targetUrl += `&tab=${notificationData.tab}`
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('/portal') && 'focus' in client) {
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
