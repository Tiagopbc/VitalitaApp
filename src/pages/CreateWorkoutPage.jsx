/**
 * CreateWorkoutPage.jsx
 * Interface para criar e editar modelos de treino.
 * Permite aos usuários adicionar exercícios, definir séries/repetições/métodos e salvar no Firestore.
 */
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Trash2, Plus, ChevronLeft, GripVertical, X } from 'lucide-react';
import { Button } from '../components/design-system/Button';

const muscleGroups = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
    'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen'
];

const methods = [
    'Convencional', 'Drop-set', 'Pirâmide Crescente', 'Pirâmide Decrescente',
    'Cluster set', 'Bi-set', 'Pico de contração', 'Falha total', 'Negativa',
    'Rest-Pause', 'Cardio 140 bpm'
];

import { workoutService } from '../services/workoutService';

export default function CreateWorkoutPage({ onBack, user, initialData, creationContext }) {
    const [workoutName, setWorkoutName] = useState(initialData?.name || '');
    const [exercises, setExercises] = useState(initialData?.exercises || []);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Search State
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Patch missing IDs on load (legacy data support)
    useEffect(() => {
        if (exercises.some(ex => !ex.id)) {
            setExercises(prev => prev.map(ex => ({
                ...ex,
                id: ex.id || Math.random().toString(36).substr(2, 9)
            })));
        }
    }, [exercises]);

    // Form state
    const [newExercise, setNewExercise] = useState({
        muscleGroup: '',
        name: '',
        sets: '3',
        reps: '12',
        method: 'Convencional',
        rest: '',
        notes: ''
    });

    // Debounced Search Effect
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Logic:
            // 1. If we have a muscleGroup selected, we can search even with empty name (to show list).
            // 2. If no muscleGroup, we need at least 2 chars of name to avoid fetching whole DB.
            const hasMuscle = !!newExercise.muscleGroup;
            const hasName = newExercise.name.length >= 2;

            if (!hasMuscle && !hasName) {
                setSuggestions([]);
                return;
            }

            setIsSearching(true);
            try {
                // If searching ONLY by muscle group (no name), fetch more results to populate grid
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

    function handleSelectSuggestion(suggestion) {
        setNewExercise(prev => ({
            ...prev,
            name: suggestion.name,
            muscleGroup: suggestion.muscleGroup || prev.muscleGroup || 'Geral', // Auto-fill muscle if missing
            // Could also auto-fill instructions/notes if we wanted
        }));
        setSuggestions([]); // Clear suggestions
    }

    function handleAddExercise() {
        if (!newExercise.name) return;

        const finalExercise = {
            ...newExercise,
            muscleGroup: newExercise.muscleGroup || 'Geral'
        };

        if (editingExerciseId) {
            // Edit existing
            setExercises(exercises.map(ex => ex.id === editingExerciseId ? { ...finalExercise, id: editingExerciseId } : ex));
            setEditingExerciseId(null);
            setShowAddExercise(false);
        } else {
            // Add new
            const exercise = {
                id: Date.now().toString(),
                ...finalExercise
            };
            setExercises([...exercises, exercise]);
            setShowAddExercise(false);
        }

        // Reset form
        setNewExercise({
            muscleGroup: '',
            name: '',
            sets: '3',
            reps: '12',
            method: 'Convencional',
            rest: '',
            notes: ''
        });
        setSuggestions([]);
    }

    function handleEditExercise(ex) {
        // Force state update with complete object
        const exerciseToEdit = { ...ex };
        setEditingExerciseId(exerciseToEdit.id);

        let mappedMuscle = exerciseToEdit.muscleGroup || exerciseToEdit.group || exerciseToEdit.muscleFocus?.primary || '';

        // Try to match casing with muscleGroups
        const exactMatch = muscleGroups.find(m => m.toLowerCase() === mappedMuscle.toLowerCase());
        if (exactMatch) mappedMuscle = exactMatch;

        setNewExercise({
            muscleGroup: mappedMuscle,
            name: exerciseToEdit.name || '',
            sets: exerciseToEdit.sets || '3',
            reps: exerciseToEdit.reps || '12',
            method: exerciseToEdit.method || 'Convencional',
            rest: exerciseToEdit.rest || '',
            notes: exerciseToEdit.notes || ''
        });
        setShowAddExercise(true);
    }

    function removeExercise(id) {
        setExercises(exercises.filter(ex => ex.id !== id));
    }

    async function handleSave() {
        if (!workoutName || exercises.length === 0) {
            return;
        }

        setLoading(true);
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeline excedido (10s). Erro de Conexão com Firebase.")), 10000)
            );

            // Determine Target User
            const targetUserId = creationContext?.targetUserId || user.uid;
            // Determine Created By (Always the logged in user)
            const createdBy = user.uid;

            const workoutData = {
                name: workoutName,
                exercises: exercises,
                updatedAt: serverTimestamp()
            };

            if (initialData?.id) {
                // UPDATE
                const docRef = doc(db, 'workout_templates', initialData.id);
                await Promise.race([
                    updateDoc(docRef, workoutData),
                    timeout
                ]);
            } else {
                // CREATE
                await Promise.race([
                    addDoc(collection(db, 'workout_templates'), {
                        ...workoutData,
                        createdBy: createdBy,
                        userId: targetUserId, // Associa o treino ao aluno (ou ao próprio usuário)
                        assignedByTrainer: creationContext?.targetUserId ? true : false, // Flag opcional
                        createdAt: serverTimestamp(),
                    }),
                    timeout
                ]);
            }
            onBack();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar treino.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-32">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onBack}
                    className="mb-6 uppercase font-bold tracking-wider"
                    leftIcon={<ChevronLeft size={16} />}
                >
                    VOLTAR
                </Button>
                <h2 className="text-2xl font-bold text-white">{initialData ? 'Editar Treino' : 'Criar Novo Treino'}</h2>
            </div>

            {/* Workout Name Input */}
            <div className="mb-8">
                <label className="flex flex-col gap-2 text-[0.85rem] text-slate-400 font-medium">
                    Nome do Treino
                    <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="Ex: Treino A - Peito e Tríceps"
                        className="w-full rounded-xl border border-blue-800/60 bg-[#0f172a] text-gray-200 px-3.5 py-3 text-[0.95rem] outline-none focus:border-blue-500/95 focus:ring-1 focus:ring-blue-600/70 transition-all placeholder:text-slate-600 font-medium"
                    />
                </label>
            </div>

            {/* Exercises List */}
            <div className="mb-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Exercícios ({exercises.length})
                </h3>

                {exercises.length === 0 && !showAddExercise ? (
                    <div className="text-center py-8 px-4 rounded-[14px] border border-dashed border-slate-400/30 bg-[#0f172a]/50 text-slate-500 text-sm">
                        Nenhum exercício adicionado ainda
                    </div>
                ) : (
                    exercises.map((ex, index) => (
                        <div
                            key={ex.id}
                            onClick={() => handleEditExercise(ex)}
                            className="p-4 rounded-[14px] border border-slate-400/35 bg-[#0f172a]/80 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 transition-all"
                        >
                            <div className="text-slate-500">
                                <GripVertical size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[0.7rem] text-cyan-400 uppercase tracking-widest font-bold mb-1">
                                    {ex.muscleGroup || ex.group || ex.muscleFocus?.primary || 'Geral'}
                                </div>
                                <div className="text-[0.95rem] font-semibold text-gray-200 mb-1 uppercase">
                                    {index + 1}. {ex.name}
                                </div>
                                <div className="text-[0.8rem] text-slate-400 font-medium">
                                    {ex.sets || '?'} sets × {ex.reps || '?'} reps • {ex.method || 'Convencional'}
                                    {ex.rest && <span className="text-slate-500 ml-1">• ⏱ {ex.rest}</span>}
                                </div>
                                {ex.notes && (
                                    <div className="text-[0.75rem] text-slate-500 italic mt-0.5 truncate">
                                        Obs: {ex.notes}
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0">
                                <Button
                                    variant="danger"
                                    size="xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeExercise(ex.id)
                                    }}
                                    className="w-8 h-8 p-0 rounded-lg bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Exercise Modal */}
            {showAddExercise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h4 className="text-lg font-bold text-white">
                                {editingExerciseId ? 'Editar Exercício' : 'Novo Exercício'}
                            </h4>
                            <button
                                onClick={() => {
                                    setShowAddExercise(false);
                                    setEditingExerciseId(null);
                                    // Reset form
                                    setNewExercise({
                                        muscleGroup: '',
                                        name: '',
                                        sets: '3',
                                        reps: '12',
                                        method: 'Convencional',
                                        rest: '',
                                        notes: ''
                                    });
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                            <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Grupo Muscular (Filtro)
                                <select
                                    value={newExercise.muscleGroup}
                                    onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
                                    className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                                >
                                    <option value="">Todos (Global)</option>
                                    {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider relative group">
                                Exercício
                                <input
                                    type="text"
                                    value={newExercise.name}
                                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                    onFocus={() => {
                                        // Trigger search if we have a muscle group selected already
                                        if (newExercise.muscleGroup && newExercise.name.length < 2) {
                                            // Ensure effect runs or state allows showing
                                        }
                                    }}
                                    placeholder={newExercise.muscleGroup ? "Selecione da lista ou digite..." : "Digite para buscar..."}
                                    className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all uppercase"
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-9">
                                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {(suggestions.length > 0 && (newExercise.name.length >= 2 || newExercise.muscleGroup)) && (
                                    <div className="absolute left-0 right-0 top-[105%] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                        {suggestions.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectSuggestion(s)}
                                                className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                                            >
                                                <div className="text-white font-medium text-sm">{s.name}</div>
                                                <div className="text-[10px] text-cyan-400 flex gap-2">
                                                    <span>{s.muscleGroup}</span>
                                                    {s.equipment && <span className="opacity-50">• {s.equipment}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Séries
                                    <input
                                        type="number"
                                        value={newExercise.sets}
                                        onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm text-center outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    />
                                </label>
                                <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Repetições
                                    <input
                                        type="text"
                                        value={newExercise.reps}
                                        onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm text-center outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Método
                                    <select
                                        value={newExercise.method}
                                        onChange={(e) => setNewExercise({ ...newExercise, method: e.target.value })}
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                                    >
                                        {methods.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Descanso
                                    <input
                                        type="text"
                                        value={newExercise.rest}
                                        onChange={(e) => setNewExercise({ ...newExercise, rest: e.target.value })}
                                        placeholder="Ex: 60s"
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm text-center outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Observação
                                <textarea
                                    value={newExercise.notes}
                                    onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Detalhes sobre a execução..."
                                    className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button
                                    onClick={() => {
                                        setShowAddExercise(false);
                                        setEditingExerciseId(null);
                                        setNewExercise({
                                            muscleGroup: '',
                                            name: '',
                                            sets: '3',
                                            reps: '12',
                                            method: 'Convencional',
                                            rest: '',
                                            notes: ''
                                        });
                                    }}
                                    variant="secondary"
                                    fullWidth
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddExercise}
                                    disabled={!newExercise.name}
                                    variant="primary"
                                    fullWidth
                                >
                                    {editingExerciseId ? 'Salvar' : 'Adicionar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showAddExercise && (
                <Button
                    onClick={() => {
                        setEditingExerciseId(null);
                        setNewExercise({
                            muscleGroup: '',
                            name: '',
                            sets: '3',
                            reps: '12',
                            method: 'Convencional',
                            rest: '',
                            notes: ''
                        });
                        setShowAddExercise(true);
                    }}
                    variant="secondary"
                    fullWidth
                    className="mb-6 border-dashed border-slate-600/50 bg-slate-900/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 h-14"
                    leftIcon={<Plus size={18} />}
                >
                    Adicionar Exercício
                </Button>
            )}

            <Button
                onClick={handleSave}
                loading={loading}
                disabled={loading || exercises.length === 0 || !workoutName}
                variant="primary"
                size="lg"
                fullWidth
                className="shadow-xl"
            >
                {loading ? 'Salvando...' : 'Salvar Treino'}
            </Button>

        </div>
    );
}
