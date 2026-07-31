import { ChevronLeft, ChevronRight, Link2, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { SyncStatusBadge } from '../design-system/SyncStatusBadge';

/**
 * Navegação Anterior/Próximo do Modo Foco, com a linha "utilitária" logo
 * acima (cancelar treino + status de sincronização, e o rótulo de grupo
 * quando houver). O botão de cancelar treino não aparece na `ExecutionTopBar`
 * no Modo Foco — mora aqui, pareado com o `SyncStatusBadge`, com o mesmo
 * formato/altura de pill (`h-8 rounded-full`) usado por eles e pelos botões
 * Anterior/Próximo logo abaixo, pra os dois pares ficarem visualmente
 * simétricos.
 *
 * O rótulo do grupo é derivado do `groupId` (via `getGroupInfo` na página) e
 * **não** pode ser substituído pela tag de método do card: `method` é só
 * informativo, enquanto o `groupId` é o que de fato faz o Modo Foco alternar
 * os exercícios e adiar o descanso. Um exercício agrupado pelo botão de
 * corrente (ou vindo do PDF) costuma manter `method: "Convencional"`, então
 * sem este rótulo não sobraria nenhuma indicação do comportamento real. Fica
 * numa linha própria, centralizado, pra não disputar espaço com o par
 * Cancelar/Salvo nem com o "X de Y" do stepper.
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

            <div className="flex items-center justify-between gap-2 mb-4">
                <button
                    type="button"
                    onClick={onDiscard}
                    className="inline-flex w-36 h-8 items-center justify-center gap-2 rounded-full border px-3 text-[11px] font-bold uppercase backdrop-blur-md border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                >
                    <Trash2 size={14} />
                    <span className="whitespace-nowrap">Cancelar</span>
                </button>

                <SyncStatusBadge status={syncStatus} />
            </div>

            <div className="flex items-center justify-between">
                <Button
                    variant="outline-primary-strong"
                    size="sm"
                    onClick={onPrev}
                    disabled={currentExerciseIndex === 0}
                    leftIcon={<ChevronLeft size={16} />}
                    className="w-36 backdrop-blur-md"
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
                    className="w-36 backdrop-blur-md"
                >
                    Próximo
                </Button>
            </div>
        </div>
    );
}
