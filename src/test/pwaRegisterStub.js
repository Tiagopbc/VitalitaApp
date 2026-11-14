// Substituto de `virtual:pwa-register/react` nos testes (alias no
// vitest.config.js). O módulo real só existe no build, criado pelo
// vite-plugin-pwa; sem o alias o Vite nem resolve o import, e o coverage
// excluía o PwaUpdatePrompt com PARSE_ERROR. Os testes que precisam de outro
// comportamento usam vi.mock por cima deste.
export function useRegisterSW() {
    return {
        needRefresh: [false, () => {}],
        offlineReady: [false, () => {}],
        updateServiceWorker: () => Promise.resolve()
    };
}
