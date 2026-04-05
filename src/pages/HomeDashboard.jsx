/**
 * HomeDashboard.jsx
 * Visualização principal do painel exibindo progresso do usuário, sequências (streaks) e sugestão de próximo treino.
 * Busca e agrega estatísticas do usuário e modelos de treino do Firestore.
 */
import React, { useState, useEffect, useRef } from 'react';

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
    ChevronRight,
    ArrowDown,
    Layers,
    Info,
    Minus
} from 'lucide-react';
import { StreakWeeklyGoalHybrid } from '../StreakWeeklyGoalHybrid';
import { getFirestoreDeps } from '../firebaseDb';
import { calculateWeeklyStats } from '../utils/workoutStats';
import { workoutService } from '../services/workoutService';
import { achievementsCatalog } from '../data/achievementsCatalog';
import { evaluateAchievements, calculateStats } from '../utils/evaluateAchievements';

const HOME_DASHBOARD_CACHE_VERSION = 1;

const MOTIVATIONAL_QUOTES = [
    "Faça ou não faça. Tentativa não há. — Mestre Yoda",
    "Ninguém vai bater tão duro quanto a vida. Se trata de quanto você aguenta apanhar e seguir em frente. — Rocky Balboa",
    "A verdadeira força de um guerreiro não está no tamanho de seus músculos, mas na sua vontade de dar mais um passo. — Mestre dos Magos",
    "A resistência que você enfrenta na academia constrói a força que você precisa para vencer na vida. — Arnold Schwarzenegger",
    "Equilíbrio é a chave. Corpo são, mente sã. Respire e foque no movimento. — Sr. Miyagi",
    "Os limites só existem se você deixar. Eleve o seu ki e quebre todos eles hoje! — Goku",
    "Não reze por uma vida fácil, reze por força para suportar uma vida difícil. — Bruce Lee",
    "Tudo o que temos de decidir é o que fazer com o tempo que nos é dado. Faça o seu treino valer a pena. — Gandalf",
    "Cansado? Lembre-se do seu objetivo e diga a si mesmo: 'Eu posso fazer isso o dia todo'. — Capitão América",
    "Eu odiava cada minuto de treino, mas dizia: 'Não desista. Sofra agora e viva o resto da vida como um campeão'. — Muhammad Ali",
    "A dor é apenas o seu corpo dizendo que a fraqueza está indo embora. Vai lá e faz o trabalho. — Wolverine",
    "Lembre-se de quem você é. Você é muito mais forte do que imagina ser. — Mufasa",
    "Eu posso aceitar o fracasso, todo mundo falha em alguma coisa. Mas eu não posso aceitar não tentar. — Michael Jordan",
    "Por que nós caímos? Para aprendermos a nos levantar. Volte para a arena. — Batman",
    "Você é mais forte do que acredita. Tem mais poder do que jamais imaginou. — Mulher-Maravilha",
    "O trabalho duro é inútil para aqueles que não acreditam em si mesmos. Esse é o meu jeito ninja! — Naruto",
    "São as nossas escolhas, mais do que as nossas capacidades, que mostram quem realmente somos. Escolha não desistir hoje. — Alvo Dumbledore",
    "O maior poder que você possui é a sua própria mente. Quando ela acredita, o corpo simplesmente obedece. — Professor Xavier",
    "O progresso é como uma xícara de chá quente: leva tempo e paciência, mas aquece a alma de quem persiste. — Tio Iroh",
    "Não lamente o cansaço. Seja melhor. — Kratos",
    "Não tente erguer o peso. Apenas perceba a verdade: a força vem da sua própria mente. — Neo",
    "Quando o treino ficar muito pesado, sabe o que você faz? Continue a treinar, continue a treinar... — Dory",
    "Quando a sua mente disser que você chegou ao limite, você está apenas em 40% da sua capacidade. Continue. — David Goggins",
    "Você pode usar os melhores equipamentos, mas o verdadeiro reator principal é a sua força de vontade. — Tony Stark",
    "A sorte não tem nada a ver com o sucesso. É o resultado de horas e horas de treino. A quadra agora é sua. — Serena Williams",
    "A pressa é a inimiga da perfeição. Foque na postura, respire fundo e execute o movimento com maestria. — Mestre Splinter",
    "Eu treinei por quatro anos para correr apenas nove segundos. Não desista se você não vir resultados em poucas semanas. — Usain Bolt",
    "O segredo da força absoluta... é que não existe ingrediente secreto. O ingrediente é só você! — Po",
    "Não se contente com o treino de ontem. Ultrapasse as suas metas de hoje. Ao infinito... e além! — Buzz Lightyear",
    "O sucesso não é um acidente. É trabalho duro, perseverança, aprendizado, sacrifício e amor pelo que você faz. — Pelé",
    "Em minha longa experiência, não existe isso de sorte. Existe apenas o resultado do seu treinamento. — Obi-Wan Kenobi",
    "O que fazemos pelo nosso corpo hoje, ecoa na nossa saúde pela eternidade. Força e honra. — Maximus",
    "Eu nunca olho para o treino de ontem, querido. Distrai do agora. Foco total na sua próxima série! — Edna Moda",
    "As coisas podem parecer pesadas agora, mas são nessas horas que a gente descobre a força real para continuar. — Samwise Gamgee",
    "O talento sem trabalho duro e repetição constante não é nada. Prove a sua dedicação hoje. — Cristiano Ronaldo",
    "O guerreiro mais formidável nunca para de aprimorar suas defesas e ataques. Mostre do que você é feito. — Pantera Negra",
    "Que a disposição esteja sempre a seu favor. Mas, na dúvida, não confie na sorte, confie no seu treino. — Katniss Everdeen",
    "Eu só posso lhe mostrar o caminho e a ficha de treino. É você quem tem que suar a camisa. — Morpheus",
    "Não importa o quão pesada seja a carga, nós não recuamos. Transforme-se e supere seus limites! — Optimus Prime",
    "A diferença entre o impossível e o possível é só uma questão de quanto suor você está disposto a deixar pelo caminho. — Lara Croft"
];

