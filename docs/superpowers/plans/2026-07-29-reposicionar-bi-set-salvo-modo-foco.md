# Reposicionar BI-SET e "Salvo agora" no Modo Foco — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desafogar a área acima do stepper ANTERIOR/PRÓXIMO no Modo Foco da tela de execução de treino, removendo o badge BI-SET duplicado e reposicionando "Cancelar treino" + status de sincronização numa linha própria, com mais respiro e botões de navegação com traço mais forte.

**Architecture:** Mudança puramente de UI em quatro componentes React já existentes (`Button`, `FocusModeNav`, `ExecutionTopBar`, `WorkoutExecutionPage`). Nenhum novo componente, nenhuma mudança de dados/estado — só reorganização de props e markup, condicionada a `focusMode`.

**Tech Stack:** React 19, Tailwind (classes utilitárias, sem CSS Modules), Vitest + Testing Library, lucide-react para ícones.

## Global Constraints

- Toda a mudança vale **somente quando `focusMode === true`**. Fora do Modo Foco, `ExecutionTopBar` e o bloco avulso do `SyncStatusBadge` continuam exatamente como hoje.
- Não alterar a variante `outline-primary` existente no `Button` — ela é usada em Perfil, Termos, Privacidade, Dashboard do Personal e Métodos. Toda mudança visual dos botões Anterior/Próximo vai numa variante nova, `outline-primary-strong`.
- Não mexer no `LinearCardCompactV2` / card do exercício — o agrupamento Séries/Meta/BI-SET no card já quebra linha sozinho.
- Não renomear o botão "CALC" (fora de escopo — o modal por trás cobre 1RM *e* anilhas).
- Sempre rodar `npm test -- --run <arquivo>` depois de cada implementação, e a suíte completa (`npm run lint && npm test -- --run && npm --prefix functions test && npm run build`) ao final, antes de considerar o trabalho pronto — conforme `CLAUDE.md`.

---

### Task 1: Nova variante `outline-primary-strong` no Button do design system

**Files:**
- Modify: `src/components/design-system/Button.jsx:62-83` (mapa `variantStyles`)
- Test: `src/components/design-system/Button.test.jsx`

**Interfaces:**
- Produces: variante de `Button` chamada `'outline-primary-strong'`, consumida pelo `FocusModeNav` na Task 2.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final do `describe('Button', ...)` em `src/components/design-system/Button.test.jsx`:

```jsx
    it('applies the outline-primary-strong variant classes', () => {
        render(<Button variant="outline-primary-strong">Próximo</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('border-cyan-500/80');
    });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- --run src/components/design-system/Button.test.jsx`
Expected: FAIL — a variante `outline-primary-strong` não existe, `Button` cai no fallback `primary`, que não contém `border-cyan-500/80`.

- [ ] **Step 3: Implementar a variante**

Em `src/components/design-system/Button.jsx`, dentro do objeto `variantStyles` (logo depois da entrada `'outline-primary'`, linha ~79), adicionar:

```js
        // OUTLINE-PRIMÁRIO FORTE: mesmo espírito do outline-primary, com traço
        // sólido e leve glow — usado nos botões Anterior/Próximo do Modo Foco,
        // que precisam se destacar mais que o outline padrão (sem herdar o
        // gradiente do primary, reservado à ação principal da tela).
        'outline-primary-strong': 'bg-cyan-500/15 border-2 border-cyan-500/80 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.25)] hover:bg-cyan-500/25 hover:border-cyan-400',
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- --run src/components/design-system/Button.test.jsx`
Expected: PASS (todos os testes do arquivo, incluindo o novo)

- [ ] **Step 5: Commit**

```bash
git add src/components/design-system/Button.jsx src/components/design-system/Button.test.jsx
git commit -m "feat: adicionar variante outline-primary-strong ao Button"
```

---

### Task 2: Remover badge BI-SET duplicado e adicionar linha utilitária (Cancelar + sync) no FocusModeNav

**Files:**
- Modify: `src/components/execution/FocusModeNav.jsx` (reescrita completa do componente)
- Create: `src/components/execution/FocusModeNav.test.jsx`

**Interfaces:**
- Consumes: `Button` variant `'outline-primary-strong'` (Task 1); `TopBarButton` (`src/components/execution/TopBarButton.jsx`, já existe — props `icon`, `label`, `variant`, `onClick`, `iconOnly`); `SyncStatusBadge` (`src/components/design-system/SyncStatusBadge.jsx`, já existe — prop `status`).
- Produces: `FocusModeNav({ currentExerciseIndex, totalExercises, onPrev, onNext, onDiscard, syncStatus })`. **Remove a prop `exercises`** (não é mais usada — o cálculo de grupo saiu do componente). `onDiscard: () => void` e `syncStatus: string` (um dos valores de `SESSION_SYNC_STATES`) são as duas props novas, consumidas pela Task 4.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/components/execution/FocusModeNav.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusModeNav } from './FocusModeNav';
import { SESSION_SYNC_STATES } from '../../services/sessions/sessionRecoveryService';

