import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Wifi } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useWorkout } from '../context/WorkoutContext';
import { Button } from './design-system/Button';
import { toast } from 'sonner';

export function PwaUpdatePrompt() {
    const { activeWorkoutId } = useWorkout();
    const [dismissedWorkoutId, setDismissedWorkoutId] = useState(null);
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker
    } = useRegisterSW({
        immediate: true,
        onRegisterError(error) {
            console.error('PWA registration failed:', error);
        }
    });

    useEffect(() => {
        if (!offlineReady) return;
        toast.success('Vitalità pronto para uso offline.');
        setOfflineReady(false);
    }, [offlineReady, setOfflineReady]);

    const hasActiveWorkout = Boolean(activeWorkoutId);
    const dismissedForThisWorkout = hasActiveWorkout && dismissedWorkoutId === activeWorkoutId;

    if (!needRefresh || dismissedForThisWorkout) return null;

    const handleUpdate = () => {
        if (hasActiveWorkout) {
            toast.info('Finalize ou descarte o treino antes de atualizar o app.');
            return;
        }
        updateServiceWorker(true);
    };

    const handleDismiss = () => {
        if (hasActiveWorkout) {
            setDismissedWorkoutId(activeWorkoutId);
        } else {
            setNeedRefresh(false);
        }
    };

    return (
        <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[240] mx-auto max-w-md lg:bottom-6">
            <div className={`rounded-3xl border p-4 shadow-2xl backdrop-blur-xl ${hasActiveWorkout
                ? 'border-amber-400/35 bg-amber-950/80'
                : 'border-cyan-400/35 bg-slate-950/90'
            }`}>
                <div className="mb-3 flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${hasActiveWorkout
                        ? 'bg-amber-400/10 text-amber-200'
                        : 'bg-cyan-400/10 text-cyan-200'
                    }`}>
                        {hasActiveWorkout ? <ShieldCheck size={20} /> : <RefreshCw size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">
                            {hasActiveWorkout ? 'Atualização aguardando' : 'Nova versão disponível'}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {hasActiveWorkout
                                ? 'Você está em treino ativo. A atualização fica bloqueada para evitar perda de dados.'
                                : 'Atualize agora para carregar a versão mais recente do Vitalità.'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={hasActiveWorkout ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={handleUpdate}
                        disabled={hasActiveWorkout}
                        className="flex-1 rounded-xl"
                        leftIcon={hasActiveWorkout ? <Wifi size={15} /> : <RefreshCw size={15} />}
                    >
                        {hasActiveWorkout ? 'Após o treino' : 'Atualizar'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="rounded-xl text-slate-400"
                    >
                        Depois
                    </Button>
                </div>
            </div>
        </div>
    );
}
