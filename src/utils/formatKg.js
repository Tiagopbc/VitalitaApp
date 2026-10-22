/**
 * formatKg.js
 *
 * Número de carga no formato brasileiro, sem a unidade: "22,5", não "22,5 kg".
 *
 * A unidade fica com quem chama de propósito — numa frase ela entra no meio do
 * texto ("Tente 82,5 kg"), e num número grande da tela ela costuma aparecer com
 * estilo próprio ao lado do valor.
 */
export function formatKg(valor) {
    return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
