import { useCallback } from 'react';
import { generateId } from './normalizeSets';

export function useSessionExerciseActions(setExercises) {
    const updateExerciseSet = useCallback((exId, setId, field, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex,
            sets: ex.sets.map(set => set.id === setId ? { ...set, [field]: val } : set)
        } : ex));
    }, [setExercises]);

    const toggleSet = useCallback((exId, setId) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex,
            sets: ex.sets.map(set => set.id === setId ? { ...set, completed: !set.completed } : set)
        } : ex));
    }, [setExercises]);

    const updateNotes = useCallback((exId, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, notes: val } : ex));
    }, [setExercises]);

    const updateSetMultiple = useCallback((exId, setId, updates) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex,
            sets: ex.sets.map(set => set.id === setId ? { ...set, ...updates } : set)
        } : ex));
    }, [setExercises]);

    const completeSetAutoFill = useCallback((exId, setNumber, weight, actualReps, weightMode = 'total', baseWeight = null, drops = null) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentSetIdx = setNumber - 1;
            const nextSetIdx = currentSetIdx + 1;

            return {
                ...ex,
                sets: ex.sets.map((set, idx) => {
                    if (idx === currentSetIdx) {
                        return {
                            ...set,
                            completed: true,
                            weight,
                            reps: actualReps,
                            weightMode,
                            baseWeight
                        };
                    }

                    if (idx === nextSetIdx) {
                        return {
                            ...set,
                            weight,
                            reps: actualReps,
                            weightMode,
                            baseWeight,
                            drops: drops ? drops.map(drop => ({ ...drop, id: generateId(), reps: drop.reps })) : null
                        };
                    }

                    return set;
                })
            };
        }));
    }, [setExercises]);

    const toggleExerciseWeightMode = useCallback((exId) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentMode = ex.sets[0]?.weightMode || 'total';
            const targetMode = currentMode === 'total' ? 'per_side' : 'total';

            const newSets = ex.sets.map(set => {
                const currentWeight = parseFloat(set.weight) || 0;

                if (targetMode === 'per_side') {
                    const newBase = currentWeight > 0 ? (currentWeight / 2) : 0;
                    return {
                        ...set,
                        weightMode: 'per_side',
                        baseWeight: newBase.toString()
                    };
                }

                return {
                    ...set,
                    weightMode: 'total',
                    baseWeight: null
                };
            });

            return { ...ex, sets: newSets };
        }));
    }, [setExercises]);

    return {
        updateExerciseSet,
        toggleSet,
        updateNotes,
        updateSetMultiple,
        completeSetAutoFill,
        toggleExerciseWeightMode
    };
}
