# Barra de aviso descendo do topo — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** substituir o toast do `sonner` por uma barra própria que desce do topo, full-bleed, usada por todos os avisos do app — e passar a confirmar o salvamento de ficha no caminho normal.

**Arquitetura:** um store de módulo (`notifyStore`) guarda o aviso atual e cuida do ciclo de vida dele; um componente (`TopBanner`) lê esse store com `useSyncExternalStore` e desenha a barra com framer-motion. O store ser um módulo, e não contexto React, é requisito: dois emissores ficam fora da árvore React. O `sonner` sai do projeto.

**Stack:** React 19, framer-motion 12, lucide-react, Tailwind, Vitest + @testing-library/react (jsdom).

**Spec:** [docs/superpowers/specs/2026-08-12-banner-aviso-topo-design.md](../specs/2026-08-12-banner-aviso-topo-design.md)

## Restrições globais

- Node 24 + npm 11. Em shell não-interativo o gerenciador de versão não carrega; use `fnm exec --using=24 -- <comando>` quando a versão importar. Nunca rode `npm install` que reescreva o `package-lock.json` num npm de major diferente.
- Português em comentários, mensagens de commit e textos de UI. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Nunca importe pacote do Firebase dinamicamente (`await import('firebase/...')`) — quebra o boot em produção. Não se aplica ao `sonner`, mas os imports dinâmicos dele estão sendo removidos por este plano.
- O CI reprova por lint. Sequência completa antes de fechar:
  `npm run lint && npm test -- --run && npm --prefix functions test && npm run build`
- Um teste isolado: `npm test -- --run src/utils/notifyStore.test.js`
- Portas de dev são fixas (5175 dev, 4173 preview) por causa da restrição de referrer da API key. Não altere.

## Desvio consciente do spec

O spec diz que o `TopBanner` "agenda o auto-dismiss". **O timer fica no store, não no componente.** Motivo: com o timer no store, as regras de tempo ("some em 3s", "com ação não some") são testáveis em JavaScript puro, sem depender do ciclo de animação do framer-motion dentro do jsdom — que é justamente onde teste de componente fica frágil. O componente vira uma view pura. Nada mais muda no comportamento descrito.

## Emenda 1 — descoberta durante a execução (12/08/2026)

A contagem de 39 chamadas foi feita com `grep "toast\."` e por isso **perdeu uma
chamada sem método**: `toast('Bi-set é executado em dupla', { description, action,
duration: 8000 })` em `CreateWorkoutPage.jsx:333` — a sugestão de agrupar quando o
usuário salva um exercício marcado como "Bi-set" sem encadeá-lo com o anterior.
São 40 chamadas, e `CreateWorkoutPage.jsx` tem 7, não 6.

Ela usa duas opções que o store não previa. Decisão do usuário:

- **`description` entra** como opção do store e segunda linha da barra (título em
  negrito, explicação abaixo em corpo menor). Serve avisos futuros que precisem
  explicar, não só este.
- **`duration` entra** como opção, permitida inclusive junto de `action`. O padrão
  segue: sem ação, `AUTO_DISMISS_MS`; com ação e sem `duration`, não some sozinha.
  A sugestão de bi-set passa `8000` e mantém o comportamento de hoje — é sugestão
  opcional, não erro, e ignorá-la deve bastar para ela sair de cena. O "Tentar
  Novamente" do perfil continua sem `duration`, esperando toque. **(Revertido pela
  Emenda 2 — ver abaixo.)**

## Emenda 2 — decidida na revisão final (13/08/2026)

A regra "com ação, espera toque" foi desenhada olhando o aviso isolado. A revisão
final da branch mostrou a consequência que ninguém tinha visto: como a barra vive
na raiz autenticada e não tem X, swipe nem `dismiss` na desmontagem, o aviso de
falha ao carregar o perfil ficava **permanente e sem forma de fechar**, acompanhando
o usuário para Home, Treinos, Histórico e execução, por cima de tudo em `z-[10000]`.
Bastava abrir o Perfil offline uma vez para ficar com uma faixa vermelha fixa no
topo do app inteiro. O `sonner` não tinha esse problema porque aquela chamada
passava `duration: 5000` mesmo tendo botão.

Decisão do usuário: **devolver o `duration: 5000`** à chamada de `useProfileData`.
Isso restaura a paridade com o comportamento anterior à migração e resolve de uma
vez três coisas — a permanência, o vazamento do aviso entre telas, e o aviso
sobrevivendo ao logout com um `onClick` preso a um hook já desmontado.

