/**
 * WorkoutsPage.jsx
 * Exibe uma grade de modelos de treino disponíveis para o usuário.
 * Suporta pesquisa, filtragem (por empurrar/puxar/pernas/etc) e classificação de modelos.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
    ListOrdered,
    Sparkles
} from 'lucide-react';

import { Button } from '../components/design-system/Button';
import { EmptyState } from '../components/design-system/EmptyState';
import { PageHeader } from '../components/design-system/PageHeader';
import { PremiumCard } from '../components/design-system/PremiumCard';
import { AddCardioModal } from '../components/AddCardioModal';
import { StarterWorkoutsLibrary } from '../components/workout/StarterWorkoutsLibrary';
import { ConfirmDialog } from '../components/design-system/ConfirmDialog';
import { nextDisplayOrder, normalizeActiveWorkoutOrder, sortWorkoutTemplates } from '../utils/workoutTemplateOrder';
import { buildCopyName, copyInsertIndex, isCopyName } from '../utils/workoutCopyName';
import { countBySourceFilter, matchesSourceFilter } from '../utils/workoutSourceFilter';
import { SourceFilterChips } from '../components/workout/SourceFilterChips';
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

    // Biblioteca de fichas modelo (onboarding / começo rápido)
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [cloningStarterId, setCloningStarterId] = useState(null);

    const loadWorkouts = useCallback(async (forceRefresh = false) => {
        try {
            // CACHED FETCH
            const { workoutService } = await import('../services/workoutService');
            const loadedWorkouts = await workoutService.getTemplates(user.uid, forceRefresh);

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
    }, [user]);

    useEffect(() => {
        void loadWorkouts();
    }, [loadWorkouts]);

    const handleCloneStarter = async (starter) => {
        setCloningStarterId(starter.id);
        try {
            const { workoutService } = await import('../services/workoutService');
            const exercises = starter.exercises.map((ex, i) => ({ ...ex, id: `${Date.now()}-${i}` }));
            await workoutService.createTemplate(
                {
                    name: starter.name,
                    exercises,
                    targetUserId: user.uid,
                    createdBy: user.uid
                },
                {
                    category: starter.category,
                    muscleGroups: starter.muscleGroups,
                    displayOrder: nextDisplayOrder(workouts)
                }
            );
            await loadWorkouts(true);
            toast.success('Treino adicionado às suas fichas.');
            setIsLibraryOpen(false);
        } catch (err) {
            toast.error(err.message || 'Erro ao adicionar o treino.');
        } finally {
            setCloningStarterId(null);
        }
    };

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
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));

        return matchesSearch && matchesSourceFilter(workout, sourceFilter, user.uid);
    }));

    const sourceCounts = countBySourceFilter(workouts, user.uid);

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

    /**
     * Duplica uma ficha pelo caminho único de escrita (`workoutService`) e
     * posiciona a cópia no fim do bloco de cópias daquele treino — cronológico,
     * "(Cópia)" e depois "(Cópia 2)". Entrar sempre logo abaixo do original
     * deixava a mais recente por cima da mais antiga.
     *
     * Sem o reposicionamento a cópia pulava para o topo da lista: ela era a
     * única com `displayOrder` definido, e `compareWorkoutTemplates` coloca
     * quem tem ordem antes de quem não tem.
     */
    const duplicateWorkout = async (workout) => {
        const { workoutService } = await import('../services/workoutService');
        const exercises = workout.exercises || [];
        const muscleGroups = workout.muscleGroups || [];
        const name = buildCopyName(workout.name, workouts.map(item => item.name));

        const newId = await workoutService.createTemplate(
            {
                name,
                exercises,
                targetUserId: user.uid,
                createdBy: user.uid
            },
            {
                category: workout.category || 'fullbody',
                estimatedDuration: workout.duration,
                muscleGroups,
                displayOrder: nextDisplayOrder(workouts)
            }
        );

        const copy = {
            id: newId,
            name,
            exercisesCount: exercises.length,
            exercises,
            duration: workout.duration || '45-60min',
            muscleGroups,
            lastPerformed: 'Nunca',
            lastPerformedDate: null,
            frequency: '1x/sem',
            timesPerformed: 0,
            isFavorite: false,
            category: workout.category || 'fullbody',
            createdBy: user.uid,
            assignedByTrainer: false,
            completedToday: false,
            isArchived: false,
            displayOrder: nextDisplayOrder(workouts)
        };

        setWorkouts(prev => [...prev, copy]);
        toast.success("Treino duplicado.");

        // Reordenar é um extra: se falhar, a cópia continua existindo no fim da
        // lista — não vale desfazer a duplicação nem alarmar o usuário.
        try {
            const activeWorkouts = normalizeActiveWorkoutOrder(workouts);
            const originalIndex = activeWorkouts.findIndex(item => item.id === workout.id);
            const reordered = [...activeWorkouts];
            reordered.splice(copyInsertIndex(activeWorkouts, originalIndex, workout.name), 0, copy);

            const normalized = reordered.map((item, displayOrder) => ({ ...item, displayOrder }));
            const orderById = new Map(normalized.map(item => [item.id, item]));

            setWorkouts(current => current.map(item => orderById.get(item.id) || item));
            await workoutService.saveTemplateOrder(normalized);
        } catch (orderError) {
            console.error('Erro ao posicionar a cópia na lista:', orderError);
        }
    };

    const handleMenuAction = async (e, action, workout) => {
        e.stopPropagation();
        setActiveCardMenu(null);

        if (action === 'delete') {
            setWorkoutPendingDelete(workout);
        } else if (action === 'duplicate') {
            try {
                await duplicateWorkout(workout);
            } catch (err) {
                toast.error(err.message || "Erro ao duplicar treino.");
            }
        } else if (action === 'edit') {
            onNavigateToCreate(workout);
        } else if (action === 'archive' || action === 'unarchive') {
            const isArchived = action === 'archive';
            try {
                const { workoutService } = await import('../services/workoutService');
                await workoutService.setTemplateArchived(workout.id, isArchived);

                setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, isArchived } : w));
                toast.success(isArchived ? "Treino arquivado." : "Treino desarquivado.");
            } catch (err) {
                toast.error(err.message || (isArchived ? "Erro ao arquivar treino." : "Erro ao desarquivar treino."));
            }
        }
    };

    const confirmDeleteWorkout = async () => {
        if (!workoutPendingDelete) return;
        setDeletingWorkout(true);
        try {
            const { workoutService } = await import('../services/workoutService');
            await workoutService.deleteTemplate(workoutPendingDelete.id);

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
        <div className="min-h-screen pb-8 pt-2 px-4 lg:px-8 w-full max-w-5xl mx-auto lg:pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pb-12">

            {/* 1. HEADER & SEARCH */}
            <div className="space-y-4 pt-2 mb-8 lg:space-y-5 lg:pt-6">
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
                        ) : null}
                        className="mb-0"
                    />
                )}

                {/* Bloco de ações: "Novo treino" em destaque + atalhos compactos.
                    Antes eram quatro botões dividindo a largura do celular, e o
                    rótulo de cada um ficava espremido contra o próprio ícone. */}
                {!isTrainerMode && !isOrganizing && (
                    <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-3 shadow-md">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                            <div className="grid grid-cols-3 gap-2 sm:flex-1 sm:order-1">
                                {[
                                    { id: 'modelos', label: 'Modelos', icon: <Sparkles size={17} />, onClick: () => setIsLibraryOpen(true) },
                                    { id: 'cardio', label: 'Cardio', icon: <Activity size={17} />, onClick: () => setIsAddCardioOpen(true) },
                                    { id: 'ordem', label: 'Ordem', icon: <ListOrdered size={17} />, onClick: toggleOrganizing }
                                ].map(shortcut => (
                                    <Button
                                        key={shortcut.id}
                                        variant="unstyled"
                                        haptic="light"
                                        onClick={shortcut.onClick}
                                        className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/70 hover:text-white sm:flex-row sm:gap-2"
                                    >
                                        <span className="text-cyan-400">{shortcut.icon}</span>
                                        <span className="text-[11px] font-semibold tracking-wide sm:text-xs">{shortcut.label}</span>
                                    </Button>
                                ))}
                            </div>

                            <Button
                                onClick={() => onNavigateToCreate(null, { targetUserId: user.uid })}
                                className="h-12 w-full rounded-2xl sm:order-2 sm:h-auto sm:w-auto sm:px-6"
                                leftIcon={<Plus size={18} />}
                            >
                                Novo treino
                            </Button>
                        </div>
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
                    <div className="overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-md">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nome ou músculo..."
                                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500 rounded-3xl transition-colors"
                            />
                        </div>

                        {!isTrainerMode && (
                            <SourceFilterChips
                                value={sourceFilter}
                                counts={sourceCounts}
                                onChange={setSourceFilter}
                            />
                        )}
                    </div>
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
                                            {/* Derivado do nome (ver workoutCopyName.js): o sufixo
                                                "(Cópia)" se perde no fim de um título longo, então o
                                                selo é o que de fato diferencia a cópia do original. */}
                                            {isCopyName(workout.name) && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                                                    <Copy size={10} strokeWidth={3} />
                                                    CÓPIA
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
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setIsLibraryOpen(true)}
                                    leftIcon={<Sparkles size={16} />}
                                >
                                    Ver modelos prontos
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onNavigateToCreate(null, { targetUserId: user.uid })}
                                    leftIcon={<Plus size={16} />}
                                >
                                    Criar Treino
                                </Button>
                            </div>
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

            <StarterWorkoutsLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onClone={handleCloneStarter}
                cloningId={cloningStarterId}
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
