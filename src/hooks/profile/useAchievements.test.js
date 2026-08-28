import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getUserStats = vi.fn();
const getRecentSessions = vi.fn();
const evaluateAchievements = vi.fn();

vi.mock('../../services/userStatsService', () => ({
    userStatsService: { getUserStats: (...a) => getUserStats(...a) }
}));

vi.mock('../../services/workoutService', () => ({
    SESSION_LIMITS: { profileStats: 50 },
    workoutService: { getRecentSessions: (...a) => getRecentSessions(...a) }
}));

vi.mock('../../utils/evaluateAchievements', () => ({
    evaluateAchievements: (...a) => evaluateAchievements(...a),
    calculateStats: () => ({ totalWorkouts: 0 }),
    evaluateHistory: () => ({})
}));

vi.mock('../../utils/workoutStats', () => ({
    calculateWeeklyStats: () => ({ currentStreak: 0, bestStreak: 0, weeklyGoal: 4 })
}));

vi.mock('../../data/achievementsCatalog', () => ({ achievementsCatalog: [] }));

import { useAchievements } from './useAchievements';

const USER = { uid: 'u1' };

describe('useAchievements', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Devolve o mapa recebido, para as asserções poderem inspecionar o merge.
        evaluateAchievements.mockImplementation((_catalog, _stats, map) => [{ id: 'lista', map }]);
    });

    it('começa com lista vazia enquanto as estatísticas não chegaram', () => {
        getUserStats.mockReturnValue(new Promise(() => {})); // nunca resolve
        const { result } = renderHook(() => useAchievements(USER, { achievements: {} }));
        expect(result.current.achievementsList).toEqual([]);
    });

    it('publica a lista avaliada quando as estatísticas chegam', async () => {
        getUserStats.mockResolvedValue({ totalWorkouts: 3, achievements: {} });

        const { result } = renderHook(() => useAchievements(USER, { achievements: {} }));

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        expect(result.current.achievementsList[0].id).toBe('lista');
    });

    it('o histórico calculado tem precedência sobre o mapa do perfil', async () => {
        // Mesma conquista nos dois lados, com datas diferentes.
        getUserStats.mockResolvedValue({
            totalWorkouts: 3,
            achievements: { primeiro_treino: '2026-01-01' }
        });

        const profile = { achievements: { primeiro_treino: '2026-08-01' } };
        const { result } = renderHook(() => useAchievements(USER, profile));

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        // O calculado (servidor) vence: é mais preciso para "quando foi a primeira vez".
        expect(result.current.achievementsList[0].map.primeiro_treino).toBe('2026-01-01');
    });

    it('reavalia quando o perfil muda, sem refazer a busca', async () => {
        getUserStats.mockResolvedValue({ totalWorkouts: 3, achievements: {} });

        const { result, rerender } = renderHook(
            ({ profile }) => useAchievements(USER, profile),
            { initialProps: { profile: { weeklyGoal: 4, achievements: { a: 'antes' } } } }
        );

        await waitFor(() => expect(result.current.achievementsList).toHaveLength(1));
        expect(result.current.achievementsList[0].map.a).toBe('antes');

        const buscasAntes = getUserStats.mock.calls.length;
        rerender({ profile: { weeklyGoal: 4, achievements: { a: 'depois' } } });

        await waitFor(() => expect(result.current.achievementsList[0].map.a).toBe('depois'));
        // Mudar overrides do perfil não pode custar uma ida ao servidor.
        expect(getUserStats.mock.calls.length).toBe(buscasAntes);
    });

    it('não avalia nada sem usuário', () => {
        const { result } = renderHook(() => useAchievements(null, { achievements: {} }));
        expect(result.current.achievementsList).toEqual([]);
        expect(evaluateAchievements).not.toHaveBeenCalled();
        expect(getUserStats).not.toHaveBeenCalled();
    });
});
