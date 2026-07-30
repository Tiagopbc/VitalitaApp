# Reposicionar badge BI-SET e status de sync no Modo Foco

## Problema

Na tela de execução de treino, com o **Modo Foco** ativo, a linha entre a barra superior e o card do exercício fica apertada: o badge "SALVO AGORA" (ou outro estado de `SyncStatusBadge`) e o indicador de grupo "🔗 BI-SET" disputam espaço com o stepper ANTERIOR / "X de Y" / PRÓXIMO. Isso deixa a área visualmente poluída e aumenta o risco de toque errado.

Uma primeira versão desta spec afirmava que o badge de grupo era redundante, porque `LinearCardCompactV2` (via `ExerciseCard`) já mostra uma tag de método (ex. "BI-SET") ao lado de "Séries" e "Meta". **Isso estava errado** e foi corrigido depois que a revisão automática do PR apontou (obrigado, Codex):

- `method` é um rótulo **puramente informativo**, digitado pelo usuário — não muda nada na execução. O próprio código diz isso em `CreateWorkoutPage.jsx:323`: *"Método 'Bi-set' sozinho é só informativo; o que muda a execução é o agrupamento."*
- `groupId` é o que **de fato** faz o Modo Foco alternar os exercícios e adiar o descanso até o fim da volta.

Os dois campos são independentes. O botão de corrente (`toggleGroupWithPrevious`) e a importação por PDF definem **só o `groupId`**, deixando `method: "Convencional"` — nesse caso a tag do card diz "CONVENCIONAL" enquanto a execução alterna os exercícios. O badge do stepper (vindo de `getGroupInfo`) era o **único** indicador correto do comportamento real no Modo Foco, não uma duplicata.

## Objetivo

Reorganizar o espaço acima do stepper no Modo Foco, sem alterar o comportamento fora dele.

## Escopo

Vale **somente para o Modo Foco** (`focusMode === true`). Fora dele, a `ExecutionTopBar` e o `SyncStatusBadge` continuam exatamente como estão — não há aperto nessa visão (o `FocusModeNav` nem renderiza; quem aparece é `ExecutionProgressCard`).

## Mudanças

1. **Tirar o badge de grupo do stepper, mas mantê-lo na linha utilitária.** O badge sai da linha do meio (onde espremia o "X de Y" entre ANTERIOR e PRÓXIMO) e passa a ficar entre o botão Cancelar e o status de sync, onde há espaço sobrando. Continua derivado do `groupId` via `getGroupInfo`, chamado na página e passado ao `FocusModeNav` pela prop `groupLabel`. **Não pode ser substituído pela tag de método do card** — ver a seção de contexto acima.

2. **Botão "Cancelar treino" sai da `ExecutionTopBar` no Modo Foco.** `ExecutionTopBar` já recebe a prop `focusMode`; quando `true`, o `TopBarButton` de cancelar (ícone `Trash2`, variant `danger`) não é renderizado ali. Fora do Modo Foco, nada muda.

3. **Nova linha utilitária, dentro de `FocusModeNav`, acima do stepper.** Contém:
   - à esquerda: botão **Cancelar** — reaproveita `TopBarButton` (`variant="danger"`, com label visível, não `iconOnly`), mesmo componente/estilo já usado na barra superior, só que agora aqui.
   - à direita: `SyncStatusBadge` (mesmo componente atual, com todos os estados — carregando, sincronizando, salvo, falha, etc. — sem reduzir a texto/ícone).

   `FocusModeNav` passa a receber duas props novas: `onDiscard` (handler do cancelar) e `syncStatus` (estado pro `SyncStatusBadge`).

4. **`WorkoutExecutionPage` para de renderizar o `SyncStatusBadge` avulso quando `focusMode` é `true`** (hoje ele fica numa `div` própria, sempre visível, acima do `FocusModeNav`/`ExecutionProgressCard`). Fora do Modo Foco, esse bloco continua exatamente como está hoje.

5. **Respiro entre a linha utilitária e o stepper.** A margem inferior da linha Cancelar/Sync aumenta (de algo como `mb-2` pra por volta de `mb-5`/20px) especificamente para afastar o botão Cancelar do botão Anterior, evitando toque errado. Confirmado com o usuário via mockup.

6. **Botões ANTERIOR/PRÓXIMO com traço mais forte.** A variante `outline-primary` do `Button` (design system) é usada em várias telas fora da execução (perfil, termos, privacidade, dashboard do personal, métodos) — não deve ser alterada globalmente. Em vez disso, adiciona-se uma nova variante ao `variantStyles` de `Button.jsx`, algo como `outline-primary-strong` (borda ciano mais opaca/sólida, fundo um pouco mais forte, glow sutil), usada só pelos botões Anterior/Próximo do `FocusModeNav`.

7. **Sem mudança no card do exercício.** O agrupamento Séries/Meta/BI-SET no `LinearCardCompactV2` já quebra linha sozinho (flex-wrap) — nenhuma alteração necessária ali.

8. **Botão "CALC" mantém o nome.** Avaliado renomear pra "1RM", mas descartado: o modal por trás (`GymToolsModal`) tem duas abas — 1RM estimado e calculadora de anilhas — e "1RM" esconderia a segunda função. Fora de escopo desta mudança.

## Arquivos afetados

- `src/components/execution/FocusModeNav.jsx` — remove badge de grupo do stepper; adiciona linha utilitária (Cancelar + SyncStatusBadge) acima do stepper; aplica a nova variante nos botões Anterior/Próximo; novas props `onDiscard` e `syncStatus`.
- `src/components/execution/ExecutionTopBar.jsx` — oculta o `TopBarButton` de cancelar quando `focusMode` é `true`.
- `src/pages/WorkoutExecutionPage.jsx` — condiciona a renderização do bloco avulso do `SyncStatusBadge` a `!focusMode`; passa `onDiscard`/`syncStatus` pro `FocusModeNav`.
- `src/components/design-system/Button.jsx` — nova variante `outline-primary-strong` no mapa `variantStyles`.

## Fora de escopo

- Qualquer mudança no `LinearCardCompactV2` / card do exercício.
- Renomear ou alterar o botão "CALC".
- Qualquer mudança na barra superior ou badges fora do Modo Foco.
- Mudança na variante `outline-primary` existente (usada em outras telas).

## Validação visual

Design aprovado interativamente com mockups (companion de brainstorming) — três opções iniciais, layout consolidado e ajuste final de espaçamento. Usuário confirmou o resultado (v2) como está.
