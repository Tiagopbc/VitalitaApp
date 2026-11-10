/**
 * historyRows.js
 * Funções puras da aba Evolução do histórico: transformam os docs de sessão
 * em linhas de histórico, PRs e pontos do gráfico. Extraídas de HistoryPage
 * (D16) sem mudar a lógica; sem React, testáveis direto.
 */

/** Nomes únicos de exercício em ordem alfabética, lendo os dois formatos de sessão. */
export function extractExerciseNamesFromSessions(docs) {
    const uniqueNames = new Set();
    docs.forEach(data => {
        const results = data.results || data.exercises || [];
        if (Array.isArray(results)) {
            results.forEach(e => { if (e.name) uniqueNames.add(e.name); });
        } else {
            Object.keys(results).forEach(key => uniqueNames.add(key));
        }
    });
    return Array.from(uniqueNames).sort();
}

function matchExercises(results, { searchMode, selectedExercise, selectedGlobalExercises }) {
    const matched = [];
    if (searchMode === 'global') {
        if (selectedGlobalExercises.length > 0) {
            if (Array.isArray(results)) {
                return results.filter(e => selectedGlobalExercises.includes(e.name));
            }
            Object.keys(results).forEach(key => {
                if (selectedGlobalExercises.includes(key)) {
                    matched.push({ name: key, ...results[key] });
                }
            });
        }
        return matched;
    }

    // Modo template
    const exerciseData = Array.isArray(results)
        ? results.find(e => e.name === selectedExercise)
        : results[selectedExercise];
    if (exerciseData) {
        matched.push({ name: selectedExercise, ...exerciseData });
    }
    return matched;
}

function bestOfExercise(exerciseData) {
    let bestWeight = 0;
    let bestReps = 0;

    if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
        exerciseData.sets.forEach(s => {
            if (!s.completed) return;

            if (Number(s.weight) > bestWeight) {
                bestWeight = Number(s.weight);
                bestReps = Number(s.reps);
            }

            if (s.drops && Array.isArray(s.drops)) {
                s.drops.forEach(d => {
                    if (Number(d.weight) > bestWeight) {
                        bestWeight = Number(d.weight);
                        bestReps = Number(d.reps);
                    }
                });
            }
        });
    } else if (exerciseData.weight) {
        bestWeight = Number(exerciseData.weight);
        bestReps = Number(exerciseData.reps);
    }

    return { bestWeight, bestReps };
}

/**
 * Uma linha por sessão com a melhor carga do(s) exercício(s) pedido(s), e os
 * PRs por carga (mesma carga fica com mais repetições), em carga crescente.
 */
export function buildHistoryRows(docs, filters) {
    const rows = [];
    const prMap = new Map();

    docs.forEach((data) => {
        const results = data.results || data.exercises || [];
        const matchedExercises = matchExercises(results, filters);
        if (matchedExercises.length === 0) return;

        const completedAt = data.completedAt?.toDate?.() || null;
        if (!completedAt) return;

        // A melhor carga entre todos os exercícios casados nesta sessão.
        let sessionBestWeight = 0;
        let sessionBestReps = 0;
        let bestExerciseName = '';
        let bestNotes = '';

        matchedExercises.forEach(exerciseData => {
            const { bestWeight, bestReps } = bestOfExercise(exerciseData);
            if (bestWeight > sessionBestWeight) {
                sessionBestWeight = bestWeight;
                sessionBestReps = bestReps;
                bestExerciseName = exerciseData.name || '';
                bestNotes = exerciseData.notes || '';
            }
        });

        if (sessionBestWeight === 0) return;

        rows.push({
            id: data.id,
            date: completedAt,
            weight: sessionBestWeight,
            reps: sessionBestReps,
            notes: bestNotes,
            originalName: bestExerciseName
        });

        const key = String(sessionBestWeight);
        const existing = prMap.get(key);
        if (!existing || sessionBestReps > existing.reps) {
            prMap.set(key, { weight: sessionBestWeight, reps: sessionBestReps });
        }
    });

    const prRows = Array.from(prMap.values()).sort((a, b) => a.weight - b.weight);
    return { rows, prRows };
}

/** Pontos do gráfico: linhas dentro do período, em ordem cronológica. */
export function filterRowsByRange(rows, chartRange, now = new Date()) {
    const rangeDate = new Date(now);
    if (chartRange === '1M') rangeDate.setMonth(now.getMonth() - 1);
    if (chartRange === '3M') rangeDate.setMonth(now.getMonth() - 3);
    if (chartRange === '6M') rangeDate.setMonth(now.getMonth() - 6);
    if (chartRange === '1Y') rangeDate.setFullYear(now.getFullYear() - 1);
    if (chartRange === 'ALL') rangeDate.setFullYear(1900);

    return rows
        .filter(r => r.date >= rangeDate)
        .sort((a, b) => a.date - b.date)
        .map(r => ({
            dateStr: r.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            weight: r.weight,
            fullDate: r.date
        }));
}
