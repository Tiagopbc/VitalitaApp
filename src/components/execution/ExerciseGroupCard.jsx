import { Link2 } from 'lucide-react';
import { groupLabel } from '../../utils/exerciseGroups';
import { ExerciseCard } from './ExerciseCard';

/**
 * Renderiza um segmento de exercícios (retornado por `computeGroupSegments`).
 * Sem grupo → apenas os cards. Com grupo → wrapper visual bi-set/circuito,
 * preservando o `data-testid="exercise-group"` exatamente no nó original.
 */
export function ExerciseGroupCard({ segment, exercises, activeSetIndices, progression, handlers }) {
    const groupedCards = segment.indices.map((exerciseIdx) => {
        const ex = exercises[exerciseIdx];
        return (
            <div id={`exercise-${ex.id}`} key={ex.id}>
                <ExerciseCard
                    exercise={ex}
                    activeSetIndices={activeSetIndices}
                    progression={progression}
                    handlers={handlers}
                />
            </div>
        );
    });

    if (!segment.groupId) {
        return groupedCards;
    }

    return (
        <div
            data-testid="exercise-group"
            className="rounded-[28px] border border-cyan-500/25 bg-cyan-500/[0.04] p-2 pt-3 space-y-4"
        >
            <div className="flex items-center gap-2 px-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0">
                    <Link2 size={11} /> {groupLabel(segment.indices.length)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight">
                    Alterne as séries • descanso ao fim da volta
                </span>
            </div>
            {groupedCards}
        </div>
    );
}
