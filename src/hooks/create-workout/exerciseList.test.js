import { describe, expect, it } from 'vitest';
import { groupLabel } from '../../utils/exerciseGroups';
import { bisetPartnerToSuggest, groupBadgesByIndex, withExerciseIds } from './exerciseList';

describe('withExerciseIds', () => {
    it('dá id a quem não tem e preserva o id de quem tem', () => {
        const lista = withExerciseIds([{ id: 'a', name: 'Supino' }, { name: 'Remada' }]);
        expect(lista[0]).toEqual({ id: 'a', name: 'Supino' });
        expect(lista[1].name).toBe('Remada');
        expect(typeof lista[1].id).toBe('string');
        expect(lista[1].id.length).toBeGreaterThan(0);
    });

    it('devolve a mesma lista quando todos já têm id', () => {
        const lista = [{ id: 'a' }, { id: 'b' }];
        expect(withExerciseIds(lista)).toBe(lista);
    });

    it('lista ausente vira lista vazia', () => {
        expect(withExerciseIds(undefined)).toEqual([]);
    });
});

describe('groupBadgesByIndex', () => {
    it('exercício avulso não tem rótulo', () => {
        expect(groupBadgesByIndex([{ id: 'a' }, { id: 'b' }])).toEqual({});
    });

    it('rotula cada membro do grupo pelo tamanho do grupo, não pelo método', () => {
        const lista = [
            { id: 'a' },
            { id: 'b', groupId: 'g1', method: 'Convencional' },
            { id: 'c', groupId: 'g1', method: 'Convencional' },
            { id: 'd', groupId: 'g2' },
            { id: 'e', groupId: 'g2' },
            { id: 'f', groupId: 'g2' }
        ];
        expect(groupBadgesByIndex(lista)).toEqual({
            1: groupLabel(2), 2: groupLabel(2),
            3: groupLabel(3), 4: groupLabel(3), 5: groupLabel(3)
        });
    });
});

describe('bisetPartnerToSuggest', () => {
    const anterior = { id: 'a', name: 'Supino' };

    it('sugere o exercício anterior quando o método é Bi-set e ainda não há grupo', () => {
        expect(bisetPartnerToSuggest([anterior, { id: 'b', method: 'Bi-set' }], 'b')).toBe(anterior);
    });

    it('não sugere quando já estão agrupados', () => {
        const lista = [{ ...anterior, groupId: 'g' }, { id: 'b', method: 'Bi-set', groupId: 'g' }];
        expect(bisetPartnerToSuggest(lista, 'b')).toBeNull();
    });

    it('não sugere para o primeiro da lista, para outro método ou id desconhecido', () => {
        expect(bisetPartnerToSuggest([{ id: 'b', method: 'Bi-set' }], 'b')).toBeNull();
        expect(bisetPartnerToSuggest([anterior, { id: 'b', method: 'Convencional' }], 'b')).toBeNull();
        expect(bisetPartnerToSuggest([anterior], 'zzz')).toBeNull();
    });
});
