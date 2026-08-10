import { useState } from 'react';

/**
 * Flag "grudenta" dos painéis de diagnóstico: `?debug=<nome>` liga e o estado
 * persiste em `localStorage`; `?debug=off` desliga.
 *
 * A persistência não é conveniência — é requisito. O PWA instalado na tela de
 * início abre sem barra de endereço, então não há como redigitar o parâmetro; a
 * flag também precisa sobreviver aos redirects de auth (ex.: /login) e à
 * navegação entre rotas.
 *
 * Cada painel guarda a própria chave, então `?debug=off` desliga todos os que
 * estiverem montados.
 *
 * @param {string} name Valor esperado em `?debug=` (ex.: 'appcheck').
 * @returns {[boolean, () => void]} Estado e função para desligar.
 */
export function useDebugPanelFlag(name) {
    const storageKey = `vitalita:debug:${name}`;

    const read = () => {
        if (typeof window === 'undefined') return false;
        try {
            const param = new URLSearchParams(window.location.search).get('debug');
            if (param === name) {
                localStorage.setItem(storageKey, '1');
                return true;
            }
            if (param === 'off') {
                localStorage.removeItem(storageKey);
                return false;
            }
            return localStorage.getItem(storageKey) === '1';
        } catch {
            return false;
        }
    };

    const [enabled, setEnabled] = useState(read);

    const disable = () => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Sem storage (modo privado/quota): fechar em memória já basta.
        }
        setEnabled(false);
    };

    return [enabled, disable];
}
