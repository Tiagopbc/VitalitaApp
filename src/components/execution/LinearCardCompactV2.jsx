/**
 * LinearCardCompactV2.jsx
 * Cartão de exercício compacto para visualização de execução.
 * Lida com registro de séries, ajustes de peso/repetição e rastreamento visual de progresso.
 */
import React, { useState, useMemo, memo } from 'react';
import { Minus, Plus, CheckCircle2, Info, Check, Zap, LayoutList, Target, ArrowRight, History, Scale } from 'lucide-react';

/**
 * @typedef {'NUMERIC' | 'RANGE' | 'PYRAMID' | 'CLUSTER' | 'FAILURE' | 'TEXT'} RepsType
 */

/**
 * Detecta o tipo de repetições com base na string de meta.
 * @param {string} repsGoal 
 * @returns {RepsType}
 */
function detectRepsType(repsGoal) {
    if (!repsGoal || repsGoal.trim() === '') return 'NUMERIC';

    const cleaned = repsGoal.trim().toUpperCase();

    if (cleaned.includes('FALHA') || cleaned.includes('FAILURE') || cleaned.includes('MAX')) {
        return 'FAILURE';
    }
    // Verifica Pirâmide (separado por barra ou vírgula).
    // REMOVIDO '+' para permitir que "8+8+8" seja mostrado como texto completo (Cluster/Drop)
    if (cleaned.includes('/') || (cleaned.includes(',') && cleaned.split(',').length > 1)) {
        return 'PYRAMID';
    }
    // Cluster: agora verifica explicitamente intervalo com '-' OU notação '+'
    if ((cleaned.includes('-') && /^\d+-\d+/.test(cleaned)) || cleaned.includes('+')) {
        return 'CLUSTER';
    }
    if (cleaned.includes(' A ') || cleaned.includes('À') || /^\d+-\d+$/.test(cleaned.replace(' ', ''))) {
        return 'RANGE';
    }
    if (/^\d+$/.test(cleaned)) {
        return 'NUMERIC';
    }
    return 'TEXT';
}

/**
 * Calcula a meta para a série atual.
 * @param {string} repsGoal 
 * @param {number} setNumber 
 * @param {RepsType} repsType 
 * @returns {string}
 */
function getCurrentSetGoal(repsGoal, setNumber, repsType) {
    if (!repsGoal) return '';

    switch (repsType) {
        case 'NUMERIC':
            return repsGoal.trim();
        case 'RANGE': {
            const match = repsGoal.match(/(\d+)/g);
            if (match && match.length >= 2) {
                return `${match[0]}-${match[1]}`;
            }
            return repsGoal;
        }
        case 'PYRAMID': {
            // Dividir por barra ou vírgula
            const values = repsGoal.split(/[/,]/).map(v => v.trim());
            return values[setNumber - 1] || values[0] || '';
        }
        case 'CLUSTER':
            return repsGoal.trim();
        case 'FAILURE':
            return 'ATÉ A FALHA';
        default:
            return repsGoal;
    }
}

// --- DICIONÁRIOS DE CORES ---

