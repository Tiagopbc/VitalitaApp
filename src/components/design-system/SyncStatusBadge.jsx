import React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, Loader2, RotateCw } from 'lucide-react';
import { SESSION_SYNC_STATES } from '../../services/sessions/sessionRecoveryService';

const statusConfig = {
    [SESSION_SYNC_STATES.loading]: {
        label: 'Carregando sessão',
        icon: Loader2,
        className: 'border-slate-700 bg-slate-900/80 text-slate-300',
        spin: true
    },
    [SESSION_SYNC_STATES.active]: {
        label: 'Sessão ativa',
        icon: CheckCircle2,
        className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
    },
    [SESSION_SYNC_STATES.offline]: {
        label: 'Salvo localmente',
        icon: CloudOff,
        className: 'border-amber-500/35 bg-amber-500/10 text-amber-200'
    },
    [SESSION_SYNC_STATES.syncing]: {
        label: 'Sincronizando',
        icon: RotateCw,
        className: 'border-blue-500/35 bg-blue-500/10 text-blue-200',
        spin: true
    },
    [SESSION_SYNC_STATES.saved]: {
        label: 'Salvo agora',
        icon: CheckCircle2,
        className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
    },
    [SESSION_SYNC_STATES.syncFailed]: {
        label: 'Falha ao sincronizar',
        icon: AlertTriangle,
        className: 'border-red-500/35 bg-red-500/10 text-red-200'
    },
    [SESSION_SYNC_STATES.finishing]: {
        label: 'Finalizando',
        icon: Loader2,
        className: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-200',
        spin: true
    },
    [SESSION_SYNC_STATES.finished]: {
        label: 'Finalizado',
        icon: CheckCircle2,
        className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
    },
    [SESSION_SYNC_STATES.discarding]: {
        label: 'Descartando',
        icon: Loader2,
        className: 'border-slate-700 bg-slate-900/80 text-slate-300',
        spin: true
    },
    [SESSION_SYNC_STATES.discarded]: {
        label: 'Descartado',
        icon: CheckCircle2,
        className: 'border-slate-700 bg-slate-900/80 text-slate-300'
    },
    [SESSION_SYNC_STATES.conflict]: {
        label: 'Recuperado do backup',
        icon: AlertTriangle,
        className: 'border-amber-500/35 bg-amber-500/10 text-amber-200'
    },
    [SESSION_SYNC_STATES.error]: {
        label: 'Erro na sessão',
        icon: AlertTriangle,
        className: 'border-red-500/35 bg-red-500/10 text-red-200'
    }
};

export function SyncStatusBadge({ status, className = '' }) {
    const config = statusConfig[status] || statusConfig[SESSION_SYNC_STATES.active];
    const Icon = config.icon;

    return (
        <div
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-bold uppercase backdrop-blur-md ${config.className} ${className}`}
            role="status"
            aria-live="polite"
        >
            <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
            <span className="whitespace-nowrap">{config.label}</span>
        </div>
    );
}
