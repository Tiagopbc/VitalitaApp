/**
 * computeSessionStats.js
 * Resumo puro da sessão para o card final: nome, duração, nº de exercícios
 * concluídos e carga de volume (soma peso×reps das séries concluídas,
 * expandindo drop sets). Aceita pesos com vírgula decimal.
 */

import { sessionVolumeLoad } from './volumeLoad';

export function computeSessionStats({ exercises, elapsedSeconds, templateName }) {
    const completedExercisesCount = exercises.filter(ex => ex.sets.every(s => s.completed)).length;

    const volumeLoad = sessionVolumeLoad(exercises);

    return {
        templateName: templateName || 'Treino Personalizado',
        duration: Math.floor(elapsedSeconds / 60) + "min",
        exercisesCount: completedExercisesCount,
        volumeLoad
    };
}
