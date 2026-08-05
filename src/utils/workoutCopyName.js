/**
 * Nome das fichas duplicadas.
 *
 * O selo "CÓPIA" do card é derivado do nome, não de um campo no documento:
 * campo novo no topo de `workout_templates` exigiria mudar as `firestore.rules`
 * e o cenário correspondente em `tests/security/firestore.rules.test.js`, e o
 * sufixo já é a fonte da verdade que o usuário edita quando renomeia.
 */

const COPY_SUFFIX = /\s*\(cópia(?:\s+(\d+))?\)\s*$/i;

// Mesmo collator de `workoutTemplateOrder.js`: comparar "(Cópia)" com "(copia)"
// como iguais evita gerar dois nomes que o usuário lê como o mesmo.
const nameCollator = new Intl.Collator('pt-BR', {
    numeric: true,
    sensitivity: 'base'
});

/**
 * Remove um `(Cópia)` / `(Cópia N)` final. Só um: duplicar uma cópia deve virar
 * "(Cópia 2)", nunca "(Cópia) (Cópia)".
 */
export function stripCopySuffix(name) {
    return String(name || '').replace(COPY_SUFFIX, '').trim();
}

/** Indica se o nome foi gerado por uma duplicação (alimenta o selo do card). */
export function isCopyName(name) {
    return COPY_SUFFIX.test(String(name || '').trim());
}

/**
 * Primeiro nome livre da sequência "<base> (Cópia)", "<base> (Cópia 2)"...
 * Preenche lacunas: com "(Cópia)" e "(Cópia 3)" ocupados, devolve "(Cópia 2)".
 *
 * @param {string} name Nome do treino de origem (pode já ser uma cópia).
 * @param {string[]} existingNames Nomes já usados nas fichas do usuário.
 */
export function buildCopyName(name, existingNames = []) {
    const trimmed = String(name || '').trim();
    const base = stripCopySuffix(trimmed) || trimmed;
    const taken = existingNames.map(existing => String(existing || '').trim());
    const isTaken = candidate => taken.some(existing => nameCollator.compare(existing, candidate) === 0);

    for (let counter = 1; ; counter += 1) {
        const candidate = counter === 1
            ? `${base} (Cópia)`
            : `${base} (Cópia ${counter})`;

        if (!isTaken(candidate)) return candidate;
    }
}
