import React from 'react';
import { X, Calendar, Clock, Dumbbell, TrendingUp, Notebook } from 'lucide-react';

export function WorkoutDetailsModal({ session, onClose }) {
    if (!session) return null;

    // Helper to format date
    const formatDate = (date) => {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Helper to normalize exercises list (legacy vs new structure)
    const getExercises = () => {
        if (session.exercises && Array.isArray(session.exercises)) {
            return session.exercises;
        } else if (session.results) {
            return Object.entries(session.results).map(([name, data]) => ({
                name,
                ...data
            }));
        }
        return [];
    };

    const exercises = getExercises();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            {session.templateName || session.workoutName || 'Treino Realizado'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-cyan-500" />
                                <span>{formatDate(session.completedAt)}</span>
                            </div>
                            {session.duration && (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-amber-500" />
                                    <span>{session.duration}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {exercises.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Nenhum detalhe de exercício registrado.</p>
                    ) : (
                        exercises.map((ex, idx) => (
                            <div key={idx} className="bg-slate-900/30 rounded-xl border border-slate-800/50 overflow-hidden">
                                {/* Exercise Header */}
                                <div className="p-4 bg-slate-900/50 border-b border-slate-800/50 flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-cyan-950/30 rounded-lg border border-cyan-900/50">
                                            <Dumbbell size={16} className="text-cyan-500" />
                                        </div>
                                        <h3 className="font-bold text-slate-200 text-sm sm:text-base">
                                            {ex.name}
                                        </h3>
                                    </div>
                                    {/* Best Set Badge (Computed) */}
                                    {(() => {
                                        let maxWeight = 0;
                                        ex.sets?.forEach(s => {
                                            if (s.completed && Number(s.weight) > maxWeight) maxWeight = Number(s.weight);
                                        });
                                        if (!ex.sets && ex.weight) maxWeight = Number(ex.weight); // Legacy

                                        return maxWeight > 0 ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                <TrendingUp size={12} className="text-amber-400" />
                                                <span className="text-xs font-bold text-amber-400">{maxWeight}kg</span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Sets List */}
                                <div className="p-1 sm:p-2">
                                    {ex.sets && Array.isArray(ex.sets) ? (
                                        <div className="grid grid-cols-1 gap-1">
                                            {ex.sets.map((set, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${set.completed ? 'bg-slate-800/40 text-slate-300' : 'bg-transparent text-slate-500'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-xs w-6 text-slate-500">#{sIdx + 1}</span>
                                                        <span className={`font-bold ${set.completed ? 'text-white' : ''}`}>
                                                            {set.weight} <span className="text-[10px] font-normal text-slate-500">kg</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold">{set.reps}</span>
                                                        <span className="text-[10px] uppercase text-slate-500">reps</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Legacy single set display
                                        <div className="flex items-center justify-between p-3 text-sm bg-slate-800/40 rounded-lg m-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">{ex.weight}kg</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-slate-300">{ex.reps}</span>
                                                <span className="text-xs text-slate-500 uppercase">reps</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {ex.notes && (
                                    <div className="px-4 py-3 border-t border-slate-800/50 bg-amber-500/5 flex items-start gap-2">
                                        <Notebook size={14} className="text-amber-500/70 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-200/80 italic leading-relaxed">"{ex.notes}"</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
