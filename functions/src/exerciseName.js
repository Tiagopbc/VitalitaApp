/**
 * exerciseName.js (functions)
 * ESPELHO de src/utils/exerciseName.js — functions/ é um pacote separado e o
 * deploy leva só esta pasta, então a normalização é duplicada de propósito
 * (mesmo caso de achievementTargets.js). Alterou lá, altere aqui.
 *
 * Sem isto, grafias diferentes do mesmo exercício ("Leg Press 45°" e
 * "leg press 45") viram chaves distintas em `exerciseMaxes` e inflam
 * `distinctExercises` e `prsCount`.
 */

// Marcas de acento combinantes, expostas pelo normalize('NFD').
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Chave canônica de um exercício: sem acento, minúscula e sem pontuação
 * (inclusive os símbolos de grau ° e º), com espaços colapsados.
 */
export function normalizeExerciseName(name) {
    if (typeof name !== "string") return "";
    return name
        .normalize("NFD")
        .replace(COMBINING_MARKS, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ") // °, º, hífens e pontuação viram espaço
        .trim();
}

/**
 * Acumula o máximo por exercício canônico durante a varredura das sessões.
 * Existe para que servidor e cliente contem PR e escolham o rótulo exibido
 * exatamente da mesma forma.
 */
export function createExerciseMaxTracker() {
    const byKey = new Map();

    return {
        /**
         * Registra o máximo de uma sessão. Retorna `true` quando o peso supera
         * o máximo anterior do exercício canônico — ou seja, quando é PR.
         */
        record(rawName, weight) {
            const key = normalizeExerciseName(rawName);
            if (!key || !(weight > 0)) return false;

            const current = byKey.get(key);
            if (!current) {
                byKey.set(key, { label: rawName, weight });
                return true;
            }

            // O rótulo mais longo costuma trazer acento/grau ("Leg Press 45°").
            if (rawName.length > current.label.length) current.label = rawName;

            if (weight > current.weight) {
                current.weight = weight;
                return true;
            }
            return false;
        },

        /** `{ rótulo: peso }` — a forma que os consumidores já esperam. */
        toObject() {
            const result = {};
            for (const { label, weight } of byKey.values()) {
                result[label] = weight;
            }
            return result;
        }
    };
}
