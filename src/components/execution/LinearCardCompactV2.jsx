/**
 * LinearCardCompactV2.jsx
 * Cartão de exercício compacto para visualização de execução.
 * Lida com registro de séries, ajustes de peso/repetição e rastreamento visual de progresso.
 */
import React, { useState, useMemo } from 'react';
import { Minus, Plus, CheckCircle2, Info, Check, Zap } from 'lucide-react';

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
    // Check for Pyramid (slash, comma, or plus separated multiple values)
    if (cleaned.includes('/') || (cleaned.includes(',') && cleaned.split(',').length > 1) || (cleaned.includes('+') && cleaned.split('+').length > 1)) {
        return 'PYRAMID';
    }
    if (cleaned.includes('-') && /^\d+-\d+/.test(cleaned)) {
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
            // Split by slash, comma, or plus
            const values = repsGoal.split(/[\/,\+]/).map(v => v.trim());
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

// --- COLOR DICTIONARIES ---

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

export function LinearCardCompactV2({
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
    onWeightChange,
    onRepsChange,
    onObservationChange,
    onSetChange,
    onCompleteSet,
    suggestedWeight, // New Prop for History
    suggestedReps // New Prop for History
}) {
    // Determine completion status
    const completedCount = completedSets.filter(Boolean).length;
    const isExerciseFullyCompleted = completedCount === totalSets && totalSets > 0;
    const isCurrentSetCompleted = completedSets[currentSet - 1];

    // Memoize calculations
    const { repsType, currentSetGoal } = useMemo(() => {
        const type = detectRepsType(repsGoal);
        const goal = getCurrentSetGoal(repsGoal, currentSet, type);
        return { repsType: type, currentSetGoal: goal };
    }, [repsGoal, currentSet]);

    // Handlers
    // Handlers
    const decrementWeight = () => {
        const current = parseFloat(weight) || parseFloat(suggestedWeight) || 0;
        onWeightChange(Math.max(0, current - 0.25).toFixed(2));
    };

    const incrementWeight = () => {
        const current = parseFloat(weight) || parseFloat(suggestedWeight) || 0;
        onWeightChange((current + 0.25).toFixed(2));
    };

    const decrementReps = () => {
        const current = parseInt(actualReps) || parseInt(suggestedReps);
        if (!isNaN(current)) {
            onRepsChange(Math.max(0, current - 1).toString());
        }
    };

    const incrementReps = () => {
        const current = parseInt(actualReps) || parseInt(suggestedReps);
        if (!isNaN(current)) {
            onRepsChange((current + 1).toString());
        } else {
            if (!actualReps) onRepsChange("1");
        }
    };

    const handleCompleteSet = () => {
        // Use current OR suggested
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

        onCompleteSet({
            setNumber: currentSet,
            weight: effectiveWeight.toString(),
            actualReps: effectiveReps.toString()
        });
    };

    // --- STYLES ---

    // COMPLETE STATE (GREEN) - REDUCED GLOW
    const completeStyle = {
        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,95,70,0.3))', // Darker/Lower opacity
        border: '2px solid rgba(16,185,129,0.5)',
        boxShadow: '0 8px 30px rgba(16,185,129,0.25), inset 0 0 20px rgba(16,185,129,0.05)' // Reduced spread and opacity
    };

    // IN PROGRESS STATE (DEFAULT)
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
            {/* Header */}
            <div className="flex justify-between items-start mb-[10px] gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[#e2e8f0] text-[20px] font-bold leading-tight truncate">
                        {exerciseName}
                    </h3>

                    {/* Badges Grid */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Muscle Badge */}
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

                        {/* Method Badge */}
                        <div
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase truncate"
                            style={{
                                color: '#60a5fa',
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(59,130,246,0.25)'
                            }}
                        >
                            <Info size={10} strokeWidth={3} />
                            {method}
                        </div>

                        {/* Goal Badge (Merged) */}
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
                                    {repsType === 'PYRAMID' && `${currentSetGoal}`}
                                    {repsType === 'CLUSTER' && currentSetGoal}
                                    {repsType === 'RANGE' && `${currentSetGoal}`}
                                    {repsType === 'NUMERIC' && `${currentSetGoal}`}
                                    {repsType === 'TEXT' && currentSetGoal}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Counter */}
                <div
                    className={`px-3 py-1.5 rounded-full text-[20px] font-bold flex-shrink-0 border ${isExerciseFullyCompleted ? 'text-green-500 bg-green-500/10 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/25'}`}
                >
                    {completedCount}/{totalSets}
                </div>
            </div>


            {/* Progress Bar (Numbered Segments) */}
            <div className="flex gap-1.5 mb-2">
                {Array.from({ length: totalSets }).map((_, idx) => {
                    const setNum = idx + 1;
                    const isCompleted = completedSets[idx];
                    const isActive = currentSet === setNum && !isCompleted;

                    return (
                        <button
                            key={idx}
                            onClick={() => onSetChange(setNum)}
                            className={`flex-1 h-8 rounded-full transition-all duration-300 relative flex items-center justify-center text-xs font-bold ${isCompleted
                                ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-400'
                                : isActive
                                    ? 'bg-blue-600/20 border border-blue-500 text-blue-400'
                                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-600'
                                }`}
                            style={isActive ? {
                                boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                            } : {}}
                        >
                            {isCompleted ? <Check size={14} strokeWidth={3} /> : setNum}
                        </button>
                    );
                })}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-1">
                {/* Weight Input */}
                <div className="bg-slate-900/60 border border-slate-700/30 rounded-full p-1 flex items-center gap-1.5 relative">
                    <button
                        onClick={decrementWeight}
                        className="w-10 h-10 rounded-full bg-slate-800/60 border-2 border-slate-500/20 text-slate-400 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        <Minus size={18} strokeWidth={2} />
                    </button>
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 tracking-wider font-bold mb-0.5">PESO (KG)</span>
                        <input
                            type="number"
                            value={weight || suggestedWeight || ""}
                            onChange={(e) => onWeightChange(e.target.value)}
                            className={`bg-transparent border-none text-center font-bold text-lg p-0 w-full focus:ring-0 ${!weight && suggestedWeight ? 'text-slate-500' : 'text-[#f1f5f9]'}`}
                            placeholder="0.00"
                        />
                        {/* History Hint */}
                        {suggestedWeight && !weight && (
                            <span className="absolute bottom-1 right-14 text-[8px] text-slate-600">Hist: {suggestedWeight}</span>
                        )}
                    </div>
                    <button
                        onClick={incrementWeight}
                        className="w-10 h-10 rounded-full bg-blue-500/15 border-2 border-[#3abff8] text-[#3abff8] flex items-center justify-center shadow-[0_0_16px_rgba(58,191,248,0.25)] hover:bg-blue-500/25 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Reps Input */}
                <div className="bg-slate-900/60 border border-slate-700/30 rounded-full p-1 flex items-center gap-1.5">
                    <button
                        onClick={decrementReps}
                        className="w-10 h-10 rounded-full bg-slate-800/60 border-2 border-slate-500/20 text-slate-400 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        <Minus size={18} strokeWidth={2} />
                    </button>
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 tracking-wider font-bold mb-0.5">REPETIÇÕES</span>
                        <input
                            type="text"
                            value={(actualReps && /^\d+$/.test(actualReps)) ? actualReps : ""}
                            onChange={(e) => onRepsChange(e.target.value)}
                            className={`bg-transparent border-none text-center font-bold text-lg p-0 w-full focus:ring-0 ${(!actualReps || !/^\d+$/.test(actualReps)) ? 'text-slate-500' : 'text-[#f1f5f9]'}`}
                            placeholder="0"
                        />
                    </div>
                    <button
                        onClick={incrementReps}
                        className="w-10 h-10 rounded-full bg-blue-500/15 border-2 border-[#3abff8] text-[#3abff8] flex items-center justify-center shadow-[0_0_16px_rgba(58,191,248,0.25)] hover:bg-blue-500/25 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Complete Button */}
            <button
                onClick={handleCompleteSet}
                disabled={isCurrentSetCompleted}
                className={`w-full py-4 px-5 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${isCurrentSetCompleted
                    ? 'bg-slate-700/30 border-2 border-slate-700/40 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500/25 to-blue-600/30 border-2 border-[#3abff8] text-[#3abff8] shadow-[0_6px_24px_rgba(59,130,246,0.35)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-[0.98]'
                    }`}
            >
                {isCurrentSetCompleted ? (
                    <>
                        <Check size={20} />
                        SÉRIE {currentSet} COMPLETA
                    </>
                ) : (
                    <>
                        <CheckCircle2 size={20} />
                        Completar Série {currentSet}
                    </>
                )}
            </button>

            {/* Observations */}
            {observation !== undefined && (
                <div className="bg-slate-700/15 border border-slate-700/25 rounded-xl px-3.5 py-3 mt-1">
                    <label className="text-[9px] text-slate-400 tracking-wider block mb-1">OBSERVAÇÕES</label>
                    <textarea
                        value={observation}
                        onChange={(e) => onObservationChange(e.target.value)}
                        placeholder="Alguma observação sobre a execução?"
                        rows={1}
                        className="w-full bg-transparent border-none text-slate-300 text-xs italic p-0 focus:ring-0 placeholder:text-slate-600 resize-none"
                        style={{ minHeight: '20px' }}
                    />
                </div>
            )}
        </div>
    );
}
