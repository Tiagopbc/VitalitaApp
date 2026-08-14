import { ChevronLeft, ChevronRight, Link2, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { SyncStatusBadge } from '../design-system/SyncStatusBadge';

/**
 * Navegação Anterior/Próximo do Modo Foco — uma linha só. Cancelar treino e
 * o status de sincronização moram nas pontas dessa mesma linha, como
 * círculos de ícone (sem rótulo de texto): antes cada um tinha sua própria
 * fileira acima do stepper, e as três fileiras empilhadas (barra superior +
 * essa linha + stepper) apertavam demais o topo da tela no Modo Foco. O
 * texto de cada um continua acessível via `aria-label`/`title` — só não
 * aparece visualmente.
 *
 * O botão de cancelar treino não aparece na `ExecutionTopBar` no Modo Foco —
 * mora aqui.
 *
 * O rótulo do grupo é derivado do `groupId` (via `getGroupInfo` na página) e
 * **não** pode ser substituído pela tag de método do card: `method` é só
 * informativo, enquanto o `groupId` é o que de fato faz o Modo Foco alternar
 * os exercícios e adiar o descanso. Um exercício agrupado pelo botão de
 * corrente (ou vindo do PDF) costuma manter `method: "Convencional"`, então
 * sem este rótulo não sobraria nenhuma indicação do comportamento real. Fica
 * numa linha própria, centralizado, pra não disputar espaço com o stepper.
 *
 * Por isso o texto aqui descreve o **comportamento** ("Alterna em dupla") em
 * vez do nome do método ("Bi-set"): quando os dois campos coincidem, repetir
 * a mesma palavra faria parecer que é a mesma informação duplicada.
 */
export function FocusModeNav({ currentExerciseIndex, totalExercises, onPrev, onNext, onDiscard, syncStatus, groupLabel }) {
    return (
        <div className="px-4 mb-2 mt-2 flex flex-col pointer-events-auto relative z-40">
            {groupLabel && (
                <div className="flex justify-center mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wide">
                        <Link2 size={11} className="flex-shrink-0" />
                        <span className="truncate">{groupLabel}</span>
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between gap-1.5">
                <button
                    type="button"
                    onClick={onDiscard}
                    aria-label="Cancelar treino"
                    title="Cancelar treino"
                    className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                >
                    <Trash2 size={14} />
                </button>

                <Button
                    variant="outline-primary-strong"
                    size="xs"
                    onClick={onPrev}
                    disabled={currentExerciseIndex === 0}
                    leftIcon={<ChevronLeft size={14} />}
                >
                    Anterior
                </Button>

                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    {currentExerciseIndex + 1} de {totalExercises}
                </span>

                <Button
                    variant="outline-primary-strong"
                    size="xs"
                    onClick={onNext}
                    disabled={currentExerciseIndex === totalExercises - 1}
                    rightIcon={<ChevronRight size={14} />}
                >
                    Próximo
                </Button>

                <SyncStatusBadge status={syncStatus} compact />
            </div>
        </div>
    );
}
