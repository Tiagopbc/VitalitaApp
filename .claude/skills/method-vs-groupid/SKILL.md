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

**Para saber se há agrupamento, derive de `groupId` via `getGroupInfo` — nunca do `method`.** O rótulo correto ("Bi-set", "Tri-set", "Circuito") vem do *tamanho* do grupo, não de um campo digitado.

Onde isso já está feito certo:

- `src/components/execution/ExerciseGroupCard.jsx` — fora do Modo Foco, mostra `groupLabel(segment.indices.length)`.
- `src/components/execution/FocusModeNav.jsx` — no Modo Foco, recebe a prop `groupLabel`, que a página calcula com `focusGroupBehaviorLabel(exercises, currentExerciseIndex)`.

### A exceção: ler `method` para decidir *exibição*

A regra proíbe usar `method` como **fonte da verdade** sobre agrupamento. Não proíbe consultá-lo para decidir se vale a pena mostrar algo — são perguntas diferentes:

| Pergunta | Fonte | Permitido? |
|---|---|---|
| "Este exercício está agrupado?" | `groupId` / `getGroupInfo` | Só assim |
| "A tag do card já diz isso ao usuário?" | `method` | Sim |

`focusGroupBehaviorLabel` (`src/utils/exerciseGroups.js`) é o caso concreto: chama `getGroupInfo` para saber se há grupo — se não houver, retorna `null` e o `method` nem é lido — e só então compara com o `method` para omitir um rótulo que apenas repetiria a tag do card. Trocar o `method` por qualquer valor nunca faz um exercício agrupado parecer avulso na execução; no pior caso, mostra ou esconde um rótulo.

**O teste do limite:** se o `method` mudar e o *comportamento de execução* mudar junto, a regra foi violada. Se só a densidade visual mudar, está dentro da exceção.

### Por que o rótulo do Modo Foco fala de comportamento

O card já mostra o **nome** do método ("BI-SET", clicável, abre a explicação). Repetir a mesma palavra no topo faria parecer a mesma informação duplicada, quando na verdade uma é rótulo e a outra é comportamento. Por isso `groupBehaviorLabel` devolve "Alterna em dupla" / "Alterna em trio" / "Alterna em circuito" — descreve o que o app faz (alternar a cada série, descanso só ao fim da volta, ver `useExecutionNavigation`), não como o exercício se chama.

## Red flag

Qualquer PR que remova **incondicionalmente** um indicador derivado de `getGroupInfo` justificando que "a informação já aparece na tag de método do card". Aconteceu em 29/07/2026 no PR #47: a spec assumiu que os dois campos eram redundantes, as revisões por task e a revisão final herdaram a premissa sem questioná-la, e o Modo Foco ficou sem nenhum indicador de agrupamento quando o `method` não acompanhava. Pego pela revisão automática do Codex, não pelo nosso processo.

A diferença entre isso e a exceção legítima acima está no **incondicionalmente**: omitir o rótulo *quando o card comprovadamente já o mostra* é decisão de exibição; remover o cálculo é perder a informação.

O teste de regressão que cobre isso está em `src/pages/WorkoutExecutionPage.test.jsx` ("shows the group label in focus mode for a grouped exercise whose method is Convencional") — exercícios com `groupId` **e** `method: 'Convencional'`. Um teste que use `method: 'Bi-set'` nos dados não pega o caso, porque aí o rótulo é omitido de propósito.

Os quatro casos cobertos em `src/utils/exerciseGroups.test.js` (`focusGroupBehaviorLabel`) são o mapa completo: avulso, agrupado com método coincidente, agrupado com método "Convencional", e método descrevendo um agrupamento diferente do real.
