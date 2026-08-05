import { describe, it, expect } from 'vitest';
import { buildCopyName, copyInsertIndex, isCopyName, stripCopySuffix } from './workoutCopyName';

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

describe('copyInsertIndex', () => {
    const list = names => names.map(name => ({ name }));

    it('entra logo abaixo do original quando ainda não há cópia', () => {
        expect(copyInsertIndex(list(['Treino A', 'Treino B']), 0, 'Treino A')).toBe(1);
    });

    // Ordem cronológica: "(Cópia)" primeiro, "(Cópia 2)" depois.
    it('entra no fim do bloco de cópias do mesmo treino', () => {
        const templates = list(['Treino A', 'Treino A (Cópia)', 'Treino A (Cópia 2)', 'Treino B']);
        expect(copyInsertIndex(templates, 0, 'Treino A')).toBe(3);
    });

    it('para no primeiro treino que não é cópia daquele original', () => {
        const templates = list(['Treino A', 'Treino A (Cópia)', 'Treino B (Cópia)', 'Treino B']);
        expect(copyInsertIndex(templates, 0, 'Treino A')).toBe(2);
    });

    // Duplicar a cópia continua alimentando o mesmo bloco.
    it('usa o nome-base ao duplicar uma cópia', () => {
        const templates = list(['Treino A', 'Treino A (Cópia)', 'Treino B']);
        expect(copyInsertIndex(templates, 1, 'Treino A (Cópia)')).toBe(2);
    });

    it('joga para o fim quando o original não está na lista', () => {
        expect(copyInsertIndex(list(['Treino A', 'Treino B']), -1, 'Treino C')).toBe(2);
    });
});
