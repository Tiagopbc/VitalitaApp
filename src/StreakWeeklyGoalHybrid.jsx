import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, CheckCircle2, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Clock, AlertCircle } from 'lucide-react';


export function StreakWeeklyGoalHybrid({
    currentStreak,
    bestStreak,
    weeklyGoal,
    completedThisWeek,
    weekDays,
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
            className="relative p-4 rounded-2xl overflow-hidden transition-all duration-300"
            style={{
                background: `
          radial-gradient(circle at top left, ${level.glowColor}, transparent 70%),
          linear-gradient(135deg, #0f1729 0%, #000 100%)
        `,
                border: `1.5px solid ${level.borderColor}`,
                boxShadow: `
          0 0 40px ${level.glowColor},
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.5),
          0 20px 40px rgba(0,0,0,0.5),
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
                <div className="grid grid-cols-3 gap-4 items-center mb-6">
                    {/* Coluna 1 - Badge COMPACTO (MELHORIA #2) */}
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/40">
                            <Flame size={16} className="text-amber-400" />
                            <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
                                {level.name}
                            </span>
                        </div>
                    </div>

                    {/* Coluna 2 - Streak GRANDE (MELHORIA #1) */}
                    <div className="flex flex-col items-center">
                        <span className="text-5xl lg:text-6xl font-bold text-white leading-none">{currentStreak}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">Semanas</span>
                    </div>

                    {/* Coluna 3 - Recorde */}
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/30">
                            <Trophy size={18} className="text-amber-400 animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-amber-400 leading-none">{bestStreak}</span>
                                <span className="text-[9px] uppercase tracking-wider text-amber-400/70">Recorde</span>
                            </div>
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
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <Target size={14} className="text-cyan-400" />
                            <span className="text-xs text-slate-300">Meta desta semana</span>
                        </div>
                        <span className="text-sm font-bold text-white">{Math.round(progressPercent)}%</span>
                    </div>

                    {/* MELHORIA #8: Barra animada com shimmer */}
                    <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden mb-2 shadow-inner">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 transition-all duration-1000 ease-out shadow-lg shadow-cyan-500/60 relative overflow-hidden"
                            style={{
                                width: `${animatedProgress}%`,
                                transitionDelay: '100ms'
                            }}
                        >
                            {/* Brilho animado */}
                            <div className="h-full w-full absolute inset-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs leading-tight">
                        <span className="text-slate-300 font-medium">
                            {completedThisWeek}/{weeklyGoal} treinos completos
                        </span>
                        {completedThisWeek < weeklyGoal && (
                            <span className="text-[10px] font-bold text-cyan-400 animate-pulse flex items-center gap-1">
                                <span>Falta {remainingWorkouts}!</span>
                                <span>💪</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Seção Expansível */}


                {/* Calendário (Movido para dentro dos Detalhes) */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out -mx-6 px-6 ${expanded ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    <div className="flex gap-2 mb-4 pt-2 border-t border-slate-800/50">
                        {weekDays.map((day, idx) => {
                            // Adjust JS getDay() (0=Sun) to Array Index (0=Mon...6=Sun)
                            const todayIndex = today === 0 ? 6 : today - 1;
                            const isToday = idx === todayIndex;

                            return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 pt-4 relative">
                                    {/* Indicator Dot for Today */}
                                    {isToday && (
                                        <div className="absolute top-0 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                    )}

                                    <div
                                        className={`
                    w-full h-10 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer relative
                    ${day.trained
                                                ? 'bg-gradient-to-b from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]' // Cyan to Blue Vertical Gradient
                                                : day.isRest
                                                    ? 'bg-[#2e1065] border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' // Deep Purple
                                                    : 'bg-slate-800/40 border border-white/5 text-slate-600' // Default
                                            }
                    ${isToday ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : ''} 
                  `}
                                        onMouseEnter={() => setHoveredDay(idx)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                    >
                                        {/* Conteúdo da Bolha */}
                                        {day.trained ? (
                                            <div className="bg-white/20 p-1 rounded-full">
                                                <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                            </div>
                                        ) : day.isRest ? (
                                            <span className="text-sm font-bold opacity-60 flex items-center justify-center pt-1" style={{ fontFamily: 'monospace' }}>z<span className="text-xs -mt-1">Z</span></span>
                                        ) : (
                                            isToday && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        )}
                                    </div>

                                    {/* Label Abaixo da Bolha */}
                                    <span className={`
                                        text-[10px] font-bold uppercase tracking-wider
                                        ${isToday ? 'text-cyan-400' : 'text-slate-500'}
                                    `}>
                                        {day.label || day.day[0]}
                                    </span>

                                    {/* Tooltip */}
                                    {hoveredDay === idx && (day.trained || day.isRest) && (
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-20 whitespace-nowrap animate-fadeInUp">
                                            <p className="text-xs font-bold text-white mb-1">{day.day || day.label}</p>
                                            {day.trained && (
                                                <>
                                                    <p className="text-[10px] text-cyan-400">{day.workout}</p>
                                                    <p className="text-[9px] text-slate-400">{day.time}</p>
                                                </>
                                            )}
                                            {day.isRest && !day.trained && (
                                                <p className="text-[10px] text-purple-400">Descanso planejado</p>
                                            )}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Botão Detalhes (Pill) */}
                <div className="flex justify-center mt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className="
            px-4 py-1.5 rounded-full
            bg-cyan-950/30 border border-cyan-500/20
            hover:bg-cyan-900/40 hover:border-cyan-400/40
            text-cyan-400
            transition-all duration-200
            flex items-center gap-1.5
            group
          "
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {expanded ? 'Ocultar' : 'Detalhes'}
                        </span>
                        {expanded ? (
                            <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        ) : (
                            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        )}
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

