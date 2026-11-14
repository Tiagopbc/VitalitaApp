---
name: boot-producao-firebase
description: >-
  Contexto sobre por que firebase/auth, firebase/app e firebase/firestore não podem
  ser importados dinamicamente neste projeto — mas firebase/app-check pode (é
  proposital). Invoque antes de adicionar um `await import(...)` de qualquer coisa
  do Firebase, ao mexer nos grupos de chunk (`codeSplitting.groups`) do
  vite.config.js, ou ao depurar app preso na tela "Carregando..." em produção com
  erro "Cannot access 're' before initialization".
---

# Boot em produção e imports do Firebase

## A regra

**Não misture import estático e dinâmico do mesmo pacote do Firebase** — em
especial `firebase/auth`, `firebase/app` e `firebase/firestore`, que têm
grupo próprio em `build.rolldownOptions.output.codeSplitting.groups` no
`vite.config.js`. Todo o app importa esses três de forma estática —
`src/firebaseAuth.js` e `src/firebaseDb.js` são os módulos que expõem as
instâncias já inicializadas. Use-os em vez de
`await import('firebase/auth'|'firebase/app'|'firebase/firestore')`.

**Isso não é um veto a qualquer `import()` dinâmico de pacote do Firebase.**
`src/services/appCheckService.js` faz `import('firebase/app-check')` de
propósito, e está correto: `firebase/app-check` **não** está em nenhum grupo
(o `vendor-firebase-app` casa `app/` com a barra justamente para não pegá-lo),
e nenhum outro módulo importa `firebase/app-check` de forma estática. Sem grupo
e sem mistura de estilo, não há como se repetir a dependência circular. App
Check é carregado sob demanda de propósito — é o padrão de "integração
defensiva" do projeto (Sentry e App Check só inicializam quando configurados, e
falha nunca bloqueia boot).

Até 13/11/2026 isso não era verdade na prática: o antigo `manualChunks` usava
`startsWith('@firebase/app')`, que também casava `@firebase/app-check`, e o App
Check ia parar no `vendor-firebase-app`, baixado no boot. `vite.config.test.js`
trava a correção.

## Por que isso quebra o boot

Um único `await import('firebase/auth')` em `workoutPdfImport.js` fez o
`manualChunks` (na época, Rollup) emitir o `vendor-firebase-app` com
dependência circular (temporal dead zone). Resultado em produção:
`Uncaught ReferenceError: Cannot access 're' before initialization` no chunk
`vendor-firebase-app`, e o `vendor-firebase-auth` nunca chegava a carregar — o
app fica preso na tela "Carregando...".

Aconteceu em 23/07/2026 e derrubou produção (PR #42). O gatilho foi
especificamente misturar import estático (resto do app, para `firebase/auth`)
com dinâmico (um módulo isolado, mesmo pacote) **de um pacote com chunk
manual** — não é um bug do Firebase, é do bundling. Um pacote fora dos grupos,
importado sempre do mesmo jeito (só dinâmico, como `firebase/app-check`), não
tem esse problema.

## Os grupos do Rolldown (vite 8, desde 13/11/2026)

O vite 8 gera o bundle com o Rolldown, que **ignora** o
`onlyExplicitManualChunks` do Rollup: cada grupo leva junto as dependências dos
módulos que captura (`includeDependenciesRecursively`, padrão e recomendado
contra chunk circular — não desligue sem `strictExecutionOrder` e muito teste
no preview). Consequência: **a prioridade dos grupos segue a direção das
dependências**. Quem é dependência (React, a base `@firebase/app`/`util`/
`component`/`logger`/`idb`) tem prioridade maior do que quem depende dele
(lucide, router, Auth, Firestore). Invertido, o grupo de maior prioridade
arrasta a base para dentro de si:

- React abaixo do lucide → o React vai para o `vendor-lucide`, e os ícones
  entram no boot (+7 KB gzip, medido).
- Base do Firebase abaixo do Firestore → o Firestore inteiro entra no boot
  (276 KB gzip em vez de 115 KB, medido).

## Como verificar que não regrediu

`npm run build` só prova que compila, não que executa — o bug passou
despercebido num build normal porque só se manifesta rodando o bundle real no
navegador. Ver [verificacao-build-producao](../verificacao-build-producao/SKILL.md)
para o passo completo de reprodução, incluindo como medir o boot.

## Red flags

- `await import('firebase/auth')`, `import('firebase/app')` ou
  `import('firebase/firestore')` novo no diff — os três com grupo próprio.
- Módulo que não seja `src/firebaseAuth.js`/`src/firebaseDb.js` acessando Auth
  ou Firestore diretamente em vez de importar a instância já inicializada.
- Adicionar `firebase/app-check` (ou outro pacote hoje fora dos grupos) a um
  grupo sem também revisar todos os imports dele no projeto — nesse momento a
  regra de "só estático" passaria a valer para ele também.
- Grupo novo ou prioridade mudada sem medir o boot antes e depois.
