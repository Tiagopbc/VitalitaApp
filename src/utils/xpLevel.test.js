import { describe, expect, it } from 'vitest';
import { computeXpLevel, XP_PER_LEVEL } from './xpLevel';

describe('xpLevel', () => {
    describe('computeXpLevel', () => {
        it('returns level 1 with zeroed progress for missing stats', () => {
            expect(computeXpLevel(null)).toEqual({
                currentXP: 0,
                level: 1,
                xpInLevel: 0,
                xpProgress: 0
            });
            expect(computeXpLevel(undefined)).toEqual(computeXpLevel({}));
        });

        it('combines tonnage and workouts into XP', () => {
            // 10000kg / 10 = 1000 XP + 4 treinos * 50 = 200 XP => 1200 XP
            const result = computeXpLevel({ totalTonnageKg: 10000, totalWorkouts: 4 });
            expect(result.currentXP).toBe(1200);
            expect(result.level).toBe(1);
            expect(result.xpInLevel).toBe(1200);
            expect(result.xpProgress).toBeCloseTo((1200 / XP_PER_LEVEL) * 100);
        });

        it('advances the level once XP crosses XP_PER_LEVEL', () => {
            // 40000kg / 10 = 4000 XP => nível 2, restando 500 XP no nível
            const result = computeXpLevel({ totalTonnageKg: 40000, totalWorkouts: 0 });
            expect(result.level).toBe(2);
            expect(result.xpInLevel).toBe(500);
        });

        it('caps xpProgress at 100', () => {
            const result = computeXpLevel({ totalTonnageKg: 999999999, totalWorkouts: 0 });
            expect(result.xpProgress).toBeLessThanOrEqual(100);
        });
    });
});
