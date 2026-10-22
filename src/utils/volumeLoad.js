/**
 * volumeLoad.js
 *
 * Carga de volume de um treino: a soma de peso × repetições das séries
 * concluídas. É o número que aparece no card de compartilhamento e no detalhe
 * do histórico.
 *
 * Duas formas de exercício convivem aqui. A atual tem array `sets`, cada série
 * com `completed`. Sessões antigas do histórico guardam `weight` e `reps` no
 * próprio exercício, sem array — por isso o ramo de retrocompatibilidade.
 *
 * Drop set conta só os degraus: quem fez 100×10 e caiu para 80×5 e 60×5 moveu
 * o peso dos degraus, não os dois ao mesmo tempo.
 */

/** Aceita "22,5", "22.5", 22.5 e devolve 0 para o que não vira número. */
function numero(valor) {
    return parseFloat((valor ?? '').toString().replace(',', '.')) || 0;
}

function setVolume(set) {
    if (!set?.completed) return 0;

    if (Array.isArray(set.drops) && set.drops.length > 0) {
        return set.drops.reduce((acc, drop) => acc + numero(drop.weight) * numero(drop.reps), 0);
    }

    return numero(set.weight) * numero(set.reps);
}

/**
 * Volume de um exercício.
 * @param {object} exercicio
 * @returns {number}
 */
export function exerciseVolume(exercicio) {
    if (!exercicio) return 0;

    if (Array.isArray(exercicio.sets)) {
        return exercicio.sets.reduce((acc, set) => acc + setVolume(set), 0);
    }

    // Forma antiga: peso e reps no próprio exercício.
    if (exercicio.weight && exercicio.reps) {
        return numero(exercicio.weight) * numero(exercicio.reps);
    }

    return 0;
}

/**
 * Volume somado de uma sessão.
 * @param {Array<object>} exercicios
 * @returns {number}
 */
export function sessionVolumeLoad(exercicios) {
    if (!Array.isArray(exercicios)) return 0;
    return exercicios.reduce((acc, exercicio) => acc + exerciseVolume(exercicio), 0);
}
