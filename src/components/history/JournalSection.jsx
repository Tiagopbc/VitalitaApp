/**
 * JournalSection.jsx
 * Aba Diário do histórico: lista de sessões agrupada por mês, com "carregar
 * mais antigos" (paginação do Firestore) e "renderizar mais itens" (janela de
 * render). JSX movido de HistoryPage (D16); o estado vem de useJournal.
 */
import React from 'react';
import { TrendingUp, History, Activity } from 'lucide-react';
import { PremiumCard } from '../design-system/PremiumCard';
import { EmptyState } from '../design-system/EmptyState';
import { Button } from '../design-system/Button';

function formatDate(date) {
    if (!date) return '';
    try {
        // Safe parse: handles Timestamp, Date object, strings, or numbers
        const d = date?.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return '-'; // Invalid date
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            weekday: 'short'
        }).format(d);
    } catch (error) {
        console.error(error);
        return '-';
    }
}

function getSessionHighlight(session) {
    if (session.isCardio) {
        let details = [];
        if (session.durationMin) details.push(`${session.durationMin} min`);
        if (session.distanceKm) details.push(`${session.distanceKm} km`);
        if (session.intensity) details.push(session.intensity);
        const metrics = details.join(' • ');
        return metrics ? `${metrics}` : 'Sessão de Cardio';
    }

    let maxWeight = 0;
    let maxExName = '';

    let exerciseList = [];
    if (session.exercises && Array.isArray(session.exercises)) {
        exerciseList = session.exercises;
    } else if (session.results) {
        exerciseList = Object.entries(session.results).map(([k, v]) => ({ name: k, ...v }));
    }

    exerciseList.forEach(ex => {
        let localMax = 0;
        if (ex.sets && Array.isArray(ex.sets)) {
            ex.sets.forEach(s => {
                const w = parseFloat(s.weight);
                if (w > localMax) localMax = w;
            });
        } else if (ex.weight) {
            localMax = parseFloat(ex.weight);
        }

        if (localMax > maxWeight) {
            maxWeight = localMax;
            maxExName = ex.name;
        }
    });

    if (maxWeight > 0) return `Destaque: ${maxExName.toUpperCase()} (${maxWeight}kg)`;
    return `${session.exercisesCount || exerciseList.length} exercícios`;
}

export function JournalSection({
    loadingSessions,
    sessions,
    groupedSessions,
    hasMoreJournal,
    fetchingMore,
    onLoadMore,
    hasLocallyHiddenSessions,
    onRevealMore,
    sentinelRef,
    onSelectSession
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 2. LISTA */}
            {loadingSessions ? (
                <div className="py-20 text-center">
                    <Activity className="animate-spin w-8 h-8 text-cyan-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Carregando diário...</p>
                </div>
            ) : sessions.length === 0 ? (
                <EmptyState
                    icon={<History size={28} />}
                    title="Nenhum treino registrado"
                    description="Quando você finalizar um treino, ele aparecerá aqui com detalhes e evolução."
                    className="my-8"
                />
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedSessions).map(([month, monthSessions]) => (
                        <div key={month}>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 sticky top-32 bg-[#020617]/90 py-2 z-10 backdrop-blur-sm">
                                {month}
                            </h3>
                            <div className="space-y-3">
                                {monthSessions.map((session, idx) => (
                                    <PremiumCard
                                        key={session.id}
                                        className="border-slate-800/60 bg-slate-900/40 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                        onClick={() => onSelectSession(session)}
                                    >
                                        {/* Sobreposição de gradiente decorativo no hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                                                        {formatDate(session.completedAt)}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {session.duration}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-white leading-tight">
                                                    {session.templateName || session.workoutName || 'Treino Sem Nome'}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Destaque / Estatísticas */}
                                        <div className="flex items-center gap-2 relative z-10">
                                            <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/50 flex items-center gap-2">
                                                <TrendingUp size={12} className="text-slate-400" />
                                                <span className="text-xs font-medium text-slate-300">
                                                    {getSessionHighlight(session)}
                                                </span>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                ))}
                            </div>
                        </div>
                    ))}

                    {hasMoreJournal && (
                        <div className="text-center pt-4 pb-8">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLoadMore}
                                disabled={fetchingMore}
                                className="text-slate-400 hover:text-white"
                            >
                                {fetchingMore ? (
                                    <Activity className="animate-spin w-4 h-4 mr-2" />
                                ) : (
                                    <History size={16} className="mr-2" />
                                )}
                                {fetchingMore ? 'Carregando...' : 'Carregar mais antigos'}
                            </Button>
                        </div>
                    )}

                    {hasLocallyHiddenSessions && (
                        <>
                            <div ref={sentinelRef} className="h-1 w-full" />
                            <div className="text-center pb-8">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRevealMore}
                                    className="text-slate-500 hover:text-slate-300"
                                >
                                    Renderizar mais itens
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
