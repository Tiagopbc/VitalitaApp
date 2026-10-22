/**
 * firestoreDate.js
 *
 * Conversão de instante vindo do Firestore para `Date` ou milissegundos.
 *
 * O mesmo campo chega em quatro formatos conforme a origem: `Timestamp` do SDK
 * quando vem do servidor, `{ seconds }` quando vem de um snapshot serializado
 * no `localStorage`, string ISO quando vem do `completedAtClient`, e `Date`
 * quando já passou por outra conversão. Antes estas regras viviam copiadas em
 * sete arquivos, cada cópia com uma guarda de NaN diferente.
 *
 * O que NÃO mora aqui, de propósito: a escolha de *qual* campo ler
 * (`completedAt || completedAtClient || ...`). Isso é regra de negócio de cada
 * tela — o histórico e as conquistas ordenam por critérios próprios — e não
 * duplicação a eliminar.
 */

/** Data só vale se for Date de verdade e não for "Invalid Date". */
function dataValida(valor) {
    return valor instanceof Date && !Number.isNaN(valor.getTime());
}

/**
 * Converte para `Date`, ou `null` quando não há instante utilizável.
 *
 * @param {unknown} bruto Timestamp do Firestore, `{ seconds }`, Date, string ou número.
 * @returns {Date|null}
 */
export function toDate(bruto) {
    if (!bruto) return null;

    if (bruto instanceof Date) {
        return dataValida(bruto) ? new Date(bruto.getTime()) : null;
    }

    if (typeof bruto === 'string' || typeof bruto === 'number') {
        const convertida = new Date(bruto);
        return dataValida(convertida) ? convertida : null;
    }

    if (typeof bruto.toDate === 'function') {
        let convertida;
        try {
            convertida = bruto.toDate();
        } catch {
            // Timestamp corrompido não deve derrubar a tela que só queria uma data.
            return null;
        }
        return dataValida(convertida) ? new Date(convertida.getTime()) : null;
    }

    if (typeof bruto.seconds === 'number') {
        const convertida = new Date(bruto.seconds * 1000);
        return dataValida(convertida) ? convertida : null;
    }

    return null;
}

/**
 * Converte para milissegundos, ou `0` quando não há instante utilizável.
 *
 * O `0` existe porque quem chama isto está ordenando lista: devolver `null` ali
 * obrigaria cada chamador a tratar o caso, e uma sessão sem data deve ir para o
 * fim da ordenação, não quebrar a comparação.
 *
 * @param {unknown} bruto
 * @returns {number}
 */
export function toMillis(bruto) {
    if (!bruto) return 0;

    // Atalho do SDK: evita construir uma Date intermediária.
    if (typeof bruto.toMillis === 'function') {
        try {
            const millis = bruto.toMillis();
            if (typeof millis === 'number' && Number.isFinite(millis)) return millis;
        } catch {
            // Cai no caminho normal abaixo.
        }
    }

    const data = toDate(bruto);
    return data ? data.getTime() : 0;
}
