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
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${hasActiveWorkout
                ? 'border-amber-400/35 bg-amber-950/95'
                : 'border-cyan-400/35 bg-[#0f172a]'
            }`}>
                <div className="mb-5 flex flex-col items-center text-center">
                    <div className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${hasActiveWorkout
                        ? 'bg-amber-400/10 text-amber-300'
                        : 'bg-cyan-400/10 text-cyan-400'
                    }`}>
                        {hasActiveWorkout ? <ShieldCheck size={28} /> : <RefreshCw size={28} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            {hasActiveWorkout ? 'Atualização Aguardando' : 'Nova Versão Disponível'}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-300">
                            {hasActiveWorkout
                                ? 'Você está em um treino ativo. A atualização ficará bloqueada para evitar a perda dos seus dados atuais.'
                                : 'Atualize agora para carregar a versão mais recente e com novas melhorias do Vitalità.'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant={hasActiveWorkout ? 'secondary' : 'primary'}
                        size="md"
                        onClick={handleUpdate}
                        disabled={hasActiveWorkout}
                        className="w-full rounded-xl"
                        leftIcon={hasActiveWorkout ? <Wifi size={18} /> : <RefreshCw size={18} />}
                    >
                        {hasActiveWorkout ? 'Atualizar Após o Treino' : 'Atualizar Agora'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={handleDismiss}
                        className="w-full rounded-xl text-slate-400 hover:text-white"
                    >
                        Lembrar Mais Tarde
                    </Button>
                </div>
            </div>
        </div>
    );
}
