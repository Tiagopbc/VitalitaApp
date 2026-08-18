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

function setUserAgent(ua, { platform = '', maxTouchPoints = 0 } = {}) {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, get: () => ua });
    Object.defineProperty(window.navigator, 'platform', { configurable: true, get: () => platform });
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, get: () => maxTouchPoints });
}

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130';

describe('windowConfig', () => {
    beforeEach(() => {
        localStorage.clear();
        setStandalone(true);
        setIosStandalone(false);
        setUserAgent(IPHONE_UA);
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

    /*
     * `(display-mode: standalone)` casa também num PWA instalado de Android,
     * mas as três tags assinadas são exclusivas do iOS e o passo a passo fala
     * de Safari e tela de início. Sem esta porta, um usuário de Android
     * receberia instruções de iPhone para refazer uma instalação que o Chrome
     * atualiza sozinho.
     */
    it('nunca acusa num PWA instalado que não seja iOS', () => {
        setUserAgent(ANDROID_UA);
        checkWindowConfig();
        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(false);
    });

    // O iPadOS moderno se apresenta como Mac; o toque é a pista que sobra.
    it('trata iPad que se apresenta como Mac com toque como iOS', () => {
        setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', {
            platform: 'MacIntel',
            maxTouchPoints: 5
        });
        checkWindowConfig();
        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(true);
    });

    it('não confunde um Mac de verdade com iPad', () => {
        setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', {
            platform: 'MacIntel',
            maxTouchPoints: 0
        });
        checkWindowConfig();
        setBuildSignature('bbbb2222');

        expect(checkWindowConfig().needsReinstall).toBe(false);
    });
});
