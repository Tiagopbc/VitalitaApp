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

    // Avisa os clients (para o diagnóstico registrar que o push chegou ao
    // dispositivo). Se o app estiver em segundo plano, a mensagem é entregue
    // quando a aba volta a rodar. Melhor esforço — não bloqueia a notificação.
    const notify = self.registration.showNotification(title, options);
    const report = self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
            windowClients.forEach((client) => {
                client.postMessage({
                    type: 'rest-push-received',
                    detail: { at: Date.now(), title }
                });
            });
        })
        .catch(() => undefined);

    event.waitUntil(Promise.all([notify, report]));
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
