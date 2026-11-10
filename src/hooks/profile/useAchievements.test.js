import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getRecentSessions = vi.fn();
const calculateStats = vi.fn();
const evaluateHistory = vi.fn();
const evaluateAchievements = vi.fn();

vi.mock('../../services/workoutService', () => ({
    SESSION_LIMITS: { profileStats: 50 },
    workoutService: { getRecentSessions: (...a) => getRecentSessions(...a) }
}));

vi.mock('../../utils/evaluateAchievements', () => ({
    evaluateAchievements: (...a) => evaluateAchievements(...a),
    calculateStats: (...a) => calculateStats(...a),
    evaluateHistory: (...a) => evaluateHistory(...a)
}));

vi.mock('../../utils/workoutStats', () => ({
    calculateWeeklyStats: () => ({ currentStreak: 0, bestStreak: 0, weeklyGoal: 4 })
}));

vi.mock('../../data/achievementsCatalog', () => ({ achievementsCatalog: [] }));

import { useAchievements } from './useAchievements';

const USER = { uid: 'u1' };
const SESSIONS = [{ id: 's1' }, { id: 's2' }];

describe('useAchievements', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getRecentSessions.mockResolvedValue(SESSIONS);
        calculateStats.mockReturnValue({ totalWorkouts: 2 });
        evaluateHistory.mockReturnValue({});
        // Devolve o mapa recebido, para as asserções poderem inspecionar o merge.
        evaluateAchievements.mockImplementation((_catalog, _stats, map) => [{ id: 'lista', map }]);
    });

    it('começa com lista vazia enquanto as sessões não chegaram', () => {
        getRecentSessions.mockReturnValue(new Promise(() => {})); // nunca resolve
        const { result } = renderHook(() => useAchievements(USER, { achievements: {} }));
        expect(result.current.achievementsList).toEqual([]);
    });

    it('calcula tudo a partir das sessões recentes: única fonte, sem agregado do servidor', async () => {
        const { result } = renderHook(() => useAchievements(USER, { achievements: {} }));

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        expect(getRecentSessions).toHaveBeenCalledWith('u1', 50);
        expect(calculateStats).toHaveBeenCalledWith(SESSIONS);
        expect(result.current.stats).toMatchObject({ totalWorkouts: 2, weeklyGoal: 4 });
        expect(result.current.achievementsList[0].id).toBe('lista');
    });

    it('o histórico calculado tem precedência sobre o mapa do perfil', async () => {
        // Mesma conquista nos dois lados, com datas diferentes.
        evaluateHistory.mockReturnValue({ primeiro_treino: '2026-01-01' });

        const profile = { achievements: { primeiro_treino: '2026-08-01' } };
        const { result } = renderHook(() => useAchievements(USER, profile));

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        // O calculado vence: é mais preciso para "quando foi a primeira vez".
        expect(result.current.achievementsList[0].map.primeiro_treino).toBe('2026-01-01');
    });

    it('reavalia quando o perfil muda, sem refazer a busca', async () => {
        const { result, rerender } = renderHook(
            ({ profile }) => useAchievements(USER, profile),
            { initialProps: { profile: { weeklyGoal: 4, achievements: { a: 'antes' } } } }
        );

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        expect(result.current.achievementsList[0].map.a).toBe('antes');

        const buscasAntes = getRecentSessions.mock.calls.length;
        rerender({ profile: { weeklyGoal: 4, achievements: { a: 'depois' } } });

        await waitFor(() => expect(result.current.achievementsList[0].map.a).toBe('depois'));
        // Mudar overrides do perfil não pode custar uma ida ao Firestore.
        expect(getRecentSessions.mock.calls.length).toBe(buscasAntes);
    });

    it('não avalia nada sem usuário', () => {
        const { result } = renderHook(() => useAchievements(null, { achievements: {} }));
        expect(result.current.achievementsList).toEqual([]);
        expect(evaluateAchievements).not.toHaveBeenCalled();
        expect(getRecentSessions).not.toHaveBeenCalled();
    });
});
