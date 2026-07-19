/**
 * push-sw.js
 * Handlers de Web Push injetados no service worker gerado (workbox importScripts).
 * Recebe o push agendado do fim do descanso e mostra a notificação — funciona
 * com o app fechado e a tela bloqueada.
 */
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        // Payload não-JSON: usa os textos padrão abaixo.
    }

    const title = data.title || 'Vitalità';
    const options = {
        body: data.body || 'Descanso concluído. Hora da próxima série! 💪',
        tag: 'vitalita-rest-timer',
        renotify: true,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200, 100, 200],
        data: { url: data.url || '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const existing = windowClients.find((client) => 'focus' in client);
            if (existing) {
                return existing.focus();
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});
