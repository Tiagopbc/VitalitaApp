/**
 * workoutList.js
 * Funções puras da lista de fichas (Meus Treinos): formatar a ficha vinda do
 * Firestore, filtrar, reordenar os ativos e montar e posicionar a cópia de
 * um treino duplicado. Extraídas de WorkoutsPage (D19) sem mudar a lógica.
 */
import { normalizeActiveWorkoutOrder, sortWorkoutTemplates } from '../../utils/workoutTemplateOrder';
import { copyInsertIndex } from '../../utils/workoutCopyName';
import { matchesSourceFilter } from '../../utils/workoutSourceFilter';

/** Ficha do Firestore no formato que o card usa. */
export function formatWorkoutTemplate(data) {
    return {
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
    };
}

/** Busca por nome ou grupo muscular, filtro de origem e a ordem das fichas. */
export function filterWorkouts(workouts, searchQuery, sourceFilter, uid) {
    return sortWorkoutTemplates(workouts.filter(workout => {
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));

        return matchesSearch && matchesSourceFilter(workout, sourceFilter, uid);
    }));
}

/**
 * Move um treino ativo uma posição (direction -1 ou 1) e devolve os ativos
 * renumerados; null quando não há para onde mover.
 */
export function reorderActiveWorkouts(workouts, workoutId, direction) {
    const activeWorkouts = normalizeActiveWorkoutOrder(workouts);
    const currentIndex = activeWorkouts.findIndex(workout => workout.id === workoutId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= activeWorkouts.length) return null;

    const reordered = [...activeWorkouts];
    const [movedWorkout] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedWorkout);
    return reordered.map((workout, displayOrder) => ({ ...workout, displayOrder }));
}

/** O card da cópia recém-criada, antes de recarregar a lista. */
export function buildWorkoutCopy({ id, name, workout, uid, displayOrder }) {
    const exercises = workout.exercises || [];
    return {
        id,
        name,
        exercisesCount: exercises.length,
        exercises,
        duration: workout.duration || '45-60min',
        muscleGroups: workout.muscleGroups || [],
        lastPerformed: 'Nunca',
        lastPerformedDate: null,
        frequency: '1x/sem',
        timesPerformed: 0,
        isFavorite: false,
        category: workout.category || 'fullbody',
        createdBy: uid,
        assignedByTrainer: false,
        completedToday: false,
        isArchived: false,
        displayOrder
    };
}

/**
 * Ativos renumerados com a cópia no fim do bloco de cópias daquele treino —
 * cronológico, "(Cópia)" e depois "(Cópia 2)".
 */
export function placeCopyInOrder(workouts, workout, copy) {
    const activeWorkouts = normalizeActiveWorkoutOrder(workouts);
    const originalIndex = activeWorkouts.findIndex(item => item.id === workout.id);
    const reordered = [...activeWorkouts];
    reordered.splice(copyInsertIndex(activeWorkouts, originalIndex, workout.name), 0, copy);
    return reordered.map((item, displayOrder) => ({ ...item, displayOrder }));
}
