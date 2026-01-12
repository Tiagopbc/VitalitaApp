/**
 * HomeDashboard.jsx
 * Visualização principal do painel exibindo progresso do usuário, sequências (streaks) e sugestão de próximo treino.
 * Busca e agrega estatísticas do usuário e modelos de treino do Firestore.
 */
import React, { useState, useEffect } from 'react';
import {
    Flame,
    Dumbbell,
    Target,
    ChevronRight,
    Clock,
    Plus,
    History,
    Zap,
    Trophy,
    Play,
    ArrowRight,
    Star,
    Sparkles,
    BarChart3
} from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { StreakWeeklyGoalHybrid } from './StreakWeeklyGoalHybrid';
import { db } from './firebaseConfig';
import { calculateWeeklyStats } from './utils/workoutStats';
import { workoutService } from './services/workoutService';

const weekDays = []; // Removed hardcoded mock data


export function HomeDashboard({
    onNavigateToMethods,
    onNavigateToCreateWorkout,
    onNavigateToWorkout,
    onNavigateToHistory,
    onNavigateToAchievements,
    onNavigateToVolumeAnalysis,
    onNavigateToMyWorkouts,
    user
}) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.displayName?.split(' ')[0] || 'Atleta';

    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suggestedWorkout, setSuggestedWorkout] = useState(null);
    const [userGoal, setUserGoal] = useState(4); // State for user goal
    const [stats, setStats] = useState({
        currentStreak: 0,
        bestStreak: 0,
        completedThisWeek: 0,
        weeklyGoal: 4,
        weekDays: []
    });

    useEffect(() => {
        async function fetchData() {
            if (!user) {
                setLoading(false);
                return;
            }

            let fetchedGoal = 4;

            // 0. Fetch User Goal
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().weeklyGoal) {
                    fetchedGoal = parseInt(userSnap.data().weeklyGoal);
                    setUserGoal(fetchedGoal);
                }
            } catch (err) {
                console.error("Error fetching user goal:", err);
            }

            let workoutsData = [];

            // 1. Fetch Workouts (Templates) - CACHED
            try {
                workoutsData = await workoutService.getTemplates(user.uid);
                setWorkouts(workoutsData);
                if (workoutsData.length > 0 && !suggestedWorkout) setSuggestedWorkout(workoutsData[0]);
            } catch (error) {
                console.error("Error fetching templates:", error);
            }

            // 2. Fetch History (Sessions) for Stats & Suggestion
            try {
                // We need all sessions for Streak calculation?
                // For now, yes.
                const allSessions = await workoutService.getAllSessions(user.uid);

                const sessions = allSessions.map(d => ({
                    ...d,
                    date: d.completedAt?.toDate() || new Date()
                }));

                sessions.sort((a, b) => b.date - a.date);

                // --- SMART SUGGESTION LOGIC ---
                if (workoutsData.length > 0) {
                    let nextWorkout = workoutsData[0]; // Default to first

                    if (sessions.length > 0) {
                        const lastSession = sessions[0];
                        // Try to match by templateId first, then name
                        const lastWorkoutIndex = workoutsData.findIndex(w =>
                            w.id === lastSession.templateId || w.name === lastSession.workoutName
                        );

                        if (lastWorkoutIndex !== -1) {
                            // Rotate to next: (current + 1) % total
                            const nextIndex = (lastWorkoutIndex + 1) % workoutsData.length;
                            nextWorkout = workoutsData[nextIndex];
                        }
                    }
                    setSuggestedWorkout(nextWorkout);
                }

                const computedStats = calculateWeeklyStats(sessions, fetchedGoal);
                setStats(computedStats);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);



    return (
        <div className="min-h-screen bg-transparent text-gray-50 pb-24 lg:pb-8">
            <div className="w-full max-w-3xl mx-auto px-4 lg:px-8 flex flex-col">

                {/* 1. SAUDAÇÃO */}
                <div className="pt-4 pb-6">
                    <h1 className="text-2xl lg:text-3xl mb-1">
                        {greeting}, <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{firstName}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Pronto para o próximo treino?
                    </p>
                </div>

                {/* 2. PROGRESSO */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Flame size={18} className="text-orange-400" />
                        <h3 className="text-base font-semibold text-white">Seu Progresso</h3>
                    </div>

                    <div
                        onClick={onNavigateToHistory}
                        className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                        <StreakWeeklyGoalHybrid
                            currentStreak={stats.currentStreak}
                            bestStreak={stats.bestStreak}
                            weeklyGoal={stats.weeklyGoal}
                            completedThisWeek={stats.completedThisWeek}
                            weekDays={stats.weekDays}
                            monthDays={stats.monthDays}
                            showRings={false}
                        />
                    </div>
                </div>

                {/* 3. HERO SECTION - PRÓXIMO TREINO */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={10} className="text-cyan-400" />
                        <h3 className="text-base font-bold text-white">Próximo Treino Sugerido</h3>
                    </div>

                    {suggestedWorkout ? (
                        <button
                            onClick={() => onNavigateToWorkout(suggestedWorkout.id, suggestedWorkout.name)}
                            className="w-full p-6 rounded-3xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-left group
                            bg-gradient-to-br from-[#0f172a] to-[#020617] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
                                        Sugerido
                                    </p>
                                    <h2 className="text-lg lg:text-3xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                                        {suggestedWorkout.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Dumbbell size={16} className="text-cyan-500" />
                                            <span>{suggestedWorkout.exercises?.length || 0} exercícios</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} className="text-cyan-500" />
                                            <span>~60 min</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.5)] ml-4 border border-white/20">
                                    <Play size={24} fill="white" className="text-white ml-1" />
                                </div>
                            </div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl"></div>
                        </button>
                    ) : (
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
                            <p className="text-slate-400 mb-4">Você ainda não tem treinos criados.</p>
                            <button
                                onClick={onNavigateToCreateWorkout}
                                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors"
                            >
                                Criar Primeiro Treino
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. GAMIFICAÇÃO - DESAFIO ATIVO */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-amber-400" />
                            <h3 className="text-base font-semibold text-white">Desafio Ativo</h3>
                        </div>
                        <button
                            onClick={onNavigateToAchievements}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                            Ver todas <ChevronRight size={14} />
                        </button>
                    </div>

                    <div
                        onClick={onNavigateToAchievements}
                        className="p-5 rounded-2xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                        style={{
                            background: 'radial-gradient(circle at top right, rgba(139,92,246,0.15), transparent 70%), linear-gradient(135deg, #0b1120, #000)',
                            border: '1px solid rgba(139,92,246,0.3)'
                        }}
                    >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                            <div className="flex items-center gap-3 lg:min-w-[280px]">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 flex-shrink-0">
                                    <Target size={22} className="text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-0.5">Guerreiro da Semana 💪</h4>
                                    <p className="text-xs text-slate-400">Complete {stats.weeklyGoal || 4} treinos esta semana</p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center gap-3 w-full">
                                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, ((stats.completedThisWeek || 0) / (stats.weeklyGoal || 4)) * 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold text-purple-400 min-w-[40px]">{stats.completedThisWeek || 0}/{stats.weeklyGoal || 4}</span>
                            </div>
                        </div>
                    </div>
                </div>



                {/* 6. MOTIVACIONAL */}
                <div
                    className="p-6 rounded-2xl text-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(6,182,212,0.05))',
                        border: '1px solid rgba(59,130,246,0.1)'
                    }}
                >
                    <Star size={20} className="text-cyan-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 italic">
                        "O progresso acontece fora da zona de conforto."
                    </p>
                </div>

            </div>
        </div>
    );
}

export default HomeDashboard;
