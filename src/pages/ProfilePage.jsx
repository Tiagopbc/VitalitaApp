// -----------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
    User,
    Dumbbell,
    CalendarDays,
    Loader2,
    Activity,
    Minus,
    Plus,
    Medal,
    Trophy,
    Lock,
    BicepsFlexed,
    X,
    Users,
    LogOut,
    Share2,
    Zap,
    Crown
} from 'lucide-react';
import { achievementsCatalog } from '../data/achievementsCatalog';
import { evaluateAchievements, calculateStats, evaluateHistory } from '../utils/evaluateAchievements';
import { calculateWeeklyStats } from '../utils/workoutStats';
import { Button } from '../components/design-system/Button';
const AchievementUnlockedModal = React.lazy(() => import('../components/achievements/AchievementUnlockedModal').then(module => ({ default: module.AchievementUnlockedModal })));




export default function ProfilePage({ user, onLogout, onNavigateToHistory, onNavigateToTrainer, isTrainer }) {
    const [showEditModal, setShowEditModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // --- VINCULAÇÃO DE PERSONAL TRAINER ---
    const [showLinkTrainer, setShowLinkTrainer] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [linking, setLinking] = useState(false);

    const handleLinkTrainer = async () => {
        if (!inviteCode || !user) return;
        setLinking(true);
        try {
            const { userService } = await import('../services/userService');
            await userService.linkTrainer(user.uid, inviteCode);
            alert("Personal vinculado com sucesso!");
            setShowLinkTrainer(false);
            setInviteCode('');
        } catch (err) {
            console.error(err);
            if (err.message === "PERSONAL_NOT_FOUND") alert("Personal não encontrado com este ID.");
            else if (err.message === "ALREADY_LINKED") alert("Você já está vinculado a este personal.");
            else alert("Erro ao vincular.");
        } finally {
            setLinking(false);
        }
    };

    // Estado do Perfil
    const [profile, setProfile] = useState({
        displayName: user?.displayName || '',
        email: '',
        weight: '',
        height: '',
        age: '',
        gender: 'male',
        goal: 'hypertrophy',
        weeklyGoal: 4,
        achievements: {} // Mapa de conquistas desbloqueadas { id: { unlockedAt: '...' } }
    });

    // Estado de Conquistas
    const [achievementsList, setAchievementsList] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingAchievements, setLoadingAchievements] = useState(true);
    // Armazenar histórico calculado localmente para combinar com o perfil
    const [calculatedHistoryMap, setCalculatedHistoryMap] = useState({});

    // Achievement Sharing
    const [selectedAchievement, setSelectedAchievement] = useState(null);




    // Derived weekly status
    // const workoutsThisWeekArray = React.useMemo(() => getDaysOfWeekStatus(sessionsState), [sessionsState]); // DESCONTINUADO em favor do componente Híbrido

    const fetchingRef = React.useRef(false);

    const fetchProfileData = React.useCallback(async () => {
        if (!user?.uid) return;
        if (fetchingRef.current) return; // Prevent duplicate requests

        fetchingRef.current = true;
        setLoading(true);


        try {
            // Timeout de segurança (10 segundos)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout fetching profile")), 10000)
            );

            const { userService } = await import('../services/userService');
            const docSnapData = await Promise.race([
                userService.getUserProfile(user.uid),
                timeoutPromise
            ]);

            if (docSnapData) {
                setProfile(prev => ({ ...prev, ...docSnapData }));
            } else {
                // Iniciar com dados de autenticação se não houver documento
                setProfile(prev => ({
                    ...prev,
                    displayName: user.displayName || '',
                    email: user.email
                }));
            }
        } catch (err) {
            console.error("Error fetching profile (or timeout):", err);

            // Only show toast if not already showing one (simple check or just replace)
            toast.error("Erro ao carregar dados. Verifique sua conexão.", {
                id: 'profile-fetch-error', // ID prevents duplicates
                action: {
                    label: 'Tentar Novamente',
                    onClick: () => {
                        fetchingRef.current = false; // Allow retry
                        fetchProfileData();
                    }
                },
                duration: 5000
            });

            // Fallback: mostrar o que temos (dados de auth)
            setProfile(prev => ({
                ...prev,
                displayName: user.displayName || '',
                email: user.email
            }));
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [user?.uid, user?.displayName, user?.email]);

    // Carregar Perfil
    useEffect(() => {
        // Simple logic to ensure we fetch once heavily relying on the ref inside the callback
        fetchProfileData();
        // Cleanup not needed for the fetch itself but good practice to allow refetch on unmount/remount
        return () => { fetchingRef.current = false; };
    }, [fetchProfileData]);

    // Carregar Dados de Conquistas
    useEffect(() => {
        if (!user) return;

        async function loadAchievementsData() {
            setLoadingAchievements(true);
            try {
                // 1. Buscar todas as sessões de treino (Usando Serviço)
                const { workoutService } = await import('../services/workoutService');
                const sessions = await workoutService.getAllSessions(user.uid);

                // 2. Calcular Estatísticas
                const computedStats = calculateStats(sessions);
                const weeklyGoal = profile?.weeklyGoal || 4;
                const weeklyStats = calculateWeeklyStats(sessions, weeklyGoal);
                setStats({
                    ...computedStats,
                    weeklyStreak: weeklyStats.currentStreak,
                    weeklyBestStreak: weeklyStats.bestStreak,
                    weeklyGoal: weeklyStats.weeklyGoal
                });

                // 3. Calcular Histórico de Conquistas (Datas Reais)
                const historyMap = evaluateHistory(sessions, achievementsCatalog);
                setCalculatedHistoryMap(historyMap);

            } catch (err) {
                console.error("Error loading achievements data:", err);
            } finally {
                setLoadingAchievements(false);
            }
        }

        void loadAchievementsData();
    }, [user, profile?.weeklyGoal]); // Recalcular se meta semanal mudar.

    // Reavaliar quando estatísticas ou perfil mudarem
    useEffect(() => {
        if (stats && profile) {
            // Combinar mapa do perfil com mapa calculado (Calculado tem prioridade para corrigir datas antigas, mas perfil pode ter overrides manuais futuros)
            // Na verdade, calculo histórico é mais preciso para "quando aconteceu a primeira vez".
            const mergedUnlockedMap = { ...profile.achievements, ...calculatedHistoryMap };

            const evaluated = evaluateAchievements(achievementsCatalog, stats, mergedUnlockedMap);
            setAchievementsList(evaluated);
        }
    }, [stats, profile, calculatedHistoryMap]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Validação de Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.email)) {
            alert("Por favor, insira um email válido.");
            return;
        }

        setSaving(true);
        try {
            const { userService } = await import('../services/userService');
            await userService.updateUserProfile(user.uid, {
                ...profile,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Erro ao salvar perfil.");
        } finally {
            setSaving(false);
        }
    };

    const calculateBMI = () => {
        if (!profile.weight || !profile.height) return null;
        const h = profile.height / 100;
        return (profile.weight / (h * h)).toFixed(1);
    };



    // Cálculo de Nível e XP (Simulado ou Derivado)
    // Exemplo: Nível = 1 + floor(XP / 3500)
    // XP = tonelagemTotalKg / 100 (apenas um exemplo para obter um número grande) + treinos * 100
    const currentXP = (stats?.totalTonnageKg || 0) / 10 + (stats?.totalWorkouts || 0) * 50;
    const XP_PER_LEVEL = 3500;
    const level = Math.floor(currentXP / XP_PER_LEVEL) + 1;
    const xpInLevel = Math.floor(currentXP % XP_PER_LEVEL);
    const xpProgress = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);

    const formattedJoinDate = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '14/09/2025'; // Data de design como fallback se ausente

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-32 px-4 pt-6 w-full max-w-3xl mx-auto">

            {/* --- CARTÃO DE CABEÇALHO DO PERFIL --- */}
            <div className="bg-slate-900/50 rounded-3xl p-6 mb-6 border border-slate-800 relative overflow-hidden">
                {/* Brilho de Fundo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />



                <div className="flex gap-6 items-center relative z-10">
                    {/* Grupo de Avatar (Esquerda) */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#2998FF] to-[#1E6BFF] flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20 ring-4 ring-slate-900 z-10 relative">
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
                            <h1 className="text-2xl font-bold text-white tracking-tight break-words leading-tight">{profile.displayName || 'Atleta'}</h1>
                        </div>



                        {/* Join Date */}
                        <div className="flex items-center gap-2 text-slate-500 mb-4">
                            <CalendarDays size={14} strokeWidth={2.5} />
                            <span className="text-xs">Membro desde {formattedJoinDate}</span>
                        </div>

                        {/* Botões de Ação (Abaixo do info) */}
                        {/* Botões de Ação (Abaixo do info) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 rounded-lg border border-slate-700 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                Editar Perfil
                            </button>
                            <button
                                onClick={() => setShowLinkTrainer(true)}
                                className="px-3 py-1.5 text-xs font-bold text-cyan-400 bg-cyan-950/30 rounded-lg border border-cyan-900 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors flex items-center gap-1.5"
                            >
                                <Users size={12} />
                                Personal
                            </button>
                        </div>
                    </div>
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



            {/* --- ÁREA DO TREINADOR (Apenas Mobile - Faixa) --- */}
            {
                isTrainer && (
                    <button
                        onClick={onNavigateToTrainer}
                        className="w-full py-2 mb-6 bg-cyan-950/30 border-y border-cyan-900/50 flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest hover:bg-cyan-950/50 transition-colors lg:hidden"
                    >
                        <Users size={14} />
                        Área do Personal
                    </button>
                )
            }

            {/* --- DADOS CORPORAIS --- */}
            <div className="mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-white">Dados Corporais</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2">
                        {/* Weight */}
                        <div className="flex items-center gap-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Peso</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-white">{profile.weight || '--'}</span>
                                <span className="text-[10px] text-slate-500 font-bold">kg</span>
                            </div>
                        </div>

                        {/* Height */}
                        <div className="flex items-center gap-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Altura</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-white">{profile.height || '--'}</span>
                                <span className="text-[10px] text-slate-500 font-bold">cm</span>
                            </div>
                        </div>

                        {/* Age */}
                        <div className="flex items-center gap-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Idade</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-white">{profile.age || '--'}</span>
                                <span className="text-[10px] text-slate-500 font-bold">anos</span>
                            </div>
                        </div>

                        {/* BMI */}
                        <div className="flex items-center gap-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">IMC</p>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-lg font-bold ${calculateBMI() ? 'text-white' : 'text-slate-600'}`}>
                                    {calculateBMI() || '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* --- DESTAQUES BIG 3 (ATUALIZADO para TOP 4) --- */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Melhores Marcas (1RM Estimado)</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {(() => {
                        // 1. Obter todos os máximos
                        const allMaxes = stats?.exerciseMaxes ? Object.entries(stats.exerciseMaxes) : [];
                        // 2. Ordenar por peso desc
                        const sortedMaxes = allMaxes.sort(([, weightA], [, weightB]) => weightB - weightA);
                        // 3. Pegar top 4
                        const top4 = sortedMaxes.slice(0, 4);

                        // 4. Preencher com placeholders se menos que 4
                        const displayItems = [...top4];
                        while (displayItems.length < 4) {
                            displayItems.push(null);
                        }

                        return displayItems.map((item, index) => {
                            if (!item) {
                                // Placeholder
                                return (
                                    <div key={`placeholder-${index}`}>
                                        <p className="text-sm text-slate-500 mb-1">--</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-slate-700">--</span>
                                        </div>
                                    </div>
                                );
                            }

                            const [name, weight] = item;
                            const displayName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                            return (
                                <div key={name}>
                                    <p className="text-sm text-slate-500 mb-1 truncate" title={displayName}>{displayName}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-white">{weight}</span>
                                        <span className="text-xs text-slate-500">kg</span>
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* --- GRADE DE ESTATÍSTICAS --- */}
            <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
                {/* Treinos (Clickable) */}
                <button
                    onClick={onNavigateToHistory}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Dumbbell size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Treinos</p>
                        <p className="text-xl md:text-3xl font-bold text-white">{stats?.totalWorkouts || 0}</p>
                    </div>
                </button>

                {/* Streak */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Semanas na Meta</p>
                        <p className="text-xl md:text-3xl font-bold text-white">{stats?.weeklyStreak || 0}</p>
                    </div>
                </div>

                {/* Volume (Static) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <BicepsFlexed size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Volume</p>
                        <p className="text-xl md:text-3xl font-bold text-white">
                            {((stats?.totalTonnageKg || 0) / 1000).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">ton</p>
                    </div>
                </div>

                {/* Records */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Recordes</p>
                        <p className="text-xl md:text-3xl font-bold text-white">{stats?.prsCount || 0}</p>
                    </div>
                </div>
            </div>

            {/* --- SEÇÃO DE CONQUISTAS --- */}
            <div className="mb-24">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} /> Conquistas
                    </h3>
                </div>

                {loadingAchievements ? (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto text-cyan-500 mb-2" size={24} />
                    </div>
                ) : (
                    <>
                        {/* DESBLOQUEADAS */}
                        <div className="grid gap-3">
                            {achievementsList.filter(a => a.isUnlocked).map(achievement => {
                                // Lógica de Cor Dinâmica baseada na Categoria
                                let theme = {
                                    text: 'text-amber-500',
                                    bg: 'bg-amber-500/10',
                                    border: 'border-amber-500/20',
                                    glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]',
                                    gradient: 'from-amber-500/20 to-transparent',
                                    Icon: Medal
                                };

                                if (achievement.category === 'Consistência') {
                                    theme = {
                                        text: 'text-[#22d3ee]', // Cyan-400
                                        bg: 'bg-[#083344]', // Cyan-950
                                        border: 'border-[#155e75]', // Cyan-800
                                        glow: 'shadow-[0_0_15px_-3px_rgba(34,211,238,0.2)]',
                                        gradient: 'from-[#06b6d4]/20 to-transparent',
                                        Icon: Zap
                                    };
                                } else if (achievement.category === 'Volume') {
                                    theme = {
                                        text: 'text-purple-400',
                                        bg: 'bg-purple-900/20',
                                        border: 'border-purple-500/20',
                                        glow: 'shadow-[0_0_15px_-3px_rgba(192,132,252,0.2)]',
                                        gradient: 'from-purple-500/20 to-transparent',
                                        Icon: Dumbbell
                                    };
                                } else if (achievement.category === 'Força') {
                                    theme = {
                                        text: 'text-emerald-400',
                                        bg: 'bg-emerald-900/20',
                                        border: 'border-emerald-500/20',
                                        glow: 'shadow-[0_0_15px_-3px_rgba(52,211,153,0.2)]',
                                        gradient: 'from-emerald-500/20 to-transparent',
                                        Icon: Crown
                                    };
                                }

                                const IconComponent = theme.Icon || Medal;

                                return (
                                    <div
                                        key={achievement.id}
                                        onClick={() => setSelectedAchievement(achievement)}
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
                        {achievementsList.filter(a => !a.isUnlocked).length > 0 && (
                            <div className="mt-8 pt-8 border-t border-[#1e293b]">
                                <div className="flex items-center gap-3 mb-6 opacity-60">
                                    <Lock size={16} className="text-[#64748b]" />
                                    <h4 className="text-xs font-black text-[#64748b] uppercase tracking-widest">
                                        Bloqueadas ({achievementsList.filter(a => !a.isUnlocked).length})
                                    </h4>
                                </div>

                                <div className="grid gap-3 opacity-50 hover:opacity-100 transition-opacity duration-500">
                                    {achievementsList.filter(a => !a.isUnlocked).slice(0, 3).map(achievement => (
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
                                    {achievementsList.filter(a => !a.isUnlocked).length > 3 && (
                                        <p className="text-center text-[10px] text-[#475569] font-medium uppercase tracking-widest mt-2">
                                            + {achievementsList.filter(a => !a.isUnlocked).length - 3} conquistas ocultas
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ACHIEVEMENT SHARE MODAL */}
            {selectedAchievement && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <AchievementUnlockedModal
                        achievements={[selectedAchievement]}
                        onClose={() => setSelectedAchievement(null)}
                    />
                </React.Suspense>
            )}


            {/* --- SAIR --- */}
            <div className="flex flex-col items-center gap-4 mt-8 pb-8">
                <button
                    onClick={onLogout}
                    className="w-auto px-8 py-3 md:py-4 flex items-center justify-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/20 rounded-xl md:rounded-2xl transition-all duration-300 group text-base"
                >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Sair da Conta</span>
                </button>
                <p className="text-[10px] text-slate-600 font-mono">
                    Vitalità Pro v3.1.2
                </p>
            </div>


            {/* --- MODAL DE EDIÇÃO --- */}
            {
                showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-6">Editar Perfil</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={profile.displayName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Weight */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Peso (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={profile.weight}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0.0"
                                        />
                                    </div>
                                    {/* Height */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Altura (cm)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            value={profile.height}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Age */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Idade</label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={profile.age}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    {/* Weekly Goal */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Meta Semanal</label>
                                        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2">
                                            <button
                                                onClick={() => setProfile(p => ({ ...p, weeklyGoal: Math.max(1, (p.weeklyGoal || 4) - 1) }))}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="flex-1 text-center font-bold text-white">{profile.weeklyGoal}</span>
                                            <button
                                                onClick={() => setProfile(p => ({ ...p, weeklyGoal: Math.min(7, (p.weeklyGoal || 4) + 1) }))}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button
                                    onClick={handleSave}
                                    loading={saving}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- MODAL DE VINCULAR TREINADOR --- */}
            {
                showLinkTrainer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLinkTrainer(false)} />
                        <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
                            <h2 className="text-lg font-bold text-white mb-4">Vincular Personal</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-300 font-bold uppercase">Código do Personal (UID)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-white mt-1 focus:border-cyan-500 outline-none font-mono text-sm placeholder:text-slate-500"
                                        placeholder="Cole o ID completo..."
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Peça o código para seu treinador.</p>
                                </div>
                                <Button
                                    onClick={handleLinkTrainer}
                                    loading={linking}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 rounded-xl"
                                >
                                    Confirmar Vínculo
                                </Button>
                                <button
                                    onClick={() => setShowLinkTrainer(false)}
                                    className="w-full py-2 text-sm text-slate-400 hover:text-white font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >

    );
}
