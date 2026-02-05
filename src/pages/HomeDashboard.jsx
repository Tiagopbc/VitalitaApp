/**
 * HomeDashboard.jsx
 * Visualização principal do painel exibindo progresso do usuário, sequências (streaks) e sugestão de próximo treino.
 * Busca e agrega estatísticas do usuário e modelos de treino do Firestore.
 */
import React, { useState, useEffect } from 'react';

import {
    Flame,
    Dumbbell,
    Plus,
    History,
    Zap,
    Trophy,
    Play,
    ArrowRight,
    Star,
    Sparkles,
    BarChart3,
    Crown,
    Target,
    Clock,
    ChevronRight
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { StreakWeeklyGoalHybrid } from '../StreakWeeklyGoalHybrid';
import { db } from '../firebaseDb';
import { calculateWeeklyStats } from '../utils/workoutStats';
import { workoutService } from '../services/workoutService';
import { achievementsCatalog } from '../data/achievementsCatalog';
import { evaluateAchievements, calculateStats } from '../utils/evaluateAchievements';


export function HomeDashboard({
    onNavigateToCreateWorkout,
    onNavigateToWorkout,
    onNavigateToHistory,
    onNavigateToAchievements,
    user
}) {

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.displayName?.split(' ')[0] || 'Atleta';





    const [userGoal, setUserGoal] = useState(4); // Estado para meta do usuário
    // Inicializar com estrutura de estatísticas vazia (7 dias vazios) para prevenir calendário faltando
    const [stats, setStats] = useState(() => calculateWeeklyStats([], 4));
    const [nextAchievement, setNextAchievement] = useState(null);


    const [templates, setTemplates] = useState([]);
    const [latestSession, setLatestSession] = useState(null);

    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    // 1. Lógica de Sugestão de Treino (Derivado via useMemo)
    const suggestedWorkout = React.useMemo(() => {
        if (!templates || templates.length === 0) {
            return null;
        }

        if (!latestSession) {
            return templates[0];
        }

        const lastIndex = templates.findIndex(t =>
            t.id === latestSession.templateId ||
            (t.name && latestSession.templateName && t.name === latestSession.templateName)
        );

        let nextIndex = 0;
        if (lastIndex !== -1) {
            nextIndex = (lastIndex + 1) % templates.length;
        }

        return templates[nextIndex];

    }, [templates, latestSession]);

    // 2. Data Fetching & Subscriptions
    useEffect(() => {
        let unsubscribeTemplates = null;
        let unsubscribeSessions = null;

        async function fetchData() {
            if (!user) return;

            // 0. Buscar Meta do Usuário (Single Fetch, não precisa ser real-time crítico)
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().weeklyGoal) {
                    setUserGoal(parseInt(userSnap.data().weeklyGoal));
                }
            } catch (err) {
                console.error("Error fetching user goal:", err);
            }

            // A. Inscrever-se em Treinos (Templates)
            unsubscribeTemplates = workoutService.subscribeToTemplates(user.uid, (data) => {
                setTemplates(data || []);
                setLoadingTemplates(false);
            });

            // B. Inscrever-se no Histórico (Sessões)
            try {
                unsubscribeSessions = workoutService.subscribeToSessions(user.uid, (data) => {
                    const sessions = data.map(d => {
                        let dateObj = new Date();
                        // Lógica defensiva para parse de data
                        try {
                            const raw = d.completedAtClient || d.completedAt || d.timestamp;
                            if (raw) {
                                if (typeof raw.toDate === 'function') dateObj = raw.toDate();
                                else if (raw instanceof Date) dateObj = raw;
                                else if (typeof raw === 'string' || typeof raw === 'number') dateObj = new Date(raw);
                                else if (raw.seconds) dateObj = new Date(raw.seconds * 1000);
                            }
                        } catch (e) { console.warn("Date parsing error", d.id, e); }

                        if (isNaN(dateObj.getTime())) dateObj = new Date();
                        return { ...d, date: dateObj };
                    });

                    // Ordenar por data (Mais recente primeiro)
                    sessions.sort((a, b) => b.date - a.date);

                    // Atualizar Última Sessão para a lógica de sugestão
                    if (sessions.length > 0) {
                        setLatestSession(sessions[0]);
                    } else {
                        setLatestSession(null);
                    }

                    // Calcular Estatísticas Semanais
                    const computedStats = calculateWeeklyStats(sessions, userGoal);
                    setStats({ ...computedStats, totalSessions: sessions.length });

                    // Calcular Próxima Conquista (Smart Challenge)
                    const fullStats = calculateStats(sessions);
                    const allAchievements = evaluateAchievements(achievementsCatalog, fullStats, {}); // Map vazio pois queremos recalc isUnlocked on-the-fly
                    const locked = allAchievements.filter(a => !a.isUnlocked);

                    // Ordenar por maior progresso relativo
                    locked.sort((a, b) => b.progressRatio - a.progressRatio);

                    if (locked.length > 0) {
                        setNextAchievement(locked[0]);
                    } else {
                        // Se zerou o jogo, podemos mostrar uma conquista "máxima" ou nulo
                        setNextAchievement(null);
                    }
                    setLoadingStats(false);
                });
            } catch (err) {
                console.error("Subscription Error:", err);
            }
        }

        fetchData();

        return () => {
            if (unsubscribeTemplates) unsubscribeTemplates();
            if (unsubscribeSessions) unsubscribeSessions();
        };
    }, [user, userGoal]); // Removed userGoal to prevent potential loops, as we fetch it inside. // Re-executa se user mudar ou goal mudar (embora goal seja atualizado dentro.. cuidado com loop, mas aqui é fetch inicial)



    return (
        <div className="pb-24 lg:pb-8 max-w-3xl mx-auto w-full">
            <div className="w-full px-4 lg:px-8 flex flex-col">

                {/* 1. SAUDAÇÃO */}
                <div className="pt-6 pb-6">
                    <h1 className="text-2xl lg:text-3xl mb-1 text-white font-heading font-bold">
                        {greeting}, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{firstName}</span>
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
                        {loadingStats ? (
                            <div className="w-full h-64 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
                        ) : (
                            <StreakWeeklyGoalHybrid
                                currentStreak={stats.currentStreak}
                                bestStreak={stats.bestStreak}
                                weeklyGoal={stats.weeklyGoal}
                                completedThisWeek={stats.completedThisWeek}
                                weekDays={stats.weekDays}
                                monthDays={stats.monthDays}
                                showRings={false}
                            />
                        )}
                    </div>
                </div>

                {/* 3. SEÇÃO HERO - PRÓXIMO TREINO */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={18} className="text-cyan-400" />
                        <h3 className="text-base font-bold text-white">Próximo Treino Sugerido</h3>
                    </div>

                    {loadingTemplates ? (
                        <div className="w-full h-40 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
                    ) : suggestedWorkout ? (
                        <button
                            onClick={() => onNavigateToWorkout(suggestedWorkout.id, suggestedWorkout.name)}
                            className="w-full p-6 rounded-3xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-left group
                            bg-gradient-to-br from-[#0f172a] to-[#020617] border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
                                        Sugerido
                                    </p>
                                    <h2 className="text-lg lg:text-3xl font-heading font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
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
                            {/* AmbientGlow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
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

                {/* 4. GAMIFICAÇÃO - DESAFIO ATIVO (SMART) */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-amber-400" />
                            <h3 className="text-base font-semibold text-white">Próxima Conquista</h3>
                        </div>
                        <button
                            onClick={onNavigateToAchievements}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                            Ver todas <ChevronRight size={14} />
                        </button>
                    </div>

                    {loadingStats ? (
                        <div className="w-full h-24 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
                    ) : nextAchievement ? (
                        <div
                            onClick={onNavigateToAchievements}
                            className="rounded-2xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700"
                        >
                            <div className="relative z-10 p-4 flex gap-4 items-center">
                                {/* Ícone / Badge */}
                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-inner relative overflow-hidden">
                                    {/* Background Glow baseada na categoria */}
                                    <div className={`absolute inset-0 opacity-20 ${nextAchievement.category === 'Volume' ? 'bg-purple-500' :
                                        nextAchievement.category === 'Força' ? 'bg-emerald-500' :
                                            'bg-blue-500'
                                        }`} />

                                    <Trophy size={24} className={`${nextAchievement.category === 'Volume' ? 'text-purple-400' :
                                        nextAchievement.category === 'Força' ? 'text-emerald-400' :
                                            'text-blue-400'
                                        }`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-white text-sm truncate">{nextAchievement.title}</h4>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                            {Math.floor(nextAchievement.progressRatio * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3 truncate">{nextAchievement.description}</p>

                                    {/* Barra de Progresso */}
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${nextAchievement.category === 'Volume' ? 'bg-purple-500' :
                                                nextAchievement.category === 'Força' ? 'bg-emerald-500' :
                                                    'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.max(5, nextAchievement.progressRatio * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 text-right font-mono">
                                        {nextAchievement.progressText}
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

                {/* 6. MOTIVACIONAL */}
                <div className="p-6 rounded-2xl text-center bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                    <Star size={20} className="text-cyan-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 italic font-medium">
                        &quot;O progresso acontece fora da zona de conforto.&quot;
                    </p>
                </div>

            </div>
        </div>
    );
}

export default HomeDashboard;
