import { ChevronLeft, ChevronRight, Link2, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { TopBarButton } from './TopBarButton';
import { SyncStatusBadge } from '../design-system/SyncStatusBadge';

/**
 * Navegação Anterior/Próximo do Modo Foco. A linha "utilitária" logo acima
 * (cancelar treino + rótulo do grupo + status de sincronização) foi movida
 * pra cá porque não cabia nem na barra superior nem espremida ao lado do
 * indicador "X de Y".
 *
 * O rótulo do grupo é derivado do `groupId` (via `getGroupInfo` na página) e
 * **não** pode ser substituído pela tag de método do card: `method` é só
 * informativo, enquanto o `groupId` é o que de fato faz o Modo Foco alternar
 * os exercícios e adiar o descanso. Um exercício agrupado pelo botão de
 * corrente (ou vindo do PDF) costuma manter `method: "Convencional"`, então
 * sem este rótulo não sobraria nenhuma indicação do comportamento real.
 *
 * Por isso o texto aqui descreve o **comportamento** ("Alterna em dupla") em
 * vez do nome do método ("Bi-set"): quando os dois campos coincidem, repetir
 * a mesma palavra faria parecer que é a mesma informação duplicada.
 */
export function FocusModeNav({ currentExerciseIndex, totalExercises, onPrev, onNext, onDiscard, syncStatus, groupLabel }) {
    return (
        <div className="px-4 mb-2 mt-0 flex flex-col pointer-events-auto relative z-40">
            <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex-shrink-0">
                    <TopBarButton
                        icon={<Trash2 />}
                        label="Cancelar treino"
                        variant="danger"
                        onClick={onDiscard}
                    />
                </div>

                {groupLabel ? (
                    <span className="min-w-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wide">
                        <Link2 size={11} className="flex-shrink-0" />
                        <span className="truncate">{groupLabel}</span>
                    </span>
                ) : null}

                <div className="min-w-0">
                    <SyncStatusBadge status={syncStatus} />
                </div>
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
