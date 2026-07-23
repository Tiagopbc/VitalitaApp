/**
 * starterWorkouts.js
 * Fichas de treino modelo, prontas para o aluno novo clonar no primeiro acesso
 * (enquanto o personal/educador físico não prescreve o treino definitivo).
 *
 * São dados estáticos (não dependem de rede) e seguem o mesmo schema de exercício
 * das fichas do usuário: { muscleGroup, name, sets, reps, method, rest, notes?, targetWeight? }.
 * `muscleGroup` usa os 10 grupos de CreateWorkoutPage; `method`, os 11 métodos.
 * As cargas ficam em branco de propósito — quem define é o aluno/personal.
 */
export const starterWorkouts = [
    {
        id: 'starter-full-body',
        name: 'Full Body Iniciante',
        level: 'Iniciante',
        category: 'fullbody',
        focus: 'Corpo inteiro em 3 dias por semana. Ideal para os primeiros meses.',
        muscleGroups: ['Peito', 'Costas', 'Pernas'],
        exercises: [
            { muscleGroup: 'Quadríceps', name: 'Agachamento Livre', sets: '3', reps: '10-12', method: 'Convencional', rest: '90s', notes: 'Priorize a técnica antes da carga.' },
            { muscleGroup: 'Peito', name: 'Supino Reto', sets: '3', reps: '8-12', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Costas', name: 'Puxada Alta', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Ombros', name: 'Desenvolvimento com Halteres', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Posteriores', name: 'Mesa Flexora', sets: '3', reps: '12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Abdômen', name: 'Abdominal Supra', sets: '3', reps: '15', method: 'Convencional', rest: '45s' }
        ]
    },
    {
        id: 'starter-upper',
        name: 'Treino A — Superior',
        level: 'Intermediário',
        category: 'upper',
        focus: 'Parte superior do corpo. Combine com o "Treino B — Inferior" (divisão A/B).',
        muscleGroups: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
        exercises: [
            { muscleGroup: 'Peito', name: 'Supino Reto', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Costas', name: 'Remada Curvada', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Ombros', name: 'Desenvolvimento com Halteres', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Costas', name: 'Puxada Alta', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Tríceps', name: 'Tríceps na Corda', sets: '3', reps: '12', method: 'Convencional', rest: '45s' },
            { muscleGroup: 'Bíceps', name: 'Rosca Direta', sets: '3', reps: '12', method: 'Convencional', rest: '45s' }
        ]
    },
    {
        id: 'starter-lower',
        name: 'Treino B — Inferior',
        level: 'Intermediário',
        category: 'lower',
        focus: 'Pernas e glúteos. Combine com o "Treino A — Superior" (divisão A/B).',
        muscleGroups: ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha'],
        exercises: [
            { muscleGroup: 'Quadríceps', name: 'Agachamento Livre', sets: '4', reps: '8-10', method: 'Convencional', rest: '120s' },
            { muscleGroup: 'Quadríceps', name: 'Leg Press 45°', sets: '4', reps: '10-12', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Posteriores', name: 'Cadeira Flexora', sets: '3', reps: '12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Glúteos', name: 'Elevação Pélvica', sets: '3', reps: '12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Quadríceps', name: 'Cadeira Extensora', sets: '3', reps: '15', method: 'Convencional', rest: '45s' },
            { muscleGroup: 'Panturrilha', name: 'Panturrilha em Pé', sets: '4', reps: '15-20', method: 'Convencional', rest: '45s' }
        ]
    },
    {
        id: 'starter-push',
        name: 'Push — Empurrar',
        level: 'Intermediário',
        category: 'push',
        focus: 'Peito, ombro e tríceps. Parte de uma divisão Push / Pull / Legs.',
        muscleGroups: ['Peito', 'Ombros', 'Tríceps'],
        exercises: [
            { muscleGroup: 'Peito', name: 'Supino Reto', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Peito', name: 'Supino Inclinado com Halteres', sets: '3', reps: '10-12', method: 'Convencional', rest: '75s' },
            { muscleGroup: 'Ombros', name: 'Desenvolvimento com Halteres', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Ombros', name: 'Elevação Lateral', sets: '3', reps: '12-15', method: 'Convencional', rest: '45s' },
            { muscleGroup: 'Tríceps', name: 'Tríceps na Corda', sets: '3', reps: '12', method: 'Convencional', rest: '45s' },
            { muscleGroup: 'Tríceps', name: 'Tríceps Testa', sets: '3', reps: '10-12', method: 'Convencional', rest: '45s' }
        ]
    },
    {
        id: 'starter-pull',
        name: 'Pull — Puxar',
        level: 'Intermediário',
        category: 'pull',
        focus: 'Costas e bíceps. Parte de uma divisão Push / Pull / Legs.',
        muscleGroups: ['Costas', 'Bíceps'],
        exercises: [
            { muscleGroup: 'Costas', name: 'Puxada Alta', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Costas', name: 'Remada Curvada', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s' },
            { muscleGroup: 'Costas', name: 'Remada Baixa', sets: '3', reps: '10-12', method: 'Convencional', rest: '60s' },
            { muscleGroup: 'Bíceps', name: 'Rosca Direta', sets: '3', reps: '10-12', method: 'Convencional', rest: '45s' },
            { muscleGroup: 'Bíceps', name: 'Rosca Martelo', sets: '3', reps: '12', method: 'Convencional', rest: '45s' }
        ]
    }
];
