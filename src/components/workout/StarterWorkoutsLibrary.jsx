/**
 * StarterWorkoutsLibrary.jsx
 * Galeria de fichas modelo (starterWorkouts) para o aluno clonar no primeiro acesso.
 * Não escreve no Firestore — delega a clonagem ao componente pai via onClone(starter).
 */
import React from 'react';
import { X, Dumbbell, Sparkles, Plus } from 'lucide-react';
import { starterWorkouts } from '../../data/starterWorkouts';
import { Button } from '../design-system/Button';

export function StarterWorkoutsLibrary({ isOpen, onClose, onClone, cloningId }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between mb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Modelos prontos</h4>
                            <p className="text-xs text-slate-400">Comece por um treino padrão e ajuste depois com seu personal.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto pr-1 mt-4 custom-scrollbar">
                    {starterWorkouts.map(starter => (
                        <div
                            key={starter.id}
                            className="p-4 rounded-xl border border-slate-700/70 bg-slate-900/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h5 className="text-[0.95rem] font-bold text-white">{starter.name}</h5>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700/50">
                                        {starter.level}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-2 leading-snug">{starter.focus}</p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Dumbbell size={12} /> {starter.exercises.length} exercícios
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">{starter.muscleGroups.join(' · ')}</span>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="primary"
                                loading={cloningId === starter.id}
                                disabled={Boolean(cloningId)}
                                onClick={() => onClone(starter)}
                                leftIcon={<Plus size={16} />}
                                className="shrink-0 sm:w-auto"
                            >
                                Usar este treino
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
