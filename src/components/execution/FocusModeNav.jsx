import { ChevronLeft, ChevronRight, Link2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { getGroupInfo } from '../../utils/exerciseGroups';

/**
 * Navegação Anterior/Próximo do Modo Foco, com indicador "X de Y" e badge
 * de grupo (bi-set/circuito) quando o exercício atual pertence a um grupo.
 */
export function FocusModeNav({ exercises, currentExerciseIndex, totalExercises, onPrev, onNext }) {
    const focusGroup = getGroupInfo(exercises, currentExerciseIndex);

    return (
        <div className="px-4 mb-2 mt-0 flex items-center justify-between pointer-events-auto relative z-40">
            <Button
                variant="outline-primary"
                size="sm"
                onClick={onPrev}
                disabled={currentExerciseIndex === 0}
                leftIcon={<ChevronLeft size={16} />}
                className="backdrop-blur-md"
            >
                Anterior
            </Button>

            <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                {currentExerciseIndex + 1} de {totalExercises}
                {focusGroup ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] uppercase tracking-wide">
                        <Link2 size={10} /> {focusGroup.label}
                    </span>
                ) : null}
            </span>

            <Button
                variant="outline-primary"
                size="sm"
                onClick={onNext}
                disabled={currentExerciseIndex === totalExercises - 1}
                rightIcon={<ChevronRight size={16} />}
                className="backdrop-blur-md"
            >
                Próximo
            </Button>
        </div>
    );
}
