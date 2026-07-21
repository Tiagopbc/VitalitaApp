/**
 * exerciseName.js
 * Normalização de nomes de exercício.
 *
 * `exerciseMaxes` é indexado pelo nome cru digitado/gravado, sem normalizar
 * (ver functions/src/userStatsCalculator.js e utils/evaluateAchievements.js).
 * Variações de grafia do mesmo exercício ("Leg Press 45°", "leg press 45")
 * viram chaves distintas e apareciam duplicadas nas Melhores Marcas — ocupando
 * duas vagas do top 4 com a mesma marca.
 */

// Marcas de acento combinantes, expostas pelo normalize('NFD').
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Chave canônica de um exercício: sem acento, minúscula e sem pontuação
 * (inclusive os símbolos de grau ° e º), com espaços colapsados.
 */
export function normalizeExerciseName(name) {
    if (typeof name !== 'string') return '';
    return name
        .normalize('NFD')
        .replace(COMBINING_MARKS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ') // °, º, hífens e pontuação viram espaço
        .trim();
}

/**
 * Agrupa `exerciseMaxes` ({ nome: peso }) por nome normalizado, mantendo o
 * maior peso de cada exercício. Retorna `[{ name, weight }]` — `name` é o
 * rótulo mais completo encontrado (o mais longo costuma trazer acento/grau,
 * ex.: "Leg Press 45°" em vez de "leg press 45").
 */
export function aggregateExerciseMaxes(exerciseMaxes) {
    if (!exerciseMaxes || typeof exerciseMaxes !== 'object') return [];

    const byKey = new Map();

    for (const [rawName, rawWeight] of Object.entries(exerciseMaxes)) {
        const key = normalizeExerciseName(rawName);
        if (!key) continue;

        const weight = Number(rawWeight) || 0;
        const current = byKey.get(key);

        if (!current) {
            byKey.set(key, { name: rawName, weight });
            continue;
        }

        if (weight > current.weight) current.weight = weight;
        if (rawName.length > current.name.length) current.name = rawName;
    }

    return [...byKey.values()];
}
