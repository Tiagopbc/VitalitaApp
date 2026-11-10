/**
 * SuggestedWorkoutCard.jsx
 * Seção "Próximo Treino Sugerido" da home: o treino da vez, o estado vazio
 * com "Criar Treino" e o atalho para registrar cardio manual. JSX movido de
 * HomeDashboard (D17).
 */
import React from 'react';
import { Target, Dumbbell, Clock, Play, Plus, Activity } from 'lucide-react';
import { SectionHeader } from '../design-system/SectionHeader';
import { EmptyState } from '../design-system/EmptyState';
import { Button } from '../design-system/Button';

export function SuggestedWorkoutCard({ loading, workout, onStart, onCreate, onAddCardio }) {
    return (
        <div className="mb-6 lg:mb-8">
            <SectionHeader
                icon={<Target size={18} />}
                title="Próximo Treino Sugerido"
            />

            {loading ? (
                <div className="w-full h-40 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
            ) : workout ? (
                <button
                    onClick={() => onStart(workout.id, workout.name)}
                    className="w-full p-6 rounded-3xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-left group
                    bg-gradient-to-br from-[#0f172a] to-[#020617] border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                >
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
                                Sugerido
                            </p>
                            <h2 className="text-lg lg:text-3xl font-heading font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                                {workout.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Dumbbell size={16} className="text-cyan-500" />
                                    <span>{workout.exercises?.length || 0} exercícios</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-cyan-500" />
                                    <span>~60 min</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.5)] ml-4 border border-white/20">
                            <Play size={24} fill="white" className="text-white ml-1" />
                        </div>
                    </div>
                    {/* AmbientGlow */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                </button>
            ) : (
                <EmptyState
                    icon={<Dumbbell size={26} />}
                    title="Nenhum treino criado"
                    description="Crie sua primeira ficha para começar a treinar com acompanhamento."
                    action={
                        <Button
                            onClick={onCreate}
                            size="sm"
                            className="rounded-xl"
                            leftIcon={<Plus size={16} />}
                        >
                            Criar Treino
                        </Button>
                    }
                />
            )}

            <button
                onClick={onAddCardio}
                className="mt-4 w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all group"
            >
                <Activity size={18} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm">Registrar Cardio Manual</span>
            </button>
        </div>
    );
}
