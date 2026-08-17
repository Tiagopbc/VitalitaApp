# Barra de aviso descendo do topo, no lugar do toast do sonner

## Problema

O aviso de confirmação do app hoje é um toast do `sonner` ancorado a `42vh`, que cai opticamente no centro da tela (`AppAuthed.jsx:459`). Esse posicionamento foi a solução de #51/#53 para um defeito real: ancorado no topo, o aviso ficava atrás da status bar do iPhone e o usuário o via sumir sem ler.

Resolveu o sumiço, mas o resultado é um bloco solto no meio da tela, sem relação com a interface em volta. O usuário pediu outro formato: uma **barra que desce do topo**, de borda a borda, no molde dos banners de sistema — verde quando confirma que o treino foi salvo.

Há também um buraco de comportamento independente do visual: **salvar uma ficha pelo caminho normal não avisa nada**. `CreateWorkoutPage.jsx:384` chama `onBack()` direto e volta pra lista em silêncio. O verde "Treino salvo" só dispara na fila de importação por PDF (`CreateWorkoutPage.jsx:381`), entre um treino e o próximo.

## Objetivo

Substituir o `sonner` por um componente próprio de barra superior, usado por **todos** os avisos do app (sucesso, erro e informativo), e passar a confirmar o salvamento de ficha no caminho normal.

## Por que barra no topo não reintroduz o defeito de #51/#53

Não é o aviso voltando pro topo. A barra pinta de `top: 0` até abaixo da status bar — a cor ocupa a área do relógio e da bateria, e o **conteúdo** (ícone e texto) fica na faixa logo abaixo deles. O que escondia o aviso antigo era ele ser um card curto ancorado a `top-6`, inteiramente dentro da zona da status bar. Referência visual fornecida pelo usuário: banner amarelo full-bleed com o relógio do iOS por cima da cor.

