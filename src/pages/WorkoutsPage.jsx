/**
 * WorkoutsPage.jsx
 * Exibe uma grade de modelos de treino disponíveis para o usuário.
 * Suporta pesquisa, filtragem (por empurrar/puxar/pernas/etc) e classificação de modelos.
 */
import React, { useState, useEffect } from 'react';
import { getFirestoreDeps } from '../firebaseDb';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Plus,
    Dumbbell,
    Crown,
    MoreVertical,
    Play,
    Edit2,
    Copy,
    Trash2,
    Archive,
    ArchiveRestore,
    Activity,
    ArrowDown,
    ArrowUp,
    Check,
    ListOrdered
} from 'lucide-react';

import { Button } from '../components/design-system/Button';
import { EmptyState } from '../components/design-system/EmptyState';
import { PageHeader } from '../components/design-system/PageHeader';
import { PremiumCard } from '../components/design-system/PremiumCard';
import { AddCardioModal } from '../components/AddCardioModal';
import { ConfirmDialog } from '../components/design-system/ConfirmDialog';
import { normalizeActiveWorkoutOrder, sortWorkoutTemplates } from '../utils/workoutTemplateOrder';
import { toast } from 'sonner';
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
    const [isAddCardioOpen, setIsAddCardioOpen] = useState(false);
    const [workoutPendingDelete, setWorkoutPendingDelete] = useState(null);
    const [deletingWorkout, setDeletingWorkout] = useState(false);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    
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
                    completedToday: false,
                    isArchived: !!data.isArchived,
                    displayOrder: Number.isInteger(data.displayOrder) ? data.displayOrder : null
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
            if (target && target.closest && (target.closest('.card-menu-btn') || target.closest('.card-menu-dropdown'))) return;
            setActiveCardMenu(null);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu]);


    // --- FILTER LOGIC ---
    const filteredWorkouts = sortWorkoutTemplates(workouts.filter(workout => {
        // 1. Search
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));

        // 2. Source Filter (My vs. Personal vs. Archived)
        let matchesSource = true;
        
        if (sourceFilter === 'arquivados') {
            // Só mostra arquivados
            matchesSource = workout.isArchived;
        } else {
            // Em todas as outras abas, ESCONDE os arquivados
            if (workout.isArchived) return false;
            
            if (sourceFilter === 'meus') {
                matchesSource = workout.createdBy === user.uid || !workout.createdBy;
            } else if (sourceFilter === 'personal') {
                matchesSource = workout.createdBy && workout.createdBy !== user.uid;
            }
        }

        return matchesSearch && matchesSource;
    }));

    // --- ACTIONS ---
    const handleCardClick = (id, name) => {
        if (isOrganizing) return;
        onNavigateToWorkout(id, name);
    };

    const toggleOrganizing = () => {
        setIsOrganizing(current => {
            const next = !current;
            if (next) {
                setSourceFilter('all');
                setSearchQuery('');
                setSelectedWorkout(null);
                setActiveCardMenu(null);
            }
            return next;
        });
    };

    const moveWorkout = async (workoutId, direction) => {
        if (savingOrder) return;

        const activeWorkouts = normalizeActiveWorkoutOrder(workouts);
        const currentIndex = activeWorkouts.findIndex(workout => workout.id === workoutId);
        const targetIndex = currentIndex + direction;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= activeWorkouts.length) return;

        const reordered = [...activeWorkouts];
        const [movedWorkout] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, movedWorkout);
        const normalized = reordered.map((workout, displayOrder) => ({ ...workout, displayOrder }));
        const orderById = new Map(normalized.map(workout => [workout.id, workout]));

        setWorkouts(current => current.map(workout => orderById.get(workout.id) || workout));
        setSavingOrder(true);

        try {
            const { workoutService } = await import('../services/workoutService');
            await workoutService.saveTemplateOrder(normalized);
        } catch (error) {
            console.error('Erro ao salvar ordem dos treinos:', error);
            toast.error('Não foi possível salvar a nova ordem.');

            try {
                const { workoutService } = await import('../services/workoutService');
                const freshWorkouts = await workoutService.getTemplates(user.uid, true);
                const freshById = new Map(freshWorkouts.map(workout => [workout.id, workout]));
                setWorkouts(current => current.map(workout => {
                    const fresh = freshById.get(workout.id);
                    return fresh
                        ? { ...workout, displayOrder: Number.isInteger(fresh.displayOrder) ? fresh.displayOrder : null }
                        : workout;
                }));
            } catch (refreshError) {
                console.error('Erro ao restaurar ordem dos treinos:', refreshError);
            }
        } finally {
            setSavingOrder(false);
        }
    };

    const handleMenuAction = async (e, action, workout) => {
        e.stopPropagation();
        setActiveCardMenu(null);

        if (action === 'delete') {
            setWorkoutPendingDelete(workout);
        } else if (action === 'duplicate') {
            const newWorkoutData = {
                name: `${workout.name} (Cópia)`,
                exercises: workout.exercises || [],
                category: workout.category,
                estimatedDuration: workout.duration,
                userId: user.uid,
                createdBy: user.uid,
                assignedByTrainer: false,
                displayOrder: workouts.filter(workout => !workout.isArchived).length
            };

            try {
                const { db, collection, addDoc, serverTimestamp } = await getFirestoreDeps();
                const docRef = await addDoc(collection(db, 'workout_templates'), {
                    ...newWorkoutData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                
                // Limpar cache após mutação
                const { workoutService } = await import('../services/workoutService');
                workoutService.clearCache();

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
                        completedToday: false,
                        isArchived: false,
                        displayOrder: newWorkoutData.displayOrder
                    },
                    ...prev
                ]));
                toast.success("Treino duplicado.");
            } catch (err) {
                toast.error(err.message || "Erro ao duplicar treino.");
            }
        } else if (action === 'edit') {
            onNavigateToCreate(workout);
        } else if (action === 'archive') {
            try {
                const { db, doc, updateDoc } = await getFirestoreDeps();
                await updateDoc(doc(db, 'workout_templates', workout.id), {
                    isArchived: true
                });
                // Limpar cache após mutação
                const { workoutService } = await import('../services/workoutService');
                workoutService.clearCache();

                setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, isArchived: true } : w));
                toast.success("Treino arquivado.");
            } catch (err) { toast.error(err.message || "Erro ao arquivar treino."); }
        } else if (action === 'unarchive') {
            try {
                const { db, doc, updateDoc } = await getFirestoreDeps();
                await updateDoc(doc(db, 'workout_templates', workout.id), {
                    isArchived: false
                });
                // Limpar cache após mutação
                const { workoutService } = await import('../services/workoutService');
                workoutService.clearCache();

                setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, isArchived: false } : w));
                toast.success("Treino desarquivado.");
            } catch (err) { toast.error(err.message || "Erro ao desarquivar treino."); }
        }
    };

    const confirmDeleteWorkout = async () => {
        if (!workoutPendingDelete) return;
        setDeletingWorkout(true);
        try {
            const { db, doc, deleteDoc } = await getFirestoreDeps();
            await deleteDoc(doc(db, 'workout_templates', workoutPendingDelete.id));

            const { workoutService } = await import('../services/workoutService');
            workoutService.clearCache();

            setWorkouts(prev => prev.filter(w => w.id !== workoutPendingDelete.id));
            toast.success("Treino excluído.");
            setWorkoutPendingDelete(null);
        } catch (err) {
            toast.error(err.message || "Erro ao excluir treino.");
        } finally {
            setDeletingWorkout(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen pb-48 pt-2 px-4 lg:px-8 w-full max-w-5xl mx-auto lg:pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pb-32">

            {/* 1. HEADER & SEARCH */}
            <div className="space-y-6 pt-2 mb-8 lg:space-y-8 lg:pt-6">
                {/* Top Bar - Hide if Trainer Mode */}
                {!isTrainerMode && (
                    <PageHeader
                        title="Meus Treinos"
                        description="Gerencie suas fichas, modelos do personal e treinos arquivados."
                        icon={<Dumbbell size={22} />}
                        action={isOrganizing ? (
                            <Button
                                size="sm"
                                onClick={toggleOrganizing}
                                disabled={savingOrder}
                                className="w-full rounded-xl sm:w-auto"
                                leftIcon={<Check size={16} />}
                            >
                                Concluir
                            </Button>
                        ) : (
                            <div className="flex w-full gap-2 sm:w-auto">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsAddCardioOpen(true)}
                                    className="flex-1 rounded-xl px-2 sm:flex-none sm:px-4"
                                    leftIcon={<Activity size={16} />}
                                >
                                    Cardio
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={toggleOrganizing}
                                    className="flex-1 rounded-xl px-2 sm:flex-none sm:px-4"
                                    leftIcon={<ListOrdered size={16} />}
                                >
                                    Ordem
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onNavigateToCreate(null, { targetUserId: user.uid })}
                                    className="flex-1 rounded-xl px-2 sm:flex-none sm:px-4"
                                    leftIcon={<Plus size={16} />}
                                >
                                    Novo
                                </Button>
                            </div>
                        )}
                        className="mb-0"
                    />
                )}



                {/* New: Source Tabs - Hide if Trainer Mode (since trainer sees all relevant) */}
                {!isTrainerMode && !isOrganizing && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/50 rounded-xl mb-6 border border-slate-800 backdrop-blur-sm sm:grid-cols-4">
                        {['all', 'meus', 'personal', 'arquivados'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setSourceFilter(filter)}
                                className={`min-w-0 py-2 px-2 rounded-lg text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${sourceFilter === filter
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {filter === 'all' ? 'Todos' : filter === 'meus' ? 'Meus Treinos' : filter === 'personal' ? 'Personal Play' : 'Arquivados'}
                            </button>
                        ))}
                    </div>
                )}

                {isOrganizing ? (
                    <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3 text-cyan-300">
                            <ListOrdered size={20} className="shrink-0" />
                            <span className="truncate text-sm font-semibold">Ordem dos treinos ativos</span>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-500">
                            {savingOrder ? 'Salvando...' : `${filteredWorkouts.length} treinos`}
                        </span>
                    </div>
                ) : (
                    <PremiumCard className="p-0">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nome ou músculo..."
                                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500 rounded-xl transition-colors"
                            />
                        </div>
                    </PremiumCard>
                )}
            </div>



            {/* 3. WORKOUTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map((workout, idx) => (
                        <PremiumCard
                            key={workout.id}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => handleCardClick(workout.id, workout.name)}
                            className={`relative bg-slate-900/40 hover:border-cyan-500/30 group p-5 transition-all ${selectedWorkout === workout.id ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : ''} ${activeCardMenu === workout.id ? 'z-50' : 'z-0'}`}
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

                                {/* Menu / order controls */}
                                {isOrganizing ? (
                                    <div className="flex shrink-0 flex-col gap-1">
                                        <Button variant="unstyled" haptic="medium"
                                            aria-label={`Mover ${workout.name} para cima`}
                                            title="Mover para cima"
                                            disabled={idx === 0 || savingOrder}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void moveWorkout(workout.id, -1);
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 disabled:cursor-not-allowed disabled:opacity-25"
                                        >
                                            <ArrowUp size={18} />
                                        </Button>
                                        <Button variant="unstyled" haptic="medium"
                                            aria-label={`Mover ${workout.name} para baixo`}
                                            title="Mover para baixo"
                                            disabled={idx === filteredWorkouts.length - 1 || savingOrder}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void moveWorkout(workout.id, 1);
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 disabled:cursor-not-allowed disabled:opacity-25"
                                        >
                                            <ArrowDown size={18} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Button variant="unstyled" haptic="medium"
                                            aria-label={`Abrir opções de ${workout.name}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveCardMenu(activeCardMenu === workout.id ? null : workout.id);
                                            }}
                                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors card-menu-btn"
                                        >
                                            <MoreVertical size={20} />
                                        </Button>

                                        {/* Dropdown */}
                                        {activeCardMenu === workout.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveCardMenu(null); }} />
                                                <div
                                                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden card-menu-dropdown"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <button onClick={(e) => handleMenuAction(e, 'edit', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"><Edit2 size={16} /> Editar</button>
                                                    <button onClick={(e) => handleMenuAction(e, 'duplicate', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Copy size={16} /> Duplicar</button>

                                                    {workout.isArchived ? (
                                                        <button onClick={(e) => handleMenuAction(e, 'unarchive', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><ArchiveRestore size={16} /> Desarquivar</button>
                                                    ) : (
                                                        <button onClick={(e) => handleMenuAction(e, 'archive', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Archive size={16} /> Arquivar</button>
                                                    )}

                                                    <div className="h-px bg-slate-800" />
                                                    <button onClick={(e) => handleMenuAction(e, 'delete', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={16} /> Excluir</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
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
                            {isOrganizing ? (
                                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Posição</span>
                                    <span className="text-sm font-bold text-cyan-300">{idx + 1}</span>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <Button variant="unstyled" haptic="medium"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWorkout(selectedWorkout === workout.id ? null : workout.id);
                                        }}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold transition-colors"
                                    >
                                        {selectedWorkout === workout.id ? 'Ocultar' : 'Ver Exercícios'}
                                    </Button>

                                    <Button variant="unstyled" haptic="medium"
                                        onClick={() => handleCardClick(workout.id, workout.name)}
                                        className="flex-1 py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:to-blue-500 rounded-xl text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Play size={14} fill="currentColor" /> INICIAR
                                    </Button>
                                </div>
                            )}

                            {/* --- Expandable List (Accordion) --- */}
                            <AnimatePresence>
                                {!isOrganizing && selectedWorkout === workout.id && (
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
                    <EmptyState
                        className="col-span-full"
                        icon={<Search size={28} />}
                        title="Nenhum treino encontrado"
                        description={searchQuery
                            ? 'Tente ajustar a busca ou revisar os filtros selecionados.'
                            : 'Crie sua primeira ficha para começar a organizar os treinos.'
                        }
                        action={!searchQuery && !isTrainerMode ? (
                            <Button
                                size="sm"
                                onClick={() => onNavigateToCreate(null, { targetUserId: user.uid })}
                                leftIcon={<Plus size={16} />}
                            >
                                Criar Treino
                            </Button>
                        ) : null}
                    />
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

            <AddCardioModal 
                isOpen={isAddCardioOpen} 
                onClose={() => setIsAddCardioOpen(false)} 
                user={user} 
            />

            <ConfirmDialog
                isOpen={Boolean(workoutPendingDelete)}
                title="Excluir treino?"
                description={`"${workoutPendingDelete?.name || 'Este treino'}" será removido das suas fichas. Essa ação não altera sessões já concluídas.`}
                confirmLabel="Excluir"
                loading={deletingWorkout}
                onConfirm={confirmDeleteWorkout}
                onCancel={() => setWorkoutPendingDelete(null)}
            />

        </div>
    );
}
