import { describe, expect, it } from 'vitest';
import {
    buildHistoryRows,
    extractExerciseNamesFromSessions,
    filterRowsByRange
} from './historyRows';

// Os docs vêm do Firestore: completedAt é um Timestamp (tem toDate()).
const ts = (iso) => ({ toDate: () => new Date(iso) });

const docSupino = {
    id: 's1',
    completedAt: ts('2026-10-01T10:00:00'),
    exercises: [
        {
            name: 'Supino',
            notes: 'boa',
            sets: [
                { completed: true, weight: '40', reps: '10' },
                { completed: true, weight: '50', reps: '6', drops: [{ weight: '55', reps: '3' }] },
                { completed: false, weight: '90', reps: '1' }
            ]
        },
        { name: 'Remada', sets: [{ completed: true, weight: '70', reps: '8' }] }
    ]
};

describe('extractExerciseNamesFromSessions', () => {
    it('junta nomes únicos de exercises (array) e results (objeto), em ordem alfabética', () => {
        const nomes = extractExerciseNamesFromSessions([
            { exercises: [{ name: 'Supino' }, { name: 'Remada' }, {}] },
            { results: { Agachamento: {}, Supino: {} } }
        ]);
        expect(nomes).toEqual(['Agachamento', 'Remada', 'Supino']);
    });
});

describe('buildHistoryRows no modo template', () => {
    it('usa a melhor série concluída do exercício, contando drops e ignorando série não concluída', () => {
        const { rows, prRows } = buildHistoryRows([docSupino], {
            searchMode: 'template',
            selectedExercise: 'Supino',
            selectedGlobalExercises: []
        });
        expect(rows).toEqual([
            { id: 's1', date: new Date('2026-10-01T10:00:00'), weight: 55, reps: 3, notes: 'boa', originalName: 'Supino' }
        ]);
        expect(prRows).toEqual([{ weight: 55, reps: 3 }]);
    });

    it('lê o formato antigo results[nome] com weight/reps direto', () => {
        const { rows } = buildHistoryRows([
            { id: 'a', completedAt: ts('2026-09-01'), results: { Supino: { weight: '30', reps: '12' } } }
        ], { searchMode: 'template', selectedExercise: 'Supino', selectedGlobalExercises: [] });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ weight: 30, reps: 12, originalName: 'Supino' });
    });

    it('pula sessão sem o exercício, sem completedAt ou sem carga', () => {
        const { rows } = buildHistoryRows([
            { id: 'x', completedAt: ts('2026-09-01'), exercises: [{ name: 'Remada', sets: [{ completed: true, weight: '70', reps: '8' }] }] },
            { id: 'y', completedAt: null, exercises: [{ name: 'Supino', sets: [{ completed: true, weight: '70', reps: '8' }] }] },
            { id: 'z', completedAt: ts('2026-09-01'), exercises: [{ name: 'Supino', sets: [{ completed: true, weight: '0', reps: '8' }] }] }
        ], { searchMode: 'template', selectedExercise: 'Supino', selectedGlobalExercises: [] });
        expect(rows).toEqual([]);
    });

    it('nos PRs, mesma carga fica com mais repetições, ordenados por carga crescente', () => {
        const { prRows } = buildHistoryRows([
            { id: '1', completedAt: ts('2026-09-01'), exercises: [{ name: 'Supino', sets: [{ completed: true, weight: '50', reps: '5' }] }] },
            { id: '2', completedAt: ts('2026-09-08'), exercises: [{ name: 'Supino', sets: [{ completed: true, weight: '50', reps: '8' }] }] },
            { id: '3', completedAt: ts('2026-09-15'), exercises: [{ name: 'Supino', sets: [{ completed: true, weight: '40', reps: '10' }] }] }
        ], { searchMode: 'template', selectedExercise: 'Supino', selectedGlobalExercises: [] });
        expect(prRows).toEqual([{ weight: 40, reps: 10 }, { weight: 50, reps: 8 }]);
    });
});

describe('buildHistoryRows no modo global', () => {
    it('considera só os exercícios selecionados e registra qual deles fez a melhor carga', () => {
        const { rows } = buildHistoryRows([docSupino], {
            searchMode: 'global',
            selectedExercise: '',
            selectedGlobalExercises: ['Supino', 'Remada']
        });
        expect(rows).toEqual([
            { id: 's1', date: new Date('2026-10-01T10:00:00'), weight: 70, reps: 8, notes: '', originalName: 'Remada' }
        ]);
    });

    it('sem exercício selecionado não gera linha', () => {
        const { rows, prRows } = buildHistoryRows([docSupino], {
            searchMode: 'global',
            selectedExercise: '',
            selectedGlobalExercises: []
        });
        expect(rows).toEqual([]);
        expect(prRows).toEqual([]);
    });
});

describe('filterRowsByRange', () => {
    const agora = new Date('2026-11-10T12:00:00');
    const linha = (iso, weight) => ({ id: iso, date: new Date(iso), weight, reps: 1, notes: '', originalName: 'Supino' });
    // Com hora explícita a data é local; sem hora, 'AAAA-MM-DD' é UTC e vira
    // o dia anterior no fuso de Brasília.
    const linhas = [
        linha('2026-11-01T12:00:00', 50),
        linha('2025-10-01T12:00:00', 30),
        linha('2026-09-01T12:00:00', 45),
        linha('2026-06-01T12:00:00', 40)
    ];

    it('3M fica com os últimos três meses, em ordem cronológica e com dateStr dd/mm', () => {
        expect(filterRowsByRange(linhas, '3M', agora)).toEqual([
            { dateStr: '01/09', weight: 45, fullDate: new Date('2026-09-01T12:00:00') },
            { dateStr: '01/11', weight: 50, fullDate: new Date('2026-11-01T12:00:00') }
        ]);
    });

    it('1M, 6M, 1Y e ALL recortam como antes', () => {
        expect(filterRowsByRange(linhas, '1M', agora).map((r) => r.weight)).toEqual([50]);
        expect(filterRowsByRange(linhas, '6M', agora).map((r) => r.weight)).toEqual([40, 45, 50]);
        expect(filterRowsByRange(linhas, '1Y', agora).map((r) => r.weight)).toEqual([40, 45, 50]);
        expect(filterRowsByRange(linhas, 'ALL', agora).map((r) => r.weight)).toEqual([30, 40, 45, 50]);
    });
});
