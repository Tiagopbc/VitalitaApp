/**
 * StatusBarCap.jsx
 * Tampa opaca sobre a área da status bar.
 *
 * O app usa `apple-mobile-web-app-status-bar-style: black-translucent`, então em
 * tela cheia o conteúdo corre por baixo do relógio — é o que permite a barra de
 * aviso pintar a cor dela até o pixel 0. O preço é que o iOS **esfumaça** o que
 * entra nessa faixa: rolar a Home fazia a saudação borrar ao subir, enquanto a
 * linha logo abaixo ficava nítida.
 *
 * Esta tampa esconde o conteúdo antes que ele fique visível ali. Como é código,
 * chega pela atualização normal do service worker — diferente da meta tag, que o
 * iOS lê ao montar a janela e exigia matar o app ou reinstalar o atalho.
 *
 * **O `z-index` 45 é o ponto todo do componente.** Ele precisa ficar:
 *   - acima do conteúdo de página e dos headers grudentos (30 no TrainerDashboard,
 *     40 no HistoryPage e no FocusModeNav), que é o que esconde o borrão;
 *   - abaixo de `ExecutionTopBar` (z-50) e `TopBanner` (z-10000), os dois que
 *     legitimamente pintam aquela faixa.
 * Subir esse número apaga a barra verde full-bleed; baixar devolve o esfumaçado.
 *
 * Com `env(safe-area-inset-top)` valendo 0 — desktop, aba do Safari — a altura é
 * zero e o componente não afeta nada.
 */
export function StatusBarCap() {
    return (
        // Tudo em classe, e não em `style` inline: o jsdom descarta `env()` do
        // CSSOM, então inline não seria testável. `bg-slate-950` é o `#020617`
        // do `body` em index.css — a tampa não deve se anunciar como faixa
        // própria quando não há nada rolando por baixo.
        <div
            aria-hidden="true"
            data-status-bar-cap=""
            className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-slate-950 pointer-events-none"
        />
    );
}
