// 골목대전 서비스 워커: 푸시 알림 받기 (게임 화면을 보고 있으면 띄우지 않음)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!d.force && list.some((c) => c.visibilityState === 'visible' && c.focused)) return;
    await self.registration.showNotification(d.title || '골목대전', { body: d.body || '', tag: d.tag || 'golmok', icon: '/img/icon/icon-192.png?v=3', badge: '/img/icon/icon-64.png?v=3', data: { url: d.url || '/' } });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = list.find((x) => 'focus' in x);
    if (c) return c.focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || '/');
  })());
});
