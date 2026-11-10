/**
 * useWorkoutActions.js
 * Ações sobre as fichas: o menu de cada card (editar, duplicar, arquivar,
 * desarquivar, excluir com confirmação) e clonar uma ficha da biblioteca de
 * modelos. Toda escrita passa por workoutService (ver o skill
 * escrita-workout-templates). Movido de WorkoutsPage (D19) sem mudança.
 */
import { useState } from 'react';
import { notify } from '../../utils/notifyStore';
import { nextDisplayOrder } from '../../utils/workoutTemplateOrder';
import { buildCopyName } from '../../utils/workoutCopyName';
import { buildWorkoutCopy, placeCopyInOrder } from './workoutList';

export function useWorkoutActions({ workouts, setWorkouts, user, loadWorkouts, onNavigateToCreate, closeCardMenu }) {
    const [workoutPendingDelete, setWorkoutPendingDelete] = useState(null);
    const [deletingWorkout, setDeletingWorkout] = useState(false);
    // Biblioteca de fichas modelo (onboarding / começo rápido)
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [cloningStarterId, setCloningStarterId] = useState(null);

    const handleCloneStarter = async (starter) => {
        setCloningStarterId(starter.id);
        try {
            const { workoutService } = await import('../../services/workoutService');
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
            notify.success('Treino adicionado às suas fichas.');
            setIsLibraryOpen(false);
        } catch (err) {
            notify.error(err.message || 'Erro ao adicionar o treino.');
        } finally {
            setCloningStarterId(null);
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
        const { workoutService } = await import('../../services/workoutService');
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

        const copy = buildWorkoutCopy({ id: newId, name, workout, uid: user.uid, displayOrder: nextDisplayOrder(workouts) });

        setWorkouts(prev => [...prev, copy]);
        notify.success("Treino duplicado.");

        // Reordenar é um extra: se falhar, a cópia continua existindo no fim da
        // lista — não vale desfazer a duplicação nem alarmar o usuário.
        try {
            const normalized = placeCopyInOrder(workouts, workout, copy);
            const orderById = new Map(normalized.map(item => [item.id, item]));

            setWorkouts(current => current.map(item => orderById.get(item.id) || item));
            await workoutService.saveTemplateOrder(normalized);
        } catch (orderError) {
            console.error('Erro ao posicionar a cópia na lista:', orderError);
        }
    };

    const handleMenuAction = async (e, action, workout) => {
        e.stopPropagation();
        closeCardMenu();

        if (action === 'delete') {
            setWorkoutPendingDelete(workout);
        } else if (action === 'duplicate') {
            try {
                await duplicateWorkout(workout);
            } catch (err) {
                notify.error(err.message || "Erro ao duplicar treino.");
            }
        } else if (action === 'edit') {
            onNavigateToCreate(workout);
        } else if (action === 'archive' || action === 'unarchive') {
            const isArchived = action === 'archive';
            try {
                const { workoutService } = await import('../../services/workoutService');
                await workoutService.setTemplateArchived(workout.id, isArchived);

                setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, isArchived } : w));
                notify.success(isArchived ? "Treino arquivado." : "Treino desarquivado.");
            } catch (err) {
                notify.error(err.message || (isArchived ? "Erro ao arquivar treino." : "Erro ao desarquivar treino."));
            }
        }
    };

    const confirmDeleteWorkout = async () => {
        if (!workoutPendingDelete) return;
        setDeletingWorkout(true);
        try {
            const { workoutService } = await import('../../services/workoutService');
            await workoutService.deleteTemplate(workoutPendingDelete.id);

            setWorkouts(prev => prev.filter(w => w.id !== workoutPendingDelete.id));
            notify.success("Treino excluído.");
            setWorkoutPendingDelete(null);
        } catch (err) {
            notify.error(err.message || "Erro ao excluir treino.");
        } finally {
            setDeletingWorkout(false);
        }
    };

    return {
        workoutPendingDelete,
        setWorkoutPendingDelete,
        deletingWorkout,
        confirmDeleteWorkout,
        handleMenuAction,
        isLibraryOpen,
        setIsLibraryOpen,
        cloningStarterId,
        handleCloneStarter
    };
}
