---
name: push-descanso
description: >-
  Contexto para trabalhar na notificação push de descanso do Vitalità — Web Push
  nativo com VAPID própria agendado via QStash, não FCM. Invoque ao mexer em
  restPushService, schedule-rest-push, send-rest-push, push-sw.js, no timer de
  descanso que dispara notificação, ou ao depurar por que o push não chega.
---

# Push de descanso

## Não usa FCM

É **Web Push nativo** com VAPID própria, agendado via QStash. A cadeia é:

```
src/services/restPushService.js
  → api/schedule-rest-push.js
  → api/send-rest-push.js
```

`public/push-sw.js` é importado no service worker pelo `vite-plugin-pwa`.

Segredos de servidor — `QSTASH_TOKEN`, `QSTASH_URL`, `PUSH_INTERNAL_SECRET` e a
chave VAPID privada — existem só nas variáveis de ambiente da Vercel.

## Como testar

**Testar push só vale em iPhone com a tela bloqueada.** No desktop o push aparece
mesmo com falhas que quebram o fluxo real — ou seja, o desktop mascara defeitos.
