---
name: method-vs-groupid
description: >-
  Contexto sobre por que `method` e `groupId` são campos independentes no
  Vitalità: `method` ("Bi-set", "Drop-set") é um rótulo informativo digitado
  pelo usuário, enquanto `groupId` é o que de fato faz o Modo Foco alternar
  exercícios e adiar o descanso. Invoque antes de tratar a tag de método do
  card como indicador de agrupamento, antes de remover qualquer badge derivado
  de `getGroupInfo`, ou ao mexer em bi-set/tri-set/circuito, no botão de
  corrente (`toggleGroupWithPrevious`) e na decomposição de bi-sets do PDF.
---

# `method` e `groupId` são coisas diferentes

## A distinção

| Campo | O que é | O que faz na execução |
|---|---|---|
| `method` | Rótulo **informativo**, escolhido pelo usuário no formulário ("Bi-set", "Drop-set", "Convencional") | **Nada** para bi-set/tri-set/circuito. Só `Drop-set`, `Rest-Pause` e `Cluster set` têm efeito (semeiam reduções em `normalizeSets.js`). |
| `groupId` | Vínculo entre exercícios **consecutivos**, criado pelo botão de corrente ou pela importação de PDF | **Tudo**: `useExecutionNavigation` chama `getGroupInfo` e, com base nele, alterna os exercícios a cada série e adia o descanso até o fim da volta. |

O próprio código diz isso, em `src/pages/CreateWorkoutPage.jsx`:

```js
// Método "Bi-set" sozinho é só informativo; o que muda a execução é o
// agrupamento. Ao salvar com esse método, oferece agrupar com o anterior.
```

## Por que isso morde

**Os dois campos não andam juntos.** `toggleGroupWithPrevious` (`src/utils/exerciseGroups.js`) só mexe em `groupId` — nunca toca em `method`. A importação por PDF (`workoutPdfImport.js`) converte `groupedWithPrevious` em `groupId`, também sem definir `method`. Resultado: é comum um exercício agrupado carregar `method: "Convencional"`.

Isso cria dois casos assimétricos:

- **Agrupado, mas `method: "Convencional"`** → a execução alterna os exercícios, mas a tag do card diz "CONVENCIONAL". Se a UI depender do `method` para sinalizar o agrupamento, o usuário não tem como saber que o comportamento mudou.
- **`method: "Bi-set"`, mas sem `groupId`** → a tag do card diz "BI-SET" e a execução **não** alterna nada. Por isso existe `suggestGroupingForBiSet`, que ao salvar oferece agrupar de fato.

## A regra

**Para indicar agrupamento na UI, derive de `groupId` via `getGroupInfo` / `groupLabel` — nunca leia o `method`.** O rótulo correto ("Bi-set", "Tri-set", "Circuito") vem do *tamanho* do grupo, não de um campo digitado.

Onde isso já está feito certo:

- `src/components/execution/ExerciseGroupCard.jsx` — fora do Modo Foco, mostra `groupLabel(segment.indices.length)`.
- `src/components/execution/FocusModeNav.jsx` — no Modo Foco, recebe a prop `groupLabel`, que a página calcula com `getGroupInfo(exercises, currentExerciseIndex)?.label`.

## Red flag

Qualquer PR que remova um badge derivado de `getGroupInfo` justificando que "a informação já aparece na tag de método do card". Aconteceu em 29/07/2026 no PR #47: a spec assumiu que os dois campos eram redundantes, as revisões por task e a revisão final herdaram a premissa sem questioná-la, e o Modo Foco ficou sem nenhum indicador de agrupamento para treinos vindos do PDF. Pego pela revisão automática do Codex, não pelo nosso processo.

O teste de regressão que cobre isso está em `src/pages/WorkoutExecutionPage.test.jsx` ("shows the group label in focus mode for a grouped exercise whose method is Convencional") — exercícios com `groupId` **e** `method: 'Convencional'`. Um teste que use `method: 'Bi-set'` nos dados não pega o caso.
