/**
 * windowConfig.js
 * Detecta quando a janela do app instalado ficou para trás em relação ao build
 * atual — o único caso em que "Atualizar Agora" não basta e é preciso remover
 * o ícone da tela de início e adicionar de novo.
 *
 * Por que existe: o iOS lê três configurações ao MONTAR a janela do app
 * instalado — estilo da status bar, ícone e nome do atalho. Elas não viajam
 * pelo service worker. Em 16/08/2026 isso custou uma rodada inteira de
 * diagnóstico: a tag mudou, o app atualizou normalmente, e nada aconteceu até
 * reinstalar. O comentário longo do index.html conta a história.
 *
 * O limite honesto desta detecção: o iOS não expõe o que leu ao montar a
 * janela, então não dá para inspecionar a instalação. O que dá é registrar a
 * assinatura vigente na primeira execução e comparar daí em diante — ou seja,
 * a checagem passa a valer da PRÓXIMA mudança em diante, nunca
 * retroativamente. Quem já estiver com uma janela desatualizada hoje não será
 * avisado; quem estiver na próxima vez, sim.
 */
import { safeGetItem, safeSetItem } from './storage';

const STORAGE_KEY = 'vitalita:windowConfigSignature';

/** Assinatura que este build espera (injetada pelo vite.config.js). */
export function getBuildSignature() {
    const signature = import.meta.env.VITE_WINDOW_CONFIG_SIGNATURE;
    return typeof signature === 'string' && signature ? signature : null;
}

/**
 * Só faz sentido num app instalado. No navegador a "janela" é a aba, e
 * qualquer mudança dessas pega sozinha no carregamento seguinte.
 */
export function isStandaloneWindow() {
    if (typeof window === 'undefined') return false;
    return window.navigator?.standalone === true
        || (typeof window.matchMedia === 'function'
            && window.matchMedia('(display-mode: standalone)').matches);
}

/**
 * Diz se a instalação precisa ser refeita para as configurações de janela
 * deste build valerem.
 *
 * Registra a assinatura atual quando ainda não há nenhuma guardada — é esse
 * registro que torna a comparação possível na próxima mudança.
 */
export function checkWindowConfig() {
    const current = getBuildSignature();
    if (!current || !isStandaloneWindow()) {
        return { needsReinstall: false, signature: current };
    }

    const installed = safeGetItem(STORAGE_KEY);
    if (!installed) {
        safeSetItem(STORAGE_KEY, current);
        return { needsReinstall: false, signature: current };
    }

    return { needsReinstall: installed !== current, signature: current };
}

/**
 * Marca a janela atual como em dia. Chamado quando o usuário confirma que
 * reinstalou — o iOS não avisa que isso aconteceu, e a reinstalação nem sempre
 * limpa o armazenamento da origem, então a confirmação dele é o único sinal
 * confiável de que o aviso já cumpriu seu papel.
 */
export function acknowledgeWindowConfig() {
    const current = getBuildSignature();
    if (!current) return;
    safeSetItem(STORAGE_KEY, current);
}
