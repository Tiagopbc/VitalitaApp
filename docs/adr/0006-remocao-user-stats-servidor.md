# ADR-0006: Remoção de `user_stats` e da Cloud Function; cálculo só no cliente

**Status:** Accepted
**Date:** 2026-11-09
**Deciders:** Tiago Cavalcanti
**Supersedes:** [ADR-0003](0003-user-stats-client-side-por-custo.md)

## Contexto

O ADR-0003 decidiu que o cliente recalcula totais, streaks e conquistas a
partir das sessões recentes, e que o agregado `user_stats/{userId}` escrito
pela Cloud Function `rebuildUserStatsOnSessionCreated` ficaria como opção
desligada (`VITE_ENABLE_SERVER_USER_STATS=false`). O próprio ADR registrou,
na revisão de 2026-07-29, que a function é um trigger incondicional: rodava a
cada sessão salva, lia até 2.000 sessões do usuário e reescrevia um documento
que nenhuma tela lia.

Na revisão de reduções de 2026-11-09, o estado era:

- `functions/` com 840 linhas, duas suítes, `package-lock.json` próprio, três
  passos no CI, uma entrada no Dependabot e dois documentos de operação;
- `userStatsService.js` e dois ramos no cliente (`HomeDashboard.jsx`,
  `useAchievements.js`) para um caminho que a flag nunca ligou;
- custo de leitura no Firestore pago a cada treino, sem retorno.

## Decisão

Remover o caminho server-side por inteiro:

- `functions/` (code, testes, script de backfill) e o bloco `functions` do
  `firebase.json`;
- `src/services/userStatsService.js`, a flag `VITE_ENABLE_SERVER_USER_STATS`
  e os ramos que a liam;
- a leitura de `user_stats` na exportação LGPD (`privacyExportService.js`);
- a regra `match /user_stats` em `firestore.rules` — a coleção passa a cair no
  `allow read, write: if false` final, e o cenário de rules afirma isso;
- os passos de Functions no `ci.yml`, a entrada `/functions` e o grupo
  `firebase-functions-e-admin` no `dependabot.yml`, o workspace no
  `knip.json`, `docs/functions-deploy.md`, `docs/user-stats-backfill.md` e o
  skill `user-stats-cliente`.

Fora do repositório: apagar a function implantada
(`firebase functions:delete rebuildUserStatsOnSessionCreated`) e a variável
na Vercel. Documentos antigos em `user_stats` podem persistir até uma limpeza
administrativa; nenhum caminho do app os lê.

## Opções consideradas

### Opção A: remover tudo (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Cai: um workspace npm a menos, CI com três passos a menos, uma flag a menos |
| Custo | Zera a execução por sessão e as leituras de até 2.000 documentos por treino |
| Escalabilidade | Igual à de hoje: o cliente já era a única fonte exibida |
| Reversibilidade | O código fica no histórico do git; voltar exige ADR novo |

### Opção B: manter a function e torná-la incremental (item 3 do ADR-0003)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Sobe: contadores incrementais, idempotência, backfill |
| Custo | Reduz, mas não zera, e exige deploy e monitoramento de uma function que ninguém lê |
| Escalabilidade | Só se justifica se o volume por usuário ultrapassar os limites de `SESSION_LIMITS` |

### Opção C: ligar a flag e ler o agregado

Descartada pelo ADR-0003: cria segunda fonte de verdade que pode divergir das
sessões se a function falhar ou atrasar.

## Consequências

- O cliente é a única fonte de totais, streaks e conquistas; os limites em
  `SESSION_LIMITS` (`workoutService.js`) definem o custo por tela.
- `user_stats` vira coleção descontinuada: sem regra, sem leitura, sem
  escrita. Qualquer retorno de agregado server-side passa por ADR novo.
- A exportação LGPD deixa de incluir `userStats` e sobe para `schemaVersion: 2`;
  o conteúdo era derivado de `workout_sessions`, que continua exportado.
- Se o volume por usuário crescer a ponto de a janela recente não bastar, a
  Opção B volta à mesa — com números, não por precaução.

## Action Items

1. [x] Remover código, configuração e documentação (este PR).
2. [ ] Apagar a function implantada e a variável na Vercel (Tiago).
3. [ ] Fechar o PR do Dependabot `functions/firebase-functions-e-admin`, que
   ficou sem diretório.
