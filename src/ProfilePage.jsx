/**
 * ProfilePage.jsx
 * Tela de gerenciamento de perfil do usuário.
 * Permite visualizar e editar estatísticas pessoais (peso, altura, idade) e objetivos.
 */
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
    User,
    Mail,
    Dumbbell,
    Maximize2,
    CalendarDays,
    Target,
    LogOut,
    Edit2,
    Save,
    Loader2,
    Activity,
    Minus,
    Plus,
    Medal,
    Trophy,
    Lock,
    Star,
    CheckCircle2
} from 'lucide-react';
import { achievementsCatalog } from './data/achievementsCatalog';
import { evaluateAchievements, calculateStats } from './utils/evaluateAchievements';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from './components/design-system/Button';
import { PremiumCard } from './components/design-system/PremiumCard';

export default function ProfilePage({ user, onLogout }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        displayName: user?.displayName || '',
        weight: '',
        height: '',
        age: '',
        gender: 'male',
        goal: 'hypertrophy',
        weeklyGoal: 4,
        achievements: {} // Map of unlocked achievements { id: { unlockedAt: '...' } }
    });

    // Achievements State
    const [achievementsList, setAchievementsList] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingAchievements, setLoadingAchievements] = useState(true);

    // Load Profile
    useEffect(() => {
        if (!user) return;

        async function loadProfile() {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(prev => ({ ...prev, ...docSnap.data() }));
                } else {
                    // Init with auth data if no doc exists
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
        loadProfile();
    }, [user]);

    // Load Achievements Data
    useEffect(() => {
        if (!user) return;

        async function loadAchievementsData() {
            setLoadingAchievements(true);
            try {
                // 1. Fetch all workout sessions for stats
                const sessionsRef = collection(db, 'workout_sessions');
                const q = query(
                    sessionsRef,
                    where('userId', '==', user.uid)
                    // We don't need to sort here if calculateStats handles it, but good practice
                );
                const snap = await getDocs(q);
                const sessions = snap.docs.map(d => ({ ...d.data(), id: d.id }));

                // 2. Calculate Stats
                const computedStats = calculateStats(sessions);
                setStats(computedStats);

                // 3. Evaluate Achievements
                // use profile.achievements from main effect if available, or fetch again?
                // The main profile load effect sets 'profile'. 
                // We depend on 'profile' being loaded? 
                // It's better to rely on 'profile' state.
                // But 'profile' might be initial state.
                // Only evaluate when profile is loaded.
            } catch (err) {
                console.error("Error loading achievements data:", err);
            } finally {
                setLoadingAchievements(false);
            }
        }

        loadAchievementsData();
    }, [user]); // Re-run if user changes. 

    // Re-evaluate when stats or profile changes
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
            await setDoc(doc(db, 'users', user.uid), {
                ...profile,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setIsEditing(false);
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

    const GOALS = {
        hypertrophy: 'Hipertrofia',
        strength: 'Força',
        weight_loss: 'Emagrecimento',
        maintenance: 'Manutenção'
    };

    // Level & XP Calculation (Mocked or Derived)
    // Example: Level = 1 + floor(XP / 3500)
    // XP = totalTonnageKg / 100 (just an example to get a big number) + workouts * 100
    const currentXP = (stats?.totalTonnageKg || 0) / 10 + (stats?.totalWorkouts || 0) * 50;
    const XP_PER_LEVEL = 3500;
    const level = Math.floor(currentXP / XP_PER_LEVEL) + 1;
    const xpInLevel = Math.floor(currentXP % XP_PER_LEVEL);
    const xpProgress = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);

    const formattedJoinDate = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '14/09/2025'; // Fallback to design date if missing

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] pb-32 px-4 pt-[calc(2rem+env(safe-area-inset-top))] w-full max-w-5xl mx-auto">

            {/* --- PROFILE HEADER CARD --- */}
            <div className="bg-slate-900/50 rounded-3xl p-6 mb-6 border border-slate-800 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex gap-6 items-center relative z-10">
                    {/* Avatar Group (Left) */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2998FF] to-[#1E6BFF] flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20 ring-4 ring-slate-900 z-10 relative">
                            {profile.displayName && profile.displayName.length > 0
                                ? <span className="font-bold text-white">{profile.displayName.substring(0, 2).toUpperCase()}</span>
                                : <User size={32} className="text-white" />
                            }
                        </div>
                        {/* Level Badge - Overlapping Bottom */}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                            <div className="bg-amber-500 text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg border-2 border-slate-900 whitespace-nowrap">
                                Nível {level}
                            </div>
                        </div>
                    </div>

                    {/* Info (Right) */}
                    <div className="flex-1 min-w-0">
                        {/* Name & Edit Row */}
                        <div className="flex items-center gap-3 mb-1">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="displayName"
                                    value={profile.displayName}
                                    onChange={handleChange}
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-white font-bold text-xl w-full max-w-[200px] focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-white tracking-tight truncate">{profile.displayName || 'Atleta'}</h1>
                            )}

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                            >
                                {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                            </button>
                        </div>

                        {/* Email & Date */}
                        <div className="flex flex-col gap-1 text-slate-400 text-xs mb-4">
                            <div className="flex items-center gap-2">
                                <Mail size={12} />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarDays size={12} />
                                <span>Membro desde {formattedJoinDate}</span>
                            </div>
                        </div>

                        {/* XP Section */}
                        <div className="w-full">
                            <div className="flex justify-between items-end text-xs font-bold mb-1.5">
                                <span className="text-slate-500 uppercase tracking-wider">Experiência</span>
                                <div>
                                    <span className="text-blue-500 text-sm">{Math.floor(currentXP)}</span>
                                    <span className="text-slate-600 text-[10px]"> / {XP_PER_LEVEL} XP</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Treinos */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-0.5">Treinos</p>
                        <p className="text-3xl font-bold text-white">{stats?.totalWorkouts || 0}</p>
                    </div>
                </div>

                {/* Streak */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-0.5">Streak Atual</p>
                        <p className="text-3xl font-bold text-white">{stats?.currentStreakDays || 0}</p>
                    </div>
                </div>

                {/* Volume */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <Activity size={24} className="rotate-45" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-0.5">Volume Total</p>
                        <p className="text-3xl font-bold text-white">
                            {((stats?.totalTonnageKg || 0) / 1000).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">toneladas</p>
                    </div>
                </div>

                {/* Records */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-0.5">Records</p>
                        <p className="text-3xl font-bold text-white">{stats?.prsCount || 0}</p>
                    </div>
                </div>
            </div>

            {/* --- ACHIEVEMENTS SECTION --- */}
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
                        {/* UNLOCKED */}
                        <div className="flex flex-col gap-3">
                            {achievementsList.filter(a => a.isUnlocked).map(achievement => {
                                // Dynamic Color Logic based on Category
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
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center ${colorClass} shrink-0 ${shadowClass} group-hover:scale-110 transition-transform`}>
                                            <Medal size={24} />
                                        </div>

                                        {/* Content */}
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

                        {/* LOCKED */}
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

            {/* --- LOGOUT --- */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-red-500/80 hover:text-red-500 text-sm font-medium transition-colors"
                >
                    <LogOut size={16} />
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}
