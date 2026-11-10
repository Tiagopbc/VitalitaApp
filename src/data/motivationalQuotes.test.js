import { describe, expect, it } from 'vitest';
import { MOTIVATIONAL_QUOTES, getDailyQuote } from './motivationalQuotes';

describe('getDailyQuote', () => {
    it('devolve a mesma frase em qualquer hora do mesmo dia', () => {
        const manha = getDailyQuote(new Date(2026, 10, 10, 7, 0));
        const noite = getDailyQuote(new Date(2026, 10, 10, 23, 30));
        expect(manha).toBe(noite);
        expect(MOTIVATIONAL_QUOTES).toContain(manha);
    });

    it('troca de frase no dia seguinte', () => {
        expect(getDailyQuote(new Date(2026, 10, 10, 12))).not.toBe(getDailyQuote(new Date(2026, 10, 11, 12)));
    });

    it('usa o dia do ano como índice, dando a volta na lista', () => {
        // 1º de janeiro é o dia 1 do ano.
        expect(getDailyQuote(new Date(2026, 0, 1, 12))).toBe(MOTIVATIONAL_QUOTES[1 % MOTIVATIONAL_QUOTES.length]);
    });
});
