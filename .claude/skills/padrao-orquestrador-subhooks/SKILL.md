---
name: padrao-orquestrador-subhooks
description: >-
  Contexto sobre o padrão orquestrador + sub-hooks usado no Vitalità para quebrar
  hooks e páginas grandes. Invoque antes de dividir um hook ou serviço grande em
  arquivos menores, antes de criar um arquivo solto do tipo useXyzHelper.js ao lado
  de um hook grande, ou ao decidir onde colocar lógica nova que está deixando
  useWorkoutSession, WorkoutExecutionPage ou ProfilePage difíceis de ler.
---

# Padrão orquestrador + sub-hooks

## A regra

Quando um hook ou página fica grande demais, a quebra não é "extrair um arquivo
solto" — é criar um **diretório irmão** com o mesmo nome base e mover cada
responsabilidade para um sub-hook lá dentro. O arquivo original vira um
orquestrador fino que só compõe os sub-hooks.

```
src/hooks/useWorkoutSession.js          ← orquestrador fino
src/hooks/workout-session/
  useSessionLoader.js                   ← carregar sessão
  useSessionSync.js                     ← sincronização
  useSessionExerciseActions.js          ← ações de série
  useSessionFinish.js                   ← finalização
  normalizeSets.js
```

Mesmo formato em:

- `src/hooks/workout-execution/` (`useExecutionNavigation`, `useFinishWorkoutFlow`,
  `useWorkoutShare`) para `WorkoutExecutionPage.jsx`.
- `src/hooks/profile/` (`useAchievements`, `useProfileData`) para `ProfilePage.jsx`.
- `src/services/sessions/` (`activeSessionService`, `sessionRecoveryService`) para
  lógica de sessão compartilhada entre hooks.

## Por que não um arquivo solto

Um `useWorkoutSessionHelpers.js` ao lado do hook original não comunica qual
responsabilidade está ali nem cresce de forma previsível — quem chega depois não
sabe se deve adicionar ali ou criar outro arquivo solto. O diretório irmão com um
sub-hook por responsabilidade deixa a divisão auto-descritiva e é o que o resto
do projeto já espera encontrar.

## Como aplicar

1. Nomeie o diretório irmão com o nome do hook/página em kebab-case, sem
   prefixo `use` (ex.: `useWorkoutSession.js` → `workout-session/`).
2. Um sub-hook por responsabilidade coesa (carregar, sincronizar, agir, finalizar
   — não por camada técnica).
3. O arquivo original importa e compõe os sub-hooks, sem lógica de negócio própria.

## Red flag

Arquivo `use*.js` crescendo a olhos vistos, ou proposta de criar
`algumaCoisaHelper.js`/`algumaCoisaUtils.js` do lado de um hook grande em vez de
um diretório irmão.
