import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Inicia o Sentry de verdade (sem mock) para medir o que o SDK aplica, e não só
// o que o app passa: no Sentry 11 o `sendDefaultPii` deixou de existir e passou a
// ser ignorado em silêncio, o que ligaria a dedução de IP pelo servidor. Este
// teste pega esse tipo de mudança no próximo major.
const DSN_FALSO = 'https://chavepublica@o0.ingest.sentry.io/0';

async function iniciarSentry() {
    const { initializeSentry } = await import('./sentry');
    const Sentry = await import('@sentry/react');
    expect(initializeSentry()).toBe(true);
    return Sentry.getClient();
}

describe('sentry', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_SENTRY_DSN', DSN_FALSO);
        vi.stubEnv('VITE_SENTRY_TRACING', 'false');
    });

    afterEach(async () => {
        const Sentry = await import('@sentry/react');
        await Sentry.close(0);
        vi.unstubAllEnvs();
    });

    it('não pede ao servidor para deduzir o IP de quem usa o app', async () => {
        const client = await iniciarSentry();

        expect(client.getDataCollectionOptions().userInfo).toBe(false);
        expect(client.getOptions()._metadata.sdk.settings.infer_ip).toBe('never');
    });

    it('não coleta cookies, cabeçalhos, corpo de requisição nem parâmetros de URL', async () => {
        const client = await iniciarSentry();
        const coleta = client.getDataCollectionOptions();

        expect(coleta.cookies).toBe(false);
        expect(coleta.httpHeaders).toEqual({ request: false, response: false });
        expect(coleta.httpBodies).toEqual([]);
        expect(coleta.urlQueryParams).toBe(false);
    });

    it('não inicia fora de produção', async () => {
        vi.stubEnv('PROD', false);
        const { initializeSentry } = await import('./sentry');

        expect(initializeSentry()).toBe(false);
    });
});
