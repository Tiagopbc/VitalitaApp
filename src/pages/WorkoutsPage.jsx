/**
 * WorkoutsPage.jsx
 * Meus Treinos: as fichas do usuário e as do personal, com busca, filtro de
 * origem, modo de ordenação, menu de cada card (editar, duplicar, arquivar,
 * excluir) e a biblioteca de modelos.
 *
 * Orquestrador fino (D19): estado e ações em src/hooks/workouts/, o topo e
 * cada card em src/components/workout/. Aqui ficam o card expandido, o
 * exercício em edição, a grade e os modais.
 */
import React, { useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { EmptyState } from '../components/design-system/EmptyState';
import { ConfirmDialog } from '../components/design-system/ConfirmDialog';
import { AddCardioModal } from '../components/AddCardioModal';
import { StarterWorkoutsLibrary } from '../components/workout/StarterWorkoutsLibrary';
import { WorkoutsToolbar } from '../components/workout/WorkoutsToolbar';
import { WorkoutCard } from '../components/workout/WorkoutCard';
import { useWorkoutTemplates } from '../hooks/workouts/useWorkoutTemplates';
import { useWorkoutFilters } from '../hooks/workouts/useWorkoutFilters';
import { useCardMenu } from '../hooks/workouts/useCardMenu';
import { useWorkoutOrdering } from '../hooks/workouts/useWorkoutOrdering';
import { useWorkoutActions } from '../hooks/workouts/useWorkoutActions';
import { usePresence } from '../hooks/usePresence';

const EditExerciseModal = React.lazy(() => import('../components/workout/EditExerciseModal').then(module => ({ default: module.EditExerciseModal })));

export default function WorkoutsPage({ onNavigateToCreate, onNavigateToWorkout, user, isTrainerMode }) {
    const { workouts, setWorkouts, loadWorkouts } = useWorkoutTemplates(user);
    const filters = useWorkoutFilters({ workouts, user });
    const { activeCardMenu, setActiveCardMenu } = useCardMenu();

    // UI State
    const [selectedWorkout, setSelectedWorkout] = useState(null); // ID of expanded workout
    const [editingExercise, setEditingExercise] = useState(null); // { workoutId, index, data }
    const [isAddCardioOpen, setIsAddCardioOpen] = useState(false);

    // O modal de exercício sai animado: usePresence o mantém montado durante a
    // saída, e `shownExercise` guarda os dados que já foram limpos ao fechar.
    const editPresence = usePresence(Boolean(editingExercise), 200);
    const [shownExercise, setShownExercise] = useState(editingExercise);
    if (editingExercise && editingExercise !== shownExercise) setShownExercise(editingExercise);

    const ordering = useWorkoutOrdering({
        workouts,
        setWorkouts,
        user,
        onEnterOrganizing: () => {
            filters.setSourceFilter('all');
            filters.setSearchQuery('');
            setSelectedWorkout(null);
            setActiveCardMenu(null);
        }
    });

    const actions = useWorkoutActions({
        workouts,
        setWorkouts,
        user,
        loadWorkouts,
        onNavigateToCreate,
        closeCardMenu: () => setActiveCardMenu(null)
    });

    const { isOrganizing, savingOrder } = ordering;
    const { filteredWorkouts } = filters;
    const createWorkout = () => onNavigateToCreate(null, { targetUserId: user.uid });

    const handleCardClick = (id, name) => {
        if (isOrganizing) return;
        onNavigateToWorkout(id, name);
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen pb-8 pt-2 px-4 lg:px-8 w-full max-w-5xl mx-auto lg:pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pb-12">
            <WorkoutsToolbar
                isTrainerMode={isTrainerMode}
                isOrganizing={isOrganizing}
                savingOrder={savingOrder}
                onToggleOrganizing={ordering.toggleOrganizing}
                onOpenLibrary={() => actions.setIsLibraryOpen(true)}
                onOpenCardio={() => setIsAddCardioOpen(true)}
                onCreate={createWorkout}
                workoutCount={filteredWorkouts.length}
                searchQuery={filters.searchQuery}
                onSearchChange={filters.setSearchQuery}
                sourceFilter={filters.sourceFilter}
                sourceCounts={filters.sourceCounts}
                onSourceFilterChange={filters.setSourceFilter}
            />

            {/* 3. WORKOUTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map((workout, idx) => (
                        <WorkoutCard
                            key={workout.id}
                            workout={workout}
                            idx={idx}
                            total={filteredWorkouts.length}
                            isOrganizing={isOrganizing}
                            savingOrder={savingOrder}
                            isSelected={selectedWorkout === workout.id}
                            isMenuOpen={activeCardMenu === workout.id}
                            onOpen={() => handleCardClick(workout.id, workout.name)}
                            onToggleMenu={() => setActiveCardMenu(activeCardMenu === workout.id ? null : workout.id)}
                            onCloseMenu={() => setActiveCardMenu(null)}
                            onMenuAction={actions.handleMenuAction}
                            onMove={(direction) => ordering.moveWorkout(workout.id, direction)}
                            onToggleExpand={() => setSelectedWorkout(selectedWorkout === workout.id ? null : workout.id)}
                            onEditExercise={setEditingExercise}
                        />
                    ))
                ) : (
                    <EmptyState
                        className="col-span-full"
                        icon={<Search size={28} />}
                        title="Nenhum treino encontrado"
                        description={filters.searchQuery
                            ? 'Tente ajustar a busca ou revisar os filtros selecionados.'
                            : 'Crie sua primeira ficha para começar a organizar os treinos.'
                        }
                        action={!filters.searchQuery && !isTrainerMode ? (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => actions.setIsLibraryOpen(true)}
                                    leftIcon={<Sparkles size={16} />}
                                >
                                    Ver modelos prontos
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={createWorkout}
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
            {editPresence.mounted && shownExercise && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <EditExerciseModal
                        exercise={shownExercise}
                        leaving={editPresence.leaving}
                        onClose={() => setEditingExercise(null)}
                        onSave={() => {

                            // Update logic here
                        }}
                    />
                </React.Suspense>
            )}

            <AddCardioModal
                isOpen={isAddCardioOpen}
                onClose={() => setIsAddCardioOpen(false)}
                user={user}
            />

            <StarterWorkoutsLibrary
                isOpen={actions.isLibraryOpen}
                onClose={() => actions.setIsLibraryOpen(false)}
                onClone={actions.handleCloneStarter}
                cloningId={actions.cloningStarterId}
            />

            <ConfirmDialog
                isOpen={Boolean(actions.workoutPendingDelete)}
                title="Excluir treino?"
                description={`"${actions.workoutPendingDelete?.name || 'Este treino'}" será removido das suas fichas. Essa ação não altera sessões já concluídas.`}
                confirmLabel="Excluir"
                loading={actions.deletingWorkout}
                onConfirm={actions.confirmDeleteWorkout}
                onCancel={() => actions.setWorkoutPendingDelete(null)}
            />
        </div>
    );
}
