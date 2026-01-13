/**
 * WorkoutsPage.jsx
 * Exibe uma grade de modelos de treino disponíveis para o usuário.
 * Suporta pesquisa, filtragem (por empurrar/puxar/pernas/etc) e classificação de modelos.
 */
import React, { useState, useRef, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, query, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search,
    Plus,
    Filter,
    Dumbbell,
    Crown,
    Clock,
    Calendar,
    MoreVertical,
    Trophy,
    Play,
    Star,
    X,
    Flame,
    Check,
    Edit2,
    Copy,
    Trash2,
    RefreshCw
} from 'lucide-react';

import { RippleButton } from './components/design-system/RippleButton';
import { PremiumCard } from './components/design-system/PremiumCard';
import { ExerciseCard } from './components/workout/ExerciseCard';
import { EditExerciseModal } from './components/workout/EditExerciseModal';
import { workoutService } from './services/workoutService';
import { useAuth } from './AuthContext';

// --- MOCK DATA FOR ACCORDION DEMO ---
// Mock data removed


// Filter constants
const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'push', label: 'Push' },
    { id: 'pull', label: 'Pull' },
    { id: 'legs', label: 'Pernas' },
    { id: 'fullbody', label: 'Full Body' },
];

const SORT_OPTIONS = [
    { id: 'recent', label: 'Recentes' },
    { id: 'name', label: 'Nome' },
];