Efeito colateral registrado: a deduplicação por `id` que o `sonner` fazia nessa
chamada **não** tem substituto no store — o early-return de dedup exige
`!action && !current.action`, e esta é a única chamada com ação. Quem evita o
incômodo de repetição aqui é o `duration`, não a dedup. Os comentários de
`useProfileData.js` e `notifyStore.js` afirmavam o contrário e foram corrigidos.

Isso reabre `notifyStore` e `TopBanner` (Tarefas 1 e 2) numa tarefa 5a, executada
antes de fechar a Tarefa 5.

## Estrutura de arquivos

**Criar:**
- `src/utils/notifyStore.js` — estado do aviso atual, API imperativa (`notify.*`), fila de um, regra de `id`, timer de auto-dismiss.
- `src/utils/notifyStore.test.js`
- `src/components/design-system/TopBanner.jsx` — a barra: posição, cores, animação, acessibilidade.
- `src/components/design-system/TopBanner.test.jsx`

**Modificar:**
- `src/AppAuthed.jsx` — monta `TopBanner`; remove `SonnerToaster`, o `React.lazy` dele e o gate `shouldRenderToaster`.
- `src/services/workoutService.js` e `src/pages/HomeDashboard.jsx` — removem o helper `showToastError` e o `await import('sonner')`.
- `src/services/workoutService.test.js` — troca o mock de `sonner` pelo do `notifyStore`.
- 9 arquivos de UI — troca de import e prefixo (tabela na Tarefa 5).
- `src/pages/CreateWorkoutPage.jsx` — ganha o aviso que falta ao salvar ficha.
- `package.json` — remove `sonner`.

---

### Tarefa 1: store dos avisos

**Arquivos:**
- Criar: `src/utils/notifyStore.js`
- Teste: `src/utils/notifyStore.test.js`

**Interfaces:**
- Consome: nada.
- Produz: `notify.success(message, options?)`, `notify.error(...)`, `notify.info(...)`, `notify.dismiss()` — todos síncronos, retornam o `id` (número) do aviso; `subscribeToNotify(listener) => unsubscribe`; `getNotifySnapshot() => { id, type, message, action } | null`; `resetNotifyStore()`; constante `AUTO_DISMISS_MS = 3000`. `options` aceita só `{ action: { label, onClick } }`. `type` é `'success' | 'error' | 'info'`.

- [ ] **Passo 1: escrever os testes que falham**

