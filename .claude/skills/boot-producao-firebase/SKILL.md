---
name: boot-producao-firebase
description: >-
  Contexto sobre por que firebase/auth, firebase/app e firebase/firestore não podem
  ser importados dinamicamente neste projeto — mas firebase/app-check pode (é
  proposital). Invoque antes de adicionar um `await import(...)` de qualquer coisa
  do Firebase, ao mexer em manualChunks do vite.config.js, ou ao depurar app preso
  na tela "Carregando..." em produção com erro "Cannot access 're' before
  initialization".
---

# Boot em produção e imports do Firebase

## A regra

**Não misture import estático e dinâmico do mesmo pacote do Firebase** — em
especial `firebase/auth`, `firebase/app` e `firebase/firestore`, que têm
entrada própria no `manualChunks` do `vite.config.js`. Todo o app importa
esses três de forma estática — `src/firebaseAuth.js` e `src/firebaseDb.js`
são os módulos que expõem as instâncias já inicializadas. Use-os em vez de
`await import('firebase/auth'|'firebase/app'|'firebase/firestore')`.

**Isso não é um veto a qualquer `import()` dinâmico de pacote do Firebase.**
`src/services/appCheckService.js` faz `import('firebase/app-check')` de
propósito, e está correto: `firebase/app-check` **não** tem entrada no
`manualChunks` (só `firebase/app`, `firebase/auth` e `firebase/firestore`
têm — ver `vite.config.js`), e nenhum outro módulo importa
`firebase/app-check` de forma estática. Sem chunk manual e sem mistura de
estilo, não há como se repetir a dependência circular. App Check é
carregado sob demanda de propósito — é o padrão de "integração defensiva"
do projeto (Sentry, App Check e Cloud Functions só inicializam quando
configurados, e falha nunca bloqueia boot).

## Por que isso quebra o boot

Um único `await import('firebase/auth')` em `workoutPdfImport.js` fez o
`manualChunks` do `vite.config.js` emitir o `vendor-firebase-app` com
dependência circular (temporal dead zone). Resultado em produção:
`Uncaught ReferenceError: Cannot access 're' before initialization` no chunk
`vendor-firebase-app`, e o `vendor-firebase-auth` nunca chegava a carregar — o
app fica preso na tela "Carregando...".

Aconteceu em 23/07/2026 e derrubou produção (PR #42). O gatilho foi
especificamente misturar import estático (resto do app, para `firebase/auth`)
com dinâmico (um módulo isolado, mesmo pacote) **de um pacote que está no
`manualChunks`** — não é um bug do Firebase, é do bundling. Um pacote fora do
`manualChunks`, importado sempre do mesmo jeito (só dinâmico, como
`firebase/app-check`), não tem esse problema.

## Como verificar que não regrediu

`npm run build` só prova que compila, não que executa — o bug passou
despercebido num build normal porque só se manifesta rodando o bundle real no
navegador. Ver [verificacao-build-producao](../verificacao-build-producao/SKILL.md)
para o passo completo de reprodução.

## Red flags

- `await import('firebase/auth')`, `import('firebase/app')` ou
  `import('firebase/firestore')` novo no diff — os três com entrada no
  `manualChunks`.
- Módulo que não seja `src/firebaseAuth.js`/`src/firebaseDb.js` acessando Auth
  ou Firestore diretamente em vez de importar a instância já inicializada.
- Adicionar `firebase/app-check` (ou outro pacote hoje fora do
  `manualChunks`) ao `manualChunks` sem também revisar todos os imports dele
  no projeto — nesse momento a regra de "só estático" passaria a valer para
  ele também.
