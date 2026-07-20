import { Check } from 'lucide-react';

/**
 * Card de progresso do treino: contador de exercícios concluídos + barra
 * segmentada. Mostrado apenas fora do Modo Foco.
 */
export function ExecutionProgressCard({ completedCount, totalCount }) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-4 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
                        <Check size={9} className="text-cyan-400" strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso do Treino</span>
                </div>

                <div className="text-sm font-bold text-white">
                    <span className="text-lg text-cyan-400 mr-1 font-heading">{completedCount}</span>
                    <span className="text-slate-600">/ {totalCount}</span>
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="flex gap-1.5 h-1.5 w-full">
                {Array.from({ length: totalCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-500 ${idx < completedCount
                            ? 'bg-cyan-500'
                            : 'bg-slate-800/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
