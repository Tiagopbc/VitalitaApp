import React, { useState, useRef } from 'react';
import { X, Calendar, Clock, Dumbbell, TrendingUp, Notebook, Share2, Activity, Navigation, Flame } from 'lucide-react';
import { ShareableWorkoutCard } from '../sharing/ShareableWorkoutCard';

export function WorkoutDetailsModal({ session, onClose, user }) {
    const shareCardRef = useRef(null);
    const [sharing, setSharing] = useState(false);
    if (!session) return null;

    // Helper para formatar data
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

    // Helper para normalizar lista de exercícios (legado vs nova estrutura)
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

    const volumeLoad = exercises.reduce((acc, ex) => {
        let exVolume = 0;
        if (ex.sets && Array.isArray(ex.sets)) {
            exVolume = ex.sets.reduce((sAcc, s) => {
                if (!s.completed) return sAcc;
                if (s.drops && s.drops.length > 0) {
                    return sAcc + s.drops.reduce((dAcc, d) => {
                        const dw = parseFloat((d.weight || '').toString().replace(',', '.')) || 0;
                        const dr = parseFloat((d.reps || '').toString().replace(',', '.')) || 0;
                        return dAcc + (dw * dr);
                    }, 0);
                }
                const weightStr = (s.weight || '').toString().replace(',', '.');
                const repsStr = (s.reps || '').toString().replace(',', '.');
                const w = parseFloat(weightStr) || 0;
                const r = parseFloat(repsStr) || 0;
                return sAcc + (w * r);
            }, 0);
        } else if (ex.weight && ex.reps) {
            const w = parseFloat((ex.weight || '').toString().replace(',', '.')) || 0;
            const r = parseFloat((ex.reps || '').toString().replace(',', '.')) || 0;
            exVolume = w * r;
        }
        return acc + exVolume;
    }, 0);

    const sessionData = {
        templateName: session.templateName || session.workoutName || 'Treino Realizado',
        duration: session.duration || '0min',
        exercisesCount: exercises.length,
        volumeLoad: volumeLoad
    };

    const handleShare = async () => {
        if (sharing) return;
        if (!shareCardRef.current) {
            alert("Card de compartilhamento indisponível.");
            return;
        }

        if (!window.isSecureContext) {
            alert("O compartilhamento requer conexão segura (HTTPS).\n\nSe você está testando localmente via IP, use 'localhost' ou configure SSL.");
            return;
        }

        setSharing(true);
        try {
            const waitWithTimeout = async (promise, timeoutMs = 2000) => {
                try {
                    await Promise.race([
                        promise,
                        new Promise(resolve => setTimeout(resolve, timeoutMs))
                    ]);
                } catch {
                    // Ignora erros de fonte
                }
            };

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            if (document.fonts && document.fonts.ready) {
                await waitWithTimeout(document.fonts.ready, 2000);
            }

            const canvas = shareCardRef.current;
            if (!canvas || !canvas.toBlob) {
                throw new Error('Canvas não disponível para exportação.');
            }

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Falha gerar blob do canvas'));
                }, 'image/jpeg', 0.88);
            });

            const file = new File([blob], 'treino_concluido.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Treino Concluído!',
                        text: `Acabei de completar o treino ${sessionData.templateName}! 💪`,
                        files: [file]
                    });
                    return;
                } catch (err) {
                    if (err?.name === 'AbortError') return;
                    console.warn('Share failed, falling back to download:', err);
                }
            }

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `treino_${new Date().toISOString().slice(0, 10)}.jpg`;
            link.href = blobUrl;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Error sharing:", err);
            alert("Erro ao gerar imagem de compartilhamento.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Fundo (Backdrop) */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Conteúdo do Modal */}
            <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Cabeçalho */}
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

                {/* Corpo - Rolável */}
                <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {session.isCardio ? (
                        <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-6 space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-800/50 pb-4">
                                <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-900/50">
                                    <Activity size={24} className="text-cyan-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{session.activityType || 'Cardio'}</h3>
                                    <p className="text-sm text-slate-400">Atividade concluída</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {session.durationMin > 0 && (
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/30">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-400"/> Duração</p>
                                        <p className="text-lg font-bold text-white">{session.durationMin} min</p>
                                    </div>
                                )}
                                {session.distanceKm > 0 && (
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/30">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Navigation size={12} className="text-indigo-400"/> Distância</p>
                                        <p className="text-lg font-bold text-white">{session.distanceKm} km</p>
                                    </div>
                                )}
                                {session.intensity && (
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/30">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Activity size={12} className="text-cyan-400"/> Intensidade</p>
                                        <p className="text-lg font-bold text-white">{session.intensity}</p>
                                    </div>
                                )}
                                {session.calories > 0 && (
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/30">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Flame size={12} className="text-orange-400"/> Calorias</p>
                                        <p className="text-lg font-bold text-white">{session.calories} kcal</p>
                                    </div>
                                )}
                            </div>

                            {session.notes && (
                                <div className="px-4 py-3 border border-slate-800/50 rounded-xl bg-amber-500/5 flex items-start gap-3">
                                    <Notebook size={16} className="text-amber-500/70 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-500/80 mb-1">Anotações</p>
                                        <p className="text-sm text-amber-200/80 italic leading-relaxed">&quot;{session.notes}&quot;</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : exercises.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Nenhum detalhe de exercício registrado.</p>
                    ) : (
                        exercises.map((ex, idx) => (
                            <div key={idx} className="bg-slate-900/30 rounded-xl border border-slate-800/50 overflow-hidden">
                                {/* Cabeçalho do Exercício */}
                                <div className="p-4 bg-slate-900/50 border-b border-slate-800/50 flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-cyan-950/30 rounded-lg border border-cyan-900/50">
                                            <Dumbbell size={16} className="text-cyan-500" />
                                        </div>
                                        <h3 className="font-bold text-slate-200 text-sm sm:text-base uppercase">
                                            {ex.name}
                                        </h3>
                                    </div>
                                    {/* Emblema de Melhor Série (Calculado) */}
                                    {(() => {
                                        let maxWeight = 0;
                                        ex.sets?.forEach(s => {
                                            if (s.completed && Number(s.weight) > maxWeight) maxWeight = Number(s.weight);
                                        });
                                        if (!ex.sets && ex.weight) maxWeight = Number(ex.weight); // Legado

                                        return maxWeight > 0 ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                <TrendingUp size={12} className="text-amber-400" />
                                                <span className="text-xs font-bold text-amber-400">{maxWeight}kg</span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Lista de Séries */}
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
                                        // Display de série única legado
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

                                {/* Notas */}
                                {ex.notes && (
                                    <div className="px-4 py-3 border-t border-slate-800/50 bg-amber-500/5 flex items-start gap-2">
                                        <Notebook size={14} className="text-amber-500/70 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-200/80 italic leading-relaxed">&quot;{ex.notes}&quot;</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Rodapé */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold transition-colors flex items-center gap-2 text-sm border border-cyan-500/20"
                    >
                        {sharing ? (
                            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        ) : (
                            <Share2 size={16} />
                        )}
                        Compartilhar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>

            {/* Hidden Canvas for Sharing */}
            <ShareableWorkoutCard
                ref={shareCardRef}
                session={sessionData}
                userName={user?.displayName || 'Atleta'}
                isVisible={false}
            />
        </div>
    );
}
