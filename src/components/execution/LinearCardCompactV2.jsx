import React, { useState, memo, useRef } from 'react';
import { Minus, Plus, CheckCircle2, Info, Check, ArrowRight, Scale, LayoutList, Target, ArrowDown } from 'lucide-react';
import { NumericKeypad } from '../common/NumericKeypad';

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export const LinearCardCompactV2 = memo(function LinearCardCompactV2({
    exerciseId,
    setId,
    exerciseName,
    method,
    repsGoal,
    currentSet,
    totalSets,
    completedSets,
    weight,
    actualReps,
    drops,
    observation,
    onUpdateNotes,
    onCompleteSet,
    suggestedWeight,
    suggestedReps,
    onMethodClick,
    weightMode = 'total',
    baseWeight,
    onUpdateSetMultiple,
    onToggleWeightMode
}) {
    const completedCount = completedSets.filter(Boolean).length;
    const isExerciseFullyCompleted = completedCount === totalSets && totalSets > 0;
    const isCurrentSetCompleted = completedSets[currentSet - 1];

    const isCascadingAllowed = ['Drop-set', 'Bi-set', 'Rest-Pause', 'Cluster set'].includes(method);
    const hasDrops = drops && drops.length > 0;

    const itemsToRender = hasDrops ? drops.map((d, i) => ({ ...d, index: i })) : [{
        id: 'main', index: 0, weight, reps: actualReps, weightMode, baseWeight
    }];

    const formatWeight = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return "0";
        return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    };

    const [keypadOpen, setKeypadOpen] = useState(false);
    const [activeInput, setActiveInput] = useState(null); // { type: 'weight'|'reps', index }

    const openKeypad = (type, index) => {
        setActiveInput({ type, index });
        setKeypadOpen(true);
    };

    const handleUpdateActiveRow = (index, updates) => {
        if (hasDrops) {
            const newDrops = [...drops];
            newDrops[index] = { ...newDrops[index], ...updates };
            onUpdateSetMultiple(exerciseId, setId, { drops: newDrops });
            // Sincroniza tb o field base opcional
            if (index === 0 && (updates.weight !== undefined || updates.reps !== undefined)) {
                const multi = {};
                if (updates.weight !== undefined) multi.weight = updates.weight;
                if (updates.reps !== undefined) multi.reps = updates.reps;
                if (updates.baseWeight !== undefined) multi.baseWeight = updates.baseWeight;
                if (updates.weightMode !== undefined) multi.weightMode = updates.weightMode;
                onUpdateSetMultiple(exerciseId, setId, multi);
            }
        } else {
            onUpdateSetMultiple(exerciseId, setId, updates);
        }
    };

    const handleKeypadConfirm = (val) => {
        if (!activeInput) return;
        const { type, index } = activeInput;
        const currentItem = itemsToRender[index];
        const isPerSideLocal = currentItem.weightMode === 'per_side';

        if (type === 'weight') {
            const numVal = parseFloat(val);
            if (isNaN(numVal)) return;

            if (isPerSideLocal) {
                handleUpdateActiveRow(index, { weight: (numVal * 2).toString(), baseWeight: val });
            } else {
                handleUpdateActiveRow(index, { weight: val });
            }
        } else {
            handleUpdateActiveRow(index, { reps: val });
        }
    };

    const decrementWeight = (index) => {
        const item = itemsToRender[index];
        const isPerSideLocal = item.weightMode === 'per_side';
        const displayW = isPerSideLocal ? (parseFloat(item.baseWeight) || (parseFloat(item.weight) / 2) || 0) : (parseFloat(item.weight) || parseFloat(suggestedWeight) || 0);
        const newVal = Math.max(0, displayW - 2.5);

        if (isPerSideLocal) {
            handleUpdateActiveRow(index, { weight: (newVal * 2).toString(), baseWeight: newVal.toString() });
        } else {
            handleUpdateActiveRow(index, { weight: newVal.toString() });
        }
    };

    const incrementWeight = (index) => {
        const item = itemsToRender[index];
        const isPerSideLocal = item.weightMode === 'per_side';
        const displayW = isPerSideLocal ? (parseFloat(item.baseWeight) || (parseFloat(item.weight) / 2) || 0) : (parseFloat(item.weight) || parseFloat(suggestedWeight) || 0);
        const newVal = displayW + 2.5;

        if (isPerSideLocal) {
            handleUpdateActiveRow(index, { weight: (newVal * 2).toString(), baseWeight: newVal.toString() });
        } else {
            handleUpdateActiveRow(index, { weight: newVal.toString() });
        }
    };

    const decrementReps = (index) => {
        const item = itemsToRender[index];
        const current = parseInt(item.reps) || parseInt(suggestedReps) || 0;
        const newVal = Math.max(0, current - 1).toString();
        handleUpdateActiveRow(index, { reps: newVal });
    };

    const incrementReps = (index) => {
        const item = itemsToRender[index];
        const current = parseInt(item.reps) || parseInt(suggestedReps) || 0;
        const newVal = (current + 1).toString();
        handleUpdateActiveRow(index, { reps: newVal });
    };

    const cardEndRef = useRef(null);

    const handleAddDrop = () => {
        let newDrops = [];
        if (!hasDrops) {
            newDrops = [
                { id: generateId(), weight: weight || '', reps: actualReps || '', weightMode, baseWeight },
                { id: generateId(), weight: weight || '', reps: '', weightMode, baseWeight }
            ];
        } else {
            const last = drops[drops.length - 1];
            newDrops = [
                ...drops,
                { id: generateId(), weight: last.weight, reps: '', weightMode: last.weightMode, baseWeight: last.baseWeight }
            ];
        }
        onUpdateSetMultiple(exerciseId, setId, { drops: newDrops });
        
        // Timeout para permitir que o DOM atualize
        setTimeout(() => {
            if (cardEndRef.current) {
                cardEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 150);
    };

    const handleRemoveDrop = (index) => {
        if (!hasDrops) return;
        const newDrops = drops.filter((_, i) => i !== index);
        if (newDrops.length === 1) {
            // Reverter para single set
            onUpdateSetMultiple(exerciseId, setId, { 
                drops: null, 
                weight: newDrops[0].weight, 
                reps: newDrops[0].reps,
                weightMode: newDrops[0].weightMode,
                baseWeight: newDrops[0].baseWeight
            });
        } else {
            onUpdateSetMultiple(exerciseId, setId, { drops: newDrops });
        }
    };

    const toggleLocalWeightMode = (index) => {
        if (hasDrops) {
             const item = drops[index];
             const targetMode = item.weightMode === 'total' ? 'per_side' : 'total';
             const currentWeight = parseFloat(item.weight) || 0;
             if (targetMode === 'per_side') {
                 handleUpdateActiveRow(index, { weightMode: 'per_side', baseWeight: (currentWeight > 0 ? currentWeight / 2 : 0).toString() });
             } else {
                 handleUpdateActiveRow(index, { weightMode: 'total', baseWeight: null });
             }
        } else {
             if (onToggleWeightMode) onToggleWeightMode();
        }
    };

    const handleCompleteSet = () => {
        if (hasDrops) {
            // Validar tds os drops
            const invalid = drops.some(d => !d.weight || parseFloat(d.weight) <= 0 || !d.reps || d.reps.trim() === '');
            if (invalid) {
                alert('Preencha os valores de peso e repetição em todas as sub-séries (drops)!');
                return;
            }
            onCompleteSet(exerciseId, currentSet, drops[0].weight, drops[0].reps, drops[0].weightMode, drops[0].baseWeight, drops);
        } else {
            const w = (weight && parseFloat(weight) > 0) ? weight : suggestedWeight;
            const r = (actualReps && actualReps.trim() !== '') ? actualReps : suggestedReps;
            if (!w || parseFloat(w) <= 0) { alert('Informe o peso utilizado!'); return; }
            if (!r || r.toString().trim() === '') { alert('Informe as repetições alcançadas!'); return; }
            onCompleteSet(exerciseId, currentSet, w.toString(), r.toString(), weightMode, baseWeight);
        }
    };

    const containerClass = isExerciseFullyCompleted
        ? "bg-emerald-900/20 border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
        : "bg-slate-900/40 border border-slate-700/50 shadow-lg backdrop-blur-md";

    // Determinar valor inicial do numpad
    let numpadInitial = '';
    let numpadTitle = '';
    if (activeInput) {
        const item = itemsToRender[activeInput.index];
        if (activeInput.type === 'weight') {
            const isPerSideL = item.weightMode === 'per_side';
            const dispW = isPerSideL ? (parseFloat(item.baseWeight) || (parseFloat(item.weight) / 2) || 0) : (parseFloat(item.weight) || parseFloat(suggestedWeight) || 0);
            numpadInitial = formatWeight(dispW);
            numpadTitle = isPerSideL ? 'DEFINIR PESO (LADO)' : 'DEFINIR PESO (TOTAL)';
        } else {
            numpadInitial = item.reps || suggestedReps || '';
            numpadTitle = 'DEFINIR REPETIÇÕES';
        }
    }

    return (
        <div className={`rounded-[24px] p-[22px] flex flex-col gap-[14px] transition-all duration-300 relative overflow-hidden ${containerClass}`}>
            <div className="flex justify-between items-start mb-[10px] gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[#e2e8f0] text-[20px] font-bold leading-tight uppercase relative" style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', display: 'block' }}>
                        {exerciseName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2 mb-0.5">
                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                            <LayoutList size={11} className="text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-300">{totalSets} Séries</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                            <Target size={11} className="text-cyan-500" />
                            <span className="text-[11px] font-bold text-cyan-400 tracking-wide">Meta: {repsGoal}</span>
                        </div>
                        <div onClick={onMethodClick} className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50 cursor-pointer hover:bg-slate-700 transition-all group/badge">
                            <Info size={11} className="text-blue-400 group-hover/badge:text-cyan-400 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{method}</span>
                        </div>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-base font-bold flex-shrink-0 border ${isExerciseFullyCompleted ? 'text-green-500 bg-green-500/10 border-green-500/30' : 'text-blue-500 bg-blue-500/10 border-blue-500/25'}`}>
                    {completedCount} / {totalSets}
                </div>
            </div>

            <div className="flex gap-1.5 mb-2">
                {Array.from({ length: totalSets }).map((_, idx) => {
                    const setNum = idx + 1;
                    const isCompleted = completedSets[idx];
                    const isActive = currentSet === setNum && !isCompleted;
                    return (
                        <div key={idx} className={`flex-1 h-8 rounded-full transition-all duration-300 relative flex items-center justify-center text-xs font-extrabold select-none ${isCompleted ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-400' : isActive ? 'bg-blue-600/20 border border-blue-500 text-blue-400' : 'bg-slate-800/40 border border-slate-700/50 text-slate-400'}`} style={isActive ? { boxShadow: '0 0 15px rgba(59,130,246,0.3)' } : {}}>
                            {isCompleted ? <Check size={16} strokeWidth={3} /> : setNum}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 relative leading-none z-10">
                {itemsToRender.map((item, index) => {
                    const isPerSideL = item.weightMode === 'per_side';
                    const dispW = isPerSideL ? (parseFloat(item.baseWeight) || (parseFloat(item.weight) / 2) || 0) : (parseFloat(item.weight) || (index === 0 ? parseFloat(suggestedWeight) : 0) || 0);
                    const formattedDisplay = formatWeight(dispW);
                    
                    return (
                        <div key={item.id} className="relative">
                            {index > 0 && (
                                <div className="flex justify-center -mt-4 mb-2 relative z-0">
                                    <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-full text-cyan-500">
                                        <ArrowDown size={14}/>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 relative z-10 w-full mb-1">
                                <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center justify-between gap-1 h-8 px-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate flex-1 text-center">
                                            {isPerSideL ? `LADO • TOT: ${item.weight||"0"}` : 'PESO (TOT)'}
                                        </span>
                                        <button onClick={() => toggleLocalWeightMode(index)} className={`p-1.5 rounded-full ${isPerSideL ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}><Scale size={13} /></button>
                                    </div>
                                    <div className={`bg-[#0f172a] border ${isPerSideL?'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]': (index > 0 ? 'border-cyan-500/30' : 'border-slate-800')} rounded-[24px] p-1 md:p-1.5 flex items-center justify-between relative h-[56px] md:h-[64px]`}>
                                        <button onClick={() => decrementWeight(index)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-800"><Minus className="w-[18px] md:w-5" strokeWidth={2.5} /></button>
                                        <div className="flex-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 text-center" onClick={() => openKeypad('weight', index)}>
                                            <div className={`text-xl md:text-2xl font-bold leading-none tracking-tight ${!formattedDisplay || formattedDisplay === '0' ? 'text-slate-400' : isPerSideL ? 'text-purple-400' : (index>0?'text-white':'text-white')}`}>
                                                {formattedDisplay}
                                            </div>
                                        </div>
                                        <button onClick={() => incrementWeight(index)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]"><Plus className="w-[18px] md:w-5" strokeWidth={2.5} /></button>
                                        {index === 0 && !item.weight && suggestedWeight && (
                                            <div className="absolute top-1 left-1/2 -translate-x-1/2 -mt-1 opacity-0 group-hover:opacity-100 pointer-events-none"><span className="text-[9px] text-slate-300 bg-slate-800/90 px-1.5 rounded border border-slate-700">Hist: {suggestedWeight}</span></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center justify-between h-8 px-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center flex-1">Repetições</span>
                                        {index > 0 && (
                                            <button onClick={() => handleRemoveDrop(index)} className="p-1.5 text-slate-500 hover:text-red-400"><Minus size={13}/></button>
                                        )}
                                    </div>
                                    <div className={`bg-[#0f172a] border ${index>0?'border-slate-800':'border-slate-800'} rounded-[24px] p-1 md:p-1.5 flex items-center justify-between h-[56px] md:h-[64px]`}>
                                        <button onClick={() => decrementReps(index)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-800"><Minus className="w-[18px] md:w-5" strokeWidth={2.5} /></button>
                                        <div className="flex-1 flex flex-col items-center justify-center cursor-pointer active:scale-95" onClick={() => openKeypad('reps', index)}>
                                            <div className={`text-xl md:text-2xl font-bold leading-none tracking-tight ${!item.reps && (index===0?suggestedReps:null) ? 'text-slate-400' : 'text-white'}`}>
                                                {item.reps || (index===0?suggestedReps:null) || "0"}
                                            </div>
                                        </div>
                                        <button onClick={() => incrementReps(index)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]"><Plus className="w-[18px] md:w-5" strokeWidth={2.5} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isCascadingAllowed && (
                 <button onClick={handleAddDrop} disabled={isCurrentSetCompleted} className="mt-1 mb-2 mx-auto text-[10px] uppercase font-bold text-slate-400 border border-dashed border-slate-700 rounded-xl py-2 px-6 hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-fit">
                      + Adicionar Redução / Drop
                 </button>
            )}

            <button onClick={handleCompleteSet} disabled={isCurrentSetCompleted} className={`w-auto min-w-[240px] px-8 self-center py-4 rounded-[20px] font-bold text-base tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${isCurrentSetCompleted ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-[0.98]'}`}>
                {isCurrentSetCompleted ? <><CheckCircle2 size={24} strokeWidth={2.5} /> SÉRIE CONCLUÍDA</> : <>CONCLUIR SÉRIE {currentSet} {hasDrops ? '(COMPLETA)' : ''} <ArrowRight size={22} strokeWidth={2.5} /></>}
            </button>

            <div className="pt-2">
                <input type="text" value={observation || ''} onChange={(e) => onUpdateNotes(exerciseId, e.target.value)} placeholder="Adicionar observação..." className="w-full bg-transparent border-b border-slate-700/50 text-xs text-slate-300 py-3 focus:border-cyan-500/50 focus:text-slate-200 outline-none transition-colors placeholder:text-slate-500" />
            </div>

            <NumericKeypad isOpen={keypadOpen} onClose={() => setKeypadOpen(false)} onConfirm={handleKeypadConfirm} initialValue={numpadInitial} title={numpadTitle} />
            <div ref={cardEndRef} className="h-1" />
        </div>
    );
});
