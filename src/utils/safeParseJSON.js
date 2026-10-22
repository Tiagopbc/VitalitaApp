/**
 * safeParseJSON.js
 *
 * `JSON.parse` que nunca lança. Usado pelos painéis de diagnóstico ao ler log
 * do `localStorage`, onde o conteúdo pode ter sido truncado por quota, escrito
 * por uma versão anterior do app ou editado à mão.
 *
 * O fallback também cobre o `null` que `JSON.parse('null')` devolve sem erro.
 */
export function safeParseJSON(bruto, fallback) {
    try {
        return JSON.parse(bruto) ?? fallback;
    } catch {
        return fallback;
    }
}
