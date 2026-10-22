/**
 * ids.js
 *
 * Identificador curto para itens que só existem no cliente: séries de um
 * exercício dentro de uma sessão em andamento, usadas como `key` do React e
 * para casar a série editada com a salva.
 *
 * Não serve para ID de documento do Firestore — ali quem gera é o SDK, ou o
 * próprio valor é o dado (o código do convite em `trainer_invites`).
 */

/** 9 caracteres de [a-z0-9], o suficiente para itens de uma única sessão. */
const COMPRIMENTO = 9;

/**
 * @returns {string} Identificador de 9 caracteres alfanuméricos minúsculos.
 */
export function generateId() {
    // `padEnd` cobre o sorteio raro que cai perto de zero e produz uma
    // representação curta demais para fatiar.
    return Math.random()
        .toString(36)
        .slice(2, 2 + COMPRIMENTO)
        .padEnd(COMPRIMENTO, '0');
}
