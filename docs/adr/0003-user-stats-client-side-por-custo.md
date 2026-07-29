# ADR-0003: `user_stats` recalculado no cliente por padrão, agregação server-side opcional

**Status:** Accepted
**Date:** 2026-07-03 (Cloud Function de agregação adicionada nesta data; decisão de mantê-la desligada por padrão registrada retroativamente em 2026-07-29)
**Deciders:** Tiago Cavalcanti

## Contexto

O dashboard e o perfil precisam mostrar totais, streaks e conquistas do
aluno. Calcular isso a cada carregamento de tela varrendo todas as sessões
históricas do usuário não escala indefinidamente, mas o projeto opera com
Firestore sem plano pago vinculado — cada leitura extra tem custo, e o
volume de uso atual (pessoal/pequena escala) não justifica esse custo.

Existe uma Cloud Function (`rebuildUserStatsOnSessionCreated`, em
`functions/`) capaz de manter um agregado `user_stats/{userId}` sempre
atualizado no servidor. A pergunta: o cliente lê esse agregado, ou recalcula
os totais localmente a partir das sessões recentes?

**Detalhe importante:** essa function é um trigger incondicional do Firestore
(`onDocumentCreated("workout_sessions/{sessionId}", ...)`) — ela dispara em
**toda** sessão de treino salva, com a flag do cliente ligada ou desligada.
`VITE_*` é uma variável embutida em build time pelo Vite; o runtime do Cloud
Functions (Node) nem tem acesso a ela. Ou seja, **o custo de execução da
function já é pago hoje, independente da flag** — a flag não liga/desliga a
function, só decide o que o cliente lê.

## Decisão

`user_stats` do servidor é **opcional e desligado por padrão**, controlado
pela flag `VITE_ENABLE_SERVER_USER_STATS` (`src/services/userStatsService.js`).
Com a flag desligada — o padrão — o cliente ignora o agregado e recalcula
totais, streaks e conquistas a partir das sessões recentes: `publishStats` em
`HomeDashboard.jsx` e o fallback em `hooks/profile/useAchievements.js`. A
Cloud Function roda de qualquer forma a cada sessão criada; a flag só decide
se o cliente lê o resultado dela (`user_stats/{userId}`, 1 leitura) ou
recalcula por conta própria a partir das sessões recentes (N leituras).

## Opções consideradas

### Opção A: Cálculo client-side por padrão, servidor opcional (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa — utilitários puros em `src/utils/`, sem infraestrutura adicional para operar |
| Custo | O cliente evita 1 leitura de `user_stats` por carregamento — **mas o custo de execução da Cloud Function já é pago do mesmo jeito**, ela roda sempre |
| Escalabilidade | Limitada — recálculo no cliente cresce com o volume de sessões recentes lidas |
| Consistência | Cada carregamento reflete o estado real das sessões, sem depender da function ter rodado com sucesso |

**Prós:** não depende de a function ter processado a última sessão a tempo
nem de ela nunca falhar silenciosamente; simples de auditar (a fonte da
verdade são as sessões, sempre); nenhum efeito colateral se a function for
removida ou desativada no futuro.
**Contras:** não economiza o custo de execução da function — esse já é pago
hoje de qualquer forma; o cliente lê mais documentos por carregamento do que
leria um único agregado, então **não é a opção que minimiza leitura total**
se a function já está rodando de qualquer jeito.

### Opção B: Ler `user_stats` do servidor por padrão

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média — já implementada (`userStatsService.js`, function em `functions/`), só não é o caminho padrão |
| Custo | Mesmo custo de execução de function que **já é pago hoje** com a flag desligada; a diferença é o cliente trocar N leituras de sessões por 1 leitura de `user_stats` |
| Escalabilidade | Melhor no limite para o cliente — leitura de um único documento agregado, independente do histórico |
| Consistência | Depende da function nunca falhar silenciosamente; agregado pode divergir das sessões reais |