> **Emenda de 16/08/2026 — o full-bleed vale, e agora aparece de verdade.**
>
> Esta seção continua descrevendo o comportamento. A barra pinta até o pixel 0,
> com o relógio por cima da cor. Confirmado no iPhone.
>
> O caminho até aqui passou por uma emenda intermediária, escrita em 15/08 e
> **errada**, que declarava o full-bleed morto. Ela ficou registrada abaixo
> porque o raciocínio dela — não o veredito — explica a configuração atual.
>
> **O que estava certo nela:** com `apple-mobile-web-app-status-bar-style:
> black-translucent`, o iOS aplica dois efeitos em quem entra na faixa da status
> bar — esfumaçado e escurecimento, este para o relógio branco continuar legível
> sobre qualquer cor. A barra verde saía com o topo lavado, e o texto da tela
> borrava ao rolar para cima.
>
> **O que estava errado:** concluir que `black` custaria o full-bleed. Não custa.
> O `viewport-fit=cover` mantém o conteúdo ocupando a tela toda nos dois modos; o
> que muda é que, com `black`, o iOS assume fundo escuro e **não aplica efeito
> nenhum**. Resultado: cor cheia até o topo, sem esfumaçado e sem escurecimento.
>
> **Duas tentativas de conviver com `black-translucent` falharam antes**, ambas
> verificadas no aparelho: cinco hipóteses de CSS testadas com painel de A/B, e
> uma tampa opaca sobre a área segura (`StatusBarCap`, #72) — que falhou porque a
> região afetada não coincide com `env(safe-area-inset-top)` e porque a barra de
> aviso, em z-10000, fica acima de qualquer tampa.
>
> **Ao mexer nessa tag:** o iOS a lê ao montar a janela do app. Nem "Atualizar
> Agora" nem matar o app no seletor bastaram — só pegou removendo o ícone da tela
> inicial e adicionando de novo pelo Safari. Custo de uma vez só, e restrito às
> três configurações de janela (status bar, ícone, nome). Todo o resto chega pelo
> service worker.
>
> ---
>
> **Emenda intermediária (15/08, veredito errado) — a cor não alcança mais o relógio.**
>
> O app trocou `apple-mobile-web-app-status-bar-style` de `black-translucent`
> para `black` (#70). Com isso o conteúdo deixa de passar por baixo da status
> bar, `env(safe-area-inset-top)` passa a **0** em tela cheia, e a barra verde
> **não pinta mais sob o relógio** — ela começa abaixo da faixa que o iOS pinta.
>
> O `pt-[env(safe-area-inset-top)]` continua no componente e vira no-op nesse
> modo. É de propósito: ele volta a valer sozinho se a tag mudar, e cobre
> plataformas onde o inset não é zero.
>
> **Por que a troca:** com `black-translucent`, o iOS aplica um esfumaçado
> próprio no conteúdo que entra na faixa da status bar. Isso borrava os botões
> da barra de execução, que é `fixed` no topo e mora dentro da faixa. O usuário
> localizou o efeito rolando a Home e vendo a saudação borrar ao entrar ali,
> enquanto a linha logo abaixo ficava nítida. Cinco hipóteses do lado do app
> foram testadas no aparelho antes disso e todas caíram — o efeito é do sistema,
> e nenhum CSS o remove.
>
> **O que se perdeu:** o full-bleed sob o relógio, que era a premissa central
> deste spec. A decisão foi do usuário, tomada comparando os dois estados no
> aparelho: texto nítido valeu mais que cor de ponta a ponta.
>
> O resto do spec — fila de um, `id` como chave de remount, `pointer-events-none`,
> auto-dismiss, aviso com ação — segue valendo sem alteração.

## Decisão de arquitetura

Duas abordagens foram avaliadas:

**A — manter o `sonner` como motor e trocar só a aparência** via `toast.custom()` e reconfiguração do `Toaster`. Ganha fila, timers, `aria-live` e pausa no hover de graça.

**B — componente próprio, `sonner` sai da árvore.** (escolhida)

Escolhida a B. O motivo é específico desta mudança: chegar a full-bleed até o pixel 0 exige vencer o CSS do `sonner` (`--width`, padding do container, `width` do `li`), e #53 já registrou que sobrescrever o CSS do pacote briga com a animação de `transform` que ele aplica. Aqui a animação de descida **é** o pedido central, então herdar essa briga é herdar o risco no ponto errado. De quebra sai uma dependência do bundle e o chunk lazy dela.

Custo aceito: fila e acessibilidade passam a ser código do projeto. Mitigado por escopo mínimo — fila de um.

## Arquitetura

Três peças.

### `src/utils/notifyStore.js`

Store de módulo, sem React. Expõe `subscribe(fn)`, `getSnapshot()` e a API imperativa:

```js
notify.success(message, options?)
notify.error(message, options?)
notify.info(message, options?)
notify.dismiss()
```

`options` aceita apenas `action: { label, onClick }` (ver "Aviso com ação" abaixo).

**Fila de um:** aviso novo substitui o anterior. O app nunca dispara dois simultâneos, e empilhar barras full-bleed cobriria a tela.

**`id` incremental por aviso.** É a chave de remount do componente: sem ela, duas mensagens em sequência trocariam o texto sem refazer a descida. Regra complementar: aviso com **mesmo tipo e mesma mensagem** do que já está na tela não gera `id` novo e não reinicia a animação — é o que substitui a deduplicação por `id` que o `sonner` fazia em `useProfileData.js:58`.

Ser módulo, e não contexto React, é requisito e não estilo: `workoutService.js:13` e `HomeDashboard.jsx:92` emitem erro de fora da árvore React e hoje fazem `await import('sonner')` só para isso. Ambos passam a importar `notify` estaticamente e chamar direto.

### `src/components/design-system/TopBanner.jsx`

Lê o store com `useSyncExternalStore`, anima com framer-motion e agenda o auto-dismiss.

**Posição e forma.** `fixed inset-x-0 top-0`, com `pt-[env(safe-area-inset-top)]` mais uma linha de conteúdo. Ícone (`CheckCircle2` / `AlertCircle`) e mensagem em negrito, alinhados à esquerda. Sem botão de fechar.

**Cores.** Seguem a convenção que o app já usa em `Toast.jsx:13`: `emerald-600` para sucesso, `red-600` para erro, `blue-600` para info, texto branco. Como a barra carrega o próprio fundo, funciona nos temas claro e escuro — o `theme="dark"` fixo que o `sonner` exigia deixa de existir.

**`pointer-events-none` no wrapper.** Sem botão, a barra não precisa receber toque nenhum. Isso dissolve a disputa de `z-index`: ela vai para `z-[10000]`, acima dos modais de 9999 (`NumericKeypad.jsx:44`, `PremiumAlert.jsx:43`), sem risco de roubar um toque. No caso com ação, só o botão recebe `pointer-events-auto`.

**Animação.** Desce de `y: -100%` até `0` em ~260ms, ease-out; permanece 3s; recolhe em ~200ms, ease-in. Movimento reduzido já é tratado globalmente por `MotionPreferences.jsx:10` (`MotionConfig reducedMotion="user"`), sem tratamento específico aqui.

**Acessibilidade por tipo.** Sucesso e info em `role="status"` / `aria-live="polite"`; erro em `role="alert"` / `aria-live="assertive"`, para não competir com a leitura em curso quando é apenas confirmação.

### Montagem em `AppAuthed.jsx`

`TopBanner` ocupa o lugar do `SonnerToaster`. Saem junto o `React.lazy(loadSonnerToaster)` e o gate `shouldRenderToaster` / `requestIdleCallback` (`AppAuthed.jsx:121` e `:146`) — existiam para adiar o chunk do `sonner`; o componente próprio é pequeno e o framer-motion já está carregado.

Ficar montado na raiz autenticada é o que faz o aviso **sobreviver à navegação**, necessário porque salvar uma ficha volta pra lista no mesmo tique.

O comentário atual sobre o `offset` de `42vh` sai; no lugar entra o registro de por que a barra é full-bleed, para a lição de #51/#53 não se perder.

## Aviso com ação

`useProfileData.js:58` é o único aviso com botão de verdade: um "Tentar Novamente" que refaz o carregamento do perfil. Não cabe numa barra `pointer-events-none`, e descartá-lo seria perder função.

A barra passa a aceitar ação opcional: `notify.error(msg, { action: { label, onClick } })` renderiza um botão à direita — a mesma posição do "Upgrade" na referência visual, então o formato já comporta.

**Quando há ação, a barra não sobe sozinha.** Sumir em 3s levaria o retry embora antes de o usuário decidir. É o único caso que espera toque; o `onClick` executa e fecha a barra.

## Migração

39 chamadas em 9 arquivos, todas mecânicas (troca do import e do prefixo `toast.` → `notify.`), exceto a de `useProfileData.js`, coberta acima.

| Arquivo | Chamadas |
|---|---|
| `src/pages/ProfilePage.jsx` | 10 |
| `src/pages/WorkoutsPage.jsx` | 9 |
| `src/pages/CreateWorkoutPage.jsx` | 6 |
| `src/pages/TrainerDashboard.jsx` | 4 |
| `src/components/AddCardioModal.jsx` | 3 |
| `src/components/history/WorkoutDetailsModal.jsx` | 3 |
| `src/components/PwaUpdatePrompt.jsx` | 2 |
| `src/components/achievements/AchievementUnlockedModal.jsx` | 1 |
| `src/hooks/profile/useProfileData.js` | 1 |

Mais os dois emissores de fora do React, que perdem o `await import('sonner')` e o helper `showToastError` inteiro:

- `src/services/workoutService.js:13`
- `src/pages/HomeDashboard.jsx:92`

E a remoção de `sonner` do `package.json`.

## Aviso novo ao salvar ficha

`CreateWorkoutPage.jsx:384` passa a chamar `notify.success('Treino salvo.')` antes de `onBack()`, fechando o silêncio do caminho normal. O aviso da fila de importação (`:381`) continua com o texto atual, que informa qual treino vem a seguir.

## Arquivos afetados

- `src/utils/notifyStore.js` — **novo**: store, API imperativa, fila de um, regra de `id`.
- `src/components/design-system/TopBanner.jsx` — **novo**: a barra.
- `src/AppAuthed.jsx` — troca `SonnerToaster` por `TopBanner`; remove `loadSonnerToaster`, `SonnerToaster`, `shouldRenderToaster` e o efeito de `requestIdleCallback`; atualiza o comentário de posicionamento.
- `src/services/workoutService.js` — remove `showToastError` e o import dinâmico; chama `notify.error`.
- `src/pages/HomeDashboard.jsx` — idem.
- `src/hooks/profile/useProfileData.js` — migra para `notify.error` com `action`.
- Os 8 demais arquivos da tabela de migração — troca de import e prefixo.
- `package.json` — remove `sonner`.

## Testes

`src/utils/notifyStore.test.js` — **novo**: substituição pela fila de um; `id` incremental; aviso idêntico não reinicia; `dismiss`.

`src/components/design-system/TopBanner.test.jsx` — **novo**: mensagem e cor por tipo; `role`/`aria-live` por tipo; some após 3s (fake timers); **não** some sozinha quando tem ação; clique na ação dispara o `onClick` e fecha.

`src/services/workoutService.test.js` — o `vi.mock('sonner')` (`:6`) vira mock do `notifyStore`; simplifica, porque o import deixa de ser dinâmico.

## Validação

Sequência do CI antes de commitar:

```bash
npm run lint && npm test -- --run && npm --prefix functions test && npm run build
```

**Visual.** A barra só existe em tela autenticada e nenhum ambiente que o agente abre autentica. Verificação por entry point temporário do Vite renderizando `TopBanner` isolado nos três tipos e no caso com ação, medindo por DOM e conferindo a descida em screenshot; o entry point é removido depois.

`env(safe-area-inset-top)` não reproduz no desktop — a conferência da faixa sob o relógio fica para o iPhone, com o usuário.

## Fora de escopo

- O `Toast` próprio da tela de execução (`src/components/design-system/Toast.jsx`), usado só para o erro de validação em `WorkoutExecutionPage.jsx:266`. Ele aponta para o campo de peso/repetições que a mensagem manda corrigir, e essa proximidade é o valor dele — virar barra no topo desfaria #51.
- O `SyncStatusBadge` ("Salvo agora") do Modo Foco, que é status contínuo de sincronização, não aviso pontual.
- Empilhamento de múltiplos avisos, gesto de swipe para dispensar e pausa do timer com a aba oculta.
