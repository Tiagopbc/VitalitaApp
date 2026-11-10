/**
 * exerciseFormDefaults.js
 * Métodos oferecidos no formulário de exercício e o exercício vazio usado em
 * cada reset. Movido de CreateWorkoutPage (D18) sem mudança.
 */

export const METHODS = [
    'Convencional', 'Drop-set', 'Pirâmide Crescente', 'Pirâmide Decrescente',
    'Cluster set', 'Bi-set', 'Pico de contração', 'Falha total', 'Negativa',
    'Rest-Pause', 'Cardio 140 bpm'
];

// Estado inicial de um exercício no formulário. Centralizado para manter todos
// os campos controlados (evita warning uncontrolled→controlled) em cada reset.
export const EMPTY_EXERCISE = {
    muscleGroup: '',
    name: '',
    sets: '3',
    reps: '12',
    method: 'Convencional',
    rest: '',
    notes: '',
    targetWeight: ''
};
