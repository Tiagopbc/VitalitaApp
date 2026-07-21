import { describe, expect, it } from 'vitest';
import { calculateStats, evaluateAchievements, evaluateHistory } from './evaluateAchievements';

function session(date, exercises) {
    return { completedAt: new Date(date), exercises };
}

function exercise(name, weight) {
    return { name, sets: [{ weight, reps: 10, completed: true }] };
}

const catalog = [
    { id: 'pr_50', type: 'prs_count', target: 50 },
    { id: 'ex_10', type: 'distinct_exercises', target: 10 }
];

describe('calculateStats', () => {
    it('trata grafias diferentes do mesmo exercício como um só', () => {
        const stats = calculateStats([
            session('2026-07-01T10:00:00.000Z', [exercise('Leg Press 45°', '200')]),
            session('2026-07-02T10:00:00.000Z', [exercise('leg press 45', '180')])
        ]);

        expect(stats.distinctExercises).toBe(1);
        expect(stats.prsCount).toBe(1);
        expect(stats.exerciseMaxes).toEqual({ 'Leg Press 45°': 200 });
    });

    it('conta como PR quando a marca sobe, mesmo com outra grafia', () => {
        const stats = calculateStats([
            session('2026-07-01T10:00:00.000Z', [exercise('leg press 45', '180')]),
            session('2026-07-02T10:00:00.000Z', [exercise('Leg Press 45°', '200')])
        ]);

        expect(stats.prsCount).toBe(2);
        expect(stats.exerciseMaxes).toEqual({ 'Leg Press 45°': 200 });
    });
});

describe('evaluateHistory', () => {
    it('não desbloqueia conquistas com PRs duplicados por grafia', () => {
        const history = evaluateHistory([
            session('2026-07-01T10:00:00.000Z', [exercise('Leg Press 45°', '200')]),
            session('2026-07-02T10:00:00.000Z', [exercise('leg press 45', '180')])
        ], [{ id: 'pr_2', type: 'prs_count', target: 2 }]);

        expect(history.pr_2).toBeUndefined();
    });
});

describe('evaluateAchievements', () => {
    it('mantém desbloqueada a conquista já registrada, mesmo com valor menor', () => {
        const [prAchievement] = evaluateAchievements(
            catalog,
            { prsCount: 47, distinctExercises: 3 },
            { pr_50: { unlockedAt: '2026-05-01T00:00:00.000Z' } }
        );

        expect(prAchievement.isUnlocked).toBe(true);
        expect(prAchievement.unlockedAt).toBe('2026-05-01T00:00:00.000Z');
        // Barra cheia: a medalha já foi ganha.
        expect(prAchievement.progressRatio).toBe(1);
        expect(prAchievement.progressText).toBe('50 / 50');
    });

    it('mantém bloqueada a conquista que nunca foi atingida', () => {
        const [, variety] = evaluateAchievements(
            catalog,
            { prsCount: 47, distinctExercises: 3 },
            {}
        );

        expect(variety.isUnlocked).toBe(false);
        expect(variety.progressText).toBe('3 / 10');
    });
});
