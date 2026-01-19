/**
 * PremiumToggle.jsx
 * Componente de alternância (switch) com estilo visual pesado (esquemórfico/vidro).
 * Exibe ícones de Check ou X com base no estado.
 */
import React from 'react';
import { Check, X } from 'lucide-react';

export function PremiumToggle({ enabled, onChange }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`
                relative w-[52px] h-[28px] rounded-full p-[2px] transition-all duration-300 ease-out cursor-pointer border-none
                ${enabled
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'bg-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                }
            `}
        >
            {/* Botão (Knob) */}
            <div
                className={`
                    absolute top-[2px] w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 cubic-bezier(0.68,-0.55,0.27,1.55)
                    ${enabled ? 'left-[calc(100%-26px)] scale-110' : 'left-[2px] scale-100'}
                `}
            >
                {/* Brilho Interno */}
                <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-gradient-to-br from-white to-transparent opacity-60" />
            </div>

            {/* Ícones */}
            {enabled ? (
                <Check
                    size={12}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white/90 drop-shadow-sm"
                    strokeWidth={4}
                />
            ) : (
                <X
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                    strokeWidth={3}
                />
            )}
        </button>
    );
}
