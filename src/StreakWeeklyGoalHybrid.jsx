import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, Check, ChevronDown, Moon, AlertCircle } from 'lucide-react';

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
    const [expanded, setExpanded] = useState(false); // Default expanded to show the calendar
    const [showCelebration, setShowCelebration] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Calculations
    const progressPercent = Math.min(100, (completedThisWeek / weeklyGoal) * 100);
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

    // Celebration Logic
    useEffect(() => {
        if (completedThisWeek >= weeklyGoal) {
            const key = getWeekKey();
            const hasShown = sessionStorage.getItem(key);

            if (!hasShown && !showCelebration) {
                setShowCelebration(true);
                sessionStorage.setItem(key, 'true');
                setTimeout(() => setShowCelebration(false), 5000);
            }
        }
    }, [completedThisWeek, weeklyGoal]);

    // Streak Level Styles
    const getStreakLevel = () => {
        if (currentStreak >= 12) return { color: 'text-purple-400', glow: 'shadow-purple-500/20', name: 'Diamante', icon: '💎' };
        if (currentStreak >= 8) return { color: 'text-amber-400', glow: 'shadow-amber-500/20', name: 'Ouro', icon: '🥇' };
        if (currentStreak >= 4) return { color: 'text-slate-300', glow: 'shadow-slate-500/20', name: 'Prata', icon: '🥈' };
        return { color: 'text-orange-400', glow: 'shadow-orange-500/20', name: 'Bronze', icon: '🥉' };
    };

    const level = getStreakLevel();

    return (
        <div className="relative w-full lg:max-w-xl lg:mx-auto">

            {/* --- CARD CONTAINER --- */}
            <div
                className="relative overflow-hidden rounded-[32px] border border-blue-500/10 bg-[#020617] shadow-xl transition-all duration-300"
                style={{
                    boxShadow: '0 0 50px -10px rgba(2, 6, 23, 0.9)'
                }}
            >
                {/* Background Glows (Subtle) */}
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-5 sm:p-6">

                    {/* 1. HEADER: STREAK & INFO */}
                    <div className="flex flex-col items-center justify-center mb-6 relative">
                        {/* Streak Badge - ABSOLUTE LEFT */}
                        <div className={`absolute left-0 top-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/5 backdrop-blur-md ${level.glow}`}>
                            <Flame size={14} className={level.color} fill="currentColor" fillOpacity={0.2} />
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${level.color}`}>
                                {level.name}
                            </span>
                        </div>

                        {/* Huge Streak Number - PRESERVED FONT SIZE CHANGE */}
                        <h1 className="text-4xl sm:text-4xl font-black text-white tracking-tighter leading-none drop-shadow-2xl relative z-10">
                            {currentStreak}
                        </h1>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.25em] mt-3">
                            Semanas Consecutivas
                        </p>

                        {/* Recorde - ABSOLUTE RIGHT - Visible on Mobile now */}
                        <div className="absolute right-0 top-0 flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] uppercase font-bold text-amber-500 bg-amber-500/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-amber-500/10">
                            <Trophy size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Recorde: {bestStreak}</span>
                        </div>
                    </div>

                    {/* 2. WEEKLY GOAL PROGRESS */}
                    <div className="mb-6 px-2">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10">
                                    <Target size={16} className="text-cyan-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-200">Meta da semana</span>
                            </div>
                            <span className="text-sm font-extrabold text-white bg-slate-800/50 px-2 py-0.5 rounded-md border border-white/5">
                                {Math.round(progressPercent)}%
                            </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-4 w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                            {/* Animated Bar */}
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full relative overflow-hidden transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                style={{ width: `${animatedProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>

                        {/* Footer Text */}
                        <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400 px-1">
                            <span>
                                <strong className="text-white text-sm mr-1">{completedThisWeek}</strong>
                                de {weeklyGoal} treinos
                            </span>

                            {/* Risk Alert */}
                            {isAtRisk && (
                                <span className="text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                    <AlertCircle size={12} />
                                    Faltam {remainingWorkouts}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 3. CALENDAR GRID (Collapsible/Hybrid) */}
                    <div className="transition-all duration-500 ease-in-out">
                        <div className="bg-slate-900/20 rounded-[24px] p-4 sm:p-5 border border-white/5 backdrop-blur-sm">

                            {/* Days Header */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                                    <div key={i} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-3 sm:gap-4 transition-all duration-500">
                                {(expanded ? (monthDays || []) : weekDays).map((day, idx) => {
                                    const todayDate = new Date();
                                    const isToday = day.dateNumber === todayDate.getDate() && !day.isOutsideMonth && !day.status?.includes('prev');

                                    // Determine Status & Style
                                    let status = day.status;
                                    if (!status) {
                                        if (day.trained) status = 'trained';
                                        else if (day.isOutsideMonth) status = 'prev_month_rest';
                                        else status = 'rest';
                                    }

                                    const isTrained = status === 'trained';
                                    const isRest = (status === 'rest' || status === 'prev_month_rest') && !isTrained; // Priority to trained
                                    const isFuture = status === 'future';

                                    return (
                                        <div
                                            key={idx}
                                            className={`
                                                relative aspect-square flex items-center justify-center rounded-lg transition-all duration-300 group
                                                ${isTrained ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/40 shadow-[0_4px_10px_rgba(34,211,238,0.2)] backdrop-blur-md border border-cyan-400/30 z-10' : ''}
                                                ${isRest ? 'bg-[#0f172a]/80 border border-slate-800 text-slate-600' : ''}
                                                ${!isTrained && !isRest ? 'text-slate-700' : ''} 
                                                ${isToday ? 'ring-[2px] ring-amber-400 ring-offset-4 ring-offset-[#020617] z-20 shadow-[0_0_20px_rgba(251,191,36,0.15)]' : ''}
                                            `}
                                        >
                                            {/* Trained State: Glass Square + Check Overlay */}
                                            {isTrained && (
                                                <>
                                                    {/* Glass Gloss (Top Highlight) */}
                                                    <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-cyan-400/20 to-transparent pointer-events-none" />

                                                    {/* Date Number - Centered (Behind Check) */}
                                                    <span className="relative z-10 text-base sm:text-lg font-bold text-white drop-shadow-md">
                                                        {day.dateNumber}
                                                    </span>

                                                    {/* Check Icon - Overlay (On Top, Transparent) */}
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-30 mix-blend-overlay">
                                                        <Check size={28} className="text-white drop-shadow-sm" strokeWidth={4} />
                                                    </div>
                                                </>
                                            )}

                                            {/* Rest State: Moon Icon */}
                                            {isRest && (
                                                <Moon size={14} className="text-indigo-400/60 transition-colors group-hover:text-indigo-400" strokeWidth={2} />
                                            )}

                                            {/* Standard/Future/Today Empty State: Number */}
                                            {(!isTrained && !isRest) && (
                                                <span className={`text-xs font-semibold ${isToday ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                                    {day.dateNumber}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend - Clean & Minimal */}
                            <div className="flex justify-center gap-6 mt-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-[4px] bg-slate-700/50 border border-white/20 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feito</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Moon size={12} className="text-indigo-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descanso</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-[4px] border border-amber-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hoje</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Expand/Collapse Trigger */}
                    <div className="flex justify-center mt-4">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(prev => !prev);
                            }}
                            className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.15em] py-2 px-4 cursor-pointer"
                        >
                            {expanded ? 'Ocultar calendário' : 'Ver mês completo'}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
