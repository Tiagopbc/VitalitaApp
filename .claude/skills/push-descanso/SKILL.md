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

O relato de quem testou não distingue "chegou com a tela bloqueada" de "chegou
com o app aberto" — mas os logs de runtime da Vercel distinguem, pelo formato do
ciclo. Um `send` **sem `cancel` atrás** significa JS congelado na entrega, ou
seja, tela realmente bloqueada; um `cancel` 1-2 s depois do `send` significa app
acordado no fim do descanso, e não prova nada. O procedimento dos testes, as
pré-condições que produzem falso negativo e a tabela completa de assinaturas
estão em [docs/validacao-push-descanso-ios.md](../../../docs/validacao-push-descanso-ios.md),
junto do registro da validação de 28/08/2026.
