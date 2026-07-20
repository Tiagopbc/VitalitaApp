import { Loader2, Lock, Share2, Trophy } from 'lucide-react';
import { EmptyState } from '../design-system/EmptyState';
import { SectionHeader } from '../design-system/SectionHeader';
import { getAchievementTheme } from './achievementTheme';

/**
 * Seção de conquistas: desbloqueadas (com tema por categoria e ação de
 * compartilhar) e bloqueadas (estilo minimalista). O split unlocked/locked
 * é feito aqui a partir da lista completa.
 */
export function AchievementsSection({ achievements, loading, onSelect }) {
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    const lockedAchievements = achievements.filter(a => !a.isUnlocked);

    return (
        <div className="mb-24">
            <SectionHeader icon={<Trophy className="text-yellow-500" size={20} />} title="Conquistas" />

            {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto text-cyan-500 mb-2" size={24} />
                </div>
            ) : (
                <>
                    {/* DESBLOQUEADAS */}
                    <div className="grid gap-3">
                        {unlockedAchievements.length === 0 && (
                            <EmptyState
                                icon={<Trophy size={26} />}
                                title="Nenhuma conquista desbloqueada"
                                description="Conclua treinos e mantenha consistência para desbloquear suas primeiras conquistas."
                            />
                        )}
                        {unlockedAchievements.map(achievement => {
                            // Cor + ícone dinâmicos baseados na categoria.
                            const theme = getAchievementTheme(achievement.category);
                            const IconComponent = theme.Icon || Trophy;

                            return (
                                <div
                                    key={achievement.id}
                                    onClick={() => onSelect(achievement)}
                                    className={`
                                        relative flex items-center gap-5 p-5 rounded-[24px]
                                        bg-[#0f172a] border border-[#1e293b]
                                        hover:border-opacity-50 hover:bg-[#1e293b]
                                        transition-all duration-300 cursor-pointer active:scale-[0.98]
                                        group overflow-hidden
                                    `}
                                >
                                    {/* Background Glow Effect on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    {/* Share Icon Hint */}
                                    <div className="absolute top-4 right-4 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 group-hover:translate-y-0 duration-300">
                                        <Share2 size={16} />
                                    </div>

                                    {/* Ícone */}
                                    <div className={`
                                        relative w-14 h-14 rounded-2xl flex items-center justify-center
                                        ${theme.bg} ${theme.border} border
                                        ${theme.text} ${theme.glow}
                                        shrink-0 group-hover:scale-110 transition-transform duration-300
                                    `}>
                                        {/* Inner Glow */}
                                        <div className={`absolute inset-0 rounded-2xl opacity-20 bg-current blur-md`} />
                                        <IconComponent size={28} strokeWidth={1.5} className="relative z-10 drop-shadow-sm" />
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1 min-w-0 relative z-10 ">
                                        <h4 className="text-lg font-bold text-white mb-1 tracking-tight truncate pr-6">
                                            {achievement.title}
                                        </h4>

                                        <div className="flex items-center gap-2">
                                            <p className="text-[#94a3b8] text-xs font-medium leading-relaxed truncate">
                                                {achievement.description}
                                            </p>

                                            <span className="w-1 h-1 rounded-full bg-[#334155] shrink-0" />

                                            <div className={`inline-flex items-center gap-1 shrink-0 ${theme.bg} px-1.5 py-0.5 rounded-md border ${theme.border} border-opacity-50`}>
                                                <Trophy size={9} className={theme.text} />
                                                <span className={`${theme.text} text-[9px] font-bold uppercase tracking-wider`}>
                                                    Desbloqueada em {achievement.unlockedAt
                                                        ? new Date(achievement.unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                                        : 'Hoje'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* BLOQUEADAS - Estilo Minimalista */}
                    {lockedAchievements.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-[#1e293b]">
                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                <Lock size={16} className="text-[#64748b]" />
                                <h4 className="text-xs font-black text-[#64748b] uppercase tracking-widest">
                                    Bloqueadas ({lockedAchievements.length})
                                </h4>
                            </div>

                            <div className="grid gap-3 opacity-50 hover:opacity-100 transition-opacity duration-500">
                                {lockedAchievements.slice(0, 3).map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] grayscale"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#1e293b] flex items-center justify-center text-[#475569] shrink-0">
                                            <Lock size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[#94a3b8] truncate">{achievement.title}</h4>
                                            <p className="text-xs text-[#64748b] truncate">{achievement.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {lockedAchievements.length > 3 && (
                                    <p className="text-center text-[10px] text-[#475569] font-medium uppercase tracking-widest mt-2">
                                        + {lockedAchievements.length - 3} conquistas ocultas
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
