/**
 * useWorkoutTemplates.js
 * A lista de fichas do usuário, formatada para os cards, com `loadWorkouts`
 * para recarregar (forceRefresh ignora o cache do workoutService).
 *
 * A carga inicial é uma promessa dentro do próprio efeito, com o setState no
 * `.then`: antes o efeito chamava loadWorkouts() e o lint não conseguia
 * provar que o setState vinha depois de um await (warning do D19). A busca
 * e a formatação são as mesmas, compartilhadas com loadWorkouts.
 */
import { useCallback, useEffect, useState } from 'react';
import { formatWorkoutTemplate } from './workoutList';

async function fetchWorkoutCards(user, forceRefresh) {
    // CACHED FETCH
    const { workoutService } = await import('../../services/workoutService');
    const loadedWorkouts = await workoutService.getTemplates(user.uid, forceRefresh);
    return loadedWorkouts.map(formatWorkoutTemplate);
}

export function useWorkoutTemplates(user) {
    const [workouts, setWorkouts] = useState([]);

    const loadWorkouts = useCallback(async (forceRefresh = false) => {
        try {
            setWorkouts(await fetchWorkoutCards(user, forceRefresh));
        } catch (error) {
            console.error("Error fetching workouts:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchWorkoutCards(user, false)
            .then(setWorkouts)
            .catch(error => console.error("Error fetching workouts:", error));
    }, [user]);

    return { workouts, setWorkouts, loadWorkouts };
}
