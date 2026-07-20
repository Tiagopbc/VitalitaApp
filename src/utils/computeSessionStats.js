/**
 * computeSessionStats.js
 * Resumo puro da sessão para o card final: nome, duração, nº de exercícios
 * concluídos e carga de volume (soma peso×reps das séries concluídas,
 * expandindo drop sets). Aceita pesos com vírgula decimal.
 */

export function computeSessionStats({ exercises, elapsedSeconds, templateName }) {
    const completedExercisesCount = exercises.filter(ex => ex.sets.every(s => s.completed)).length;

    const volumeLoad = exercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((sAcc, s) => {
            if (!s.completed) return sAcc;
            if (s.drops && s.drops.length > 0) {
                return sAcc + s.drops.reduce((dAcc, d) => {
                    const dw = parseFloat((d.weight || '').toString().replace(',', '.')) || 0;
                    const dr = parseFloat((d.reps || '').toString().replace(',', '.')) || 0;
                    return dAcc + (dw * dr);
                }, 0);
            }
            const weightStr = (s.weight || '').toString().replace(',', '.');
            const repsStr = (s.reps || '').toString().replace(',', '.');
            const w = parseFloat(weightStr) || 0;
            const r = parseFloat(repsStr) || 0;
            return sAcc + (w * r);
        }, 0);
    }, 0);

    return {
        templateName: templateName || 'Treino Personalizado',
        duration: Math.floor(elapsedSeconds / 60) + "min",
        exercisesCount: completedExercisesCount,
        volumeLoad
    };
}
