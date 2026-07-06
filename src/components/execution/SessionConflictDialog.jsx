import React from 'react';
import { AlertTriangle, Cloud, HardDrive, Timer } from 'lucide-react';
import { Button } from '../design-system/Button';

function formatElapsed(totalSeconds = 0) {
    const minutes = Math.floor((Number(totalSeconds) || 0) / 60);
    const seconds = (Number(totalSeconds) || 0) % 60;
    if (minutes < 60) return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes.toString().padStart(2, '0')}min`;
}

function formatTimestamp(timestampMs) {
    if (!timestampMs) return 'Sem horário confiável';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestampMs));
}

function VersionCard({ candidate, icon, title, recommended, onChoose }) {
    const Icon = icon;
    if (!candidate) return null;

    return (
        <button
            type="button"
            onClick={onChoose}
            className={`w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${recommended
                ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_24px_rgba(6,182,212,0.14)]'
                : 'border-slate-700/70 bg-slate-900/70 hover:border-slate-500'
            }`}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 text-cyan-300 ring-1 ring-white/10">
                        <Icon size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="text-xs text-slate-500">{formatTimestamp(candidate.timestampMs)}</p>
                    </div>
                </div>
                {recommended && (
                    <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[10px] font-bold uppercase text-cyan-200">
                        Recomendado
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="mb-1 text-slate-500">Tempo</p>
                    <p className="font-bold text-slate-100">{formatElapsed(candidate.elapsedSeconds)}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="mb-1 text-slate-500">Séries</p>
                    <p className="font-bold text-slate-100">
                        {candidate.completedSets}/{candidate.totalSets}
                    </p>
                </div>
            </div>
        </button>
    );
}

export function SessionConflictDialog({ conflict, onChoose, onKeepRecommended }) {
    if (!conflict) return null;

    const cloud = conflict.candidates?.cloud;
    const local = conflict.candidates?.local;

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl border border-amber-400/30 bg-slate-950 p-5 shadow-2xl">
                <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Escolha a versão do treino</h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                            Encontramos uma sessão salva neste dispositivo e outra na nuvem.
                            Nada será descartado automaticamente; escolha qual versão quer continuar.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <VersionCard
                        candidate={local}
                        icon={HardDrive}
                        title="Backup deste dispositivo"
                        recommended={conflict.source === 'local'}
                        onChoose={() => onChoose('local')}
                    />
                    <VersionCard
                        candidate={cloud}
                        icon={Cloud}
                        title="Versão da nuvem"
                        recommended={conflict.source === 'cloud'}
                        onChoose={() => onChoose('cloud')}
                    />
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Button
                        variant="secondary"
                        onClick={onKeepRecommended}
                        className="rounded-xl"
                        leftIcon={<Timer size={16} />}
                    >
                        Continuar recomendado
                    </Button>
                    <p className="text-xs leading-relaxed text-slate-500 sm:max-w-[220px]">
                        A versão escolhida passará a ser sincronizada nas próximas alterações.
                    </p>
                </div>
            </div>
        </div>
    );
}
