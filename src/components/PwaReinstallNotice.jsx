/**
 * PwaReinstallNotice.jsx
 * Aviso para o único tipo de atualização que o botão "Atualizar Agora" não
 * entrega: mudança nas configurações de janela (status bar, ícone, nome do
 * atalho), que o iOS lê só ao montar a janela, na instalação.
 *
 * Sem este aviso o usuário toca em "Atualizar Agora", vê o app recarregar,
 * lê "versão mais recente" e fica convencido de que está em dia — enquanto a
 * janela continua a antiga. O silêncio era indistinguível do sucesso.
 */
import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { Button } from './design-system/Button';
import { checkWindowConfig, acknowledgeWindowConfig } from '../utils/windowConfig';

export function PwaReinstallNotice() {
    const { activeWorkoutId } = useWorkout();
    // Inicializador preguiçoso em vez de efeito: a checagem é síncrona e o
    // resultado não muda enquanto a janela existir — quem reinstala fecha o
    // app. `checkWindowConfig` é idempotente, então a dupla invocação do
    // StrictMode não incomoda.
    const [needsReinstall] = useState(() => checkWindowConfig().needsReinstall);
    const [dismissed, setDismissed] = useState(false);

    // Reinstalar no meio de um treino é a pior hora possível, e a configuração
    // de janela é cosmética: pode esperar o treino acabar.
    if (!needsReinstall || dismissed || activeWorkoutId) return null;

    const handleDone = () => {
        // O iOS não avisa que a reinstalação aconteceu, e remover o ícone nem
        // sempre limpa o armazenamento da origem — a confirmação do usuário é
        // o único sinal confiável de que o aviso já cumpriu seu papel.
        acknowledgeWindowConfig();
        setDismissed(true);
    };

    return (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border border-amber-400/35 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="mb-5 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
                        <Smartphone size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        Esta Atualização Pede Reinstalação
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                        A aparência do app mudou, e essa parte o iPhone só lê quando o
                        atalho é criado. Atualizar por dentro não aplica.
                    </p>
                </div>

                <ol className="mb-5 space-y-2 rounded-2xl bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-300">
                    <li>
                        <span className="font-semibold text-white">1.</span> Segure o ícone do
                        Vitalità na tela de início e escolha <span className="font-semibold">Remover App</span>.
                    </li>
                    <li>
                        <span className="font-semibold text-white">2.</span> Abra o Vitalità no
                        <span className="font-semibold"> Safari</span>.
                    </li>
                    <li>
                        <span className="font-semibold text-white">3.</span> Toque em Compartilhar
                        → <span className="font-semibold">Adicionar à Tela de Início</span>.
                    </li>
                </ol>

                <p className="mb-5 text-center text-xs leading-relaxed text-slate-400">
                    Seus treinos e seu histórico ficam salvos na sua conta, não no aparelho.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleDone}
                        className="w-full rounded-xl"
                        leftIcon={<Smartphone size={18} />}
                    >
                        Já Reinstalei
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => setDismissed(true)}
                        className="w-full rounded-xl text-slate-400 hover:text-white"
                    >
                        Agora Não
                    </Button>
                </div>
            </div>
        </div>
    );
}
