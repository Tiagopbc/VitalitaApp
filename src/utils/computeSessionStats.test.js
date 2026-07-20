import { describe, expect, it } from 'vitest';
import { computeSessionStats } from './computeSessionStats';

describe('computeSessionStats', () => {
    it('defaults the template name and formats duration in minutes', () => {
        const result = computeSessionStats({ exercises: [], elapsedSeconds: 125, templateName: undefined });
        expect(result.templateName).toBe('Treino Personalizado');
        expect(result.duration).toBe('2min');
        expect(result.exercisesCount).toBe(0);
        expect(result.volumeLoad).toBe(0);
    });

    it('counts only exercises whose sets are all completed', () => {
        const exercises = [
            { sets: [{ completed: true, weight: '10', reps: '5' }, { completed: true, weight: '10', reps: '5' }] },
            { sets: [{ completed: true, weight: '20', reps: '5' }, { completed: false, weight: '20', reps: '5' }] }
        ];
        const result = computeSessionStats({ exercises, elapsedSeconds: 0, templateName: 'A' });
        expect(result.exercisesCount).toBe(1);
    });

    it('sums peso×reps of completed sets and accepts comma decimals', () => {
        const exercises = [
            { sets: [
                { completed: true, weight: '10,5', reps: '10' }, // 105
                { completed: false, weight: '100', reps: '10' }  // ignorado
            ] }
        ];
        const result = computeSessionStats({ exercises, elapsedSeconds: 60, templateName: 'A' });
        expect(result.volumeLoad).toBe(105);
    });

    it('expands drop sets into the volume load', () => {
        const exercises = [
            { sets: [
                { completed: true, weight: '50', reps: '8', drops: [
                    { weight: '40', reps: '6' }, // 240
                    { weight: '30', reps: '6' }  // 180
                ] }
            ] }
        ];
        // Quando há drops, ignora peso/reps do set base e soma só os drops.
        const result = computeSessionStats({ exercises, elapsedSeconds: 0, templateName: 'A' });
        expect(result.volumeLoad).toBe(420);
    });
});
