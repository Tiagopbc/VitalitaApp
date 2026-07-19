/**
 * ThemeSwitch.jsx
 * Switch deslizante de tema (claro/escuro) no estilo pílula neumórfica:
 * trilho rebaixado + botão que desliza com o ícone do modo atual.
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitch({ isLight, onToggle }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={isLight}
            aria-label={isLight ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'}
            onClick={onToggle}
            className="relative w-16 h-8 shrink-0 rounded-full border border-slate-700/60 bg-slate-800/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] transition-colors duration-300 cursor-pointer"
        >
            {/* Ícone da extremidade oposta (sugere o outro modo) */}
            <Moon
                size={13}
                className={`absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity duration-300 ${isLight ? 'opacity-50' : 'opacity-0'}`}
            />
            <Sun
                size={13}
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity duration-300 ${isLight ? 'opacity-0' : 'opacity-50'}`}
            />

            {/* Botão deslizante (branco em ambos os temas, como na referência) */}
            <span
                className={`absolute top-[3px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f8fafc] shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-all duration-300 ${isLight ? 'left-[calc(100%-29px)]' : 'left-[3px]'}`}
            >
                {isLight
                    ? <Sun size={14} className="text-amber-500" />
                    : <Moon size={14} className="text-[#334155]" />}
            </span>
        </button>
    );
}
