/**
 * ThemeSelector.jsx
 * Seletor segmentado do tema: Escuro | Claro | Auto (segue o aparelho).
 * A opção escolhida fica em branco nos dois temas, como o botão do antigo
 * interruptor; o trilho acompanha o tema.
 */
import React from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { THEMES } from '../../utils/theme';

const OPCOES = [
    { valor: THEMES.dark, rotulo: 'Escuro', nome: 'Escuro', Icone: Moon },
    { valor: THEMES.light, rotulo: 'Claro', nome: 'Claro', Icone: Sun },
    { valor: THEMES.system, rotulo: 'Auto', nome: 'Automático, segue o sistema', Icone: SunMoon }
];

export function ThemeSelector({ value, onChange }) {
    return (
        <div
            role="group"
            aria-label="Tema do aplicativo"
            className="flex shrink-0 rounded-full border border-slate-700/60 bg-slate-800/80 p-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)]"
        >
            {OPCOES.map(({ valor, rotulo, nome, Icone }) => {
                const escolhido = value === valor;
                return (
                    <button
                        key={valor}
                        type="button"
                        aria-pressed={escolhido}
                        aria-label={nome}
                        onClick={() => onChange(valor)}
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] min-[360px]:px-2.5 font-bold transition-all duration-200 cursor-pointer ${escolhido
                            ? 'bg-[#f8fafc] text-[#334155] shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Icone size={13} aria-hidden="true" className={escolhido && valor === THEMES.light ? 'text-amber-500' : ''} />
                        {rotulo}
                    </button>
                );
            })}
        </div>
    );
}
