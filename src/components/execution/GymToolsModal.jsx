/**
 * GymToolsModal.jsx
 * Ferramentas rápidas durante o treino: 1RM estimado (Epley/Brzycki)
 * e calculadora de anilhas (como montar a carga na barra).
 */
import React, { useMemo, useState } from 'react';
import { X, Calculator, Disc3 } from 'lucide-react';
import { Button } from '../design-system/Button';
import {
    estimateOneRepMax,
    repMaxTable,
    calculatePlates,
    parseDecimal,
    DEFAULT_BAR_WEIGHT
} from '../../utils/strengthMath';

const inputClasses = 'w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold text-center outline-none focus:border-cyan-500/60 transition-colors';

function formatKg(value) {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

function OneRepMaxTab({ initialWeight, initialReps }) {
    const [weight, setWeight] = useState(initialWeight || '');
    const [reps, setReps] = useState(initialReps || '');

    const estimate = useMemo(() => estimateOneRepMax(weight, reps), [weight, reps]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Carga (kg)</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="60"
                        className={inputClasses}
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Repetições</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="8"
                        className={inputClasses}
                    />
                </label>
            </div>

            {estimate ? (
                <>
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">1RM estimado</span>
                        <span className="text-3xl font-heading font-bold text-cyan-400">{formatKg(estimate.oneRepMax)}</span>
                        <div className="flex justify-center gap-4 mt-2 text-[11px] text-slate-500">
                            <span>Epley: {formatKg(estimate.epley)}</span>
                            <span>Brzycki: {formatKg(estimate.brzycki)}</span>
                        </div>
                        {!estimate.reliable && (
                            <p className="text-[11px] text-amber-400/90 mt-2">
                                Acima de 12 repetições a estimativa perde precisão.
                            </p>
                        )}
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 border-b border-slate-800">
                            <span className="col-span-2">Repetições</span>
                            <span>% 1RM</span>
                            <span className="text-right">Carga</span>
                        </div>
                        {repMaxTable(estimate.oneRepMax).map(row => (
                            <div key={row.reps} className="grid grid-cols-4 px-4 py-1.5 text-sm text-slate-300 odd:bg-slate-800/20">
                                <span className="col-span-2 font-bold">{row.reps} rep{row.reps > 1 ? 's' : ''}</span>
                                <span className="text-slate-500">{row.percent}%</span>
                                <span className="text-right font-mono text-cyan-300/90">{row.weight.toLocaleString('pt-BR')}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                    Informe carga e repetições para estimar seu 1RM.
                </p>
            )}
        </div>
    );
}

function PlateCalculatorTab({ initialWeight }) {
    const [target, setTarget] = useState(initialWeight || '');
    const [barWeight, setBarWeight] = useState(String(DEFAULT_BAR_WEIGHT));

    const result = useMemo(() => {
        if (parseDecimal(target) <= 0) return undefined;
        return calculatePlates(target, barWeight);
    }, [target, barWeight]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Carga alvo (kg)</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="72,5"
                        className={inputClasses}
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Barra (kg)</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={barWeight}
                        onChange={(e) => setBarWeight(e.target.value)}
                        className={inputClasses}
                    />
                </label>
            </div>

            {result === undefined ? (
                <p className="text-sm text-slate-500 text-center py-4">
                    Informe a carga total desejada para ver a montagem da barra.
                </p>
            ) : result === null ? (
                <p className="text-sm text-amber-400/90 text-center py-4">
                    A carga alvo é menor que o peso da barra.
                </p>
            ) : (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center space-y-3">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Anilhas por lado</span>
                        {result.platesPerSide.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-2">
                                {result.platesPerSide.map((plate, idx) => (
                                    <span
                                        key={`${plate}-${idx}`}
                                        className="inline-flex items-center justify-center min-w-12 px-2 h-12 rounded-full bg-slate-900 border-2 border-cyan-500/40 text-cyan-300 font-bold text-sm"
                                    >
                                        {plate.toLocaleString('pt-BR')}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Barra vazia — sem anilhas.</p>
                        )}
                    </div>

                    <div className="text-sm text-slate-300">
                        Total montado: <span className="font-bold text-white">{formatKg(result.achievedWeight)}</span>
                    </div>

                    {result.remainder > 0 && (
                        <p className="text-[11px] text-amber-400/90">
                            Faltam {formatKg(result.remainder)} para a carga exata com as anilhas padrão (1,25 a 25 kg).
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export function GymToolsModal({ isOpen, onClose, initialWeight, initialReps }) {
    const [activeTab, setActiveTab] = useState('1rm');

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-label="Ferramentas de treino"
                className="w-full max-w-md max-h-[85dvh] overflow-y-auto bg-[#0f172a] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Ferramentas</h3>
                    <Button
                        variant="unstyled"
                        aria-label="Fechar ferramentas"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <X size={18} />
                    </Button>
                </div>

                <div className="flex gap-2 mb-5">
                    <Button
                        variant="unstyled"
                        onClick={() => setActiveTab('1rm')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${activeTab === '1rm'
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Calculator size={14} /> 1RM
                    </Button>
                    <Button
                        variant="unstyled"
                        onClick={() => setActiveTab('plates')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${activeTab === 'plates'
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Disc3 size={14} /> Anilhas
                    </Button>
                </div>

                {activeTab === '1rm'
                    ? <OneRepMaxTab initialWeight={initialWeight} initialReps={initialReps} />
                    : <PlateCalculatorTab initialWeight={initialWeight} />}
            </div>
        </div>
    );
}