const MUSCLE_COLORS = {
    'Peito': { main: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.35)' },
    'Costas': { main: '#6574cd', bg: 'rgba(101,116,205,0.15)', border: 'rgba(101,116,205,0.35)' },
    'Bíceps': { main: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)' },
    'Tríceps': { main: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)' },
    'Ombros': { main: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' },
    'Quadríceps': { main: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
    'Posterior': { main: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
    'Core/Abs': { main: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)' },
    'Panturrilha': { main: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)' },
    'DEFAULT': { main: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)' }
};

const METHOD_COLORS = {
    'Pirâmide': { main: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' },
    'Cluster': { main: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
    'Drop Set': { main: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)' },
    'Falha': { main: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)' },
    'Bi-Set': { main: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)' },
    'Convencional': { main: '#94a3b8', bg: 'rgba(71,85,105,0.2)', border: 'rgba(71,85,105,0.25)' },
    'DEFAULT': { main: '#94a3b8', bg: 'rgba(71,85,105,0.2)', border: 'rgba(71,85,105,0.25)' }
};

import { NumericKeypad } from '../common/NumericKeypad';



// ... (Importações Existentes)

// ... (Funções Auxiliares Existentes - detectRepsType, getCurrentSetGoal, COLORS)

export const LinearCardCompactV2 = memo(function LinearCardCompactV2({
    exerciseId, // Nova Prop
    setId,      // Nova Prop
    muscleGroup,
    exerciseName,
    method,
    repsGoal,
    currentSet,
    totalSets,
    completedSets,
    weight,
    actualReps,
    observation,
    onUpdateSet, // Estável: (exId, setId, field, val) => ...
    onUpdateNotes, // Estável: (exId, val) => ...
    onCompleteSet, // Estável: (exId, setNumber, weight, reps) => ...
    suggestedWeight,
    suggestedReps,

    onMethodClick,
    onSetChange,
    weightMode = 'total', // 'total' | 'per_side'
    baseWeight,           // used when mode is 'per_side'
    onUpdateSetMultiple,   // (exId, setId, { weight, weightMode, baseWeight })
    onToggleWeightMode    // Nova Prop: () => void
}) {
    // Determinar status de conclusão
    const completedCount = completedSets.filter(Boolean).length;
    const isExerciseFullyCompleted = completedCount === totalSets && totalSets > 0;
    const isCurrentSetCompleted = completedSets[currentSet - 1];

    // Determinar Peso de Exibição
    const isPerSide = weightMode === 'per_side';
    const displayWeight = isPerSide
        ? (baseWeight || (parseFloat(weight) / 2) || 0)
        : (weight || suggestedWeight || 0);

    const formatWeight = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return "0";
        return Number.isInteger(num) ? num.toString() : num.toFixed(1); // Formatação inteligente
    };

    const formattedDisplayWeight = formatWeight(displayWeight);

    // Estado do Teclado
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [activeInputType, setActiveInputType] = useState(null); // 'weight' | 'reps'

    const openKeypad = (type) => {
        setActiveInputType(type);
        setKeypadOpen(true);
    };

    const handleKeypadConfirm = (val) => {
        if (activeInputType === 'weight') {
            const numVal = parseFloat(val);
            if (isNaN(numVal)) return;

            if (isPerSide) {
                // Se for por lado, salvamos baseWeight = val, e weight = val * 2
                onUpdateSetMultiple(exerciseId, setId, {
                    weight: (numVal * 2).toString(),
                    baseWeight: val
                });
            } else {
                onUpdateSet(exerciseId, setId, 'weight', val);
            }
        } else if (activeInputType === 'reps') {
            onUpdateSet(exerciseId, setId, 'reps', val);
        }
    };


    // Memorizar cálculos
    const { repsType, currentSetGoal } = useMemo(() => {
        const type = detectRepsType(repsGoal);
        const goal = getCurrentSetGoal(repsGoal, currentSet, type);
        return { repsType: type, currentSetGoal: goal };
    }, [repsGoal, currentSet]);

    // Manipuladores
    const decrementWeight = () => {
        // Incremento base: 2.5kg
        const current = parseFloat(displayWeight) || 0;
        const step = 2.5;
        const newVal = Math.max(0, current - step);

        if (isPerSide) {
            onUpdateSetMultiple(exerciseId, setId, {
                weight: (newVal * 2).toString(),
                baseWeight: newVal.toString()
            });
        } else {
            onUpdateSet(exerciseId, setId, 'weight', newVal.toString());
        }
    };

    const incrementWeight = () => {
        const current = parseFloat(displayWeight) || 0;
        const step = 2.5;
        const newVal = current + step;

        if (isPerSide) {
            onUpdateSetMultiple(exerciseId, setId, {
                weight: (newVal * 2).toString(),
                baseWeight: newVal.toString()
            });
        } else {
            onUpdateSet(exerciseId, setId, 'weight', newVal.toString());
        }
    };

    const toggleWeightMode = () => {
        if (onToggleWeightMode) {
            onToggleWeightMode();
        }
    };

    const decrementReps = () => {
        const current = parseInt(actualReps) || parseInt(suggestedReps);
        if (!isNaN(current)) {
            const newVal = Math.max(0, current - 1).toString();
            onUpdateSet(exerciseId, setId, 'reps', newVal);
        }
    };

    const incrementReps = () => {
        const current = parseInt(actualReps) || parseInt(suggestedReps);
        if (!isNaN(current)) {
            const newVal = (current + 1).toString();
            onUpdateSet(exerciseId, setId, 'reps', newVal);
        } else {
            if (!actualReps) onUpdateSet(exerciseId, setId, 'reps', "1");
        }
    };

    const handleCompleteSet = () => {
        const effectiveWeight = (weight && parseFloat(weight) > 0) ? weight : suggestedWeight;
        const effectiveReps = (actualReps && actualReps.trim() !== '') ? actualReps : suggestedReps;

        if (!effectiveWeight || parseFloat(effectiveWeight) <= 0) {
            alert('Informe o peso utilizado!');
            return;
        }
        if (!effectiveReps || effectiveReps.toString().trim() === '') {
            alert('Informe as repetições alcançadas!');
            return;
        }

        onCompleteSet(
            exerciseId,
            currentSet,
            effectiveWeight.toString(),
            effectiveReps.toString(),
            weightMode,
            baseWeight
        );
    };

    // --- ESTILOS ---
    // REMOVIDO: Estilos inline substitúidos por classes Tailwind

    const containerClassName = isExerciseFullyCompleted
        ? "bg-emerald-900/20 border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
        : "bg-slate-900/40 border border-slate-700/50 shadow-lg backdrop-blur-md";

    return (
        <div
            className={`rounded-[24px] p-[22px] flex flex-col gap-[14px] transition-all duration-300 relative overflow-hidden ${containerClassName}`}
        >
            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-[10px] gap-3">
                <div className="flex-1 min-w-0">
                    <h3
                        className="text-[#e2e8f0] text-[20px] font-bold leading-tight uppercase"
                        style={{
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            display: 'block'
                        }}
                    >
                        {exerciseName}
                    </h3>

                    {/* Detalhes da Ficha (Reorganizada) */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 mb-0.5">
                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                            <LayoutList size={11} className="text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-300">
                                {totalSets} Séries
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                            <Target size={11} className="text-cyan-500" />
                            <span className="text-[11px] text-slate-400">Meta:</span>
                            <span className="text-[11px] font-bold text-cyan-400 tracking-wide">
                                {repsGoal}
                            </span>
                        </div>

                        {/* Emblema de Método */}
                        <div
                            onClick={onMethodClick}
                            className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50 cursor-pointer hover:bg-slate-700 active:scale-95 transition-all group/badge"
                        >
                            <Info size={11} className="text-blue-400 group-hover/badge:text-cyan-400 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[120px]">
                                {method}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contador */}
                <div
                    className={`px-3 py-1.5 rounded-full text-base font-bold flex-shrink-0 border ${isExerciseFullyCompleted ? 'text-green-500 bg-green-500/10 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/25'}`}
                >
                    {completedCount} / {totalSets}
                </div>
            </div>

            {/* Barra de Progresso */}
            <div className="flex gap-1.5 mb-2">
                {Array.from({ length: totalSets }).map((_, idx) => {
                    const setNum = idx + 1;
                    const isCompleted = completedSets[idx];
                    const isActive = currentSet === setNum && !isCompleted;

                    return (
                        <div
                            key={idx}
                            className={`flex-1 h-8 rounded-full transition-all duration-300 relative flex items-center justify-center text-xs font-extrabold select-none ${isCompleted
                                ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-400'
                                : isActive
                                    ? 'bg-blue-600/20 border border-blue-500 text-blue-400'
                                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-400'
                                }`}
                            style={isActive ? {
                                boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                            } : {}}
                        >
                            {isCompleted ? <Check size={16} strokeWidth={3} /> : setNum}
                        </div>
                    );
                })}
            </div>

            {/* Grade de Entradas */}
            <div className="grid grid-cols-2 gap-3 mb-1">
                {/* Entrada de Peso */}
                <div className="flex flex-col gap-1.5 relative">
                    {/* Botão de Alternar Modo - Posicionado na área do cabeçalho */}

                    <div className="flex items-center justify-center gap-2 relative h-8">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1">
                            {isPerSide ? (
                                <>
                                    <span>LADO</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-purple-400">TOT: {weight || "0"}</span>
                                </>
                            ) : 'PESO (TOTAL)'}
                        </span>
                        <button
                            onClick={toggleWeightMode}
                            className={`p-1.5 rounded-full transition-colors ${isPerSide ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                            title={isPerSide ? "Mudar para Peso Total" : "Mudar para Peso por Lado"}
                        >
                            <Scale size={14} />
                        </button>
                    </div>

                    <div className={`bg-[#0f172a] border ${isPerSide ? 'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-slate-800'} rounded-[24px] p-1 md:p-1.5 flex items-center justify-between relative h-[56px] md:h-[64px] transition-colors duration-300`}>
                        <button
                            onClick={decrementWeight}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white active:scale-95 transition-all"
                            aria-label="Diminuir peso"
                        >
                            <Minus className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={2.5} />
                        </button>

                        <div
                            className="flex-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform relative"
                            onClick={() => openKeypad('weight')}
                            role="button"
                            aria-label="Definir peso"
                        >
                            <div className={`text-xl md:text-2xl font-bold leading-none tracking-tight ${!formattedDisplayWeight || formattedDisplayWeight === '0' ? 'text-slate-600' : isPerSide ? 'text-purple-400' : 'text-white'}`}>
                                {formattedDisplayWeight}
                            </div>
                        </div>

                        <button
                            onClick={incrementWeight}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            aria-label="Aumentar peso"
                        >
                            <Plus className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={2.5} />
                        </button>

                        {/* Dica de Histórico */}
                        {suggestedWeight && !weight && (
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                <span className="text-[9px] text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">Hist: {suggestedWeight}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Entrada de Repetições */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-center h-8">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Repetições</span>
                    </div>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[24px] p-1 md:p-1.5 flex items-center justify-between h-[56px] md:h-[64px]">
                        <button
                            onClick={decrementReps}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white active:scale-95 transition-all"
                            aria-label="Diminuir repetições"
                        >
                            <Minus className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={2.5} />
                        </button>

                        <div
                            className="flex-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
                            onClick={() => openKeypad('reps')}
                            role="button"
                            aria-label="Definir repetições"
                        >
                            <div className={`text-xl md:text-2xl font-bold leading-none tracking-tight ${!actualReps && suggestedReps ? 'text-slate-600' : 'text-white'}`}>
                                {actualReps || suggestedReps || "0"}
                            </div>
                        </div>

                        <button
                            onClick={incrementReps}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            aria-label="Aumentar repetições"
                        >
                            <Plus className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Botão de Check */}
            <button
                onClick={handleCompleteSet}
                disabled={isCurrentSetCompleted}
                className={`w-auto min-w-[240px] px-8 self-center py-4 rounded-[20px] font-bold text-base tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${isCurrentSetCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-[0.98]'
                    }`}
                aria-label={isCurrentSetCompleted ? "Série concluída" : `Concluir série ${currentSet}`}
            >

                {isCurrentSetCompleted ? (
                    <>
                        <CheckCircle2 size={24} strokeWidth={2.5} />
                        SÉRIE CONCLUÍDA
                    </>
                ) : (
                    <>
                        CONCLUIR SÉRIE {currentSet}
                        <ArrowRight size={22} strokeWidth={2.5} />
                    </>
                )}
            </button>

            {/* Entrada de Observação (Colapsável) */}
            <div className="pt-2">
                <input
                    type="text"
                    value={observation || ''}
                    onChange={(e) => onUpdateNotes(exerciseId, e.target.value)} // Usar manipulador estável dedicado
                    placeholder="Adicionar observação..."
                    className="w-full bg-transparent border-b border-slate-700/50 text-xs text-slate-300 py-3 focus:border-cyan-500/50 focus:text-slate-200 outline-none transition-colors placeholder:text-slate-500" // Contraste aumentado, padding
                    aria-label="Observações do exercício"
                />
            </div>

            {/* --- SOBREPOSIÇÃO DO TECLADO --- */}
            <NumericKeypad
                isOpen={keypadOpen}
                onClose={() => setKeypadOpen(false)}
                onConfirm={handleKeypadConfirm}
                initialValue={activeInputType === 'weight' ? formattedDisplayWeight : (actualReps || suggestedReps || '')}
                title={activeInputType === 'weight' ? (isPerSide ? 'DEFINIR PESO (LADO)' : 'DEFINIR PESO (TOTAL)') : 'DEFINIR REPETIÇÕES'}
            />
        </div>
    );
}); // END MEMO
