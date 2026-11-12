/**
 * useExerciseEditor.js
 * O modal de exercício: aberto ou fechado, qual exercício se edita, o
 * formulário e as ações sobre a lista (adicionar, editar, remover, agrupar).
 * Compõe useExerciseSearch para as sugestões do catálogo. Lógica movida de
 * CreateWorkoutPage (D18) sem mudança.
 *
 * O botão de corrente mexe só em `groupId`, nunca em `method` (ver o skill
 * method-vs-groupid).
 */
import { useState } from 'react';
import { toggleGroupWithPrevious, normalizeGroups } from '../../utils/exerciseGroups';
import { notify } from '../../utils/notifyStore';
import { toCanonicalMuscleGroup } from '../../data/muscleGroups';
import { EMPTY_EXERCISE } from './exerciseFormDefaults';
import { bisetPartnerToSuggest } from './exerciseList';
import { useExerciseSearch } from './useExerciseSearch';

export function useExerciseEditor({ exercises, setExercises }) {
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    // Estado do formulário
    const [newExercise, setNewExercise] = useState({ ...EMPTY_EXERCISE });
    const { suggestions, isSearching, clearSuggestions } = useExerciseSearch(newExercise);

    function openNewExercise() {
        setEditingExerciseId(null);
        setNewExercise({ ...EMPTY_EXERCISE });
        setShowAddExercise(true);
    }

    /** Fecha e limpa o formulário (✕ e Cancelar). */
    function closeEditor() {
        setShowAddExercise(false);
        setEditingExerciseId(null);
        // Resetar formulário
        setNewExercise({ ...EMPTY_EXERCISE });
    }

    /** Fecha sem limpar o formulário (troca de ficha pela fila do PDF). */
    function hideEditor() {
        setShowAddExercise(false);
        setEditingExerciseId(null);
    }

    function handleSelectSuggestion(suggestion) {
        setNewExercise(prev => ({
            ...prev,
            name: suggestion.name,
            // O catálogo devolve o vocabulário dele ("Isquiotibiais"); a ficha
            // guarda o rótulo da tela ("Posteriores") quando ele existe. Grupo sem
            // equivalente ("Antebracos") fica como veio, igual à edição e à lista.
            muscleGroup: toCanonicalMuscleGroup(suggestion.muscleGroup) || suggestion.muscleGroup || prev.muscleGroup || 'Geral',
            // Poderia também auto-preencher instruções/notas se quiséssemos
        }));
        clearSuggestions(); // Limpar sugestões
    }

    function handleAddExercise() {
        if (!newExercise.name) return;

        const finalExercise = {
            ...newExercise,
            muscleGroup: newExercise.muscleGroup || 'Geral'
        };

        if (editingExerciseId) {
            // Editar existente (merge preserva campos fora do formulário, como groupId)
            const updated = exercises.map(ex => ex.id === editingExerciseId ? { ...ex, ...finalExercise, id: editingExerciseId } : ex);
            setExercises(updated);
            suggestGroupingForBiSet(updated, editingExerciseId);
            setEditingExerciseId(null);
            setShowAddExercise(false);
        } else {
            // Adicionar novo
            const exercise = {
                // `handleAddExercise` só existe como onClick do botão de adicionar,
                // nunca é chamada em render — a regra não consegue provar isso e
                // assume o pior. O id continua sendo o timestamp: trocá-lo mudaria o formato
                // de dado já gravado em workout_templates sem ganho real.
                // eslint-disable-next-line react-hooks/purity
                id: Date.now().toString(),
                ...finalExercise
            };
            const updated = [...exercises, exercise];
            setExercises(updated);
            suggestGroupingForBiSet(updated, exercise.id);
            setShowAddExercise(false);
        }

        // Resetar formulário
        setNewExercise({ ...EMPTY_EXERCISE });
        clearSuggestions();
    }

    function handleEditExercise(ex) {
        // Forçar atualização de estado com objeto completo
        const exerciseToEdit = { ...ex };
        setEditingExerciseId(exerciseToEdit.id);

        let mappedMuscle = exerciseToEdit.muscleGroup || exerciseToEdit.group || exerciseToEdit.muscleFocus?.primary || '';

        // Normaliza caixa/acento e traduz valor de catálogo salvo em ficha antiga
        // ("Meio-das-costas" → "Costas"), para o <select> vir pré-selecionado.
        mappedMuscle = toCanonicalMuscleGroup(mappedMuscle) || mappedMuscle;

        setNewExercise({
            muscleGroup: mappedMuscle,
            name: exerciseToEdit.name || '',
            sets: exerciseToEdit.sets || '3',
            reps: exerciseToEdit.reps || '12',
            method: exerciseToEdit.method || 'Convencional',
            rest: exerciseToEdit.rest || '',
            notes: exerciseToEdit.notes || '',
            targetWeight: exerciseToEdit.targetWeight || ''
        });
        setShowAddExercise(true);
    }

    function removeExercise(id) {
        setExercises(normalizeGroups(exercises.filter(ex => ex.id !== id)));
    }

    function handleToggleLink(id) {
        setExercises(prev => toggleGroupWithPrevious(prev, prev.findIndex(ex => ex.id === id)));
    }

    // Método "Bi-set" sozinho é só informativo; o que muda a execução é o
    // agrupamento. Ao salvar com esse método, oferece agrupar com o anterior.
    function suggestGroupingForBiSet(list, exerciseId) {
        const previous = bisetPartnerToSuggest(list, exerciseId);
        if (!previous) return;

        notify.info('Bi-set é executado em dupla', {
            description: `Agrupar com "${previous.name}" para alternar as séries na execução?`,
            action: {
                label: 'Agrupar',
                onClick: () => handleToggleLink(exerciseId)
            },
            duration: 8000
        });
    }

    return {
        showAddExercise,
        editingExerciseId,
        newExercise,
        setNewExercise,
        suggestions,
        isSearching,
        openNewExercise,
        closeEditor,
        hideEditor,
        handleSelectSuggestion,
        handleAddExercise,
        handleEditExercise,
        removeExercise,
        handleToggleLink
    };
}
