/**
 * NextAchievementCard.jsx
 * Seção "Próxima Conquista" da home: a conquista bloqueada mais perto de sair,
 * com barra de progresso, ou o estado "Lendário" quando não falta nenhuma.
 * JSX movido de HomeDashboard (D17).
 */
import React from 'react';
import { Trophy, ChevronRight, Crown } from 'lucide-react';
import { SectionHeader } from '../design-system/SectionHeader';

export function NextAchievementCard({ loading, achievement, onOpen }) {
    return (
        <div className="mb-8">
            <SectionHeader
                icon={<Trophy size={18} className="text-amber-400" />}
                title="Próxima Conquista"
                action={
                    <button
                        onClick={onOpen}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                        Ver todas <ChevronRight size={14} />
                    </button>
                }
            />

            {loading ? (
                <div className="w-full h-24 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
            ) : achievement ? (
                <div
                    onClick={onOpen}
                    className="rounded-2xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700"
                >
                    <div className="relative z-10 p-4 flex gap-4 items-center">
                        {/* Ícone / Badge */}
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-inner relative overflow-hidden">
                            {/* Background Glow baseada na categoria */}
                            <div className={`absolute inset-0 opacity-20 ${achievement.category === 'Volume' ? 'bg-purple-500' :
                                achievement.category === 'Força' ? 'bg-emerald-500' :
                                    'bg-blue-500'
                                }`} />

                            <Trophy size={24} className={`${achievement.category === 'Volume' ? 'text-purple-400' :
                                achievement.category === 'Força' ? 'text-emerald-400' :
                                    'text-blue-400'
                                }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-white text-sm truncate">{achievement.title}</h4>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                    {Math.floor(achievement.progressRatio * 100)}%
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3 truncate">{achievement.description}</p>

                            {/* Barra de Progresso */}
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${achievement.category === 'Volume' ? 'bg-purple-500' :
                                        achievement.category === 'Força' ? 'bg-emerald-500' :
                                            'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.max(5, achievement.progressRatio * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 text-right font-mono">
                                {achievement.progressText}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Lendário!</h4>
                        <p className="text-xs text-slate-400">Você desbloqueou todas as conquistas disponíveis.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