export default function WorkoutsPage({ onNavigateToCreate, onNavigateToWorkout, user, isTrainerMode }) {
    // --- STATE ---
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    // New: Source Filter (All / My / Personal)
    const [sourceFilter, setSourceFilter] = useState('all');

    // UI State
    const [selectedWorkout, setSelectedWorkout] = useState(null); // ID of expanded workout
    const [editingExercise, setEditingExercise] = useState(null); // { workoutId, index, data }

    // Menus
    const [activeSortMenu, setActiveSortMenu] = useState(false);
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    const sortMenuRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        async function fetchWorkouts() {
            setLoading(true);
            try {
                // CACHED FETCH
                const loadedWorkouts = await workoutService.getTemplates(user.uid);

                const formattedWorkouts = loadedWorkouts.map(data => ({
                    id: data.id,
                    name: data.name,
                    exercisesCount: data.exercises ? data.exercises.length : 0,
                    exercises: data.exercises || [],
                    duration: data.estimatedDuration || '45-60min',
                    muscleGroups: data.muscleGroups || [],
                    lastPerformed: data.lastPerformed ? new Date(data.lastPerformed.toDate()).toLocaleDateString('pt-BR') : 'Nunca',
                    lastPerformedDate: data.lastPerformed ? data.lastPerformed.toDate() : null,
                    frequency: '1x/sem',
                    timesPerformed: data.timesPerformed || 0,
                    isFavorite: !!data.isFavorite,
                    category: data.category || 'fullbody',
                    createdBy: data.createdBy,
                    assignedByTrainer: data.assignedByTrainer,
                    completedToday: false
                }));

                setWorkouts(formattedWorkouts);
            } catch (error) {
                console.error("Error fetching workouts:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchWorkouts();
    }, [user]);

    // --- CLICK OUTSIDE HANDLERS ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setActiveSortMenu(false);
            }
            if (activeCardMenu && !event.target.closest('.card-menu-btn')) {
                // Simple close if clicking outside menu area
                // setActiveCardMenu(null); 
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu]);


    // --- FILTER LOGIC ---
    const filteredWorkouts = workouts.filter(workout => {
        const matchesCategory = selectedFilter === 'all' || workout.category === selectedFilter;
        // 2. Search
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));

        // 3. Source Filter (My vs Personal)
        let matchesSource = true;
        if (sourceFilter === 'meus') {
            matchesSource = workout.createdBy === user.uid || !workout.createdBy;
        } else if (sourceFilter === 'personal') {
            matchesSource = workout.createdBy && workout.createdBy !== user.uid;
        }

        return matchesCategory && matchesSearch && matchesSource;
    }).sort((a, b) => {
        if (sortBy === 'recent') {
            if (!a.lastPerformedDate) return 1;
            if (!b.lastPerformedDate) return -1;
            return new Date(b.lastPerformedDate) - new Date(a.lastPerformedDate);
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    // --- ACTIONS ---
    const handleCardClick = (id, name) => {
        onNavigateToWorkout(id, name);
    };

    const handleMenuAction = async (e, action, workout) => {
        e.stopPropagation();
        setActiveCardMenu(null);

        if (action === 'delete') {
            if (window.confirm(`Tem certeza que deseja excluir "${workout.name}"?`)) {
                try {
                    await deleteDoc(doc(db, 'workout_templates', workout.id));
                    setWorkouts(prev => prev.filter(w => w.id !== workout.id));
                } catch (err) { alert(err.message); }
            }
        } else if (action === 'duplicate') {
            const newWorkoutData = {
                name: `${workout.name} (Cópia)`,
                exercises: workout.exercises || [],
                category: workout.category,
                estimatedDuration: workout.duration,
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'workout_templates'), newWorkoutData);
            window.location.reload();
        } else if (action === 'edit') {
            onNavigateToCreate(workout);
        }
    };


    // --- RENDER ---
    return (
        <div className="min-h-screen pb-32 pt-[calc(1rem+env(safe-area-inset-top))] px-4 lg:px-8 w-full max-w-5xl mx-auto">

            {/* 1. HEADER & SEARCH */}
            <div className="space-y-8 pt-6 mb-8">
                {/* Top Bar - Hide if Trainer Mode */}
                {!isTrainerMode && (
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                Meus Treinos
                            </h1>
                            <p className="text-slate-400 text-base">
                                Gerencie suas fichas de treino
                            </p>
                        </div>

                        <RippleButton
                            onClick={() => onNavigateToCreate(null, { targetUserId: user.uid })}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span className="hidden sm:inline">Novo Treino</span>
                            <span className="sm:hidden">Novo</span>
                        </RippleButton>
                    </div>
                )}

                {/* Stats Grid - Hide if Trainer Mode */}
                {!isTrainerMode && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Workouts */}
                        <PremiumCard className="p-5 flex items-center gap-3">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                                <Dumbbell size={22} className="text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{workouts.length}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Treinos</p>
                            </div>
                        </PremiumCard>

                        {/* This Week (Static Mock 4) */}
                        <PremiumCard className="p-5 flex flex-col justify-center">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-2">
                                <Calendar size={22} className="text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">4</p>
                            <p className="text-xs text-slate-400">Esta semana</p>
                        </PremiumCard>

                        {/* Total Exercises */}
                        <PremiumCard className="p-5 flex flex-col justify-center">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-2">
                                <Play size={22} className="text-purple-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {workouts.reduce((acc, w) => acc + w.exercisesCount, 0)}
                            </p>
                            <p className="text-xs text-slate-400">Exercícios</p>
                        </PremiumCard>

                        {/* Last Workout (Letter) */}
                        <PremiumCard className="p-5 flex flex-col justify-center">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-2">
                                <Flame size={22} className="text-yellow-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">A</p>
                            <p className="text-xs text-slate-400">Último treino</p>
                        </PremiumCard>
                    </div>
                )}

                {/* New: Source Tabs - Hide if Trainer Mode (since trainer sees all relevant) */}
                {!isTrainerMode && (
                    <div className="flex p-1 bg-slate-900/50 rounded-xl mb-6 border border-slate-800 backdrop-blur-sm">
                        {['all', 'meus', 'personal'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setSourceFilter(filter)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${sourceFilter === filter
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {filter === 'all' ? 'Todos' : filter === 'meus' ? 'Meus Treinos' : 'Personal Play'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search Bar */}
                <PremiumCard className="p-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nome ou músculo..."
                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500 rounded-xl transition-all"
                        />
                    </div>
                </PremiumCard>
            </div>

            {/* 2. FILTERS (Keeping logic concise) */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border whitespace-nowrap ${selectedFilter === filter.id
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* 3. WORKOUTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map((workout, idx) => (
                        <PremiumCard
                            key={workout.id}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => handleCardClick(workout.id, workout.name)}
                            className={`bg-slate-900/40 hover:border-cyan-500/30 group p-5 transition-all ${selectedWorkout === workout.id ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : ''}`}
                        >
                            {/* --- Card Header --- */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 text-white text-xl font-bold">
                                        {workout.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Title & Tags */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight mb-1.5">{workout.name}</h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {/* Coach Badge */}
                                            {workout.assignedByTrainer && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                                    <Crown size={10} strokeWidth={3} />
                                                    COACH
                                                </span>
                                            )}
                                            {workout.muscleGroups.map((tag, i) => (
                                                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700/50">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu */}
                                <div className="relative">
                                    <RippleButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveCardMenu(activeCardMenu === workout.id ? null : workout.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors card-menu-btn"
                                    >
                                        <MoreVertical size={20} />
                                    </RippleButton>

                                    {/* Dropdown */}
                                    {activeCardMenu === workout.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveCardMenu(null); }} />
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={(e) => handleMenuAction(e, 'edit', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"><Edit2 size={16} /> Editar</button>
                                                <button onClick={(e) => handleMenuAction(e, 'duplicate', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Copy size={16} /> Duplicar</button>
                                                <div className="h-px bg-slate-800" />
                                                <button onClick={(e) => handleMenuAction(e, 'delete', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={16} /> Excluir</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* --- Stats Line --- */}
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-6 pl-1">
                                <span className="flex items-center gap-1.5">
                                    <Dumbbell size={14} /> {workout.exercisesCount} exercícios
                                </span>
                                <span>•</span>
                                <span>Último: {workout.lastPerformed}</span>
                            </div>

                            {/* --- Actions --- */}
                            <div className="flex gap-3">
                                <RippleButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedWorkout(selectedWorkout === workout.id ? null : workout.id);
                                    }}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold transition-colors"
                                >
                                    {selectedWorkout === workout.id ? 'Ocultar' : 'Ver Exercícios'}
                                </RippleButton>

                                <RippleButton
                                    onClick={(e) => handleCardClick(workout.id, workout.name)}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:to-blue-500 rounded-xl text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                                >
                                    <Play size={14} fill="currentColor" /> INICIAR
                                </RippleButton>
                            </div>

                            {/* --- Expandable List (Accordion) --- */}
                            <AnimatePresence>
                                {selectedWorkout === workout.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
                                            {/* Real Exercises List */}
                                            {workout.exercises && workout.exercises.length > 0 ? (
                                                workout.exercises.map((exercise, i) => (
                                                    <ExerciseCard
                                                        key={i}
                                                        name={exercise.name}
                                                        muscleGroup={exercise.group || 'Geral'}
                                                        sets={exercise.target ? exercise.target.split('x')[0] : '?'}
                                                        lastReps={exercise.target || '-'}
                                                        lastWeight={null} // We don't have weight in template, only in history
                                                        onPress={() => setEditingExercise({ workoutId: workout.id, index: i, data: exercise })}
                                                    />
                                                ))
                                            ) : (
                                                <p className="text-sm text-slate-500 text-center py-4">Nenhum exercício cadastrado.</p>
                                            )}
                                            {/* Note: In real app, we would map `workout.exercises` if detailed. */}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </PremiumCard>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center opacity-50">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum treino encontrado</h3>
                        <p className="text-slate-500">Tente outra busca.</p>
                    </div>
                )}
            </div>



            {/* --- Edit Modal --- */}
            <AnimatePresence>
                {editingExercise && (
                    <EditExerciseModal
                        exercise={editingExercise}
                        onClose={() => setEditingExercise(null)}
                        onSave={(data) => {

                            // Update logic here
                        }}
                    />
                )}
            </AnimatePresence>

        </div>
    );
}
