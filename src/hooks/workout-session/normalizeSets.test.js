import { describe, expect, it } from 'vitest';
import { parseDropSegments, seedCascadingDrops, mapTemplateExercises } from './normalizeSets';

describe('parseDropSegments', () => {
    it('divide "15+12" em dois segmentos', () => {
        expect(parseDropSegments('15+12')).toEqual(['15', '12']);
    });

    it('divide "10+12+15" em três segmentos', () => {
        expect(parseDropSegments('10+12+15')).toEqual(['10', '12', '15']);
    });

    it('tolera espaços ao redor do "+"', () => {
        expect(parseDropSegments('15 + 12')).toEqual(['15', '12']);
    });

    it('retorna null sem "+" (segmento único)', () => {
        expect(parseDropSegments('12')).toBeNull();
    });

    it('retorna null para faixa "8-12"', () => {
        expect(parseDropSegments('8-12')).toBeNull();
    });

    it('retorna null para entradas vazias/não-string', () => {
        expect(parseDropSegments('')).toBeNull();
        expect(parseDropSegments(null)).toBeNull();
        expect(parseDropSegments(undefined)).toBeNull();
    });
});

describe('seedCascadingDrops', () => {
    it('semeia Drop-set "15+12" com queda de 20% sugerida na redução', () => {
        const drops = seedCascadingDrops('Drop-set', '15+12', '50', 'total');
        expect(drops).toHaveLength(2);
        expect(drops[0]).toMatchObject({ weight: '50', reps: '15', weightMode: 'total', baseWeight: null });
        // 50 * 0.8 = 40
        expect(drops[1]).toMatchObject({ weight: '40', reps: '12', weightMode: 'total', baseWeight: null });
        expect(drops[0].id).toBeTruthy();
        expect(drops[1].id).toBeTruthy();
        expect(drops[0].id).not.toBe(drops[1].id);
    });

    it('arredonda a queda ao passo de 2,5 kg', () => {
        const drops = seedCascadingDrops('Drop-set', '15+12', '40', 'total');
        // 40 * 0.8 = 32 -> arredonda p/ 32.5
        expect(drops[1].weight).toBe('32.5');
    });

    it('encadeia a queda a cada redução para "10+12+15"', () => {
        const drops = seedCascadingDrops('Drop-set', '10+12+15', '100', 'total');
        expect(drops.map(d => d.reps)).toEqual(['10', '12', '15']);
        // 100 -> 80 -> 100*0.64=64 (múltiplo de 2,5)
        expect(drops.map(d => d.weight)).toEqual(['100', '80', '65']);
    });

    it('deixa reduções em branco quando não há carga-base', () => {
        const drops = seedCascadingDrops('Drop-set', '10+12+15', '', 'total');
        expect(drops.map(d => d.reps)).toEqual(['10', '12', '15']);
        expect(drops.map(d => d.weight)).toEqual(['', '', '']);
    });

    it('semeia Rest-Pause e Cluster set', () => {
        expect(seedCascadingDrops('Rest-Pause', '10+8', '30', 'total')).toHaveLength(2);
        expect(seedCascadingDrops('Cluster set', '5+5+5', '60', 'total')).toHaveLength(3);
    });

    it('não semeia métodos fora do escopo', () => {
        expect(seedCascadingDrops('Convencional', '15+12', '40', 'total')).toBeNull();
        expect(seedCascadingDrops('Bi-set', '15+12', '40', 'total')).toBeNull();
    });

    it('não semeia Drop-set sem "+" nas reps', () => {
        expect(seedCascadingDrops('Drop-set', '12', '40', 'total')).toBeNull();
    });

    it('propaga o weightMode informado', () => {
        const drops = seedCascadingDrops('Drop-set', '15+12', '40', 'per_side');
        expect(drops[0].weightMode).toBe('per_side');
        expect(drops[1].weightMode).toBe('per_side');
    });
});

describe('mapTemplateExercises — drop-set', () => {
    const tmpl = (ex) => ({ exercises: [ex] });

    it('expande Drop-set "15+12" já na 1ª série, com carga-alvo e queda sugerida', () => {
        const [ex] = mapTemplateExercises(tmpl({
            name: 'Cadeira Extensora', method: 'Drop-set', sets: '4', reps: '15+12', targetWeight: '50'
        }));
        ex.sets.forEach(set => {
            expect(set.drops).toHaveLength(2);
            expect(set.drops[0]).toMatchObject({ reps: '15', weight: '50' });
            expect(set.drops[1]).toMatchObject({ reps: '12', weight: '40' });
        });
    });

    it('expande "10+12+15" em três reduções', () => {
        const [ex] = mapTemplateExercises(tmpl({
            name: 'Rosca', method: 'Drop-set', sets: '1', reps: '10+12+15'
        }));
        expect(ex.sets[0].drops.map(d => d.reps)).toEqual(['10', '12', '15']);
    });

    it('mantém linha única (drops null) para Drop-set sem "+"', () => {
        const [ex] = mapTemplateExercises(tmpl({
            name: 'Supino', method: 'Drop-set', sets: '3', reps: '12'
        }));
        ex.sets.forEach(set => expect(set.drops).toBeNull());
    });

    it('não expande métodos fora do escopo (Convencional, Bi-set)', () => {
        const [conv] = mapTemplateExercises(tmpl({
            name: 'Supino', method: 'Convencional', sets: '3', reps: '15+12'
        }));
        conv.sets.forEach(set => expect(set.drops).toBeNull());
        const [bi] = mapTemplateExercises(tmpl({
            name: 'Bi', method: 'Bi-set', sets: '3', reps: '15+12'
        }));
        bi.sets.forEach(set => expect(set.drops).toBeNull());
    });

    it('preserva drops do histórico sem re-semear', () => {
        const last = [{
            name: 'Cadeira Extensora',
            sets: [{ weight: '45', reps: '15', drops: [
                { id: 'a', weight: '45', reps: '15' },
                { id: 'b', weight: '30', reps: '12' }
            ] }]
        }];
        const [ex] = mapTemplateExercises(tmpl({
            name: 'Cadeira Extensora', method: 'Drop-set', sets: '2', reps: '15+12', targetWeight: '50'
        }), last);
        // 1ª série herda os drops registrados (peso reduzido preservado na 2ª redução).
        expect(ex.sets[0].drops[1]).toMatchObject({ weight: '30', reps: '12' });
    });

    it('expande Rest-Pause e Cluster set', () => {
        const [rp] = mapTemplateExercises(tmpl({
            name: 'RP', method: 'Rest-Pause', sets: '1', reps: '10+8'
        }));
        expect(rp.sets[0].drops).toHaveLength(2);
        const [cs] = mapTemplateExercises(tmpl({
            name: 'CS', method: 'Cluster set', sets: '1', reps: '5+5+5'
        }));
        expect(cs.sets[0].drops).toHaveLength(3);
    });
});
