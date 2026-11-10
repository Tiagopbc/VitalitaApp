/**
 * useWorkoutOrdering.js
 * Modo "Ordem": mover treinos ativos para cima e para baixo, salvar a nova
 * ordem pelo workoutService e, se falhar, restaurar a ordem do servidor.
 * Movido de WorkoutsPage (D19) sem mudança.
 */
import { useState } from 'react';
import { notify } from '../../utils/notifyStore';
import { reorderActiveWorkouts } from './workoutList';

export function useWorkoutOrdering({ workouts, setWorkouts, user, onEnterOrganizing }) {
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    /** Ao entrar no modo, limpa busca, filtro, card aberto e menu (onEnterOrganizing). */
    const toggleOrganizing = () => {
        setIsOrganizing(current => {
            const next = !current;
            if (next) {
                onEnterOrganizing();
            }
            return next;
        });
    };

    const moveWorkout = async (workoutId, direction) => {
        if (savingOrder) return;

        const normalized = reorderActiveWorkouts(workouts, workoutId, direction);
        if (!normalized) return;
        const orderById = new Map(normalized.map(workout => [workout.id, workout]));

        setWorkouts(current => current.map(workout => orderById.get(workout.id) || workout));
        setSavingOrder(true);

        try {
            const { workoutService } = await import('../../services/workoutService');
            await workoutService.saveTemplateOrder(normalized);
        } catch (error) {
            console.error('Erro ao salvar ordem dos treinos:', error);
            notify.error('Não foi possível salvar a nova ordem.');

            try {
                const { workoutService } = await import('../../services/workoutService');
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

    return { isOrganizing, savingOrder, toggleOrganizing, moveWorkout };
}