```javascript
// src/utils/notifyStore.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    notify,
    subscribeToNotify,
    getNotifySnapshot,
    resetNotifyStore,
    AUTO_DISMISS_MS
} from './notifyStore';

describe('notifyStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetNotifyStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('guarda o aviso e notifica quem assinou', () => {
        const listener = vi.fn();
        subscribeToNotify(listener);

        notify.success('Treino salvo.');

        expect(listener).toHaveBeenCalled();
        expect(getNotifySnapshot()).toMatchObject({ type: 'success', message: 'Treino salvo.' });
    });

    it('cancela a assinatura', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToNotify(listener);
        unsubscribe();

        notify.info('Qualquer coisa.');

        expect(listener).not.toHaveBeenCalled();
    });

    // Fila de um: empilhar barras full-bleed cobriria a tela.
    it('aviso novo substitui o anterior', () => {
        notify.success('Treino salvo.');
        notify.error('Erro ao salvar treino.');

        expect(getNotifySnapshot()).toMatchObject({ type: 'error', message: 'Erro ao salvar treino.' });
    });

    // O id é a chave de remount do componente: sem id novo, duas mensagens
    // em sequência trocariam o texto sem refazer a descida.
    it('gera id novo a cada aviso diferente', () => {
        const primeiro = notify.success('Treino salvo.');
        const segundo = notify.success('Treino duplicado.');

        expect(segundo).not.toBe(primeiro);
    });

    it('aviso idêntico ao que está na tela não gera id novo', () => {
        const primeiro = notify.error('Erro ao carregar treinos.');
        const repetido = notify.error('Erro ao carregar treinos.');

        expect(repetido).toBe(primeiro);
    });

    it('mesma mensagem em tipo diferente gera id novo', () => {
        const primeiro = notify.info('Pronto.');
        const segundo = notify.success('Pronto.');

        expect(segundo).not.toBe(primeiro);
    });

    it('some sozinho depois da duração', () => {
        notify.success('Treino salvo.');

        vi.advanceTimersByTime(AUTO_DISMISS_MS);

        expect(getNotifySnapshot()).toBeNull();
    });

    it('o relógio do aviso novo recomeça do zero', () => {
        notify.success('Treino salvo.');
        vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
        notify.success('Treino duplicado.');

        vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
        expect(getNotifySnapshot()).not.toBeNull();

        vi.advanceTimersByTime(500);
        expect(getNotifySnapshot()).toBeNull();
    });

    // Sumir em 3s levaria o botão embora antes de o usuário decidir.
    it('com ação, não some sozinho', () => {
        notify.error('Erro ao carregar dados.', {
            action: { label: 'Tentar Novamente', onClick: vi.fn() }
        });

        vi.advanceTimersByTime(AUTO_DISMISS_MS * 3);

        expect(getNotifySnapshot()).toMatchObject({ message: 'Erro ao carregar dados.' });
        expect(getNotifySnapshot().action.label).toBe('Tentar Novamente');
    });

    it('dismiss limpa na hora', () => {
        notify.success('Treino salvo.');

        notify.dismiss();

        expect(getNotifySnapshot()).toBeNull();
    });

    it('dismiss não deixa o timer antigo derrubar um aviso posterior', () => {
        notify.success('Treino salvo.');
        notify.dismiss();
        notify.info('Outro aviso.');

        vi.advanceTimersByTime(AUTO_DISMISS_MS - 1);

        expect(getNotifySnapshot()).toMatchObject({ message: 'Outro aviso.' });
    });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Rodar: `npm test -- --run src/utils/notifyStore.test.js`
Esperado: FAIL — `Failed to resolve import "./notifyStore"`.

- [ ] **Passo 3: implementar o store**

```javascript
// src/utils/notifyStore.js
/**
 * notifyStore.js
 * Estado dos avisos do app — a barra que desce do topo (`TopBanner`).
 *
 * É um módulo, e não um contexto React, por requisito e não por estilo:
 * `workoutService` e `HomeDashboard` emitem erro de fora da árvore React.
 * A API imperativa (`notify.success(...)`) é a mesma forma que o `sonner`
 * expunha, então os pontos de chamada não mudam de formato.
 */

export const AUTO_DISMISS_MS = 3000;

const listeners = new Set();

let current = null;
let nextId = 1;
let timerId = null;

function emit() {
    listeners.forEach(listener => listener());
}

function clearTimer() {
    if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
    }
}

function push(type, message, options = {}) {
    const action = options.action || null;

    // Aviso idêntico ao que já está na tela mantém o id: sem isso a barra
    // refaria a descida por cima dela mesma. Substitui a deduplicação por
    // `id` que o sonner fazia em useProfileData.
    if (current && current.type === type && current.message === message && !action && !current.action) {
        return current.id;
    }

    clearTimer();
    current = { id: nextId++, type, message, action };

    // Com ação, a barra espera toque — ver AUTO_DISMISS_MS no spec.
    if (!action) {
        timerId = setTimeout(() => {
            timerId = null;
            current = null;
            emit();
        }, AUTO_DISMISS_MS);
    }

    emit();
    return current.id;
}

export const notify = {
    success: (message, options) => push('success', message, options),
    error: (message, options) => push('error', message, options),
    info: (message, options) => push('info', message, options),
    dismiss: () => {
        clearTimer();
        if (current !== null) {
            current = null;
            emit();
        }
    }
};

