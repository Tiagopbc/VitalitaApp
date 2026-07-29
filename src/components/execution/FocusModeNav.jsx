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
