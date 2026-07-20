import React from 'react';

/**
 * Botão da barra superior de execução. Ações principais mantêm rótulo;
 * ações de navegação/destrutivas podem ser icon-only (rótulo vira aria-label)
 * para a barra caber sem rolagem.
 */
export const TopBarButton = ({ icon, label, variant = 'default', onClick, active, iconOnly = false, prominence = 'compact' }) => {
    const sizeStyles = iconOnly
        ? "p-2.5 min-w-10 min-h-10 justify-center"
        : prominence === 'large'
            ? "px-3.5 py-2 text-[11px] tracking-wide min-h-9"
            : "px-2.5 py-2 text-[10px] tracking-tight min-h-9";

    const baseStyles = `flex items-center gap-1 rounded-lg font-bold uppercase transition-all duration-300 border backdrop-blur-md whitespace-nowrap ${sizeStyles}`;
    const iconSize = iconOnly ? 18 : prominence === 'large' ? 15 : 14;

    const variants = {
        primary: "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        default: active
            ? "bg-slate-800 text-white border-slate-600 shadow-lg"
            : "bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800/80 hover:text-white"
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
