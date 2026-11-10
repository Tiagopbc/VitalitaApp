/**
 * useWorkoutFilters.js
 * Busca por nome ou grupo muscular e filtro de origem (Todos, Meus Treinos,
 * Personal, Arquivados), com a contagem de cada filtro. Movido de
 * WorkoutsPage (D19) sem mudança.
 */
import { useState } from 'react';
import { countBySourceFilter } from '../../utils/workoutSourceFilter';
import { filterWorkouts } from './workoutList';

export function useWorkoutFilters({ workouts, user }) {
    const [searchQuery, setSearchQuery] = useState('');
    // Source Filter (All / My / Personal)
    const [sourceFilter, setSourceFilter] = useState('all');

    const filteredWorkouts = filterWorkouts(workouts, searchQuery, sourceFilter, user.uid);
    const sourceCounts = countBySourceFilter(workouts, user.uid);

    return { searchQuery, setSearchQuery, sourceFilter, setSourceFilter, filteredWorkouts, sourceCounts };
}
