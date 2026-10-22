import { describe, it, expect } from 'vitest';
import { exerciseVolume, sessionVolumeLoad } from './volumeLoad';

describe('exerciseVolume', () => {
    it('soma peso × reps das séries concluídas', () => {
        const ex = {
            sets: [
                { weight: '100', reps: '10', completed: true },
                { weight: '90', reps: '8', completed: true }
            ]
        };
        expect(exerciseVolume(ex)).toBe(1000 + 720);
    });

    it('ignora série não concluída', () => {
        const ex = {
            sets: [
                { weight: '100', reps: '10', completed: true },
                { weight: '100', reps: '10', completed: false }
            ]
        };
        expect(exerciseVolume(ex)).toBe(1000);
    });

    it('aceita vírgula decimal', () => {
        expect(exerciseVolume({ sets: [{ weight: '22,5', reps: '10', completed: true }] })).toBe(225);
    });

    it('expande drop set e ignora o peso da série que o contém', () => {
        const ex = {
            sets: [{
                weight: '100',
                reps: '10',
                completed: true,
                drops: [
                    { weight: '80', reps: '5' },
                    { weight: '60', reps: '5' }
                ]
            }]
        };
        expect(exerciseVolume(ex)).toBe(80 * 5 + 60 * 5);
    });

    it('trata peso ou reps ausente como zero', () => {
        expect(exerciseVolume({ sets: [{ reps: '10', completed: true }] })).toBe(0);
        expect(exerciseVolume({ sets: [{ weight: '100', completed: true }] })).toBe(0);
        expect(exerciseVolume({ sets: [{ weight: 'abc', reps: 'def', completed: true }] })).toBe(0);
    });

    it('aceita número além de string', () => {
        expect(exerciseVolume({ sets: [{ weight: 100, reps: 10, completed: true }] })).toBe(1000);
    });

    // Sessões antigas do histórico guardam peso e reps no próprio exercício,
    // sem array de séries.
    it('usa peso e reps do exercício quando não há array de séries', () => {
        expect(exerciseVolume({ weight: '50', reps: '12' })).toBe(600);
    });

    it('devolve zero para exercício sem séries nem peso', () => {
        expect(exerciseVolume({})).toBe(0);
        expect(exerciseVolume({ sets: [] })).toBe(0);
        expect(exerciseVolume({ sets: null })).toBe(0);
        expect(exerciseVolume(null)).toBe(0);
    });

    it('prefere o array de séries ao peso solto do exercício', () => {
        const ex = { weight: '999', reps: '999', sets: [{ weight: '10', reps: '2', completed: true }] };
        expect(exerciseVolume(ex)).toBe(20);
    });
});

describe('sessionVolumeLoad', () => {
    it('soma o volume de todos os exercícios', () => {
        const exercicios = [
            { sets: [{ weight: '100', reps: '10', completed: true }] },
            { sets: [{ weight: '50', reps: '10', completed: true }] }
        ];
        expect(sessionVolumeLoad(exercicios)).toBe(1500);
    });

    it('mistura formas antiga e nova na mesma sessão', () => {
        const exercicios = [
            { sets: [{ weight: '100', reps: '10', completed: true }] },
            { weight: '20', reps: '10' }
        ];
        expect(sessionVolumeLoad(exercicios)).toBe(1200);
    });

    it('devolve zero para lista vazia ou inválida', () => {
        expect(sessionVolumeLoad([])).toBe(0);
        expect(sessionVolumeLoad(null)).toBe(0);
        expect(sessionVolumeLoad(undefined)).toBe(0);
    });
});
