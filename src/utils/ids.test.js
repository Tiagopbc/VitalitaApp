import { describe, it, expect } from 'vitest';
import { generateId } from './ids';

describe('generateId', () => {
    it('devolve 9 caracteres alfanuméricos minúsculos', () => {
        for (let i = 0; i < 50; i += 1) {
            expect(generateId()).toMatch(/^[a-z0-9]{9}$/);
        }
    });

    it('não repete em mil chamadas', () => {
        const gerados = new Set();
        for (let i = 0; i < 1000; i += 1) {
            gerados.add(generateId());
        }
        expect(gerados.size).toBe(1000);
    });

    it('mantém o comprimento mesmo quando o sorteio cai em valor curto', () => {
        // Math.random() perto de 0 produz "0.000...", onde o corte em 2 deixaria
        // menos de 9 caracteres se o comprimento não fosse garantido.
        const original = Math.random;
        try {
            Math.random = () => 0;
            expect(generateId()).toHaveLength(9);
            Math.random = () => 0.0000001;
            expect(generateId()).toHaveLength(9);
        } finally {
            Math.random = original;
        }
    });
});
