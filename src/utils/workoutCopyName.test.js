import { describe, it, expect } from 'vitest';
import { buildCopyName, isCopyName, stripCopySuffix } from './workoutCopyName';

describe('stripCopySuffix', () => {
    it('remove apenas o sufixo final de cópia', () => {
        expect(stripCopySuffix('Treino A')).toBe('Treino A');
        expect(stripCopySuffix('Treino A (Cópia)')).toBe('Treino A');
        expect(stripCopySuffix('Treino A (Cópia 3)')).toBe('Treino A');
    });

    it('preserva parênteses que não são sufixo de cópia', () => {
        expect(stripCopySuffix('Treino A (leve)')).toBe('Treino A (leve)');
        expect(stripCopySuffix('Treino A (Cópia) do personal')).toBe('Treino A (Cópia) do personal');
    });
});

describe('isCopyName', () => {
    it('reconhece nomes gerados por duplicação', () => {
        expect(isCopyName('Treino A (Cópia)')).toBe(true);
        expect(isCopyName('Treino A (Cópia 2)')).toBe(true);
        expect(isCopyName('Treino A (cópia)')).toBe(true);
    });

    it('não marca nomes comuns', () => {
        expect(isCopyName('Treino A')).toBe(false);
        expect(isCopyName('Treino A (leve)')).toBe(false);
        expect(isCopyName('')).toBe(false);
        expect(isCopyName(undefined)).toBe(false);
    });
});

describe('buildCopyName', () => {
    it('usa "(Cópia)" quando o nome está livre', () => {
        expect(buildCopyName('Treino A', ['Treino A'])).toBe('Treino A (Cópia)');
    });

    it('numera a partir da segunda cópia em vez de repetir o nome', () => {
        expect(buildCopyName('Treino A', ['Treino A', 'Treino A (Cópia)']))
            .toBe('Treino A (Cópia 2)');
    });

    // Duplicar a cópia não pode empilhar sufixos.
    it('parte do nome-base ao duplicar uma cópia', () => {
        expect(buildCopyName('Treino A (Cópia)', ['Treino A', 'Treino A (Cópia)']))
            .toBe('Treino A (Cópia 2)');
    });

    it('preenche lacunas da sequência', () => {
        expect(buildCopyName('Treino A', ['Treino A', 'Treino A (Cópia)', 'Treino A (Cópia 3)']))
            .toBe('Treino A (Cópia 2)');
    });

    it('ignora caixa e acento ao verificar o que já existe', () => {
        expect(buildCopyName('Treino A', ['Treino A', 'treino a (copia)']))
            .toBe('Treino A (Cópia 2)');
    });

    it('funciona sem lista de nomes existentes', () => {
        expect(buildCopyName('Treino A')).toBe('Treino A (Cópia)');
    });
});
