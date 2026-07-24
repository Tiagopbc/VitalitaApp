---
name: importacao-pdf-treino
description: >-
  Contexto para trabalhar na importação de treino por PDF do Vitalità — a função
  serverless api/parse-workout-pdf.js que chama a API da Anthropic, o formato
  { workouts: [...] }, a decomposição de bi-sets, a fila de revisão no
  CreateWorkoutPage e como isso interage com as firestore.rules. Invoque ao mexer
  em parse-workout-pdf, workoutPdfImport, importação/leitura de ficha por PDF,
  bi-set/tri-set, groupedWithPrevious/groupId ou no botão de importar treino.
---

# Importação de treino por PDF

A **única funcionalidade paga** do app. Ler antes de mexer no fluxo.

## Custo e configuração

`api/parse-workout-pdf.js` chama a API da Anthropic (`claude-opus-4-8`) para ler a
ficha, a ~US$ 0,04 por PDF. Exige três variáveis:

- `ANTHROPIC_API_KEY` e `FIREBASE_PROJECT_ID` — **servidor**, nunca `VITE_*`.
- `VITE_ENABLE_PDF_IMPORT=true` — **build**, para exibir o botão. O cliente não
  consegue detectar a config do servidor sem gastar requisição.

Sem elas o botão some ou a função responde 503, sem afetar o resto do app.

## Fronteira de responsabilidade (proposital)

A função **só parseia**. Quem grava em `workout_templates` é o cliente autenticado
via `workoutService.createTemplate`, respeitando as `firestore.rules`. A revisão
humana no `CreateWorkoutPage` antes de salvar é proposital, não opcional.

> Toda escrita em `workout_templates` passa por `workoutService`
> (`createTemplate`/`updateTemplate`). Não volte a chamar `addDoc` direto numa página.

## Vários treinos e decomposição de bi-sets

A resposta é `{ workouts: [...] }` — um item por ficha do documento (Treino A, B, C).

- Bi-set/tri-set são quebrados em exercícios separados e consecutivos, marcados com
  `groupedWithPrevious`. O cliente (`assignGroupIds` em `workoutPdfImport.js`)
  converte isso no `groupId` que `exerciseGroups.js` usa para religar a dupla.
- A decomposição é **rede de segurança determinística** no servidor
  (`decomposeExercise`): mesmo que a IA devolva "A + B" num nome só, a função separa.
- No `CreateWorkoutPage` os treinos entram numa **fila de revisão** — salva um, o
  próximo aparece.

## Interação com as firestore.rules

As `firestore.rules` só validam **chaves de topo**: o `hasOnly` roda sobre
`request.resource.data.keys()`, então campos *dentro* do array `exercises` (como o
`targetWeight` da carga-alvo) não precisam ser liberados nas regras. Campo novo no
**topo** do documento, sim — e aí exige cenário em
`tests/security/firestore.rules.test.js`.

## Referências

- [MANUAL_TECNICO.md](../../../MANUAL_TECNICO.md) §7.4
- [docs/security-rules.md](../../../docs/security-rules.md)
