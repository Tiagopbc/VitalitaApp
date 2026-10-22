import { describe, it, expect } from 'vitest';
import { toDate, toMillis } from './firestoreDate';

/** Imita um Timestamp do Firestore sem depender do SDK. */
function timestampFake(date) {
    return {
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => new Date(date.getTime()),
        toMillis: () => date.getTime()
    };
}

const referencia = new Date('2026-03-15T10:30:00.000Z');

describe('toDate', () => {
    it('converte Timestamp do Firestore', () => {
        expect(toDate(timestampFake(referencia))).toEqual(referencia);
    });

    it('devolve a própria Date quando já é Date', () => {
        const d = new Date(referencia);
        expect(toDate(d)).toEqual(referencia);
    });

    it('converte objeto com seconds, sem toDate', () => {
        expect(toDate({ seconds: Math.floor(referencia.getTime() / 1000) })).toEqual(
            new Date(Math.floor(referencia.getTime() / 1000) * 1000)
        );
    });

    it('converte string ISO', () => {
        expect(toDate(referencia.toISOString())).toEqual(referencia);
    });

    it('converte número em milissegundos', () => {
        expect(toDate(referencia.getTime())).toEqual(referencia);
    });

    it('devolve null para ausência de valor', () => {
        for (const vazio of [null, undefined, '', 0, false, NaN]) {
            expect(toDate(vazio)).toBeNull();
        }
    });

    it('devolve null para Date inválida', () => {
        expect(toDate(new Date('nada disso'))).toBeNull();
    });

    it('devolve null para string que não é data', () => {
        expect(toDate('nada disso')).toBeNull();
    });

    it('devolve null quando o toDate do Timestamp devolve lixo', () => {
        expect(toDate({ toDate: () => new Date('inválida') })).toBeNull();
        expect(toDate({ toDate: () => null })).toBeNull();
    });

    it('devolve null para tipo sem conversão possível', () => {
        expect(toDate({ qualquer: 'coisa' })).toBeNull();
        expect(toDate([1, 2, 3])).toBeNull();
    });

    it('não devolve a mesma referência de objeto do Timestamp', () => {
        const ts = timestampFake(referencia);
        const convertida = toDate(ts);
        convertida.setFullYear(1999);
        expect(ts.toDate().getFullYear()).toBe(2026);
    });
});

describe('toMillis', () => {
    it('usa o atalho toMillis do Firestore quando existe', () => {
        expect(toMillis(timestampFake(referencia))).toBe(referencia.getTime());
    });

    it('converte Timestamp que só tem toDate', () => {
        expect(toMillis({ toDate: () => new Date(referencia) })).toBe(referencia.getTime());
    });

    it('converte Date, string e número', () => {
        expect(toMillis(referencia)).toBe(referencia.getTime());
        expect(toMillis(referencia.toISOString())).toBe(referencia.getTime());
        expect(toMillis(referencia.getTime())).toBe(referencia.getTime());
    });

    it('converte objeto com seconds', () => {
        const segundos = Math.floor(referencia.getTime() / 1000);
        expect(toMillis({ seconds: segundos })).toBe(segundos * 1000);
    });

    it('devolve 0 para valor ausente ou inválido', () => {
        for (const ruim of [null, undefined, '', 'nada disso', new Date('x'), { a: 1 }, NaN, Infinity]) {
            expect(toMillis(ruim)).toBe(0);
        }
    });

    it('ordena sessões de tipos misturados de forma consistente', () => {
        const antiga = new Date('2026-01-01T00:00:00.000Z');
        const meio = new Date('2026-06-01T00:00:00.000Z');
        const nova = new Date('2026-12-01T00:00:00.000Z');

        const brutas = [
            { quando: nova.toISOString() },
            { quando: timestampFake(antiga) },
            { quando: meio.getTime() }
        ];
        const ordenadas = [...brutas].sort((a, b) => toMillis(b.quando) - toMillis(a.quando));

        expect(ordenadas.map(s => toMillis(s.quando))).toEqual([
            nova.getTime(),
            meio.getTime(),
            antiga.getTime()
        ]);
    });
});