const HOME_DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

function canUseHomeCacheStorage() {
    return typeof localStorage !== 'undefined'
        && typeof localStorage.getItem === 'function'
        && typeof localStorage.setItem === 'function'
        && typeof localStorage.removeItem === 'function';
}

function getHomeDashboardCacheKey(userId) {
    return `home_dashboard_snapshot_v${HOME_DASHBOARD_CACHE_VERSION}_${userId}`;
}

function parseToDate(raw) {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw.toDate === 'function') {
        const converted = raw.toDate();
        return converted instanceof Date && !isNaN(converted.getTime()) ? converted : null;
    }
    if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') {
        const fromSeconds = new Date(raw.seconds * 1000);
        return isNaN(fromSeconds.getTime()) ? null : fromSeconds;
    }
    if (typeof raw === 'string' || typeof raw === 'number') {
        const parsed = new Date(raw);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

function serializeStatsForCache(stats) {
    if (!stats || typeof stats !== 'object') return null;
    const serializeDay = (day) => ({
        ...day,
        fullDate: day?.fullDate instanceof Date ? day.fullDate.toISOString() : day?.fullDate ?? null
    });
    return {
        ...stats,
        weekDays: Array.isArray(stats.weekDays) ? stats.weekDays.map(serializeDay) : [],
        monthDays: Array.isArray(stats.monthDays) ? stats.monthDays.map(serializeDay) : []
    };
}

function deserializeStatsFromCache(cachedStats) {
    if (!cachedStats || typeof cachedStats !== 'object') return null;
    const deserializeDay = (day) => {
        const fullDate = parseToDate(day?.fullDate);
        return {
            ...day,
            fullDate: fullDate || day?.fullDate || null
        };
    };
    return {
        ...cachedStats,
        weekDays: Array.isArray(cachedStats.weekDays) ? cachedStats.weekDays.map(deserializeDay) : [],
        monthDays: Array.isArray(cachedStats.monthDays) ? cachedStats.monthDays.map(deserializeDay) : []
    };
}

function serializeLatestSessionForCache(session) {
    if (!session || typeof session !== 'object') return null;
    const sessionDate = parseToDate(session.date || session.completedAtClient || session.completedAt || session.timestamp);
    return {
        ...session,
        date: sessionDate ? sessionDate.toISOString() : null
    };
}

function deserializeLatestSessionFromCache(session) {
    if (!session || typeof session !== 'object') return null;
    const parsedDate = parseToDate(session.date || session.completedAtClient || session.completedAt || session.timestamp);
    return {
        ...session,
        date: parsedDate || new Date()
    };
}

function loadHomeDashboardCache(cacheKey) {
    if (!cacheKey || !canUseHomeCacheStorage()) return null;
    try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        const updatedAt = Number(parsed.updatedAt) || 0;
        if (!updatedAt || (Date.now() - updatedAt > HOME_DASHBOARD_CACHE_TTL_MS)) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function saveHomeDashboardCache(cacheKey, payload) {
    if (!cacheKey || !canUseHomeCacheStorage()) return;
    try {
        localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
        // Falha de cache não deve interromper a UI.
    }
}

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

    // Determinar frase diária com base no dia do ano
    const dailyQuote = React.useMemo(() => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const diff = today - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    }, []);





    // Inicializar com estrutura de estatísticas vazia (7 dias vazios) para prevenir calendário faltando
    const [stats, setStats] = useState(() => calculateWeeklyStats([], 4));
    const [nextAchievement, setNextAchievement] = useState(null);


    const [templates, setTemplates] = useState([]);
    const [latestSession, setLatestSession] = useState(null);

    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const cacheHydratedRef = useRef(false);
    const cacheKey = user?.uid ? getHomeDashboardCacheKey(user.uid) : null;

    // 1. Lógica de Sugestão de Treino (Derivado via useMemo)
    const suggestedWorkout = React.useMemo(() => {
        const activeTemplates = templates ? templates.filter(t => !t.isArchived) : [];
        
        if (activeTemplates.length === 0) {
            return null;
        }

        if (!latestSession) {
            return activeTemplates[0];
        }

        const lastIndex = activeTemplates.findIndex(t =>
            t.id === latestSession.templateId ||
            (t.name && latestSession.templateName && t.name === latestSession.templateName)
        );

        let nextIndex = 0;
        if (lastIndex !== -1) {
            nextIndex = (lastIndex + 1) % activeTemplates.length;
        }

        return activeTemplates[nextIndex];

    }, [templates, latestSession]);

    useEffect(() => {
        cacheHydratedRef.current = false;
    }, [cacheKey]);

    useEffect(() => {
        if (!user || !cacheKey || cacheHydratedRef.current) return;
        cacheHydratedRef.current = true;

        const cached = loadHomeDashboardCache(cacheKey);
        if (!cached) return;

        const hydrateId = window.setTimeout(() => {
            if (Array.isArray(cached.templates)) {
                setTemplates(cached.templates);
                setLoadingTemplates(false);
            }

            if (cached.latestSession) {
                setLatestSession(deserializeLatestSessionFromCache(cached.latestSession));
            }

            const cachedStats = deserializeStatsFromCache(cached.stats);
            if (cachedStats) {
                setStats(cachedStats);
                setLoadingStats(false);
            }

            if (cached.nextAchievement !== undefined) {
                setNextAchievement(cached.nextAchievement);
            }
        }, 0);

        return () => window.clearTimeout(hydrateId);
    }, [cacheKey, user]);

    // 2. Data Fetching & Subscriptions
    useEffect(() => {
        let unsubscribeTemplates = null;
        let unsubscribeSessions = null;

        async function fetchData() {
            if (!user) return;
            let effectiveGoal = 4;

            // 0. Buscar Meta do Usuário (Single Fetch, não precisa ser real-time crítico)
            try {
                const { db, doc, getDoc } = await getFirestoreDeps();
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().weeklyGoal) {
                    effectiveGoal = parseInt(userSnap.data().weeklyGoal, 10) || 4;
                }
            } catch (err) {
                console.error("Error fetching user goal:", err);
            }

            // A. Inscrever-se em Treinos (Templates)
            unsubscribeTemplates = await workoutService.subscribeToTemplates(user.uid, (data) => {
                setTemplates(data || []);
                setLoadingTemplates(false);
            });

            // B. Inscrever-se no Histórico (Sessões)
            try {
                unsubscribeSessions = await workoutService.subscribeToSessions(user.uid, (data) => {
                    const sessions = data.map(d => {
                        let dateObj = new Date();
                        // Lógica defensiva para parse de data
                        try {
                            const raw = d.completedAtClient || d.completedAt || d.timestamp;
                            const parsedDate = parseToDate(raw);
                            if (parsedDate) dateObj = parsedDate;
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
                    const computedStats = calculateWeeklyStats(sessions, effectiveGoal);
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
    }, [user]);

    useEffect(() => {
        if (!user || !cacheKey || (loadingTemplates && loadingStats)) return undefined;
        if (typeof window === 'undefined') return undefined;

        let cancelled = false;
        const payload = {
            updatedAt: Date.now(),
            templates,
            latestSession: serializeLatestSessionForCache(latestSession),
            stats: serializeStatsForCache(stats),
            nextAchievement
        };

        const persistCache = () => {
            if (cancelled) return;
            saveHomeDashboardCache(cacheKey, payload);
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(persistCache, { timeout: 1400 });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(persistCache, 260);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [cacheKey, loadingStats, loadingTemplates, latestSession, nextAchievement, stats, templates, user]);



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

                {/* 5. MOTIVACIONAL */}
                <div className="mb-8 p-6 rounded-2xl text-center bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                    <Star size={20} className="text-cyan-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 italic font-medium">
                        &quot;{dailyQuote}&quot;
                    </p>
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


            </div>
        </div>
    );
}

export default HomeDashboard;