describe('FocusModeNav', () => {
    const baseProps = {
        currentExerciseIndex: 1,
        totalExercises: 3,
        onPrev: vi.fn(),
        onNext: vi.fn(),
        onDiscard: vi.fn(),
        syncStatus: SESSION_SYNC_STATES.saved
    };

    it('shows the current position and no group badge', () => {
        render(<FocusModeNav {...baseProps} />);
        expect(screen.getByText('2 de 3')).toBeInTheDocument();
        expect(screen.queryByText(/BI-SET/i)).not.toBeInTheDocument();
    });

    it('disables Anterior on the first exercise', () => {
        render(<FocusModeNav {...baseProps} currentExerciseIndex={0} />);
        expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
    });

    it('disables Próximo on the last exercise', () => {
        render(<FocusModeNav {...baseProps} currentExerciseIndex={2} />);
        expect(screen.getByRole('button', { name: /Próximo/i })).toBeDisabled();
    });

    it('calls onDiscard when Cancelar treino is clicked', () => {
        render(<FocusModeNav {...baseProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(baseProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('shows the sync status label', () => {
        render(<FocusModeNav {...baseProps} syncStatus={SESSION_SYNC_STATES.saved} />);
        expect(screen.getByText('Salvo agora')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- --run src/components/execution/FocusModeNav.test.jsx`
Expected: FAIL — o componente atual não tem botão "Cancelar treino" nem `SyncStatusBadge`, e ainda importa `getGroupInfo`/`Link2` (que não recebem mais `exercises`, então o teste de "2 de 3" pode até passar, mas os de Cancelar/sync falham com "Unable to find role").

- [ ] **Step 3: Reescrever o componente**

Substituir todo o conteúdo de `src/components/execution/FocusModeNav.jsx` por:

```jsx
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { TopBarButton } from './TopBarButton';
import { SyncStatusBadge } from '../design-system/SyncStatusBadge';

/**
 * Navegação Anterior/Próximo do Modo Foco. A linha "utilitária" logo acima
 * (cancelar treino + status de sincronização) foi movida pra cá porque não
 * cabia nem na barra superior nem espremida ao lado do indicador "X de Y" —
 * a informação de bi-set/circuito já mora no card do exercício, então não é
 * repetida aqui.
 */
export function FocusModeNav({ currentExerciseIndex, totalExercises, onPrev, onNext, onDiscard, syncStatus }) {
    return (
        <div className="px-4 mb-2 mt-0 flex flex-col pointer-events-auto relative z-40">
            <div className="flex items-center justify-between mb-5">
                <TopBarButton
                    icon={<Trash2 />}
                    label="Cancelar treino"
                    variant="danger"
                    onClick={onDiscard}
                />
                <SyncStatusBadge status={syncStatus} />
            </div>

            <div className="flex items-center justify-between">
                <Button
                    variant="outline-primary-strong"
                    size="sm"
                    onClick={onPrev}
                    disabled={currentExerciseIndex === 0}
                    leftIcon={<ChevronLeft size={16} />}
                    className="backdrop-blur-md"
                >
                    Anterior
                </Button>

                <span className="text-sm font-bold text-slate-400">
                    {currentExerciseIndex + 1} de {totalExercises}
                </span>

                <Button
                    variant="outline-primary-strong"
                    size="sm"
                    onClick={onNext}
                    disabled={currentExerciseIndex === totalExercises - 1}
                    rightIcon={<ChevronRight size={16} />}
                    className="backdrop-blur-md"
                >
                    Próximo
                </Button>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- --run src/components/execution/FocusModeNav.test.jsx`
Expected: PASS (todos os 5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/components/execution/FocusModeNav.jsx src/components/execution/FocusModeNav.test.jsx
git commit -m "feat: mover cancelar treino e status de sync pro FocusModeNav, remover badge BI-SET duplicado"
```

---

### Task 3: Esconder "Cancelar treino" da ExecutionTopBar quando o Modo Foco está ativo

**Files:**
- Modify: `src/components/execution/ExecutionTopBar.jsx:52-59`
- Create: `src/components/execution/ExecutionTopBar.test.jsx`

**Interfaces:**
- Consumes: nenhuma interface nova — `ExecutionTopBar` já recebe `focusMode` (bool) e `onDiscard` (`() => void`) como props existentes.
- Produces: nenhuma mudança de interface pública — só o comportamento condicional do botão.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/components/execution/ExecutionTopBar.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionTopBar } from './ExecutionTopBar';

describe('ExecutionTopBar', () => {
    const baseProps = {
        onBack: vi.fn(),
        onDiscard: vi.fn(),
        onOpenGymTools: vi.fn(),
        showGymTools: false,
        showTimer: false,
        onToggleTimer: vi.fn(),
        focusMode: false,
        onToggleFocus: vi.fn()
    };

    it('shows the Cancelar treino button outside focus mode', () => {
        render(<ExecutionTopBar {...baseProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(baseProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('hides the Cancelar treino button in focus mode', () => {
        render(<ExecutionTopBar {...baseProps} focusMode />);
        expect(screen.queryByRole('button', { name: 'Cancelar treino' })).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- --run src/components/execution/ExecutionTopBar.test.jsx`
Expected: FAIL no segundo teste ("hides the Cancelar treino button in focus mode") — hoje o botão renderiza sempre, independente de `focusMode`.

- [ ] **Step 3: Implementar a condicional**

Em `src/components/execution/ExecutionTopBar.jsx`, envolver o `TopBarButton` de cancelar (linhas 53-59) com a checagem de `focusMode`:

```jsx
                        {!focusMode && (
                            <TopBarButton
                                icon={<Trash2 />}
                                label="Cancelar treino"
                                variant="danger"
                                onClick={onDiscard}
                                iconOnly
                            />
                        )}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- --run src/components/execution/ExecutionTopBar.test.jsx`
Expected: PASS (os 2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/components/execution/ExecutionTopBar.jsx src/components/execution/ExecutionTopBar.test.jsx
git commit -m "feat: esconder cancelar treino da barra superior no Modo Foco"
```

---

### Task 4: Integrar no WorkoutExecutionPage — esconder o SyncStatusBadge avulso e ligar onDiscard/syncStatus no FocusModeNav

**Files:**
- Modify: `src/pages/WorkoutExecutionPage.jsx:283-297`
- Modify: `src/pages/WorkoutExecutionPage.test.jsx`

**Interfaces:**
- Consumes: `FocusModeNav({ currentExerciseIndex, totalExercises, onPrev, onNext, onDiscard, syncStatus })` (Task 2); `ExecutionTopBar` já recebe `focusMode` (comportamento da Task 3 é automático, não precisa de mudança na chamada existente).
- Produces: nenhuma interface nova exposta por `WorkoutExecutionPage` — é o ponto de integração final.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao `describe('WorkoutExecutionPage', ...)` em `src/pages/WorkoutExecutionPage.test.jsx`, depois do teste `'opens cancel modal and confirms discard'`:

```jsx
    it('moves cancel and sync status into FocusModeNav when focus mode is on', () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(screen.getByText('Cancelar Treino?')).toBeInTheDocument();
    });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- --run src/pages/WorkoutExecutionPage.test.jsx`
Expected: FAIL no novo teste — `FocusModeNav` ainda não recebe `onDiscard` da página, então o clique no botão "Cancelar treino" (agora renderizado pelo `FocusModeNav`, graças à Task 3) não faz nada e o modal "Cancelar Treino?" não aparece.

- [ ] **Step 3: Implementar a integração**

Em `src/pages/WorkoutExecutionPage.jsx`, substituir o bloco (linhas 285-297):

```jsx
                <div className="px-4 mt-2 mb-2 flex justify-end">
                    <SyncStatusBadge status={syncState} />
                </div>

                {focusMode && (
                    <FocusModeNav
                        exercises={exercises}
                        currentExerciseIndex={currentExerciseIndex}
                        totalExercises={totalExercises}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                    />
                )}
```

por:

```jsx
                {!focusMode && (
                    <div className="px-4 mt-2 mb-2 flex justify-end">
                        <SyncStatusBadge status={syncState} />
                    </div>
                )}

                {focusMode && (
                    <FocusModeNav
                        currentExerciseIndex={currentExerciseIndex}
                        totalExercises={totalExercises}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                        onDiscard={handleDiscard}
                        syncStatus={syncState}
                    />
                )}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- --run src/pages/WorkoutExecutionPage.test.jsx`
Expected: PASS (todos os testes do arquivo, incluindo o novo e os 3 já existentes)

- [ ] **Step 5: Commit**

```bash
git add src/pages/WorkoutExecutionPage.jsx src/pages/WorkoutExecutionPage.test.jsx
git commit -m "feat: mover salvo agora pro Modo Foco e ligar cancelar treino no FocusModeNav"
```

---

### Task 5: Verificação final

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm run lint && npm test -- --run && npm --prefix functions test && npm run build`
Expected: tudo verde — lint sem erros, todos os testes (incluindo os 4 arquivos tocados/criados nas Tasks 1-4) passando, suíte de `functions/` inalterada e passando, build de produção sem erros.

- [ ] **Step 2: Testar visualmente no navegador**

Rodar `npm run dev`, abrir uma sessão de treino com bi-set, ativar o Modo Foco e conferir:
- Barra ANTERIOR/PRÓXIMO limpa, sem o badge BI-SET.
- Linha CANCELAR + status de sync acima da barra, com respiro visível entre as duas linhas.
- Botões ANTERIOR/PRÓXIMO com o traço azul mais forte.
- Fora do Modo Foco, tudo como antes (cancelar na barra de cima, sync badge na posição de sempre).

Isso não substitui a suíte automatizada, mas confirma que o resultado bate com o mockup aprovado.
