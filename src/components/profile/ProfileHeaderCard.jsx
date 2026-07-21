import { CalendarDays, Moon, PencilLine, Sun, User, Users } from 'lucide-react';
import { Button } from '../design-system/Button';
import { ThemeSwitch } from '../design-system/ThemeSwitch';
import { THEMES } from '../../utils/theme';
import { XP_PER_LEVEL } from '../../utils/xpLevel';

/**
 * Cartão de cabeçalho do perfil: avatar + nível, nome, data de ingresso,
 * ações primárias (editar / personal), alternância de tema e barra de XP.
 * Totalmente controlado por props — nenhum estado próprio.
 */
export function ProfileHeaderCard({
    profile,
    level,
    formattedJoinDate,
    appTheme,
    xpInLevel,
    xpProgress,
    onEditProfile,
    onLinkTrainer,
    onToggleTheme
}) {
    return (
        <div className="bg-slate-900/50 rounded-3xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden">
            {/* Brilho de Fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex gap-4 sm:gap-6 items-center relative z-10">
                {/* Grupo de Avatar (Esquerda) */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-[#2998FF] to-[#1E6BFF] flex items-center justify-center text-2xl sm:text-3xl shadow-xl shadow-blue-500/20 ring-4 ring-slate-900 z-10 relative">
                        {profile.displayName && profile.displayName.length > 0
                            ? <span className="font-bold text-white">{profile.displayName.substring(0, 2).toUpperCase()}</span>
                            : <User size={32} className="text-white" />
                        }
                    </div>
                    {/* Distintivo de Nível - Sobreposição Inferior */}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-amber-500 text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg border-2 border-slate-900 whitespace-nowrap">
                            Nível {level}
                        </div>
                    </div>
                </div>

                {/* Informações (Direita) */}
                <div className="flex-1 min-w-0">
                    {/* Linha de Nome */}
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words leading-tight">{profile.displayName || 'Atleta'}</h1>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={14} strokeWidth={2.5} />
                        <span className="text-xs">Membro desde {formattedJoinDate}</span>
                    </div>
                </div>
            </div>

            <div
                data-testid="profile-primary-actions"
                className="relative z-10 mt-5 grid grid-cols-2 gap-2"
            >
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEditProfile}
                    className="w-full rounded-xl px-3 text-[0.68rem] tracking-normal whitespace-nowrap"
                    leftIcon={<PencilLine size={14} />}
                >
                    Editar perfil
                </Button>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onLinkTrainer}
                    className="w-full rounded-xl px-3 text-[0.68rem] tracking-normal whitespace-nowrap"
                    leftIcon={<Users size={14} />}
                >
                    Personal
                </Button>
            </div>

            {/* Tema do aplicativo */}
            <div className="relative z-10 mt-4 flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-400">
                    {appTheme === THEMES.light
                        ? <Sun size={15} className="text-amber-500" />
                        : <Moon size={15} className="text-cyan-400" />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {appTheme === THEMES.light ? 'Modo claro' : 'Modo escuro'}
                    </span>
                </div>
                <ThemeSwitch
                    isLight={appTheme === THEMES.light}
                    onToggle={onToggleTheme}
                />
            </div>

            {/* Experience Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800 relative">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experiência</span>
                    <div className="text-right">
                        <span className="text-sm font-bold text-blue-400">{Math.floor(xpInLevel)}</span>
                        <span className="text-[10px] font-bold text-slate-600"> / {XP_PER_LEVEL} XP</span>
                    </div>
                </div>
                {/* Fundo da Barra de Progresso */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full transition-all duration-1000"
                        style={{ width: `${xpProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