export function subscribeToNotify(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getNotifySnapshot() {
    return current;
}

/** Só para testes: zera o estado entre casos. */
export function resetNotifyStore() {
    clearTimer();
    current = null;
    nextId = 1;
}
```

- [ ] **Passo 4: rodar e confirmar que passa**

Rodar: `npm test -- --run src/utils/notifyStore.test.js`
Esperado: PASS, 11 testes.

- [ ] **Passo 5: commitar**

```bash
git add src/utils/notifyStore.js src/utils/notifyStore.test.js
git commit -m "feat: store dos avisos com fila de um e auto-dismiss"
```

---

### Tarefa 2: a barra

**Arquivos:**
- Criar: `src/components/design-system/TopBanner.jsx`
- Teste: `src/components/design-system/TopBanner.test.jsx`

**Interfaces:**
- Consome: `subscribeToNotify`, `getNotifySnapshot`, `notify.dismiss` de `src/utils/notifyStore.js`.
- Produz: `export function TopBanner()` — componente sem props. Renderiza `data-testid="top-banner"` e `data-type` com o tipo do aviso.

- [ ] **Passo 1: escrever os testes que falham**

```jsx
// src/components/design-system/TopBanner.test.jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TopBanner } from './TopBanner';
import { notify, resetNotifyStore, getNotifySnapshot } from '../../utils/notifyStore';

describe('TopBanner', () => {
    beforeEach(() => {
        resetNotifyStore();
    });

    afterEach(() => {
        resetNotifyStore();
    });

    it('não renderiza nada sem aviso', () => {
        render(<TopBanner />);

        expect(screen.queryByTestId('top-banner')).not.toBeInTheDocument();
    });

    it('mostra a mensagem quando o aviso chega', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner')).toBeInTheDocument();
        expect(screen.getByText('Treino salvo.')).toBeInTheDocument();
    });

    it('mostra o aviso que já estava no store antes da montagem', () => {
        notify.success('Treino salvo.');

        render(<TopBanner />);

        expect(screen.getByText('Treino salvo.')).toBeInTheDocument();
    });

    it.each([
        ['success', 'bg-emerald-600'],
        ['error', 'bg-red-600'],
        ['info', 'bg-blue-600']
    ])('usa a cor do tipo %s', (tipo, classe) => {
        render(<TopBanner />);

        act(() => { notify[tipo]('Mensagem.'); });

        const barra = screen.getByTestId('top-banner');
        expect(barra).toHaveAttribute('data-type', tipo);
        expect(barra.className).toContain(classe);
    });

    // A cor precisa alcançar o pixel 0: é isso que faz o texto cair na faixa
    // abaixo do relógio em vez de atrás dele.
    it('ancora no topo, de borda a borda', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner').className).toContain('top-0');
        expect(screen.getByTestId('top-banner').className).toContain('inset-x-0');
    });

    // Sem botão, a barra não precisa de toque nenhum — e é isso que permite
    // ela ficar acima dos modais de z-9999 sem roubar toque.
    it('não intercepta toque quando não tem ação', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner').className).toContain('pointer-events-none');
    });

    it('anuncia erro como alert e sucesso como status', () => {
        render(<TopBanner />);

        act(() => { notify.error('Erro ao salvar treino.'); });
        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');

        act(() => { notify.success('Treino salvo.'); });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('renderiza o botão da ação e o deixa clicável', () => {
        render(<TopBanner />);

        act(() => {
            notify.error('Erro ao carregar dados.', {
                action: { label: 'Tentar Novamente', onClick: vi.fn() }
            });
        });

        const botao = screen.getByRole('button', { name: 'Tentar Novamente' });
        expect(botao.className).toContain('pointer-events-auto');
    });

    it('clique na ação dispara o onClick e fecha a barra', () => {
        const onClick = vi.fn();
        render(<TopBanner />);

        act(() => {
            notify.error('Erro ao carregar dados.', { action: { label: 'Tentar Novamente', onClick } });
        });

        act(() => {
            screen.getByRole('button', { name: 'Tentar Novamente' }).click();
        });

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getNotifySnapshot()).toBeNull();
    });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Rodar: `npm test -- --run src/components/design-system/TopBanner.test.jsx`
Esperado: FAIL — `Failed to resolve import "./TopBanner"`.

- [ ] **Passo 3: implementar a barra**

```jsx
// src/components/design-system/TopBanner.jsx
/**
 * TopBanner.jsx
 * Barra de aviso que desce do topo — o único formato de aviso do app.
 *
 * Ela pinta de `top: 0` até abaixo da status bar (`pt-[env(safe-area-inset-top)]`)
 * e põe o conteúdo na faixa sob o relógio. Isso é o oposto do defeito que #51/#53
 * corrigiram: o aviso antigo era um card curto ancorado a `top-6`, inteiramente
 * dentro da zona da status bar, e sumia sem ser lido.
 *
 * `pointer-events-none` no wrapper: sem botão, a barra não recebe toque nenhum,
 * e por isso pode ficar em z-10000 — acima dos modais de z-9999 (NumericKeypad,
 * PremiumAlert) — sem risco de roubar um toque. Só o botão de ação, quando
 * existe, volta a `pointer-events-auto`.
 *
 * O timer do auto-dismiss mora no `notifyStore`, não aqui: as regras de tempo
 * ficam testáveis sem depender do ciclo de animação dentro do jsdom.
 */
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { notify, subscribeToNotify, getNotifySnapshot } from '../../utils/notifyStore';

const backgrounds = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
};

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle
};

export function TopBanner() {
    const current = useSyncExternalStore(subscribeToNotify, getNotifySnapshot, () => null);

    const isError = current?.type === 'error';
    const Icon = current ? (icons[current.type] || AlertCircle) : null;

    function handleAction() {
        const onClick = current?.action?.onClick;
        notify.dismiss();
        if (typeof onClick === 'function') onClick();
    }

    return (
        <AnimatePresence>
            {current && (
                <motion.div
                    key={current.id}
                    initial={{ y: '-100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%', transition: { duration: 0.2, ease: 'easeIn' } }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                    role={isError ? 'alert' : 'status'}
                    aria-live={isError ? 'assertive' : 'polite'}
                    data-testid="top-banner"
                    data-type={current.type}
                    className={`fixed inset-x-0 top-0 z-[10000] pointer-events-none pt-[env(safe-area-inset-top)] text-white shadow-lg ${backgrounds[current.type] || backgrounds.info}`}
                >
                    <div className="flex items-center gap-3 px-5 py-3">
                        <Icon size={20} className="shrink-0" />
                        <span className="flex-1 font-bold text-sm">{current.message}</span>
                        {current.action && (
                            <button
                                type="button"
                                onClick={handleAction}
                                className="pointer-events-auto shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-bold hover:bg-white/30 transition-colors"
                            >
                                {current.action.label}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

- [ ] **Passo 4: rodar e confirmar que passa**

Rodar: `npm test -- --run src/components/design-system/TopBanner.test.jsx`
Esperado: PASS.

Se `it.each` reclamar de `notify[tipo]` inexistente, confira se o store exporta os três métodos (`success`, `error`, `info`).

- [ ] **Passo 5: commitar**

```bash
git add src/components/design-system/TopBanner.jsx src/components/design-system/TopBanner.test.jsx
git commit -m "feat: barra de aviso full-bleed descendo do topo"
```

---

### Tarefa 3: montar a barra e tirar o Toaster do sonner

**Arquivos:**
- Modificar: `src/AppAuthed.jsx` (linhas 26, 40, 121, 146-158 e 445-467)

**Interfaces:**
- Consome: `TopBanner` da Tarefa 2.
- Produz: nada para tarefas seguintes.

Não há teste unitário aqui — `AppAuthed` não tem suíte própria. A verificação é lint + build, e a visual fica na Tarefa 7.

**Atenção aos números de linha:** todos se referem ao arquivo original. Como os passos removem linhas de cima para baixo, cada remoção desloca as seguintes — localize cada trecho pelo conteúdo citado, não pelo número.

- [ ] **Passo 1: adicionar o import**

Depois de `import { MotionPreferences } from './components/common/MotionPreferences';` (linha 11), acrescentar:

```jsx
import { TopBanner } from './components/design-system/TopBanner';
```

Import estático, e não `React.lazy`: o componente é pequeno, o framer-motion já está no bundle, e o aviso precisa existir desde o primeiro render — um erro de carregamento pode disparar antes de qualquer `requestIdleCallback`.

- [ ] **Passo 2: remover o lazy do sonner**

Apagar a linha 26:

```jsx
const loadSonnerToaster = () => import('sonner').then(module => ({ default: module.Toaster }));
```

E a linha 40:

```jsx
const SonnerToaster = React.lazy(loadSonnerToaster);
```

- [ ] **Passo 3: remover o gate `shouldRenderToaster`**

Apagar a linha 121:

```jsx
const [shouldRenderToaster, setShouldRenderToaster] = useState(false);
```

E o efeito inteiro que começa na linha 146:

```jsx
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const scheduleToaster = () => setShouldRenderToaster(true);

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(scheduleToaster, { timeout: 1500 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(scheduleToaster, 700);
        return () => window.clearTimeout(timeoutId);
    }, []);
```

- [ ] **Passo 4: trocar o bloco do Toaster pela barra**

Substituir o comentário e o bloco condicional (linhas 445-467) por:

```jsx
            {/*
              * A barra pinta de `top: 0` até abaixo da status bar e põe o texto
              * na faixa sob o relógio. Não é o aviso "voltando pro topo": o que
              * sumia atrás da status bar em #51/#53 era um card curto ancorado
              * a `top-6`, inteiramente dentro daquela zona.
              *
              * Fica na raiz autenticada de propósito — salvar uma ficha volta
              * pra lista no mesmo tique, e o aviso precisa sobreviver à
              * navegação.
              */}
            <TopBanner />
```

- [ ] **Passo 5: verificar que `Suspense` e `useState` continuam usados**

Rodar: `npm run lint`
Esperado: sem erro. Se o ESLint acusar import não usado de `React`, `Suspense` ou `useState`, é porque este era o último uso — remova só o que ele apontar. (Ambos são usados em outros pontos do arquivo; o esperado é nada mudar nos imports.)

- [ ] **Passo 6: build**

Rodar: `npm run build`
Esperado: sucesso. O `sonner` ainda aparece no bundle nesta etapa — os outros arquivos ainda o importam.

- [ ] **Passo 7: commitar**

```bash
git add src/AppAuthed.jsx
git commit -m "feat: monta a barra de aviso no lugar do Toaster do sonner"
```

---

### Tarefa 4: migrar os emissores de fora do React

**Arquivos:**
- Modificar: `src/services/workoutService.js` (linhas 12-24, 110, 350, 352, 506, 544)
- Modificar: `src/pages/HomeDashboard.jsx` (linhas 92-103, 236, 241, 299)
- Modificar: `src/services/workoutService.test.js` (linhas 4, 6-10)

**Interfaces:**
- Consome: `notify` da Tarefa 1.
- Produz: nada para tarefas seguintes.

- [ ] **Passo 1: trocar o mock no teste existente**

Em `src/services/workoutService.test.js`, substituir a linha 4:

```javascript
import { toast } from 'sonner';
```

por:

```javascript
import { notify } from '../utils/notifyStore';
```

E o bloco das linhas 6-10:

```javascript
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn()
    }
}));
```

por:

```javascript
vi.mock('../utils/notifyStore', () => ({
    notify: {
        error: vi.fn()
    }
}));
```

Depois, no corpo do arquivo, trocar toda ocorrência de `toast.error` por `notify.error`.

- [ ] **Passo 2: rodar e confirmar que falha**

Rodar: `npm test -- --run src/services/workoutService.test.js`
Esperado: FAIL — as asserções sobre `notify.error` não são satisfeitas, porque o service ainda chama o `sonner` pelo import dinâmico (que o mock não intercepta).

- [ ] **Passo 3: migrar o `workoutService`**

Remover as linhas 12-24 (o `let sonnerPromise;` e a função `showToastError` inteira) e acrescentar, junto dos imports do topo:

```javascript
import { notify } from '../utils/notifyStore';
```

Depois trocar as cinco chamadas — todas perdem o `await`, porque `notify.error` é síncrono:

| Linha | De | Para |
|---|---|---|
| 110 | `await showToastError("Erro ao carregar treinos. Verifique sua conexão.");` | `notify.error("Erro ao carregar treinos. Verifique sua conexão.");` |
| 350 | `await showToastError("Erro de índice. Verifique o console.");` | `notify.error("Erro de índice. Verifique o console.");` |
| 352 | `await showToastError("Erro ao carregar histórico.");` | `notify.error("Erro ao carregar histórico.");` |
| 506 | `await showToastError("Erro ao buscar exercícios. Verifique sua conexão.");` | `notify.error("Erro ao buscar exercícios. Verifique sua conexão.");` |
| 544 | `await showToastError("Erro ao salvar sessão de cardio.");` | `notify.error("Erro ao salvar sessão de cardio.");` |

O `try/catch` silencioso que envolvia o import dinâmico some junto: `notify.error` é uma escrita em memória e não tem como falhar de um jeito que precise ser mascarado.

- [ ] **Passo 4: rodar e confirmar que passa**

Rodar: `npm test -- --run src/services/workoutService.test.js`
Esperado: PASS.

- [ ] **Passo 5: migrar o `HomeDashboard`**

Remover as linhas 92-103 (`let toastPromise;` e a função `showToastError`) e acrescentar, junto dos imports do topo:

```javascript
import { notify } from '../utils/notifyStore';
```

Trocar as três chamadas, sem `await`:

| Linha | De | Para |
|---|---|---|
| 236 | `await showToastError("Card de compartilhamento indisponível.");` | `notify.error("Card de compartilhamento indisponível.");` |
| 241 | `await showToastError("O compartilhamento requer conexão segura. Use HTTPS ou localhost.");` | `notify.error("O compartilhamento requer conexão segura. Use HTTPS ou localhost.");` |
| 299 | `await showToastError("Erro ao gerar imagem de compartilhamento.");` | `notify.error("Erro ao gerar imagem de compartilhamento.");` |

- [ ] **Passo 6: confirmar que nenhum import dinâmico de sonner sobrou**

Rodar: `grep -rn "import('sonner')" src`
Esperado: nenhuma saída.

- [ ] **Passo 7: lint e suíte**

Rodar: `npm run lint && npm test -- --run`
Esperado: PASS.

- [ ] **Passo 8: commitar**

```bash
git add src/services/workoutService.js src/services/workoutService.test.js src/pages/HomeDashboard.jsx
git commit -m "refactor: emissores fora do React usam o notifyStore direto"
```

---

### Tarefa 5: migrar os 9 arquivos de UI

**Arquivos:**

| Modificar | Chamadas |
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

**Interfaces:**
- Consome: `notify` da Tarefa 1.
- Produz: nada para tarefas seguintes.

- [ ] **Passo 1: trocar import e prefixo nos 8 arquivos mecânicos**

Em cada um dos oito primeiros da tabela (todos menos `useProfileData.js`), trocar:

```javascript
import { toast } from 'sonner';
```

pelo caminho relativo correto do `notifyStore`:

- `src/pages/*.jsx` → `import { notify } from '../utils/notifyStore';`
- `src/components/*.jsx` → `import { notify } from '../utils/notifyStore';`
- `src/components/history/*.jsx` e `src/components/achievements/*.jsx` → `import { notify } from '../../utils/notifyStore';`

Depois trocar `toast.success(` → `notify.success(`, `toast.error(` → `notify.error(`, `toast.info(` → `notify.info(` em cada arquivo. Nenhuma dessas 38 chamadas passa segundo argumento, então são substituições diretas.

- [ ] **Passo 2: migrar o único caso com ação**

Em `src/hooks/profile/useProfileData.js`, trocar a linha 2:

```javascript
import { toast } from 'sonner';
```

por:

```javascript
import { notify } from '../../utils/notifyStore';
```

E substituir a chamada das linhas 57-68:

```javascript
            // Only show toast if not already showing one (simple check or just replace)
            toast.error("Erro ao carregar dados. Verifique sua conexão.", {
                id: 'profile-fetch-error', // ID prevents duplicates
                action: {
                    label: 'Tentar Novamente',
                    onClick: () => {
                        fetchingRef.current = false; // Allow retry
                        fetchProfileData();
                    }
                },
                duration: 5000
            });
```

por:

```javascript
            // Único aviso do app que espera toque: com ação, a barra não sobe
            // sozinha — sumir em 3s levaria o "Tentar Novamente" embora antes de
            // o usuário decidir. A deduplicação que o `id` fazia no sonner agora
            // é regra do notifyStore (aviso idêntico não reinicia a barra).
            notify.error("Erro ao carregar dados. Verifique sua conexão.", {
                action: {
                    label: 'Tentar Novamente',
                    onClick: () => {
                        fetchingRef.current = false; // Allow retry
                        fetchProfileData();
                    }
                }
            });
```

- [ ] **Passo 3: confirmar que o sonner sumiu do código**

Rodar: `grep -rn "sonner" src`
Esperado: nenhuma saída.

- [ ] **Passo 4: lint e suíte**

Rodar: `npm run lint && npm test -- --run`
Esperado: PASS.

- [ ] **Passo 5: commitar**

```bash
git add src/pages src/components src/hooks
git commit -m "refactor: migra os avisos do sonner para o notifyStore"
```

---

### Tarefa 6: aviso ao salvar ficha e remoção da dependência

**Arquivos:**
- Modificar: `src/pages/CreateWorkoutPage.jsx` (linha 384)
- Modificar: `package.json`

**Interfaces:**
- Consome: `notify` (já importado na Tarefa 5).
- Produz: nada.

- [ ] **Passo 1: adicionar o aviso que falta**

Em `src/pages/CreateWorkoutPage.jsx`, dentro do `handleSave`, logo após o bloco `if (importQueue && ...)` que já termina em `return`, a última linha do `try` é:

```jsx
            onBack();
```

Trocar por:

```jsx
            // Caminho normal: até aqui salvava e voltava pra lista em silêncio.
            // A barra vive na raiz autenticada, então o aviso sobrevive ao
            // `onBack()` e aparece já sobre a lista.
            notify.success('Treino salvo.');
            onBack();
```

- [ ] **Passo 2: conferir no app rodando**

Rodar: `npm run dev` e abrir http://localhost:5175
Salvar uma ficha e confirmar que a barra verde desce sobre a lista de treinos.

Se a tela pedir login e não houver credencial à mão, pule este passo — a Tarefa 7 cobre a verificação visual sem autenticação.

- [ ] **Passo 3: remover o sonner do package.json**

Apagar a linha `"sonner": "^2.0.7",` das dependências.

Depois rodar, **com o Node do projeto**:

```bash
fnm exec --using=24 -- npm install
```

Confirmar que só `package.json` e `package-lock.json` mudaram, e que o `node -v` do comando é 24.x. O lockfile precisa ser regravado pelo npm 11 — npm 10 e npm 11 discordam sobre entradas aninhadas e o CI usa `npm ci` estrito.

- [ ] **Passo 4: sequência completa do CI**

Rodar:

```bash
npm run lint && npm test -- --run && npm --prefix functions test && npm run build
```

Esperado: tudo PASS.

- [ ] **Passo 5: commitar**

```bash
git add src/pages/CreateWorkoutPage.jsx package.json package-lock.json
git commit -m "feat: confirma o salvamento de ficha e remove o sonner"
```

---

### Tarefa 7: verificação visual

**Arquivos:**
- Criar (temporário): `banner-preview.html` e `src/bannerPreview.jsx`
- Apagar os dois ao fim da tarefa.

**Interfaces:**
- Consome: `TopBanner` e `notify`.
- Produz: nada — nenhum arquivo sobrevive à tarefa.

A barra só existe em tela autenticada e nenhum ambiente que o agente abre autentica. O caminho é um entry point temporário do Vite que renderiza só o componente.

- [ ] **Passo 1: criar o entry point temporário**

`src/bannerPreview.jsx`:

```jsx
import { createRoot } from 'react-dom/client';
import { TopBanner } from './components/design-system/TopBanner';
import { notify } from './utils/notifyStore';
import './index.css';

function Preview() {
    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40vh 24px', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <TopBanner />
            <button id="btn-success" onClick={() => notify.success('Treino salvo.')}>sucesso</button>
            <button id="btn-error" onClick={() => notify.error('Erro ao salvar treino.')}>erro</button>
            <button id="btn-info" onClick={() => notify.info('Finalize ou descarte o treino antes de atualizar o app.')}>info</button>
            <button id="btn-action" onClick={() => notify.error('Erro ao carregar dados. Verifique sua conexão.', { action: { label: 'Tentar Novamente', onClick: () => {} } })}>com ação</button>
        </div>
    );
}

createRoot(document.getElementById('root')).render(<Preview />);
```

`banner-preview.html`, na raiz do projeto:

```html
<!doctype html>
<html lang="pt-BR">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Preview da barra</title></head>
  <body><div id="root"></div><script type="module" src="/src/bannerPreview.jsx"></script></body>
</html>
```

- [ ] **Passo 2: subir o dev server e abrir o preview**

Usar `preview_start` com a config do `.claude/launch.json` e navegar para `http://localhost:5175/banner-preview.html`.

- [ ] **Passo 3: conferir cada tipo**

Para cada botão: clicar, tirar screenshot, e conferir por DOM que `[data-testid="top-banner"]` existe com o `data-type` certo e que `getBoundingClientRect().top === 0` e `.left === 0`.

Conferir também que o de sucesso some sozinho depois de ~3s e que o "com ação" **não** some.

- [ ] **Passo 4: conferir o console**

Sem erro nem aviso do React (especialmente sobre `useSyncExternalStore` ou chave duplicada no `AnimatePresence`).

- [ ] **Passo 5: apagar os arquivos temporários**

```bash
rm banner-preview.html src/bannerPreview.jsx
```

Rodar `git status` e confirmar que a árvore está limpa.

- [ ] **Passo 6: registrar o que fica para o iPhone**

`env(safe-area-inset-top)` não reproduz no desktop. A conferência da faixa colorida sob o relógio e da altura da barra no iPhone fica para o usuário, e deve ser dita explicitamente no fechamento — não afirmar que o visual está validado em mobile.

---

## Fora de escopo

- O `Toast` próprio da tela de execução (`src/components/design-system/Toast.jsx`), usado só no erro de validação em `WorkoutExecutionPage.jsx:266`. A proximidade dele com os campos de peso/repetições é o valor dele; virar barra desfaria #51.
- O `SyncStatusBadge` ("Salvo agora") do Modo Foco — status contínuo, não aviso pontual.
- Empilhamento de múltiplos avisos, swipe para dispensar, pausa do timer com a aba oculta.
