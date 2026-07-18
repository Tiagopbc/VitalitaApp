/**
 * strengthMath.js
 * Cálculos de força: 1RM estimado (Epley e Brzycki) e montagem de anilhas na barra.
 */

/**
 * Converte entrada numérica em pt-BR ("42,5") ou número para float.
 */
export function parseDecimal(value) {
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    const parsed = parseFloat((value || '').toString().replace(',', '.'));
    return isFinite(parsed) ? parsed : 0;
}

/**
 * Estima o 1RM a partir de carga e repetições.
 * Usa a média de Epley e Brzycki, as duas fórmulas mais difundidas.
 * Acima de 12 repetições a estimativa perde precisão — retornamos mesmo assim,
 * mas o chamador pode exibir um aviso via `reliable`.
 *
 * @returns {{ oneRepMax: number, epley: number, brzycki: number, reliable: boolean } | null}
 */
export function estimateOneRepMax(weight, reps) {
    const w = parseDecimal(weight);
    const r = Math.round(parseDecimal(reps));
    if (w <= 0 || r <= 0) return null;
    if (r === 1) {
        return { oneRepMax: w, epley: w, brzycki: w, reliable: true };
    }

    const epley = w * (1 + r / 30);
    // Brzycki diverge para r >= 37; limitamos o denominador.
    const brzycki = r < 37 ? (w * 36) / (37 - r) : epley;
    const oneRepMax = (epley + brzycki) / 2;

    return {
        oneRepMax: Math.round(oneRepMax * 10) / 10,
        epley: Math.round(epley * 10) / 10,
        brzycki: Math.round(brzycki * 10) / 10,
        reliable: r <= 12
    };
}

/**
 * Tabela de percentuais de 1RM por faixa de repetições (referência clássica).
 */
export function repMaxTable(oneRepMax) {
    const percents = [
        { reps: 1, percent: 100 },
        { reps: 2, percent: 95 },
        { reps: 3, percent: 93 },
        { reps: 5, percent: 87 },
        { reps: 8, percent: 80 },
        { reps: 10, percent: 75 },
        { reps: 12, percent: 70 },
        { reps: 15, percent: 65 }
    ];
    return percents.map(({ reps, percent }) => ({
        reps,
        percent,
        weight: Math.round(oneRepMax * percent / 10) / 10
    }));
}

export const DEFAULT_BAR_WEIGHT = 20;
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Calcula as anilhas por lado para atingir a carga alvo.
 *
 * @param {number|string} targetWeight - carga total desejada (barra + anilhas)
 * @param {number|string} barWeight - peso da barra
 * @param {number[]} availablePlates - anilhas disponíveis (peso unitário), em ordem qualquer
 * @returns {{ platesPerSide: number[], achievedWeight: number, remainder: number } | null}
 *          null se a carga alvo for menor que a barra.
 */
export function calculatePlates(targetWeight, barWeight = DEFAULT_BAR_WEIGHT, availablePlates = DEFAULT_PLATES) {
    const target = parseDecimal(targetWeight);
    const bar = parseDecimal(barWeight);
    if (target <= 0 || bar < 0 || target < bar) return null;

    let perSide = (target - bar) / 2;
    const platesPerSide = [];
    const sorted = [...availablePlates].sort((a, b) => b - a);

    for (const plate of sorted) {
        while (perSide >= plate - 1e-9) {
            platesPerSide.push(plate);
            perSide -= plate;
        }
    }

    const achievedWeight = bar + platesPerSide.reduce((acc, p) => acc + p, 0) * 2;
    return {
        platesPerSide,
        achievedWeight: Math.round(achievedWeight * 100) / 100,
        remainder: Math.round(perSide * 2 * 100) / 100
    };
}
