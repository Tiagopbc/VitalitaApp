import { describe, it, expect } from 'vitest';
import { estimateOneRepMax, calculatePlates, parseDecimal, repMaxTable } from './strengthMath';

describe('parseDecimal', () => {
    it('aceita vírgula decimal pt-BR', () => {
        expect(parseDecimal('42,5')).toBe(42.5);
    });

    it('retorna 0 para entrada inválida', () => {
        expect(parseDecimal('abc')).toBe(0);
        expect(parseDecimal('')).toBe(0);
        expect(parseDecimal(null)).toBe(0);
    });
});

describe('estimateOneRepMax', () => {
    it('retorna null sem carga ou repetições', () => {
        expect(estimateOneRepMax(0, 5)).toBeNull();
        expect(estimateOneRepMax(100, 0)).toBeNull();
    });

    it('1 repetição é o próprio 1RM', () => {
        expect(estimateOneRepMax(100, 1).oneRepMax).toBe(100);
    });

    it('calcula Epley e Brzycki para 100kg x 10', () => {
        const result = estimateOneRepMax(100, 10);
        expect(result.epley).toBeCloseTo(133.3, 1);
        expect(result.brzycki).toBeCloseTo(133.3, 1);
        expect(result.oneRepMax).toBeGreaterThan(130);
        expect(result.reliable).toBe(true);
    });

    it('marca como não confiável acima de 12 repetições', () => {
        expect(estimateOneRepMax(50, 15).reliable).toBe(false);
    });

    it('aceita string com vírgula', () => {
        expect(estimateOneRepMax('42,5', '8').oneRepMax).toBeGreaterThan(42.5);
    });
});

describe('repMaxTable', () => {
    it('gera tabela decrescente a partir do 1RM', () => {
        const table = repMaxTable(100);
        expect(table[0]).toEqual({ reps: 1, percent: 100, weight: 100 });
        expect(table.at(-1).weight).toBe(65);
    });
});

describe('calculatePlates', () => {
    it('retorna null quando alvo é menor que a barra', () => {
        expect(calculatePlates(15, 20)).toBeNull();
    });

    it('barra vazia não precisa de anilhas', () => {
        const result = calculatePlates(20, 20);
        expect(result.platesPerSide).toEqual([]);
        expect(result.achievedWeight).toBe(20);
    });

    it('monta 100kg com barra de 20kg', () => {
        const result = calculatePlates(100, 20);
        expect(result.platesPerSide).toEqual([25, 15]);
        expect(result.achievedWeight).toBe(100);
        expect(result.remainder).toBe(0);
    });

    it('usa combinação gulosa para 72,5kg', () => {
        const result = calculatePlates('72,5', 20);
        expect(result.platesPerSide).toEqual([25, 1.25]);
        expect(result.achievedWeight).toBe(72.5);
    });

    it('reporta sobra quando não fecha exato', () => {
        const result = calculatePlates(21, 20);
        expect(result.platesPerSide).toEqual([]);
        expect(result.remainder).toBe(1);
    });
});
