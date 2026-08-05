import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { SOURCE_FILTERS } from '../../utils/workoutSourceFilter';

/**
 * Filtros de origem das fichas em uma faixa rolável de chips.
 *
 * O grid 2x2 anterior tomava uma faixa alta da tela antes do primeiro treino.
 * Os quatro rótulos não cabem na largura de um iPhone, então a faixa rola — e
 * um degradê na borda direita avisa que ainda há filtro fora da tela; sem ele
 * "Arquivados" simplesmente não existiria para quem não tentasse arrastar.
 *
 * O contador é decorativo (`aria-hidden`): a lista logo abaixo já é a resposta
 * para leitores de tela, e mantê-lo fora do nome acessível deixa cada chip
 * anunciado só pelo próprio rótulo.
 */
export function SourceFilterChips({ value, counts, onChange }) {
    const stripRef = useRef(null);
    const [showEndFade, setShowEndFade] = useState(false);

    const syncFade = useCallback(() => {
        const strip = stripRef.current;
        if (!strip) return;
        const remaining = strip.scrollWidth - strip.clientWidth - strip.scrollLeft;
        setShowEndFade(remaining > 8);
    }, []);

    useLayoutEffect(() => {
        syncFade();
        window.addEventListener('resize', syncFade);
        return () => window.removeEventListener('resize', syncFade);
    }, [syncFade]);

    return (
        <div className="relative border-t border-slate-800/70">
            <div
                ref={stripRef}
                onScroll={syncFade}
                className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto px-3 py-2.5"
            >
                {SOURCE_FILTERS.map(({ id, label }) => {
                    const isActive = value === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChange(id)}
                            className={`inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isActive
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {label}
                            <span
                                aria-hidden="true"
                                className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${isActive ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'}`}
                            >
                                {counts[id] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {showEndFade && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-950 to-transparent"
                />
            )}
        </div>
    );
}
