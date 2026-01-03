/**
 * ProfilePage.jsx
 * User profile management screen.
 * Allows viewing and editing personal stats (weight, height, age) and goals.
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
    Plus
} from 'lucide-react';
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
        weeklyGoal: 4
    });

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] pb-32 px-4 pt-8 max-w-2xl mx-auto">

            {/* --- HEADER PROFILE --- */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/20 mb-4 ring-4 ring-slate-900 border border-slate-700">
                    {/* Simple Initials or User Icon */}
                    {profile.displayName && profile.displayName.length > 0
                        ? profile.displayName[0].toUpperCase()
                        : <User size={40} className="text-white" />
                    }
                </div>

                {isEditing ? (
                    <input
                        type="text"
                        name="displayName"
                        value={profile.displayName}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-center text-white font-bold text-xl w-full max-w-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-white mb-1">{profile.displayName || 'Atleta'}</h1>
                )}

                <p className="text-slate-400 flex items-center gap-1.5 text-sm">
                    <Mail size={12} /> {user?.email}
                </p>
            </div>

            {/* --- ACTION BUTTON --- */}
            <div className="flex justify-end mb-4">
                {isEditing ? (
                    <Button
                        onClick={handleSave}
                        variant="primary"
                        leftIcon={saving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                        disabled={saving}
                    >
                        Salvar Alterações
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="ghost"
                        leftIcon={<Edit2 size={16} />}
                        className="text-cyan-400 hover:bg-cyan-500/10"
                    >
                        Editar Perfil
                    </Button>
                )}
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Weight */}
                <PremiumCard className="flex flex-col items-center justify-center py-6">
                    <div className="mb-2 p-2 rounded-full bg-blue-500/10 text-blue-400">
                        <Dumbbell size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Peso</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <input
                                type="number"
                                name="weight"
                                value={profile.weight}
                                onChange={handleChange}
                                placeholder="0"
                                className="bg-slate-800 border-b border-blue-500 w-16 text-center text-white font-bold outline-none"
                            />
                            <span className="text-slate-500 text-xs">kg</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-white mt-1">
                            {profile.weight || '--'}<span className="text-sm text-slate-500 ml-1">kg</span>
                        </span>
                    )}
                </PremiumCard>

                {/* Height */}
                <PremiumCard className="flex flex-col items-center justify-center py-6">
                    <div className="mb-2 p-2 rounded-full bg-cyan-500/10 text-cyan-400">
                        <Maximize2 size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Altura</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <input
                                type="number"
                                name="height"
                                value={profile.height}
                                onChange={handleChange}
                                placeholder="0"
                                className="bg-slate-800 border-b border-cyan-500 w-16 text-center text-white font-bold outline-none"
                            />
                            <span className="text-slate-500 text-xs">cm</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-white mt-1">
                            {profile.height || '--'}<span className="text-sm text-slate-500 ml-1">cm</span>
                        </span>
                    )}
                </PremiumCard>

                {/* Age */}
                <PremiumCard className="flex flex-col items-center justify-center py-6">
                    <div className="mb-2 p-2 rounded-full bg-purple-500/10 text-purple-400">
                        <CalendarDays size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Idade</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <input
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={handleChange}
                                placeholder="0"
                                className="bg-slate-800 border-b border-purple-500 w-16 text-center text-white font-bold outline-none"
                            />
                            <span className="text-slate-500 text-xs">anos</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-white mt-1">
                            {profile.age || '--'}<span className="text-sm text-slate-500 ml-1">anos</span>
                        </span>
                    )}
                </PremiumCard>

                {/* BMI (Calculated) */}
                <PremiumCard className="flex flex-col items-center justify-center py-6 bg-slate-900/30">
                    <div className="mb-2 p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                        <Activity size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">IMC</span>
                    <span className="text-2xl font-bold text-slate-300 mt-1">
                        {calculateBMI() || '--'}
                    </span>
                </PremiumCard>

                {/* --- WEEKLY GOAL (NEW) --- */}
                <PremiumCard className="col-span-2 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                            <Target size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-500 uppercase">Meta Semanal</span>
                            <span className="text-sm text-slate-400">Treinos por semana</span>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setProfile(prev => ({ ...prev, weeklyGoal: Math.max(1, (prev.weeklyGoal || 4) - 1) }))}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="text-lg font-bold text-white w-4 text-center">{profile.weeklyGoal || 4}</span>
                            <button
                                onClick={() => setProfile(prev => ({ ...prev, weeklyGoal: Math.min(7, (prev.weeklyGoal || 4) + 1) }))}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white">{profile.weeklyGoal || 4}</span>
                            <span className="text-xs text-slate-500 ml-1">/semana</span>
                        </div>
                    )}
                </PremiumCard>
            </div>

            {/* --- GOAL SECTION --- */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="text-red-400" size={20} /> Objetivo Principal
                </h3>

                {isEditing ? (
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(GOALS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setProfile(prev => ({ ...prev, goal: key }))}
                                className={`
                                    p-4 rounded-xl border text-left transition-all
                                    ${profile.goal === key
                                        ? 'bg-red-500/10 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                        : 'bg-slate-800/20 border-slate-800 text-slate-400 hover:bg-slate-800/40'}
                                `}
                            >
                                <span className="font-bold">{label}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <PremiumCard className="flex items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-900/50 border-slate-800">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Foco Atual</p>
                            <p className="text-xl font-bold text-white">{GOALS[profile.goal] || 'Não definido'}</p>
                        </div>
                    </PremiumCard>
                )}
            </div>

            {/* --- LOGOUT --- */}
            <div className="border-t border-slate-800/50 pt-8 mt-12">
                <Button
                    variant="danger"
                    fullWidth
                    onClick={onLogout}
                    leftIcon={<LogOut size={18} />}
                >
                    Sair da Conta
                </Button>
                <p className="text-center text-slate-600 text-xs mt-4">
                    Vitalità App v1.2.0 • Build 2024
                </p>
            </div>
        </div>
    );
}
