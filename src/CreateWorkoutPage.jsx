/**
 * CreateWorkoutPage.jsx
 * Interface para criar e editar modelos de treino.
 * Permite aos usuários adicionar exercícios, definir séries/repetições/métodos e salvar no Firestore.
 */
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Trash2, Plus, ChevronLeft, GripVertical, X } from 'lucide-react';
import { Button } from './components/design-system/Button';

const muscleGroups = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
    'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen'
];

const methods = [
    'Convencional', 'Drop-set', 'Pirâmide Crescente', 'Pirâmide Decrescente',
    'Cluster set', 'Bi-set', 'Pico de contração', 'Falha total', 'Negativa',
    'Rest-Pause', 'Cardio 140 bpm'
];

const exercisesByMuscle = {
    'Peito': ['Supino Reto', 'Supino Inclinado', 'Supino Declinado', 'Crucifixo', 'Crossover', 'Flexão'],
    'Costas': ['Barra Fixa', 'Remada Curvada', 'Remada Unilateral', 'Pulldown', 'Remada Sentado', 'Levantamento Terra'],
    'Ombros': ['Desenvolvimento', 'Elevação Lateral', 'Elevação Frontal', 'Crucifixo Inverso', 'Remada Alta'],
    'Bíceps': ['Rosca Direta', 'Rosca Alternada', 'Rosca Scott', 'Rosca Concentrada', 'Rosca Martelo'],
    'Tríceps': ['Tríceps Testa', 'Tríceps Pulley', 'Mergulho', 'Tríceps Francês', 'Tríceps Coice'],
    'Quadríceps': ['Agachamento', 'Leg Press', 'Cadeira Extensora', 'Afundo', 'Agachamento Búlgaro'],
    'Posteriores': ['Mesa Flexora', 'Stiff', 'Cadeira Flexora', 'Levantamento Terra Romeno'],
    'Glúteos': ['Hip Thrust', 'Abdução', 'Elevação Pélvica', 'Kickback'],
    'Panturrilha': ['Panturrilha em Pé', 'Panturrilha Sentado', 'Panturrilha no Leg Press'],
    'Abdômen': ['Abdominal Reto', 'Abdominal Oblíquo', 'Prancha', 'Elevação de Pernas']
};

export default function CreateWorkoutPage({ onBack, user, initialData, creationContext }) {
    const [workoutName, setWorkoutName] = useState(initialData?.name || '');
    const [exercises, setExercises] = useState(initialData?.exercises || []);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Patch missing IDs on load (legacy data support)
    useEffect(() => {
        if (exercises.some(ex => !ex.id)) {
            setExercises(prev => prev.map(ex => ({
                ...ex,
                id: ex.id || Math.random().toString(36).substr(2, 9)
            })));
        }
    }, []);

    // Form state
    const [newExercise, setNewExercise] = useState({
        muscleGroup: '',
        name: '',
        sets: '3',
        reps: '12',
        method: 'Convencional'
    });

    function handleAddExercise() {
        if (!newExercise.name || !newExercise.muscleGroup) return;

        if (editingExerciseId) {
            // Edit existing
            setExercises(exercises.map(ex => ex.id === editingExerciseId ? { ...newExercise, id: editingExerciseId } : ex));
            setEditingExerciseId(null);
            setShowAddExercise(false);
        } else {
            // Add new
            const exercise = {
                id: Date.now().toString(),
                ...newExercise
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
            method: 'Convencional'
        });
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

            if (initialData?.id) {
                // UPDATE
                const docRef = doc(db, 'workout_templates', initialData.id);
                await Promise.race([
                    updateDoc(docRef, {
                        name: workoutName,
                        exercises: exercises,
                        updatedAt: serverTimestamp()
                    }),
                    timeout
                ]);
            } else {
                // CREATE
                await Promise.race([
                    addDoc(collection(db, 'workout_templates'), {
                        name: workoutName,
                        exercises: exercises,
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
            // ... (error handling)
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
                                <div className="text-[0.95rem] font-semibold text-gray-200 mb-1">
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
                    <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
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

                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Grupo Muscular
                                <select
                                    value={newExercise.muscleGroup}
                                    onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value, name: '' })}
                                    className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                                >
                                    <option value="">Selecione...</option>
                                    {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Exercício
                                <div className="relative">
                                    <input
                                        type="text"
                                        list="exercise-suggestions"
                                        value={newExercise.name}
                                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                        disabled={!newExercise.muscleGroup}
                                        placeholder={newExercise.muscleGroup ? "Selecione ou digite..." : "Selecione o grupo muscular primeiro"}
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
                                    />
                                    <datalist id="exercise-suggestions">
                                        {newExercise.muscleGroup && exercisesByMuscle[newExercise.muscleGroup]?.map(ex => (
                                            <option key={ex} value={ex} />
                                        ))}
                                    </datalist>
                                </div>
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

            {/* Add Button Trigger (Only visible when modal is closed, logical checks handled by standard flow) */}
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

            {/* Save Button */}
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
