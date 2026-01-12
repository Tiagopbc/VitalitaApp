import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, CheckCircle2, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Clock, AlertCircle, BedDouble, Moon, Sparkles } from 'lucide-react';


export function StreakWeeklyGoalHybrid({
    currentStreak,
    bestStreak,
    weeklyGoal,
    completedThisWeek,
    weekDays,
    monthDays,
    showRings = false,
    onNavigateToSettings
}) {
    const [hoveredDay, setHoveredDay] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Cálculos
    const progressPercent = (completedThisWeek / weeklyGoal) * 100;
    const remainingWorkouts = Math.max(0, weeklyGoal - completedThisWeek);
    const daysRemaining = weekDays.filter(d => !d.trained && !d.isRest).length;
    const isAtRisk = remainingWorkouts > daysRemaining && daysRemaining > 0;

    // Animate progress bar on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progressPercent);
        }, 300);
        return () => clearTimeout(timer);
    }, [progressPercent]);

    // Helper to identify current week for storage
    const getWeekKey = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `celebration_shown_${d.getFullYear()}_${weekNo}`;
    };

    // MELHORIA #9: Celebração com confete (Fixed: Only once per session/week)
    useEffect(() => {
        if (completedThisWeek >= weeklyGoal) {
            const key = getWeekKey();
            const hasShown = sessionStorage.getItem(key);

            if (!hasShown && !showCelebration) {
                setShowCelebration(true);
                // Dispara confete
                // Confetti disabled

                // Mark as shown
                sessionStorage.setItem(key, 'true');

                // Remove badge após 5s
                setTimeout(() => setShowCelebration(false), 5000);
            }
        }
    }, [completedThisWeek, weeklyGoal]); // Removed showCelebration from dependency to avoid loop

    // Streak level
    const getStreakLevel = () => {
        if (currentStreak >= 12) return {
            color: 'from-purple-400 via-pink-400 to-blue-400',
            borderColor: 'rgba(168,85,247,0.5)',
            glowColor: 'rgba(168,85,247,0.2)',
            textColor: 'text-purple-400',
            icon: '💎',
            name: 'Diamante'
        };
        if (currentStreak >= 8) return {
            color: 'from-yellow-400 to-amber-600',
            borderColor: 'rgba(251,191,36,0.5)',
            glowColor: 'rgba(251,191,36,0.25)',
            textColor: 'text-amber-400',
            icon: '🥇',
            name: 'Ouro'
        };
        if (currentStreak >= 4) return {
            color: 'from-slate-300 to-slate-500',
            borderColor: 'rgba(148,163,184,0.5)',
            glowColor: 'rgba(148,163,184,0.2)',
            textColor: 'text-slate-300',
            icon: '🥈',
            name: 'Prata'
        };
        return {
            color: 'from-orange-400 to-orange-600',
            borderColor: 'rgba(251,146,60,0.5)',
            glowColor: 'rgba(251,146,60,0.2)',
            textColor: 'text-orange-400',
            icon: '🥉',
            name: 'Bronze'
        };
    };

    const level = getStreakLevel();
    const today = new Date().getDay();

    return (
        <div
            className="relative p-5 sm:p-6 rounded-2xl overflow-hidden transition-all duration-300 w-full lg:max-w-3xl lg:mx-auto"
            style={{
                background: `
          radial-gradient(circle at top left, ${level.glowColor}, transparent 70%),
          linear-gradient(135deg, #0f1729 0%, #000 100%)
        `,
                border: `1.5px solid ${level.borderColor}`,
                boxShadow: `
          0 0 25px ${level.glowColor},
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.5),
          0 20px 30px rgba(0,0,0,0.4),
          0 0 0 1px rgba(0,0,0,0.1)
        `
            }}
        >
            {/* MELHORIA #10: Gradiente sutil no topo */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>

            {/* Conteúdo */}
            <div className="relative z-10">
                {/* MELHORIA #9: Badge "Meta Atingida!" */}
                {showCelebration && (
                    <div className="absolute -top-2 -right-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg animate-bounce z-20">
                        Meta Atingida! 🎉
                    </div>
                )}

                {/* Alert se em risco */}
                {isAtRisk && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-400" />
                        <p className="text-[10px] text-red-300 flex-1">
                            <strong>Atenção!</strong> Faltam {remainingWorkouts} treinos em {daysRemaining} dias disponíveis 🚨
                        </p>
                    </div>
                )}

                {/* Header - Grid System (MELHORIA #1, #2) */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center mb-6 sm:mb-8">
                    {/* Coluna 1 - Badge COMPACTO (MELHORIA #2) */}
                    <div className="flex justify-start">
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/50 border border-amber-500/20 backdrop-blur-sm shadow-inner shadow-amber-500/5">
                            <Flame size={16} className="text-amber-400" />
                            <span className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-amber-400">
                                {level.name}
                            </span>
                        </div>
                    </div>

                    {/* Coluna 2 - Streak GRANDE (MELHORIA #1) */}
                    <div className="flex flex-col items-center">
                        <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-none">{currentStreak}</span>
                        <span className="text-[12px] sm:text-[12px] uppercase font-bold tracking-wide text-slate-300/90 mt-1 text-center leading-snug">Semanas consecutivas</span>
                    </div>

                    {/* Coluna 3 - Recorde */}
                    <div className="flex justify-center">
                        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 min-w-[140px] sm:min-w-[170px] rounded-2xl bg-slate-900/50 border border-amber-500/25 backdrop-blur-sm shadow-inner shadow-amber-500/10">
                            <Trophy size={20} className="text-amber-400" />
                            <span className="text-[13px] sm:text-sm font-semibold text-slate-100/90">Recorde:</span>
                            <span className="text-[15px] sm:text-base font-extrabold text-amber-400 leading-none">{bestStreak}</span>
                        </div>
                    </div>
                </div>

                {/* Anéis SVG (se showRings = true) */}
                {showRings && (
                    <div className="flex justify-center mb-6">
                        <div
                            className="relative cursor-pointer transition-transform duration-300 hover:scale-110 group"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <svg
                                width="90"
                                height="90"
                                viewBox="0 0 90 90"
                                className="transform -rotate-90 transition-transform duration-500 group-hover:rotate-[-100deg]"
                            >
                                {/* Anel Externo - Tempo */}
                                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="5" />
                                <circle cx="45" cy="45" r="38" fill="none" stroke="url(#grad-time)" strokeWidth="5"
                                    strokeDasharray={`${239 * 0.64} 239`} strokeLinecap="round" />

                                {/* Anel Médio - Volume */}
                                <circle cx="45" cy="45" r="30" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="5" />
                                <circle cx="45" cy="45" r="30" fill="none" stroke="url(#grad-volume)" strokeWidth="5"
                                    strokeDasharray={`${188 * 0.71} 188`} strokeLinecap="round" />

                                {/* Anel Interno - Treinos */}
                                <circle cx="45" cy="45" r="22" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="5" />
                                <circle cx="45" cy="45" r="22" fill="none" stroke="url(#grad-treinos)" strokeWidth="5"
                                    strokeDasharray={`${138 * (progressPercent / 100)} 138`} strokeLinecap="round" />

                                <defs>
                                    <linearGradient id="grad-treinos" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                    <linearGradient id="grad-volume" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="grad-time" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#d97706" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Mini labels ao hover */}
                            <div className="absolute -bottom-8 right-0 hidden group-hover:flex flex-col gap-0.5 text-[8px] uppercase tracking-wider">
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                    <span className="text-cyan-400">T</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="text-emerald-400">V</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                    <span className="text-amber-400">H</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meta Semanal - Sempre visível */}
                {/* Meta Semanal - Premium Card */}
                <div className="mb-8 p-5 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-2xl relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <Target size={14} className="text-cyan-400" />
                                </div>
                                <span className="text-[13px] sm:text-xs font-semibold text-slate-200 tracking-wide">Meta da semana</span>
                            </div>
                            <span className="text-[13px] sm:text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-md border border-white/5">{Math.round(progressPercent)}%</span>
                        </div>

                        {/* Barra animada Premium */}
                        <div className="w-full h-3 bg-slate-950/50 rounded-full overflow-hidden mb-3 ring-1 ring-white/5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)] relative overflow-hidden"
                                style={{
                                    width: `${animatedProgress}%`,
                                    transitionDelay: '100ms'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[13px] sm:text-xs">
                            <span className="text-slate-300/90 font-medium">
                                <strong className="text-white">{completedThisWeek}</strong> de {weeklyGoal} treinos
                            </span>
                            {completedThisWeek < weeklyGoal && (
                                <span className="text-[12px] sm:text-[10px] font-bold text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1.5 rounded-full border border-cyan-500/20 leading-none">
                                    <span>Faltam {remainingWorkouts}</span>
                                    <span className="animate-bounce">�</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seção Expansível */}


                {/* Calendário (Cards Semanais - Novo Design Premium) */}
                <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] px-1 ${expanded ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>

                    {/* Glass Container for Calendar */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 sm:p-4 lg:max-w-md lg:mx-auto shadow-inner shadow-white/5">

                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3 px-0.5">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {((monthDays && monthDays.length > 0) ? monthDays : weekDays).map((day, idx) => {
                                const todayDate = new Date();
                                const isToday = day.dateNumber === todayDate.getDate() && !day.isOutsideMonth && !day.status?.includes('prev');

                                // Status Defaults
                                let status = day.status;
                                if (!status) {
                                    if (day.trained) status = 'trained';
                                    else if (day.isOutsideMonth) status = 'prev_month_rest';
                                    else status = 'rest';
                                }

                                // Base Styles
                                let cardClass = "relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-all duration-300 group";
                                let content = null;
                                let animationDelay = `${idx * 0.03}s`;

                                if (status === 'trained') {
                                    cardClass += " bg-gradient-to-br from-cyan-500 to-blue-600 border-white/10 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 z-10";
                                    content = (
                                        <>
                                            <span className="text-white font-bold text-sm sm:text-base leading-none drop-shadow-md">{day.dateNumber}</span>
                                            <div className="absolute bottom-1 right-1 opacity-100">
                                                <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                                            </div>
                                        </>
                                    );
                                } else if (status === 'future') {
                                    // FUTURO: Minimalista, baixa opacidade
                                    cardClass += " bg-transparent border-slate-800/60 opacity-40 hover:opacity-70 hover:border-slate-700";
                                    content = <span className="text-slate-500 font-medium text-xs sm:text-sm">{day.dateNumber}</span>;
                                } else if (status === 'rest' || status === 'prev_month_rest') {
                                    // DESCANSO: Fundo profundo, Ícone de Lua
                                    const isOutside = day.isOutsideMonth;
                                    cardClass += ` bg-slate-800/40 border-slate-800 ${isOutside ? 'opacity-30' : 'opacity-80 hover:opacity-100'} hover:bg-slate-800`;

                                    content = (
                                        <>
                                            {/* Date number hidden, Moon icon always visible */}
                                            <div className="flex items-center justify-center">
                                                <Moon size={14} className="text-indigo-400" />
                                            </div>
                                            {/* Small indicator dot removed since icon is visible */}
                                        </>
                                    );
                                }

                                // TODAY Highlight
                                if (isToday) {
                                    cardClass += " ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.2)]";
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={`${cardClass} animate-fadeInUp`}
                                        style={{ animationDelay: expanded ? animationDelay : '0s', animationFillMode: 'both' }}
                                        onMouseEnter={() => setHoveredDay(idx)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                    >
                                        {content}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Legend */}
                        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Feito</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Descanso</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full border border-amber-400"></div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Hoje</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Always Visible Toggle Button */}
                <div className="flex justify-center px-1 mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className="text-[14px] sm:text-[13px] font-semibold text-cyan-300 flex items-center gap-1.5 hover:text-cyan-200 transition-colors min-h-[44px] py-3 px-3 rounded-xl"
                    >
                        {expanded ? 'Ocultar calendário' : 'Ver calendário completo'}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.2s ease-out;
        }
      `}</style>
            </div>
        </div>
    );
}
