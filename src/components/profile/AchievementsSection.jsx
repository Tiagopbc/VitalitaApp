import { Loader2, Lock, Trophy } from 'lucide-react';
import { EmptyState } from '../design-system/EmptyState';
import { ProfileSection } from './ProfileSection';
import { getAchievementTheme } from './achievementTheme';

/**
 * Conquistas em grade de medalhas: compacta o suficiente para exibir o
 * catálogo inteiro (35+) sem dominar a página — a lista de cards anterior
 * crescia ~88px por conquista e piorava conforme o usuário evoluía.
 *
 * O rótulo é obrigatório: o ícone vem da CATEGORIA (só 4 temas em
 * `getAchievementTheme`), então uma grade só de ícones repetiria o mesmo
 * símbolo dezenas de vezes sem diferenciar nada.
 */

/** Medalha individual. Desbloqueada usa o tema da categoria; bloqueada fica esmaecida. */
function AchievementMedal({ achievement, onSelect }) {
    const isUnlocked = achievement.isUnlocked;
    const theme = getAchievementTheme(achievement.category);
    const IconComponent = isUnlocked ? (theme.Icon || Trophy) : Lock;

    const unlockedAt = achievement.unlockedAt
        ? new Date(achievement.unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : null;

    const title = isUnlocked
        ? `${achievement.title}${unlockedAt ? ` — desbloqueada em ${unlockedAt}` : ''}`
        : `${achievement.title} — ${achievement.description}`;

    return (
        <button
            type="button"
            onClick={() => isUnlocked && onSelect(achievement)}
            disabled={!isUnlocked}
            title={title}
            className={`group flex flex-col items-center gap-1.5 text-center ${isUnlocked ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <span
                className={`
                    relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-300
                    ${isUnlocked
                        ? `${theme.bg} ${theme.border} ${theme.text} ${theme.glow} group-hover:scale-110`
                        : 'border-slate-800 bg-slate-900 text-slate-600'}
                `}
            >
                <IconComponent size={24} strokeWidth={1.5} />
            </span>

            <span
                className={`line-clamp-2 text-[10px] font-semibold leading-tight ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}
            >
                {achievement.title}
            </span>
        </button>
    );
}

export function AchievementsSection({ achievements, loading, onSelect }) {
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const total = achievements.length;
    const progress = total > 0 ? (unlockedCount / total) * 100 : 0;

    // Desbloqueadas primeiro, preservando a ordem do catálogo dentro de cada grupo.
    const ordered = [
        ...achievements.filter(a => a.isUnlocked),
        ...achievements.filter(a => !a.isUnlocked)
    ];

    return (
        <ProfileSection icon={<Trophy className="text-yellow-500" size={20} />} title="Conquistas">
            {loading ? (
                <div className="py-8 text-center">
                    <Loader2 className="mx-auto animate-spin text-cyan-500" size={24} />
                </div>
            ) : total === 0 ? (
                <EmptyState
                    icon={<Trophy size={26} />}
                    title="Nenhuma conquista desbloqueada"
                    description="Conclua treinos e mantenha consistência para desbloquear suas primeiras conquistas."
                />
            ) : (
                <>
                    {/* Progresso — espelha a barra de XP do cabeçalho do perfil. */}
                    <div className="mb-5">
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <span className="text-xs font-medium text-slate-500">
                                <span className="font-bold text-white">{unlockedCount}</span> de {total} conquistas
                            </span>
                            <span className="text-xs font-bold text-yellow-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6">
                        {ordered.map(achievement => (
                            <AchievementMedal
                                key={achievement.id}
                                achievement={achievement}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </>
            )}
        </ProfileSection>
    );
}
