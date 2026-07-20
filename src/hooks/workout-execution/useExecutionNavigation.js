import { useEffect, useState } from 'react';
import { getGroupInfo } from '../../utils/exerciseGroups';

function scrollToExercise(targetExerciseId) {
    const nextElement = document.getElementById(`exercise-${targetExerciseId}`);
    if (nextElement) {
        const yOffset = -100; // Ajuste para a barra superior fixa
        const y = nextElement.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

/**
 * Navegação da execução: índice do exercício atual (Modo Foco), série ativa
 * por exercício e o wrapper de conclusão de série que avança bi-set/circuito
 * e dispara o descanso ao fim da volta.
 */
export function useExecutionNavigation({ exercises, focusMode, autoStartTimer, setShowTimer, completeSetAutoFill }) {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState({});

    const handleSetNavigation = (exerciseId, setIndex) => {
        setActiveSetIndices(prev => ({
            ...prev,
            [exerciseId]: setIndex
        }));
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) setCurrentExerciseIndex(prev => prev + 1);
    };
    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) setCurrentExerciseIndex(prev => prev - 1);
    };

    const handleCompleteSetWrapper = (...args) => {
        completeSetAutoFill(...args);

        const [exerciseId, currentSetNum] = args;
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        const group = exerciseIndex !== -1 ? getGroupInfo(exercises, exerciseIndex) : null;

        // Em grupos (bi-set/circuito) o descanso acontece só ao fim da volta,
        // ou seja, ao concluir a série do último exercício do grupo.
        if (autoStartTimer && (!group || group.isLastMember)) {
            setShowTimer(true);
        }

        if (exerciseIndex === -1) return;
        const ex = exercises[exerciseIndex];
        const isLastSetOfExercise = currentSetNum === ex.sets.length;

        let targetIndex = null;
        if (group) {
            if (!group.isLastMember) {
                // Alterna para o próximo exercício do grupo (sem descanso).
                targetIndex = group.nextMemberIndex;
            } else if (!isLastSetOfExercise) {
                // Fim da volta: retorna ao primeiro exercício do grupo.
                targetIndex = group.firstIndex;
            } else if (exerciseIndex < exercises.length - 1) {
                // Grupo concluído: segue para o próximo exercício da ficha.
                targetIndex = exerciseIndex + 1;
            }
        } else if (isLastSetOfExercise && exerciseIndex < exercises.length - 1) {
            targetIndex = exerciseIndex + 1;
        }

        if (targetIndex !== null) {
            const targetId = exercises[targetIndex].id;
            setTimeout(() => {
                if (focusMode) {
                    setCurrentExerciseIndex(targetIndex);
                } else {
                    scrollToExercise(targetId);
                }
            }, 400); // Pequeno delay para a animação da série concluída
        }
    };

    // Rolar para o topo quando o Modo Foco é ativado
    useEffect(() => {
        if (focusMode) {
            // Força o scroll suave para o topo
            const forceScroll = () => window.scrollTo({ top: 0, behavior: 'smooth' });

            forceScroll();
            // Pequeno delay para garantir que o layout atualizou
            setTimeout(forceScroll, 300);
        }
    }, [focusMode]);

    return {
        currentExerciseIndex,
        setCurrentExerciseIndex,
        activeSetIndices,
        handleSetNavigation,
        handleNextExercise,
        handlePrevExercise,
        handleCompleteSetWrapper
    };
}
