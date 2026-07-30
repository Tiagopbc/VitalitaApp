---
name: user-stats-cliente
description: >-
  Contexto sobre por que user_stats é recalculado no cliente por padrão no
  Vitalità, em vez de lido da Cloud Function que já existe. Invoque antes de
  "corrigir" HomeDashboard.jsx, ProfilePage.jsx, useAchievements.js ou
  userStatsService.js para ler user_stats do servidor, ou antes de mexer em
  VITE_ENABLE_SERVER_USER_STATS.
---

# user_stats recalculado no cliente

## É proposital, não dívida técnica

`VITE_ENABLE_SERVER_USER_STATS` fica **desligada por padrão** para operar a
custo zero. Com ela desligada:

- `userStatsService.js` não lê a coleção `user_stats`
  (`USER_STATS_COLLECTION`) — a flag decide isso em
  `import.meta.env.VITE_ENABLE_SERVER_USER_STATS === 'true'`.
- O cliente recalcula totais, streaks e conquistas a partir das sessões
  recentes: `publishStats` em `HomeDashboard.jsx` e o fallback em
  `useAchievements.js` (`hooks/profile/useAchievements.js`) fazem esse
  trabalho.
- A Cloud Function que gera `user_stats` **existe mas não é lida** nesse modo.

## Por que não "terminar a integração"

Ligar a flag e passar a ler `user_stats` do servidor tem custo de execução da
function a cada atualização de estatística — foi uma escolha consciente de
operar sem isso. Não troque o fallback do cliente por leitura do servidor sem
essa decisão ser explícita (confirmar com o usuário antes).

## Onde isso aparece no código

- `src/services/userStatsService.js` — decide a fonte pela flag.
- `src/pages/HomeDashboard.jsx` (`publishStats`) — cálculo no cliente.
- `src/hooks/profile/useAchievements.js` — fallback client-side quando
  `user_stats` está ausente.
- `src/services/privacyExportService.js` — lê `user_stats` independente da
  flag (exportação de dados), não confundir com o caminho de exibição.

## Red flag

PR que troca o fallback client-side por leitura direta de `user_stats` do
servidor, ou que liga `VITE_ENABLE_SERVER_USER_STATS=true` como parte de uma
correção não relacionada a custo/arquitetura de stats.
