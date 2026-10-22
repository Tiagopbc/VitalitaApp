import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitWithTimeout } from './waitWithTimeout';

afterEach(() => {
    vi.useRealTimers();
});

describe('waitWithTimeout', () => {
    it('resolve assim que a promessa resolve, sem esperar o teto', async () => {
        vi.useFakeTimers();
        let terminou = false;
        const tarefa = waitWithTimeout(Promise.resolve('pronto'), 2000).then(() => {
            terminou = true;
        });
        await vi.advanceTimersByTimeAsync(0);
        await tarefa;
        expect(terminou).toBe(true);
    });

    it('desiste no teto quando a promessa nunca resolve', async () => {
        vi.useFakeTimers();
        let terminou = false;
        const tarefa = waitWithTimeout(new Promise(() => {}), 2000).then(() => {
            terminou = true;
        });

        await vi.advanceTimersByTimeAsync(1999);
        expect(terminou).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await tarefa;
        expect(terminou).toBe(true);
    });

    it('engole a rejeição em vez de propagar', async () => {
        await expect(
            waitWithTimeout(Promise.reject(new Error('fonte não carregou')), 2000)
        ).resolves.toBeUndefined();
    });

    it('usa 2000ms como teto padrão', async () => {
        vi.useFakeTimers();
        let terminou = false;
        const tarefa = waitWithTimeout(new Promise(() => {})).then(() => {
            terminou = true;
        });

        await vi.advanceTimersByTimeAsync(1999);
        expect(terminou).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await tarefa;
        expect(terminou).toBe(true);
    });

    it('não devolve o valor da promessa — só serve para esperar', async () => {
        await expect(waitWithTimeout(Promise.resolve('valor'), 2000)).resolves.toBeUndefined();
    });
});
