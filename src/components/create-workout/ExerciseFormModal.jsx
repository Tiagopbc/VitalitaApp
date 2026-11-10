/**
 * ExerciseFormModal.jsx
 * Modal de adicionar ou editar exercício: grupo muscular, nome com sugestões
 * do catálogo, séries, repetições, método, descanso, carga alvo e observação.
 * JSX movido de CreateWorkoutPage (D18); o estado vem de useExerciseEditor.
 */
import React from 'react';
import { Link2, X } from 'lucide-react';
import { Button } from '../design-system/Button';
import { MUSCLE_GROUPS, toCanonicalMuscleGroup } from '../../data/muscleGroups';
import { METHODS } from '../../hooks/create-workout/exerciseFormDefaults';

export function ExerciseFormModal({
    editingExerciseId,
    newExercise,
    setNewExercise,
    suggestions,
    isSearching,
    onSelectSuggestion,
    onClose,
    onSubmit
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h4 className="text-lg font-bold text-white">
                        {editingExerciseId ? 'Editar Exercício' : 'Novo Exercício'}
                    </h4>
                    <button
                        aria-label="Fechar"
                        onClick={onClose}
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
                            {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider relative group">
                        Exercício
                        <input
                            type="text"
                            value={newExercise.name}
                            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                            onFocus={() => {
                                // Acionar busca se já tivermos um grupo muscular selecionado
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
                                        onClick={() => onSelectSuggestion(s)}
                                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                                    >
                                        <div className="text-white font-medium text-sm">{s.name}</div>
                                        <div className="text-[10px] text-cyan-400 flex gap-2">
                                            <span>{toCanonicalMuscleGroup(s.muscleGroup) || s.muscleGroup}</span>
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
                                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
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
                        Carga alvo (kg) <span className="text-slate-600 normal-case tracking-normal font-medium">— opcional</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={newExercise.targetWeight}
                            onChange={(e) => setNewExercise({ ...newExercise, targetWeight: e.target.value })}
                            placeholder="Ex: 40"
                            className="w-full rounded-xl border border-slate-600 bg-slate-800/50 text-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                        <span className="text-[11px] normal-case tracking-normal font-medium text-slate-500">
                            Prescreva uma carga inicial. Ela já aparece pré-preenchida na primeira execução.
                        </span>
                    </label>

                    {newExercise.method === 'Bi-set' && (
                        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-cyan-300/90 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2">
                            <Link2 size={12} className="mt-0.5 shrink-0" />
                            <span>Para alternar as séries na execução, agrupe este exercício com o anterior usando o botão de corrente na lista.</span>
                        </p>
                    )}

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
                            onClick={onClose}
                            variant="secondary"
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={onSubmit}
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
    );
}
