/**
 * progressionSuggestions.js
 * Motor de sugestão de progressão de carga (progressive overload).
 * Analisa as sessões recentes de um exercício e sugere: aumentar a carga,
 * consolidar a atual ou intervir na estagnação (deload/troca de método).
 */
import { parseDecimal, estimateOneRepMax } from './strengthMath';

const formatKg = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/**
 * Interpreta a meta de repetições ("8-12", "12", "10 a 12") como {min, max}.
 */
export function parseRepTarget(target) {
    if (target === null || target === undefined) return null;
    const matches = String(target).match(/\d+/g);
    if (!matches || matches.length === 0) return null;
    const numbers = matches.map(Number).filter(n => n > 0);
    if (numbers.length === 0) return null;
    return {
        min: Math.min(...numbers),
        max: Math.max(...numbers)
    };
}

function analyzeEntry(entry, goal) {
    const sets = Array.isArray(entry?.sets) ? entry.sets : [];
    const completedSets = sets.filter(s => s?.completed);
    if (completedSets.length === 0) return null;

    const topWeight = Math.max(...completedSets.map(s => parseDecimal(s.weight)));
    // Reps executadas na(s) série(s) com a carga mais alta — base para estimar o 1RM.
    const topReps = Math.max(
        ...completedSets
            .filter(s => parseDecimal(s.weight) === topWeight)
            .map(s => parseDecimal(s.reps))
    );
    const allSetsCompleted = sets.length > 0 && completedSets.length === sets.length;
    const hitRepGoal = goal
        ? completedSets.every(s => parseDecimal(s.reps) >= goal.max)
        : false;

    return { topWeight, topReps, allSetsCompleted, hitRepGoal };
}

/**
 * Incremento sugerido: 2,5 kg em cargas leves, 5 kg em cargas altas
 * (onde 2,5 kg é imperceptível).
 */
export function suggestedIncrement(weight) {
    return weight >= 60 ? 5 : 2.5;
}

/**
 * Gera a sugestão de progressão para um exercício.
 *
 * @param {Array} recentEntries - entradas do exercício nas sessões recentes,
 *   da mais nova para a mais antiga: [{ sets: [{ weight, reps, completed }] }]
 * @param {string|number} targetReps - meta de repetições da ficha (ex.: "8-12")
 * @param {Object} [options]
 * @param {string|number} [options.targetWeight] - carga-alvo prescrita na ficha,
 *   usada como baseline quando ainda não há histórico do exercício.
 * @returns {{ type: 'increase'|'maintain'|'stagnation'|'start', suggestedWeight?: number,
 *             currentWeight: number, estimatedOneRepMax?: number, message: string } | null}
 */
export function buildProgressionSuggestion(recentEntries, targetReps, options = {}) {
    const goal = parseRepTarget(targetReps) || { min: 8, max: 12 };
    const targetWeight = parseDecimal(options.targetWeight);

    // Baseline: sem histórico utilizável, sugere a carga-alvo prescrita na ficha.
    const startSuggestion = targetWeight > 0
        ? {
            type: 'start',
            currentWeight: 0,
            suggestedWeight: targetWeight,
            message: `Carga inicial sugerida pelo treino: ${formatKg(targetWeight)} kg.`
        }
        : null;

    if (!Array.isArray(recentEntries) || recentEntries.length === 0) return startSuggestion;

    const latest = analyzeEntry(recentEntries[0], goal);
    if (!latest || latest.topWeight <= 0) return startSuggestion;

    // Sinal secundário: 1RM estimado a partir da melhor série registrada.
    const oneRepMax = estimateOneRepMax(latest.topWeight, latest.topReps);
    const estimatedOneRepMax = oneRepMax?.oneRepMax;

    // Meta batida em todas as séries: hora de subir a carga.
    if (latest.allSetsCompleted && latest.hitRepGoal) {
        const increment = suggestedIncrement(latest.topWeight);
        const suggestedWeight = latest.topWeight + increment;
        return {
            type: 'increase',
            currentWeight: latest.topWeight,
            suggestedWeight,
            estimatedOneRepMax,
            message: `Meta batida no último treino. Tente ${formatKg(suggestedWeight)} kg (+${formatKg(increment)}).`
        };
    }

    // Estagnação: 3+ sessões na mesma carga sem bater a meta.
    if (recentEntries.length >= 3) {
        const analyses = recentEntries.slice(0, 3).map(entry => analyzeEntry(entry, goal));
        const stagnant = analyses.every(a =>
            a && a.topWeight === latest.topWeight && !a.hitRepGoal
        );
        if (stagnant) {
            const deloadWeight = Math.round((latest.topWeight * 0.9) / 2.5) * 2.5;
            return {
                type: 'stagnation',
                currentWeight: latest.topWeight,
                suggestedWeight: deloadWeight,
                estimatedOneRepMax,
                message: `3 treinos sem evolução em ${formatKg(latest.topWeight)} kg. Considere um deload (~${formatKg(deloadWeight)} kg) ou trocar o método.`
            };
        }
    }

    return {
        type: 'maintain',
        currentWeight: latest.topWeight,
        estimatedOneRepMax,
        message: `Consolide ${formatKg(latest.topWeight)} kg até completar ${goal.max} repetições em todas as séries.`
    };
}

/**
 * Monta o mapa de sugestões por exercício a partir das sessões recentes.
 *
 * @param {Array} recentSessions - sessões (mais nova primeiro), cada uma com `exercises`
 * @param {Array} templateExercises - exercícios da ficha ({ id, name, reps, target })
 * @returns {Object} chave: id do exercício → sugestão
 */
export function buildProgressionMap(recentSessions, templateExercises) {
    const map = {};
    if (!Array.isArray(templateExercises)) return map;

    for (const ex of templateExercises) {
        const keyName = (ex.name || '').trim().toLowerCase();
        const entries = (recentSessions || [])
            .map(session => {
                const list = Array.isArray(session?.exercises) ? session.exercises : [];
                return list.find(e => (ex.id && e.id === ex.id)
                    || (keyName && e.name && e.name.trim().toLowerCase() === keyName));
            })
            .filter(Boolean);

        const targetReps = ex.reps || (typeof ex.target === 'string' ? ex.target.split('x')[1] : null);
        const suggestion = buildProgressionSuggestion(entries, targetReps, { targetWeight: ex.targetWeight });
        if (suggestion && ex.id) {
            map[ex.id] = suggestion;
        }
    }

    return map;
}
