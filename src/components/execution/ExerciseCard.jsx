import { LinearCardCompactV2 } from './LinearCardCompactV2';

/**
 * Card unificado de um exercício. Concentra o cálculo da série ativa e a
 * fiação de props do LinearCardCompactV2, usado tanto no Modo Foco quanto
 * na lista (elimina a duplicação de ~25 props que existia na página).
 *
 * `handlers` agrupa os callbacks vindos da página/hooks; `activeSetIndices`
 * mapeia exerciseId → índice de série selecionada.
 */
export function ExerciseCard({ exercise: ex, activeSetIndices, progression, handlers }) {
    const {
        updateExerciseSet,
        updateSetMultiple,
        onSetNavigation,
        onSelectMethod,
        onCompleteSet,
        updateNotes,
        toggleExerciseWeightMode,
        onValidationError
    } = handlers;

    const firstIncomplete = ex.sets.findIndex(s => !s.completed);
    const defaultActive = firstIncomplete !== -1 ? firstIncomplete : ex.sets.length - 1;
    const activeSetIdx = activeSetIndices[ex.id] !== undefined ? activeSetIndices[ex.id] : defaultActive;
    const safeIdx = Math.max(0, Math.min(activeSetIdx, ex.sets.length - 1));
    const activeSet = ex.sets[safeIdx];

    const repsGoal = ex.reps || (ex.target ? ex.target.replace(/^\d+\s*x\s*/i, '').trim() : "12");

    return (
        <LinearCardCompactV2
            exerciseId={ex.id}
            setId={activeSet.id}
            exerciseName={ex.name}
            muscleGroup={ex.muscleFocus?.primary || ex.group || 'Geral'}
            method={ex.method || "Convencional"}
            repsGoal={repsGoal}
            currentSet={safeIdx + 1}
            totalSets={ex.sets.length}
            completedSets={ex.sets.map(s => s.completed)}
            weight={activeSet.weight}
            actualReps={activeSet.reps}
            observation={ex.notes}
            suggestedWeight={activeSet.targetWeight || activeSet.weight}
            suggestedReps={activeSet.targetReps || repsGoal}
            lastWeight={activeSet.lastWeight}
            lastReps={activeSet.lastReps}
            weightMode={activeSet.weightMode || 'total'}
            baseWeight={activeSet.baseWeight}
            drops={activeSet.drops}
            onUpdateSet={updateExerciseSet}
            onUpdateSetMultiple={updateSetMultiple}
            onSetChange={(setNum) => onSetNavigation(ex.id, setNum - 1)}
            onMethodClick={() => onSelectMethod(ex.method)}
            onCompleteSet={onCompleteSet}
            onUpdateNotes={updateNotes}
            onToggleWeightMode={() => toggleExerciseWeightMode(ex.id)}
            onValidationError={onValidationError}
            progressionHint={progression?.[ex.id]}
        />
    );
}
