/**
 * PremiumInput.jsx
 * Campo de entrada estilizado com rótulo flutuante e borda inferior animada.
 * Fornece feedback visual no foco e presença de valor.
 */
import React, { useState } from 'react';

export function PremiumInput({ label, value, onChange, placeholder, type = 'text', ...props }) {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
        <div className="relative mb-5 group">
            {/* Rótulo Animado */}
            <label
                className={`
                    absolute left-3 transition-all duration-200 pointer-events-none z-10
                    ${isFocused || hasValue
                        ? '-top-2.5 text-[11px] px-1.5 bg-slate-950 text-cyan-500 font-bold uppercase tracking-wider'
                        : 'top-3 text-sm text-slate-500 font-medium'
                    }
                `}
            >
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isFocused ? placeholder : ''}
                className={`
                    w-full px-3 py-3 rounded-xl bg-slate-900/60 border text-[15px] font-medium text-slate-200 outline-none transition-all duration-200
                    ${isFocused
                        ? 'border-cyan-500 ring-1 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'border-slate-800 focus:border-cyan-500/50'
                    }
                `}
                {...props}
            />

            {/* Barra de Progresso Inferior */}
            <div
                className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out pointer-events-none rounded-b-xl
                    ${isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}
                `}
            />
        </div>
    );
}
