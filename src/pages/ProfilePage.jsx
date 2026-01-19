// -----------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { workoutService } from '../services/workoutService';

import {
    User,
    Mail,
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
    Users
} from 'lucide-react';
import { achievementsCatalog } from '../data/achievementsCatalog';
import { evaluateAchievements, calculateStats } from '../utils/evaluateAchievements';
import { Button } from '../components/design-system/Button';




export default function ProfilePage({ user, onLogout, onNavigateToHistory, onNavigateToVolumeAnalysis, onNavigateToTrainer, isTrainer }) {
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


    // Derived weekly status
    // const workoutsThisWeekArray = React.useMemo(() => getDaysOfWeekStatus(sessionsState), [sessionsState]); // DESCONTINUADO em favor do componente Híbrido

    // Carregar Perfil
    useEffect(() => {
        if (!user) return;

        async function loadProfile() {
            try {
                const docSnapData = await userService.getUserProfile(user.uid);

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
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        }
        void loadProfile();
    }, [user]);

    // Carregar Dados de Conquistas
    useEffect(() => {
        if (!user) return;

        async function loadAchievementsData() {
            setLoadingAchievements(true);
            try {
                // 1. Buscar todas as sessões de treino (Usando Serviço)
                const sessions = await workoutService.getAllSessions(user.uid);

                // 2. Calcular Estatísticas
                const computedStats = calculateStats(sessions);
                setStats(computedStats);

            } catch (err) {
                console.error("Error loading achievements data:", err);
            } finally {
                setLoadingAchievements(false);
            }
        }

        void loadAchievementsData();
    }, [user]); // Rodar novamente se o usuário mudar. 

    // Reavaliar quando estatísticas ou perfil mudarem
    useEffect(() => {
        if (stats && profile) {
            const evaluated = evaluateAchievements(achievementsCatalog, stats, profile.achievements || {});
            setAchievementsList(evaluated);
        }
    }, [stats, profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
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
        <div className="min-h-screen bg-slate-950 pb-32 px-4 pt-0 w-full max-w-3xl mx-auto">

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
                        {/* Linha de Nome e Edição */}
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight truncate">{profile.displayName || 'Atleta'}</h1>

                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-3 py-1 text-xs font-bold text-slate-300 bg-slate-800 rounded-lg border border-slate-700 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                Editar Perfil
                            </button>
                            <button
                                onClick={() => setShowLinkTrainer(true)}
                                className="px-3 py-1 text-xs font-bold text-cyan-400 bg-cyan-950/30 rounded-lg border border-cyan-900 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors flex items-center gap-1.5"
                            >
                                <Users size={12} />
                                Personal
                            </button>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 mb-1.5 text-slate-400">
                            <Mail size={14} strokeWidth={2.5} />
                            <span className="text-xs truncate">{user?.email}</span>
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center gap-2 text-slate-500">
                            <CalendarDays size={14} strokeWidth={2.5} />
                            <span className="text-xs">Membro desde {formattedJoinDate}</span>
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
            {isTrainer && (
                <button
                    onClick={onNavigateToTrainer}
                    className="w-full py-2 mb-6 bg-cyan-950/30 border-y border-cyan-900/50 flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest hover:bg-cyan-950/50 transition-colors lg:hidden"
                >
                    <Users size={14} />
                    Área do Personal
                </button>
            )}

            {/* --- DADOS CORPORAIS --- */}
            <div className="mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-white">Dados Corporais</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Weight */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Peso</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{profile.weight || '--'}</span>
                                <span className="text-xs text-slate-500">kg</span>
                            </div>
                        </div>
                        {/* Height */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Altura</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{profile.height || '--'}</span>
                                <span className="text-xs text-slate-500">cm</span>
                            </div>
                        </div>
                        {/* Age */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Idade</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{profile.age || '--'}</span>
                                <span className="text-xs text-slate-500">anos</span>
                            </div>
                        </div>
                        {/* BMI */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">IMC</p>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${calculateBMI() ? 'text-white' : 'text-slate-600'}`}>
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
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Sequência</p>
                        <p className="text-xl md:text-3xl font-bold text-white">{stats?.currentStreakDays || 0}</p>
                    </div>
                </div>

                {/* Volume (Clickable) */}
                <button
                    onClick={onNavigateToVolumeAnalysis}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left"
                >
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <BicepsFlexed size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-0.5">Volume</p>
                        <p className="text-xl md:text-3xl font-bold text-white">
                            {((stats?.totalTonnageKg || 0) / 1000).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">ton</p>
                    </div>
                </button>

                {/* Records */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
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
                        <div className="flex flex-col gap-3">
                            {achievementsList.filter(a => a.isUnlocked).map(achievement => {
                                // Lógica de Cor Dinâmica baseada na Categoria
                                let colorClass = "text-yellow-500";
                                let bgClass = "bg-yellow-500/10";
                                let shadowClass = "shadow-[0_0_10px_rgba(234,179,8,0.1)]";

                                if (achievement.category === 'Consistência') { // Treinos/Streak style
                                    colorClass = "text-blue-500";
                                    bgClass = "bg-blue-500/10";
                                    shadowClass = "shadow-[0_0_10px_rgba(59,130,246,0.1)]";
                                } else if (achievement.category === 'Volume') { // Volume style
                                    colorClass = "text-purple-500";
                                    bgClass = "bg-purple-500/10";
                                    shadowClass = "shadow-[0_0_10px_rgba(168,85,247,0.1)]";
                                } else if (achievement.category === 'Força') { // Records style
                                    colorClass = "text-emerald-500";
                                    bgClass = "bg-emerald-500/10";
                                    shadowClass = "shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                                }

                                return (
                                    <div
                                        key={achievement.id}
                                        className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors"
                                    >
                                        {/* Ícone */}
                                        <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center ${colorClass} shrink-0 ${shadowClass} group-hover:scale-110 transition-transform`}>
                                            <Medal size={24} />
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-white mb-1">{achievement.title}</h4>
                                            <p className="text-slate-400 text-sm mb-2">{achievement.description}</p>
                                            <p className={`${colorClass} text-xs font-bold uppercase tracking-wider opacity-80`}>
                                                Desbloqueada em {achievement.unlockedAt
                                                    ? new Date(achievement.unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                    : 'Hoje'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* BLOQUEADAS */}
                        {achievementsList.filter(a => !a.isUnlocked).length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-800/50">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 pl-1">A Desbloquear</h4>
                                <div className="space-y-3 opacity-60">
                                    {achievementsList.filter(a => !a.isUnlocked).slice(0, 3).map(achievement => (
                                        <div key={achievement.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                                                <Lock size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-400">{achievement.title}</h4>
                                                <p className="text-xs text-slate-500">{achievement.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>


            {/* --- SAIR --- */}
            <div className="flex flex-col items-center gap-4 mt-8">
                <button
                    onClick={async () => {
                        if (!window.confirm("Admin: Importar +800 exercícios?")) return;
                        try {
                            const { exerciseImportService } = await import('../services/exerciseImportService');
                            const count = await exerciseImportService.importExercises();
                            alert(`Importação concluída! ${count} exercícios adicionados.`);
                        } catch (e) {
                            alert("Erro na importação: " + e.message);
                        }
                    }}
                    className="text-xs font-mono text-slate-700 hover:text-cyan-500 transition-colors"
                >
                    [Admin] Importar Database de Exercícios
                </button>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-red-500/80 hover:text-red-500 text-sm font-medium transition-colors"
                >
                    Sair da Conta
                </button>
            </div>


            {/* --- MODAL DE EDIÇÃO --- */}
            {showEditModal && (
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
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome de Exibição</label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={profile.displayName}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Seu nome"
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
                                isLoading={saving}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                            >
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE VINCULAR TREINADOR --- */}
            {showLinkTrainer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLinkTrainer(false)} />
                    <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <h2 className="text-lg font-bold text-white mb-4">Vincular Personal</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase">Código do Personal (UID)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white mt-1 focus:border-cyan-500 outline-none font-mono text-sm"
                                    placeholder="Cole o ID completo..."
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Peça o código para seu treinador.</p>
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
                                className="w-full py-2 text-sm text-slate-500 hover:text-white"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}