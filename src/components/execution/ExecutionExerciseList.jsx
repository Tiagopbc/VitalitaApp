/**
 * ExecutionExerciseList.jsx
 * Os exercícios do treino em andamento: no Modo Foco, só o exercício atual
 * (com a prévia da volta, se for bi-set/circuito); fora dele, os exercícios
 * em blocos, com os agrupados juntos. JSX movido de WorkoutExecutionPage.
 */
import React from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseGroupCard } from './ExerciseGroupCard';
import { computeGroupSegments, getGroupRoundPreview } from '../../utils/exerciseGroups';

export function ExecutionExerciseList({ focusMode, exercises, currentExerciseIndex, activeSetIndices, progression, cardHandlers }) {
    return (
        <>
            {/* `flex-1` absorve a sobra de altura. No Modo Foco a ficha
                ainda é centralizada nessa sobra; quando ela é mais alta que
                a tela o próprio `flex-1` cresce e a página rola normalmente,
                sem cortar o topo. */}
            <main className={`px-4 mt-2 space-y-4 flex-1 ${focusMode ? 'flex flex-col justify-center' : ''}`}>
                {focusMode ? (
                    exercises.length > 0 && (
                        <ExerciseCard
                            key={exercises[currentExerciseIndex].id}
                            exercise={exercises[currentExerciseIndex]}
                            activeSetIndices={activeSetIndices}
                            progression={progression}
                            handlers={cardHandlers}
                            groupRound={getGroupRoundPreview(exercises, currentExerciseIndex)}
                        />
                    )
                ) : (
                    computeGroupSegments(exercises).map((segment) => (
                        <ExerciseGroupCard
                            key={segment.groupId || `seg-${segment.indices[0]}`}
                            segment={segment}
                            exercises={exercises}
                            activeSetIndices={activeSetIndices}
                            progression={progression}
                            handlers={cardHandlers}
                        />
                    ))
                )}
            </main>
        </>
    );
}
