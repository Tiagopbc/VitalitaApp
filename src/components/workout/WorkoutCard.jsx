/**
 * WorkoutCard.jsx
 * Um card de Meus Treinos: avatar, nome e selos (COACH, CÓPIA, grupos), o menu
 * de opções ou as setas do modo Ordem, a linha de estatísticas, os botões Ver
 * Exercícios e INICIAR e a lista de exercícios expansível. JSX movido de
 * WorkoutsPage (D19); o estado vem dos hooks em src/hooks/workouts/.
 */
import React from 'react';
import {
    Archive,
    ArchiveRestore,
    ArrowDown,
    ArrowUp,
    Copy,
    Crown,
    Dumbbell,
    Edit2,
    MoreVertical,
    Play,
    Trash2
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { PremiumCard } from '../design-system/PremiumCard';
import { isCopyName } from '../../utils/workoutCopyName';
import { usePresence } from '../../hooks/usePresence';

const ExerciseCard = React.lazy(() => import('./ExerciseCard').then(module => ({ default: module.ExerciseCard })));

export function WorkoutCard({
    workout,
    idx,
    total,
    isOrganizing,
    savingOrder,
    isSelected,
    isMenuOpen,
    onOpen,
    onToggleMenu,
    onCloseMenu,
    onMenuAction,
    onMove,
    onToggleExpand,
    onEditExercise
}) {
    // Sanfona da lista de exercícios: entra e sai em CSS (.vit-expand e
    // .vit-collapse); usePresence segura a montagem durante a saída.
    const exercisesPanel = usePresence(!isOrganizing && isSelected, 250);

    return (
        <PremiumCard
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={onOpen}
            className={`relative bg-slate-900/40 hover:border-cyan-500/30 group p-5 transition-all ${isSelected ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : ''} ${isMenuOpen ? 'z-50' : 'z-0'}`}
        >
            {/* --- Card Header --- */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 text-on-color text-xl font-bold">
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
                                void onMove(-1);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                            <ArrowUp size={18} />
                        </Button>
                        <Button variant="unstyled" haptic="medium"
                            aria-label={`Mover ${workout.name} para baixo`}
                            title="Mover para baixo"
                            disabled={idx === total - 1 || savingOrder}
                            onClick={(e) => {
                                e.stopPropagation();
                                void onMove(1);
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
                                onToggleMenu();
                            }}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors card-menu-btn"
                        >
                            <MoreVertical size={20} />
                        </Button>

                        {/* Dropdown */}
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onCloseMenu(); }} />
                                <div
                                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden card-menu-dropdown"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <button onClick={(e) => onMenuAction(e, 'edit', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"><Edit2 size={16} /> Editar</button>
                                    <button onClick={(e) => onMenuAction(e, 'duplicate', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Copy size={16} /> Duplicar</button>

                                    {workout.isArchived ? (
                                        <button onClick={(e) => onMenuAction(e, 'unarchive', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><ArchiveRestore size={16} /> Desarquivar</button>
                                    ) : (
                                        <button onClick={(e) => onMenuAction(e, 'archive', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Archive size={16} /> Arquivar</button>
                                    )}

                                    <div className="h-px bg-slate-800" />
                                    <button onClick={(e) => onMenuAction(e, 'delete', workout)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={16} /> Excluir</button>
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
                            onToggleExpand();
                        }}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold transition-colors"
                    >
                        {isSelected ? 'Ocultar' : 'Ver Exercícios'}
                    </Button>

                    <Button variant="unstyled" haptic="medium"
                        onClick={onOpen}
                        className="flex-1 py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:to-blue-500 rounded-xl text-on-color text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                        <Play size={14} fill="currentColor" /> INICIAR
                    </Button>
                </div>
            )}

            {/* --- Expandable List (Accordion) --- */}
            {exercisesPanel.mounted && (
                <div className={exercisesPanel.leaving ? 'vit-collapse' : 'vit-expand'}>
                    <div className="min-h-0 overflow-hidden">
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
                                            muscleGroup={exercise.muscleGroup || exercise.group || 'Geral'}
                                            sets={exercise.sets || (exercise.target ? exercise.target.split('x')[0] : '?')}
                                            lastReps={exercise.reps || exercise.target || '-'}
                                            lastWeight={null} // We don't have weight in template, only in history
                                            onPress={() => onEditExercise({ workoutId: workout.id, index: i, data: exercise })}
                                        />
                                    ))}
                                </React.Suspense>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">Nenhum exercício cadastrado.</p>
                            )}
                            {/* Note: In real app, we would map `workout.exercises` if detailed. */}
                        </div>
                    </div>
                </div>
            )}
        </PremiumCard>
    );
}
