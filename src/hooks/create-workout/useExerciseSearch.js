/**
 * useExerciseSearch.js
 * Sugestões do catálogo de exercícios para o formulário, com espera de 400 ms
 * entre teclas. Lógica movida de CreateWorkoutPage (D18) sem mudança.
 */
import { useEffect, useState } from 'react';
import { workoutService } from '../../services/workoutService';

export function useExerciseSearch(newExercise) {
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Efeito de Busca com Debounce
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Lógica:
            // 1. Se tivermos um grupo muscular selecionado, podemos buscar mesmo com nome vazio (para mostrar lista).
            // 2. Se não houver grupo muscular, precisamos de pelo menos 2 caracteres do nome para evitar buscar todo o DB.
            const hasMuscle = !!newExercise.muscleGroup;
            const hasName = newExercise.name.length >= 2;

            if (!hasMuscle && !hasName) {
                setSuggestions([]);
                return;
            }

            setIsSearching(true);
            try {
                // Se buscando APENAS por grupo muscular (sem nome), buscar mais resultados para popular a grade
                const limit = (hasMuscle && !newExercise.name) ? 50 : 15;

                const results = await workoutService.searchExercises(
                    newExercise.name,
                    newExercise.muscleGroup || null,
                    limit
                );
                setSuggestions(results);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timeoutId);
    }, [newExercise.name, newExercise.muscleGroup]);

    return { suggestions, isSearching, clearSuggestions: () => setSuggestions([]) };
}
