/**
 * useWorkoutDraft.js
 * A ficha em edição: nome e lista de exercícios, vindos dos dados da
 * navegação (location.state) ou, ao recarregar a URL, de ?editId=.
 *
 * Dois ajustes do D18 que tiram setState síncrono de efeito: o "carregando"
 * da edição é derivado de qual editId já terminou de carregar, e o id dos
 * exercícios é dado na entrada da lista (withExerciseIds) em vez de num
 * efeito que corrigia a lista depois do primeiro render.
 */
import { useEffect, useState } from 'react';
import { workoutService } from '../../services/workoutService';
import { withExerciseIds } from './exerciseList';

export function useWorkoutDraft({ initialData, editId }) {
    const [workoutName, setWorkoutName] = useState(initialData?.name || '');
    const [exercises, setExercises] = useState(() => withExerciseIds(initialData?.exercises));
    const [editIdCarregado, setEditIdCarregado] = useState(null);

    const loadingDraft = !initialData && !!editId && editIdCarregado !== editId;

    // Initial Fetch for URL Refresh
    useEffect(() => {
        if (!initialData && editId) {
            workoutService.getWorkoutById(editId).then(data => {
                if (data) {
                    setWorkoutName(data.name);
                    setExercises(withExerciseIds(data.exercises));
                }
            }).finally(() => setEditIdCarregado(editId));
        }
    }, [initialData, editId]);

    /** Troca a ficha inteira (treino vindo da fila do PDF). */
    function replaceDraft(workout) {
        setWorkoutName(workout?.name || '');
        setExercises((workout?.exercises || []).map((ex, i) => ({ ...ex, id: `${Date.now()}-${i}` })));
    }

    return { workoutName, setWorkoutName, exercises, setExercises, loadingDraft, replaceDraft };
}
