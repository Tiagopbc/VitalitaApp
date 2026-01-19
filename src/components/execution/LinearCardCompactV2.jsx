/**
 * LinearCardCompactV2.jsx
 * Cartão de exercício compacto para visualização de execução.
 * Lida com registro de séries, ajustes de peso/repetição e rastreamento visual de progresso.
 */
import React, { useState, useMemo, memo } from 'react';
import { Minus, Plus, CheckCircle2, Info, Check, Zap, LayoutList, Target, ArrowRight, History } from 'lucide-react';

/**
 * @typedef {'NUMERIC' | 'RANGE' | 'PYRAMID' | 'CLUSTER' | 'FAILURE' | 'TEXT'} RepsType
 */

/**
 * Detects the type of repetitions based on the goal string.
 * @param {string} repsGoal 
 * @returns {RepsType}
 */
function detectRepsType(repsGoal) {
    if (!repsGoal || repsGoal.trim() === '') return 'NUMERIC';

    const cleaned = repsGoal.trim().toUpperCase();

    if (cleaned.includes('FALHA') || cleaned.includes('FAILURE') || cleaned.includes('MAX')) {
        return 'FAILURE';
    }
    // Check for Pyramid (slash or comma separated multiple values). 
    // REMOVED '+' to allow "8+8+8" to be shown as full text (Cluster/Drop)
    if (cleaned.includes('/') || (cleaned.includes(',') && cleaned.split(',').length > 1)) {
        return 'PYRAMID';
    }
    // Cluster: now explicitly checks for '-' range OR '+' notation
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
 * Calculates the goal for the current set.
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
            // Split by slash or comma
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
    exerciseId, // New Prop
    setId,      // New Prop
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
    onUpdateSet, // Stable: (exId, setId, field, val) => ...
    onUpdateNotes, // Stable: (exId, val) => ...
    onCompleteSet, // Stable: (exId, setNumber, weight, reps) => ...
    suggestedWeight,
    suggestedReps,

    onMethodClick,
    onSetChange
}) {
    // Determine completion status
    const completedCount = completedSets.filter(Boolean).length;
    const isExerciseFullyCompleted = completedCount === totalSets && totalSets > 0;
    const isCurrentSetCompleted = completedSets[currentSet - 1];

    // Estado do Teclado
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [activeInputType, setActiveInputType] = useState(null); // 'weight' | 'reps'

    const openKeypad = (type) => {
        setActiveInputType(type);
        setKeypadOpen(true);
    };

    const handleKeypadConfirm = (val) => {
        if (activeInputType === 'weight') {
            onUpdateSet(exerciseId, setId, 'weight', val);
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
        const current = parseFloat(weight) || parseFloat(suggestedWeight) || 0;
        const newVal = Math.max(0, current - 0.25).toFixed(2);
        onUpdateSet(exerciseId, setId, 'weight', newVal);
    };

    const incrementWeight = () => {
        const current = parseFloat(weight) || parseFloat(suggestedWeight) || 0;
        const newVal = (current + 0.25).toFixed(2);
        onUpdateSet(exerciseId, setId, 'weight', newVal);
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

        // Alterado para passar argumentos diretamente para suportar manipulador pai estável
        onCompleteSet(exerciseId, currentSet, effectiveWeight.toString(), effectiveReps.toString());
    };

    // ... (Estilos) ...
    // ESTADO COMPLETO (VERDE) - BRILHO REDUZIDO
    const completeStyle = {
        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,95,70,0.3))', // Darker/Lower opacity
        border: '2px solid rgba(16,185,129,0.5)',
        boxShadow: '0 8px 30px rgba(16,185,129,0.25), inset 0 0 20px rgba(16,185,129,0.05)' // Reduced spread and opacity
    };

    // ESTADO EM ANDAMENTO (PADRÃO)
    const normalStyle = {
        background: 'linear-gradient(135deg, rgba(5,8,22,0.95), rgba(11,17,32,0.98))',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    };

    const containerStyle = isExerciseFullyCompleted ? completeStyle : normalStyle;

    return (
        <div
            style={containerStyle}
            className="rounded-[24px] p-[22px] flex flex-col gap-[14px] transition-all duration-300 relative overflow-hidden"
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

                    {/* Nova Linha de Detalhes da Ficha */}
                    <div className="flex items-center gap-3 mt-1.5 mb-0.5">
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
                    </div>

                    {/* Grade de Emblemas */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Emblema de Músculo */}
                        <div
                            className="flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase truncate"
                            style={{
                                color: '#60a5fa', // Neutral blue during execution
                                background: 'rgba(59,130,246,0.12)',
                                border: '1px solid rgba(59,130,246,0.3)'
                            }}
                        >
                            {muscleGroup}
                        </div>

                        {/* Emblema de Método */}
                        <div
                            onClick={onMethodClick}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase truncate cursor-pointer hover:bg-slate-700 active:scale-95 transition-all group/badge"
                            style={{
                                color: '#60a5fa',
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(59,130,246,0.25)'
                            }}
                        >
                            <Info size={10} strokeWidth={3} className="text-blue-400 group-hover/badge:text-cyan-400 transition-colors" />
                            {method}
                        </div>

                        {/* Emblema de Meta (Mesclado) */}
                        {currentSetGoal && (
                            <div
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase truncate"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.15))',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#3abff8',
                                    boxShadow: '0 2px 12px rgba(59,130,246,0.15)'
                                }}
                            >
                                <Zap size={10} strokeWidth={3} fill="currentColor" />
                                <span>SÉRIE :</span>
                                <span className="text-[12px] font-extrabold ml-0.5">
                                    {repsType === 'FAILURE' && 'FALHA'}
                                    {repsType === 'PYRAMID' && ((typeof currentSetGoal === 'string' && currentSetGoal.includes('/')) ? currentSetGoal.split('/')[currentSet - 1] || currentSetGoal.split('/').pop() : currentSetGoal)}
                                    {repsType === 'CLUSTER' && currentSetGoal}
                                    {repsType === 'RANGE' && `${currentSetGoal}`}
                                    {repsType === 'NUMERIC' && `${currentSetGoal}`}
                                    {repsType === 'TEXT' && currentSetGoal}
                                </span>
                            </div>
                        )}
                    </div>
                </div>


                {/* Contador */}
                <div
                    className={`px-3 py-1.5 rounded-full text-[20px] font-bold flex-shrink-0 border ${isExerciseFullyCompleted ? 'text-green-500 bg-green-500/10 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/25'}`}
                >
                    {completedCount} / {totalSets}
                </div>
            </div>


            {/* Barra de Progresso (Segmentos Numerados) */}
            <div className="flex gap-1.5 mb-2">
                {Array.from({ length: totalSets }).map((_, idx) => {
                    const setNum = idx + 1;
                    const isCompleted = completedSets[idx];
                    const isActive = currentSet === setNum && !isCompleted;

                    return (
                        <button
                            key={idx}
                            onClick={() => onSetChange(setNum)}
                            className={`flex-1 h-10 rounded-full transition-all duration-300 relative flex items-center justify-center text-xs font-bold ${isCompleted // Increased height to h-10 (40px) - acceptable tradeoff for density, better than h-8
                                ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-400'
                                : isActive
                                    ? 'bg-blue-600/20 border border-blue-500 text-blue-400'
                                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-400' // Contraste melhorado do slate-600
                                }`}
                            style={isActive ? {
                                boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                            } : {}}
                            aria-label={`Ir para série ${setNum}`}
                        >
                            {isCompleted ? <Check size={16} strokeWidth={3} /> : setNum}
                        </button>
                    );
                })}
            </div>

            {/* Grade de Entradas */}
            <div className="grid grid-cols-2 gap-3 mb-1">
                {/* Entrada de Peso */}
                <div className="bg-slate-900/60 border border-slate-700/30 rounded-full p-1 flex items-center gap-1.5 relative">
                    <button
                        onClick={decrementWeight}
                        className="w-11 h-11 rounded-full bg-slate-800/60 border-2 border-slate-500/20 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all" // Aumentado para w-11 h-11 (44px), texto mais claro
                        aria-label="Diminuir peso"
                    >
                        <Minus size={20} strokeWidth={2} />
                    </button>
                    <div
                        className="flex-1 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                        onClick={() => openKeypad('weight')}
                        role="button"
                        aria-label="Definir peso"
                    >
                        <span className="text-[10px] text-slate-400 tracking-wider font-bold mb-0.5">PESO (KG)</span> {/* Tamanho do texto aumentado para 10px */}
                        <div className={`text-center font-bold text-lg leading-none ${!weight && suggestedWeight ? 'text-slate-500' : 'text-[#f1f5f9]'}`}>
                            {weight || suggestedWeight || "0.00"}
                        </div>
                        {/* Dica de Histórico */}
                        {suggestedWeight && !weight && (
                            <span className="absolute bottom-1 right-14 text-[9px] text-slate-500">Hist: {suggestedWeight}</span> // Contraste melhorado slate-500
                        )}
                    </div>
                    <button
                        onClick={incrementWeight}
                        className="w-11 h-11 rounded-full bg-blue-500/15 border-2 border-[#3abff8] text-[#3abff8] flex items-center justify-center shadow-[0_0_16px_rgba(58,191,248,0.25)] hover:bg-blue-500/25 active:scale-95 transition-all" // Increased to w-11 h-11
                        aria-label="Aumentar peso"
                    >
                        <Plus size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Entrada de Repetições */}
                <div className="bg-slate-900/60 border border-slate-700/30 rounded-full p-1 flex items-center gap-1.5">
                    <button
                        onClick={decrementReps}
                        className="w-11 h-11 rounded-full bg-slate-800/60 border-2 border-slate-500/20 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all" // Tamanho aumentado & contraste
                        aria-label="Diminuir repetições"
                    >
                        <Minus size={20} strokeWidth={2} />
                    </button>
                    <div
                        className="flex-1 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                        onClick={() => openKeypad('reps')}
                        role="button"
                        aria-label="Definir repetições"
                    >
                        <span className="text-[10px] text-slate-400 tracking-wider font-bold mb-0.5">REPETIÇÕES</span> {/* Tamanho Aumentado */}
                        <div className={`text-center font-bold text-lg leading-none ${!actualReps && suggestedReps ? 'text-slate-500' : 'text-[#f1f5f9]'}`}>
                            {actualReps || suggestedReps || "0"}
                        </div>
                    </div>
                    <button
                        onClick={incrementReps}
                        className="w-11 h-11 rounded-full bg-blue-500/15 border-2 border-[#3abff8] text-[#3abff8] flex items-center justify-center shadow-[0_0_16px_rgba(58,191,248,0.25)] hover:bg-blue-500/25 active:scale-95 transition-all" // Tamanho aumentado
                        aria-label="Aumentar repetições"
                    >
                        <Plus size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Botão de Check */}
            <button
                onClick={handleCompleteSet}
                disabled={isCurrentSetCompleted}
                className={`w-full py-4 rounded-[20px] font-bold text-base tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${isCurrentSetCompleted
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
                initialValue={activeInputType === 'weight' ? (weight || suggestedWeight || '') : (actualReps || suggestedReps || '')}
                title={activeInputType === 'weight' ? 'DEFINIR PESO (KG)' : 'DEFINIR REPETIÇÕES'}
            />
        </div>
    );
}); // END MEMO
