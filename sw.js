/* APEX — service worker: SADECE bildirimler (önbellek yok → her açılışta güncel sürüm) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  // Eski denemelerden kalmış önbellek varsa temizle
  try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch (err) {}
  await self.clients.claim();
})()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'APEX', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'apex',
    renotify: true,
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  // Bildirim türü tag'den: apex-<tür>[-gönderen] → uygulama doğru ekranı açar
  const tag = e.notification.tag || '';
  const n = tag.startsWith('apex-') ? tag.split('-')[1] : '';
  const scope = self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) {
      if (c.url.startsWith(scope) && 'focus' in c) {
        if (n) c.postMessage({ apexOpen: n });
        return c.focus();
      }
    }
    return self.clients.openWindow(scope + (n ? '?n=' + n : ''));
  }));
});