**Prós:** leitura O(1) no cliente independente do tamanho do histórico —
como a function já roda de qualquer forma, ligar a flag reduziria o total de
leituras do app sem adicionar custo novo do lado servidor.
**Contras:** introduz uma fonte de verdade paralela (`user_stats`) que pode
divergir das sessões se a function falhar ou atrasar; a function
(`rebuildUserStatsOnSessionCreated` em `functions/src/index.js`) não faz
atualização incremental de contadores — a cada sessão nova ela busca até
`MAX_REBUILD_SESSIONS` (2000) sessões do usuário, recalcula tudo com
`buildUserStatsFromSessions` e sobrescreve o documento inteiro
(`.set(..., { merge: false })`). Essa ineficiência já existe hoje, com a flag
ligada ou não — é uma razão para otimizar a function, não uma razão para
manter o cliente sem ler o agregado.

## Análise de trade-off

**Correção importante (registrada em 2026-07-29, após revisão):** a versão
original deste ADR justificava manter a flag desligada por "custo zero" do
lado da Opção A. Isso está errado — `rebuildUserStatsOnSessionCreated` é um
trigger incondicional do Firestore, roda a cada sessão criada
independentemente da flag, e `VITE_*` nem existe no runtime de Cloud
Functions para ela ler. O custo de execução da function **já é pago hoje**,
com a flag ligada ou desligada. O "custo zero" real da Opção A é só do lado
do cliente: evitar 1 leitura de `user_stats` por carregamento, trocando por
N leituras de sessões recentes.

Corrigido esse ponto, o argumento de custo passa a **favorecer ligar a
flag**, não o contrário — já que a function roda de qualquer forma, deixar o
cliente ler o agregado pronto reduz o total de leituras do app sem custo
servidor adicional. O que ainda justifica manter a flag desligada por padrão
não é custo, é **confiabilidade do agregado como fonte de verdade**: a
function pode falhar silenciosamente ou atrasar, e ela mesma tem uma
ineficiência conhecida (recompute de até 2000 sessões a cada gravação, sem
contadores incrementais) que convém corrigir antes de tornar `user_stats` a
fonte principal exibida ao usuário. Ou seja, a decisão de manter o cálculo
client-side por padrão continua válida, mas por um motivo diferente do que
o texto original afirmava.

## Consequências

- `VITE_ENABLE_SERVER_USER_STATS` não deve ser ligada como parte de uma
  correção não relacionada, sem essa decisão ser revisada explicitamente
  (ver [user-stats-cliente](../../.claude/skills/user-stats-cliente/SKILL.md)).
- `rebuildUserStatsOnSessionCreated` já custa execução + leitura de até 2000
  sessões a cada sessão de treino salva, **hoje, com a flag desligada** — não
  é um custo hipotético que só passaria a existir se alguém ligasse a flag.
  Vale monitorar esse custo (invocações da function) independente da decisão
  sobre a flag.
- `privacyExportService.js` lê `user_stats` independentemente da flag, para
  exportação de dados — não confundir com o caminho de exibição no
  dashboard/perfil.
- Pré-requisito para trocar o padrão com confiança: tornar a atualização de
  `user_stats` de fato incremental (já listado em `docs/architecture.md`
  como ponto de evolução) e validar que a function não falha/atrasa de forma
  perceptível — não para economizar custo (esse já é pago), mas para que o
  agregado seja confiável o bastante como fonte exibida ao usuário.

## Action Items

1. [x] Documentar a decisão (este ADR).
2. [x] Corrigir a premissa de custo original após revisão em 2026-07-29.
3. [ ] Avaliar se o custo de `rebuildUserStatsOnSessionCreated` (já em
   produção hoje) vale ser reduzido com atualização incremental de
   contadores, independentemente do estado da flag.
4. [ ] Só então reavaliar ligar `VITE_ENABLE_SERVER_USER_STATS` por padrão —
   ganho de leitura total no cliente, condicionado a confiar no agregado
   como fonte de verdade.
