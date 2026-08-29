/**
 * muscleGroups.js
 * Fonte única dos 10 grupos musculares do app e da tradução entre eles e o
 * vocabulário gravado no catálogo global (`exercises_catalog`).
 *
 * Por que a tradução existe: o catálogo foi populado por
 * `scripts/import_exercises.js`, que grava `primaryMuscles[0]` do dataset pt-BR
 * de origem apenas capitalizado — sem acento ("Biceps"), no plural
 * ("Panturrilhas") e com a divisão anatômica original ("Dorsais",
 * "Isquiotibiais", "Meio-das-costas"). Os rótulos desta tela seguem outra
 * convenção, então a busca por igualdade exata só acertava "Peito" e "Ombros":
 * os outros oito grupos vinham sempre vazios.
 *
 * A coleção é somente-leitura pelas regras (`allow write: if false` em
 * firestore.rules), então a tradução mora aqui, no cliente, em vez de depender
 * de uma reimportação do catálogo com credencial de admin.
 */

export const MUSCLE_GROUPS = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
    'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen'
];

/**
 * Rótulo da tela → valores que o campo `muscleGroup` pode ter no catálogo.
 * O próprio rótulo entra na lista de propósito: cobre exercícios salvos pelo
 * app e mantém tudo funcionando se um dia o catálogo for reimportado já
 * normalizado. O maior conjunto tem 5 valores, bem abaixo do limite de 30
 * disjunções do operador `in` do Firestore.
 */
export const CATALOG_ALIASES = {
    'Peito': ['Peito'],
    'Costas': ['Costas', 'Dorsais', 'Meio-das-costas', 'Inferior-das-costas', 'Trapezio'],
    'Ombros': ['Ombros'],
    'Bíceps': ['Bíceps', 'Biceps'],
    'Tríceps': ['Tríceps', 'Triceps'],
    'Quadríceps': ['Quadríceps', 'Quadriceps'],
    'Posteriores': ['Posteriores', 'Isquiotibiais'],
    'Glúteos': ['Glúteos', 'Gluteos'],
    'Panturrilha': ['Panturrilha', 'Panturrilhas'],
    'Abdômen': ['Abdômen', 'Abdominais']
};

/**
 * Valores a consultar no catálogo para um rótulo da tela.
 * @param {string} label
 * @returns {string[]}
 */
export function catalogValuesFor(label) {
    return CATALOG_ALIASES[label] || [label];
}

// Índice inverso, montado uma vez: valor do catálogo (minúsculo) → rótulo.
const CANONICAL_BY_VALUE = new Map();
for (const [label, values] of Object.entries(CATALOG_ALIASES)) {
    for (const value of values) {
        CANONICAL_BY_VALUE.set(value.toLowerCase(), label);
    }
}

/**
 * Caminho inverso: 'Isquiotibiais' → 'Posteriores', 'peito' → 'Peito'.
 * @param {string} value
 * @returns {string|null} `null` para valor desconhecido — quem chama decide o fallback.
 */
export function toCanonicalMuscleGroup(value) {
    if (!value || typeof value !== 'string') return null;
    return CANONICAL_BY_VALUE.get(value.trim().toLowerCase()) || null;
}
