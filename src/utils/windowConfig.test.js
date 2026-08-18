import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkWindowConfig, acknowledgeWindowConfig, isStandaloneWindow, getBuildSignature } from './windowConfig';

const STORAGE_KEY = 'vitalita:windowConfigSignature';

/*
 * O app instalado é o único contexto em que a janela é montada uma vez só.
 * O jsdom não implementa `matchMedia` nem `navigator.standalone`, então aqui
 * eles são definidos, não espionados.
 */
function setStandalone(standalone) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query) => ({
            matches: standalone && query === '(display-mode: standalone)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        })
    });
}

function setIosStandalone(standalone) {
    Object.defineProperty(window.navigator, 'standalone', {
        configurable: true,
        get: () => standalone
    });
}

function setBuildSignature(signature) {
    vi.stubEnv('VITE_WINDOW_CONFIG_SIGNATURE', signature);
}

describe('windowConfig', () => {
    beforeEach(() => {
        localStorage.clear();
        setStandalone(true);
        setIosStandalone(false);
        setBuildSignature('aaaa1111');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    // Não dá para perguntar ao iOS o que ele leu ao montar a janela, então a
    // primeira execução adota a assinatura vigente. É esse registro que torna
    // a comparação possível na mudança seguinte.
    it('registra a assinatura atual na primeira execução, sem acusar nada', () => {
        expect(checkWindowConfig()).toMatchObject({ needsReinstall: false });
        expect(localStorage.getItem(STORAGE_KEY)).toBe('aaaa1111');
    });

    it('não acusa nada enquanto a assinatura não muda', () => {
        checkWindowConfig();

        expect(checkWindowConfig().needsReinstall).toBe(false);
    });

    it('acusa quando o build traz uma configuração de janela diferente', () => {
        checkWindowConfig();

        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(true);
    });

    // O aviso precisa sobreviver a recarregamentos: reinstalar é uma ação
    // fora do app, e o usuário pode fechá-lo antes de fazer.
    it('continua acusando em execuções seguintes até ser confirmado', () => {
        checkWindowConfig();
        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(true);
        expect(checkWindowConfig().needsReinstall).toBe(true);
    });

    it('para de acusar depois que o usuário confirma a reinstalação', () => {
        checkWindowConfig();
        setBuildSignature('bbbb2222');
        expect(checkWindowConfig().needsReinstall).toBe(true);

        acknowledgeWindowConfig();

        expect(checkWindowConfig().needsReinstall).toBe(false);
    });

    // No navegador a "janela" é a aba: qualquer uma dessas configurações pega
    // sozinha no carregamento seguinte, então avisar seria ruído.
    it('nunca acusa fora do app instalado', () => {
        setStandalone(false);
        checkWindowConfig();
        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(false);
    });

    // Se a extração no build falhar, é melhor não avisar do que avisar errado.
    it('se desliga quando o build não trouxe assinatura', () => {
        setBuildSignature('');

        expect(getBuildSignature()).toBeNull();
        expect(checkWindowConfig().needsReinstall).toBe(false);
    });

    it('reconhece o standalone do iOS via navigator.standalone', () => {
        setStandalone(false);
        setIosStandalone(true);

        expect(isStandaloneWindow()).toBe(true);
    });
});
