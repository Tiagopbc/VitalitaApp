---
name: escrita-workout-templates
description: >-
  Contexto sobre o caminho único de escrita em workout_templates no Vitalità e
  sobre quando uma mudança de campo exige teste em firestore.rules.test.js. Invoque
  antes de escrever em workout_templates fora de workoutService, ao adicionar addDoc
  ou updateDoc direto numa página, ou ao adicionar/alterar um campo de topo em
  workout_templates, workout_sessions ou qualquer coleção validada pelas
  firestore.rules.
---

# Escrita em workout_templates e campos validados pelas rules

## Caminho único de escrita

**Toda escrita em `workout_templates` passa por `workoutService`**
(`createTemplate`/`updateTemplate` em `src/services/workoutService.js`). É o
caminho usado pela criação manual, pela biblioteca de modelos
(`src/data/starterWorkouts.js`) e pela importação por PDF. Não chame `addDoc`
ou `updateDoc` direto numa página — se precisar de um caso novo, adicione ao
`workoutService`.

## Por que as firestore.rules só importam para campo de topo

As `firestore.rules` validam propriedade e campos permitidos rodando `hasOnly`
sobre `request.resource.data.keys()` — ou seja, só sobre as **chaves de topo**
do documento. Um campo novo *dentro* do array `exercises` (como
`targetWeight` da carga-alvo) não precisa ser liberado nas regras. Um campo
novo no **topo** do documento (irmão de `name`, `exercises`, `userId`) precisa,
e nesse caso:

1. Atualizar `firestore.rules` para permitir o campo.
2. Adicionar cenário em `tests/security/firestore.rules.test.js` (roda no
   emulador — exige Java 21, `npm run test:rules`).
3. Atualizar `docs/firestore-model.md` se a coleção/campo mudou de forma.
4. Confirmar que o índice em `firestore.indexes.json` ainda cobre as queries,
   se o campo novo entrar em alguma.

Ver [docs/security-rules.md](../../../docs/security-rules.md) para o checklist
completo ao alterar rules.

## Red flags

- `addDoc(collection(db, 'workout_templates'), ...)` ou `updateDoc` direto fora
  de `workoutService.js`.
- Campo novo de topo em `workout_templates`/`workout_sessions` no diff sem
  mudança correspondente em `firestore.rules` e em
  `tests/security/firestore.rules.test.js`.
