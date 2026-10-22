/**
 * waitWithTimeout.js
 *
 * Espera uma promessa, mas desiste depois de um teto.
 *
 * Usado antes de desenhar os cards de compartilhamento em canvas, onde se
 * aguarda `document.fonts.ready` e o carregamento das imagens de fundo. Os dois
 * podem não resolver nunca — fonte bloqueada, imagem fora do cache, aba em
 * segundo plano — e sem teto o botão de compartilhar ficaria girando para
 * sempre.
 *
 * Por isso a promessa rejeitada é engolida: fonte que não carrega vira card com
 * a fonte de sistema, que é melhor do que card nenhum.
 */

const TETO_PADRAO_MS = 2000;

/**
 * @param {Promise<unknown>} promessa O que esperar.
 * @param {number} [tetoMs=2000] Quanto esperar antes de seguir mesmo assim.
 * @returns {Promise<void>} Sempre resolve, nunca rejeita, e não devolve valor.
 */
export async function waitWithTimeout(promessa, tetoMs = TETO_PADRAO_MS) {
    try {
        await Promise.race([
            promessa,
            new Promise(resolve => setTimeout(resolve, tetoMs))
        ]);
    } catch {
        // Falha de fonte ou imagem não impede o desenho do card.
    }
}
