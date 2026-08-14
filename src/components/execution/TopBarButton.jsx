import React from 'react';

/**
 * Botão da barra superior de execução. Ações principais mantêm rótulo;
 * ações de navegação/destrutivas podem ser icon-only (rótulo vira aria-label)
 * para a barra caber sem rolagem.
 */
export const TopBarButton = ({ icon, label, variant = 'default', onClick, active, iconOnly = false, prominence = 'compact' }) => {
    const sizeStyles = iconOnly
        ? "p-2 min-w-9 min-h-9 justify-center"
        : prominence === 'large'
            ? "px-3 py-1.5 text-[11px] tracking-wide min-h-8"
            : "px-2.5 py-2 text-[10px] tracking-tight min-h-9";

    // Sem `backdrop-blur-md`, que esteve aqui de 21/01/2026 a 14/08/2026: estes
    // botões vivem dentro do painel da `ExecutionTopBar`, que já aplica
    // `backdrop-blur-xl`. Desfocar o resultado já desfocado do pai não muda nada
    // — o painel é uma superfície chapada, `slate-950` é a mesma cor do fundo da
    // página — e `backdrop-filter` aninhado desenha um halo nas bordas
    // arredondadas no WebKit do iPhone. Não devolva a classe.
    const baseStyles = `flex items-center gap-1 rounded-lg font-bold uppercase transition-all duration-300 border whitespace-nowrap ${sizeStyles}`;
    const iconSize = iconOnly ? 18 : prominence === 'large' ? 15 : 14;

    const variants = {
        primary: "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        // O inativo era `bg-slate-900/60 text-slate-300 border-white/10`: cinza
        // sobre quase-preto, com borda a 10% de branco. Ao lado do card de
        // execução, cheio de ciano e branco, lia como desabilitado.
        //
        // Clarear o inativo aproxima ele do ativo, que era `bg-slate-800`
        // sólido — os dois estados quase se encostavam e o toggle deixava de
        // se anunciar. Por isso o ativo passa a ser ciano, que é a cor que o
        // app já usa para "ligado" (ver o `primary` logo acima), em vez de
        // continuar disputando o mesmo cinza com o inativo.
        //
        // O ativo se marca por contorno, não por sombra: `shadow-cyan-500/20`
        // desenhava um halo em volta da pílula. Borda em opacidade cheia e
        // preenchimento um pouco mais forte dão o mesmo recado sem espalhar luz.
        // A espessura fica em 1px — `border-2` só no ativo empurraria o layout
        // a cada toque.
        default: active
            ? "bg-cyan-500/25 text-cyan-200 border-cyan-400"
            : "bg-slate-800/70 text-slate-100 border-white/25 hover:bg-slate-700/80 hover:text-white"
    };

    return (
        <button
            onClick={onClick}
            aria-label={label}
            title={iconOnly ? label : undefined}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {React.cloneElement(icon, { size: iconSize, strokeWidth: 2.5 })}
            {!iconOnly && <span>{label}</span>}
        </button>
    );
};
