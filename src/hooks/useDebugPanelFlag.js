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
/**
 * Chaves usadas por um painel antes de ele passar a usar este hook.
 *
 * Só serve para não desligar o painel de quem já estava com ele aberto: no PWA
 * instalado não há barra de endereço para redigitar `?debug=push`, que é
 * justamente o motivo de a flag ser persistente. Pode sumir quando não houver
 * mais instalação antiga em circulação.
 */
const CHAVES_LEGADAS = {
    push: 'vitalita:pushDebug'
};

export function useDebugPanelFlag(name) {
    const storageKey = `vitalita:debug:${name}`;
    const chaveLegada = CHAVES_LEGADAS[name];

    const limpar = () => {
        localStorage.removeItem(storageKey);
        if (chaveLegada) localStorage.removeItem(chaveLegada);
    };

    const read = () => {
        if (typeof window === 'undefined') return false;
        try {
            const param = new URLSearchParams(window.location.search).get('debug');
            if (param === name) {
                localStorage.setItem(storageKey, '1');
                return true;
            }
            if (param === 'off') {
                limpar();
                return false;
            }
            if (localStorage.getItem(storageKey) === '1') return true;

            // Migra de uma vez: lê a chave antiga, grava na nova e apaga a velha.
            if (chaveLegada && localStorage.getItem(chaveLegada) === '1') {
                localStorage.setItem(storageKey, '1');
                localStorage.removeItem(chaveLegada);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const [enabled, setEnabled] = useState(read);

    const disable = () => {
        try {
            limpar();
        } catch {
            // Sem storage (modo privado/quota): fechar em memória já basta.
        }
        setEnabled(false);
    };

    return [enabled, disable];
}
