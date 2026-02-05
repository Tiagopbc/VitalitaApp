/**
 * WorkoutsPage.jsx
 * Exibe uma grade de modelos de treino disponíveis para o usuário.
 * Suporta pesquisa, filtragem (por empurrar/puxar/pernas/etc) e classificação de modelos.
 */
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseDb';
import { collection, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Plus,
    Dumbbell,
    Crown,
    Calendar,
    MoreVertical,
    Play,
    Flame,
    Edit2,
    Copy,
    Trash2
} from 'lucide-react';

import { RippleButton } from '../components/design-system/RippleButton';
import { PremiumCard } from '../components/design-system/PremiumCard';
const ExerciseCard = React.lazy(() => import('../components/workout/ExerciseCard').then(module => ({ default: module.ExerciseCard })));
const EditExerciseModal = React.lazy(() => import('../components/workout/EditExerciseModal').then(module => ({ default: module.EditExerciseModal })));



export default function WorkoutsPage({ onNavigateToCreate, onNavigateToWorkout, user, isTrainerMode }) {
    const [workouts, setWorkouts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // New: Source Filter (All / My / Personal)
    const [sourceFilter, setSourceFilter] = useState('all');

    // UI State
    const [selectedWorkout, setSelectedWorkout] = useState(null); // ID of expanded workout
    const [editingExercise, setEditingExercise] = useState(null); // { workoutId, index, data }

    // Menus
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    useEffect(() => {
        async function fetchWorkouts() {
            try {
                // CACHED FETCH
                const { workoutService } = await import('../services/workoutService');
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
            }
        }
        void fetchWorkouts();
    }, [user]);

    // --- CLICK OUTSIDE HANDLERS ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (!activeCardMenu) return;
            const target = event.target;
            if (target && target.closest && target.closest('.card-menu-btn')) return;
            setActiveCardMenu(null);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu]);


    // --- FILTER LOGIC ---
    const filteredWorkouts = workouts.filter(workout => {
        // 1. Search
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));

        // 2. Source Filter (My vs. Personal)
        let matchesSource = true;
        if (sourceFilter === 'meus') {
            matchesSource = workout.createdBy === user.uid || !workout.createdBy;
        } else if (sourceFilter === 'personal') {
            matchesSource = workout.createdBy && workout.createdBy !== user.uid;
        }

        return matchesSearch && matchesSource;
    }).sort((a, b) => {
        // Default sort by recent
        if (!a.lastPerformedDate) return 1;
        if (!b.lastPerformedDate) return -1;
        return new Date(b.lastPerformedDate) - new Date(a.lastPerformedDate);
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

            try {
                const docRef = await addDoc(collection(db, 'workout_templates'), newWorkoutData);
                setWorkouts(prev => ([
                    {
                        id: docRef.id,
                        name: newWorkoutData.name,
                        exercisesCount: newWorkoutData.exercises?.length || 0,
                        exercises: newWorkoutData.exercises || [],
                        duration: newWorkoutData.estimatedDuration || '45-60min',
                        muscleGroups: workout.muscleGroups || [],
                        lastPerformed: 'Nunca',
                        lastPerformedDate: null,
                        frequency: '1x/sem',
                        timesPerformed: 0,
                        isFavorite: false,
                        category: newWorkoutData.category || 'fullbody',
                        createdBy: user.uid,
                        assignedByTrainer: false,
                        completedToday: false
                    },
                    ...prev
                ]));
            } catch (err) {
                alert(err.message);
            }
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
                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 text-white text-xl font-bold">
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
                                    onClick={() => handleCardClick(workout.id, workout.name)}
                                    className="flex-1 py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:to-blue-500 rounded-xl text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
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
                                                <React.Suspense fallback={
                                                    <div className="space-y-3">
                                                        {workout.exercises.map((_, i) => (
                                                            <div key={i} className="h-16 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
                                                        ))}
                                                    </div>
                                                }>
                                                    {workout.exercises.map((exercise, i) => (
                                                        <ExerciseCard
                                                            key={i}
                                                            name={exercise.name}
                                                            muscleGroup={exercise.group || 'Geral'}
                                                            sets={exercise.target ? exercise.target.split('x')[0] : '?'}
                                                            lastReps={exercise.target || '-'}
                                                            lastWeight={null} // We don't have weight in template, only in history
                                                            onPress={() => setEditingExercise({ workoutId: workout.id, index: i, data: exercise })}
                                                        />
                                                    ))}
                                                </React.Suspense>
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
                    <React.Suspense fallback={
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                        </div>
                    }>
                        <EditExerciseModal
                            exercise={editingExercise}
                            onClose={() => setEditingExercise(null)}
                            onSave={() => {

                                // Update logic here
                            }}
                        />
                    </React.Suspense>
                )}
            </AnimatePresence>

        </div>
    );
}
