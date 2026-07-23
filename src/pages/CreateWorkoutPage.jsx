/**
 * CreateWorkoutPage.jsx
 * Interface para criar e editar modelos de treino.
 * Permite aos usuários adicionar exercícios, definir séries/repetições/métodos e salvar no Firestore.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, Trash2, Plus, GripVertical, X, Link2, FileUp } from 'lucide-react';
import { toggleGroupWithPrevious, normalizeGroups, computeGroupSegments, groupLabel } from '../utils/exerciseGroups';
import { Button } from '../components/design-system/Button';
import { EmptyState } from '../components/design-system/EmptyState';
import { PageHeader } from '../components/design-system/PageHeader';
import { toast } from 'sonner';
import { Reorder, useDragControls } from 'framer-motion';

const muscleGroups = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
    'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen'
];

const methods = [
    'Convencional', 'Drop-set', 'Pirâmide Crescente', 'Pirâmide Decrescente',
    'Cluster set', 'Bi-set', 'Pico de contração', 'Falha total', 'Negativa',
    'Rest-Pause', 'Cardio 140 bpm'
];

// Estado inicial de um exercício no formulário. Centralizado para manter todos
// os campos controlados (evita warning uncontrolled→controlled) em cada reset.
const EMPTY_EXERCISE = {
    muscleGroup: '',
    name: '',
    sets: '3',
    reps: '12',
    method: 'Convencional',
    rest: '',
    notes: '',
    targetWeight: ''
};

import { workoutService } from '../services/workoutService';
import { importWorkoutFromPdf, isPdfImportEnabled } from '../services/workoutPdfImport';

function ReorderableExerciseItem({ ex, index, handleEditExercise, removeExercise, groupBadge, canLink, isLinkedToPrev, onToggleLink }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={ex.id}
            id={ex.id}
            value={ex}
            dragListener={false}
            dragControls={dragControls}
            className={`p-4 rounded-[14px] border bg-[#0f172a]/80 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 transition-colors select-none ${groupBadge ? 'border-cyan-500/40 border-l-4 border-l-cyan-500/70' : 'border-slate-400/35'}`}
            onClick={() => handleEditExercise(ex)}
        >
            <div
                className="text-slate-500 cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    dragControls.start(e);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <GripVertical size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[0.7rem] text-cyan-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
                    <span>{ex.muscleGroup || ex.group || ex.muscleFocus?.primary || 'Geral'}</span>
                    {groupBadge && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[0.6rem] normal-case tracking-normal">
                            <Link2 size={10} /> {groupBadge}
                        </span>
                    )}
                </div>
                <div className="text-[0.95rem] font-semibold text-gray-200 mb-1 uppercase truncate">
                    {index + 1}. {ex.name}
                </div>
                <div className="text-[0.8rem] text-slate-400 font-medium truncate">
                    {ex.sets || '?'} sets × {ex.reps || '?'} reps • {ex.method || 'Convencional'}
                    {ex.targetWeight && <span className="text-cyan-400/80 ml-1">• {ex.targetWeight} kg</span>}
                    {ex.rest && <span className="text-slate-500 ml-1">• ⏱ {ex.rest}</span>}
                </div>
                {ex.notes && (
                    <div className="text-[0.75rem] text-slate-500 italic mt-0.5 truncate">
                        Obs: {ex.notes}
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 flex flex-col gap-2">
                {canLink && (
                    <Button
                        variant="unstyled"
                        title={isLinkedToPrev
                            ? 'Desagrupar do exercício anterior'
                            : 'Agrupar com o exercício anterior (bi-set/tri-set)'}
                        aria-label={isLinkedToPrev
                            ? `Desagrupar ${ex.name} do exercício anterior`
                            : `Agrupar ${ex.name} com o exercício anterior`}
                        aria-pressed={!!isLinkedToPrev}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLink(ex.id);
                        }}
                        className={`w-8 h-8 p-0 rounded-lg border flex items-center justify-center transition-colors ${isLinkedToPrev
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/25'
                            : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'}`}
                    >
                        <Link2 size={16} />
                    </Button>
                )}
                <Button
                    variant="danger"
                    size="xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeExercise(ex.id);
                    }}
                    className="w-8 h-8 p-0 rounded-lg bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </Reorder.Item>
    );
}

export default function CreateWorkoutPage({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { initialData, creationContext } = location.state || {};
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');

    const onBack = () => navigate(-1);
    const [workoutName, setWorkoutName] = useState(initialData?.name || '');
    const [exercises, setExercises] = useState(initialData?.exercises || []);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial Fetch for URL Refresh
    useEffect(() => {
        if (!initialData && editId) {
            setLoading(true);
            workoutService.getWorkoutById(editId).then(data => {
                if (data) {
                    setWorkoutName(data.name);
                    setExercises(data.exercises || []);
                }
            }).finally(() => setLoading(false));
        }
    }, [initialData, editId]);

    // Estado de Busca
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Importação por PDF (só na criação, e só onde o servidor está configurado;
    // a revisão acontece nesta própria tela)
    const canImportPdf = !initialData?.id && !editId && isPdfImportEnabled();
    const pdfInputRef = useRef(null);
    const [importingPdf, setImportingPdf] = useState(false);

    async function handlePdfSelected(event) {
        const file = event.target.files?.[0];
        event.target.value = ''; // permite reimportar o mesmo arquivo
        if (!file) return;

        setImportingPdf(true);
        try {
            const parsed = await importWorkoutFromPdf(file);
            if (parsed.name) setWorkoutName(parsed.name);
            setExercises(parsed.exercises.map((ex, i) => ({ ...ex, id: `${Date.now()}-${i}` })));
            toast.success(`${parsed.exercises.length} exercícios importados. Revise antes de salvar.`);
        } catch (err) {
            toast.error(err.message || 'Não foi possível importar o PDF.');
        } finally {
            setImportingPdf(false);
        }
    }

    // Corrigir IDs ausentes no carregamento (suporte a dados legados)
    useEffect(() => {
        if (exercises.some(ex => !ex.id)) {
            setExercises(prev => prev.map(ex => ({
                ...ex,
                id: ex.id || Math.random().toString(36).substr(2, 9)
            })));
        }
    }, [exercises]);

    // Estado do formulário
    const [newExercise, setNewExercise] = useState({ ...EMPTY_EXERCISE });

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

    function handleSelectSuggestion(suggestion) {
        setNewExercise(prev => ({
            ...prev,
            name: suggestion.name,
            muscleGroup: suggestion.muscleGroup || prev.muscleGroup || 'Geral', // Auto-preencher músculo se ausente
            // Poderia também auto-preencher instruções/notas se quiséssemos
        }));
        setSuggestions([]); // Limpar sugestões
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
        setSuggestions([]);
    }

    function handleEditExercise(ex) {
        // Forçar atualização de estado com objeto completo
        const exerciseToEdit = { ...ex };
        setEditingExerciseId(exerciseToEdit.id);

        let mappedMuscle = exerciseToEdit.muscleGroup || exerciseToEdit.group || exerciseToEdit.muscleFocus?.primary || '';

        // Tentar corresponder maiúsculas/minúsculas com muscleGroups
        const exactMatch = muscleGroups.find(m => m.toLowerCase() === mappedMuscle.toLowerCase());
        if (exactMatch) mappedMuscle = exactMatch;

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
        const idx = list.findIndex(ex => ex.id === exerciseId);
        if (idx <= 0) return;
        const current = list[idx];
        if (current.method !== 'Bi-set') return;
        const previous = list[idx - 1];
        if (current.groupId && current.groupId === previous.groupId) return;

        toast('Bi-set é executado em dupla', {
            description: `Agrupar com "${previous.name}" para alternar as séries na execução?`,
            action: {
                label: 'Agrupar',
                onClick: () => handleToggleLink(exerciseId)
            },
            duration: 8000
        });
    }

    async function handleSave() {
        if (!workoutName || exercises.length === 0) {
            toast.error("Informe um nome e adicione pelo menos um exercício.");
            return;
        }

        setLoading(true);
        try {
            // Determinar Usuário Alvo (aluno vinculado) ou o próprio usuário.
            const targetUserId = creationContext?.targetUserId || user.uid;

            // Sanitizar o array de exercícios para remover propriedades undefined,
            // Proxies ou referências circulares que o framer-motion possa ter injetado
            const sanitizedExercises = JSON.parse(JSON.stringify(normalizeGroups(exercises)));

            if (initialData?.id) {
                // ATUALIZAR ficha existente
                await workoutService.updateTemplate(initialData.id, {
                    name: workoutName,
                    exercises: sanitizedExercises
                });
            } else {
                // CRIAR (inclui revisão de importação por PDF, que chega sem id)
                await workoutService.createTemplate({
                    name: workoutName,
                    exercises: sanitizedExercises,
                    targetUserId,
                    createdBy: user.uid
                });
            }
            onBack();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar treino.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pt-2 pb-8 lg:pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pb-12">
            <PageHeader
                title={initialData ? 'Editar Treino' : 'Criar Novo Treino'}
                description="Monte a ficha com exercícios, séries, repetições e método de execução."
                icon={<Dumbbell size={20} />}
                onBack={onBack}
            />

            {/* Importar ficha de um PDF (IA lê e preenche; o usuário revisa aqui mesmo) */}
            {canImportPdf && (
                <div className="mb-6">
                    <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handlePdfSelected}
                    />
                    <Button
                        variant="secondary"
                        fullWidth
                        loading={importingPdf}
                        disabled={importingPdf}
                        onClick={() => pdfInputRef.current?.click()}
                        leftIcon={<FileUp size={18} />}
                        className="border-dashed border-slate-600/50 bg-slate-900/30 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 h-14"
                    >
                        {importingPdf ? 'Lendo o PDF...' : 'Importar treino de um PDF'}
                    </Button>
                    <p className="mt-2 text-center text-xs text-slate-500">
                        A ficha do personal é lida automaticamente. Você confere tudo antes de salvar.
                    </p>
                </div>
            )}

            {/* Entrada do Nome do Treino */}
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

            {/* Lista de Exercícios */}
            <div className="mb-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Exercícios ({exercises.length})
                </h3>

                {exercises.length === 0 && !showAddExercise ? (
                    <EmptyState
                        icon={<Dumbbell size={24} />}
                        title="Nenhum exercício adicionado"
                        description="Adicione o primeiro exercício para habilitar o salvamento da ficha."
                        action={
                            <Button
                                onClick={() => {
                                    setEditingExerciseId(null);
                                    setNewExercise({ ...EMPTY_EXERCISE });
                                    setShowAddExercise(true);
                                }}
                                variant="secondary"
                                size="sm"
                                leftIcon={<Plus size={16} />}
                            >
                                Adicionar Exercício
                            </Button>
                        }
                        className="py-8"
                    />
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={exercises}
                        onReorder={setExercises}
                        className="space-y-3"
                    >
                        {(() => {
                            const segments = computeGroupSegments(exercises);
                            const badgeByIndex = {};
                            segments.forEach(segment => {
                                if (segment.groupId) {
                                    const label = groupLabel(segment.indices.length);
                                    segment.indices.forEach(i => { badgeByIndex[i] = label; });
                                }
                            });

                            return exercises.map((ex, index) => (
                                <ReorderableExerciseItem
                                    key={ex.id}
                                    ex={ex}
                                    index={index}
                                    handleEditExercise={handleEditExercise}
                                    removeExercise={removeExercise}
                                    groupBadge={badgeByIndex[index] || null}
                                    canLink={index > 0}
                                    isLinkedToPrev={index > 0 && !!ex.groupId && ex.groupId === exercises[index - 1]?.groupId}
                                    onToggleLink={handleToggleLink}
                                />
                            ));
                        })()}
                    </Reorder.Group>
                )}
            </div>

            {/* Modal Adicionar/Editar Exercício */}
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
                                    // Resetar formulário
                                    setNewExercise({ ...EMPTY_EXERCISE });
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

            {!showAddExercise && exercises.length > 0 && (
                <Button
                    onClick={() => {
                        setEditingExerciseId(null);
                        setNewExercise({ ...EMPTY_EXERCISE });
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
                className="shadow-xl disabled:border-slate-700 disabled:bg-slate-900/60 disabled:bg-none disabled:text-slate-500 disabled:shadow-none disabled:opacity-100"
            >
                {loading ? 'Salvando...' : 'Salvar Treino'}
            </Button>
            {(exercises.length === 0 || !workoutName) && !loading && (
                <p className="mt-3 text-center text-xs text-slate-500">
                    Informe o nome e adicione pelo menos um exercício para salvar.
                </p>
            )}

        </div>
    );
}
