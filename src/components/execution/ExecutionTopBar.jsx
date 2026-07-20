import { ArrowLeft, Calculator, Eye, Timer, Trash2 } from 'lucide-react';
import { TopBarButton } from './TopBarButton';

/**
 * Barra superior fixa da execução: voltar (esquerda) + ações (cancelar,
 * calculadora, timer, foco). Puramente controlada por props.
 */
export function ExecutionTopBar({
    onBack,
    onDiscard,
    onOpenGymTools,
    showGymTools,
    showTimer,
    onToggleTimer,
    focusMode,
    onToggleFocus
}) {
    return (
        <div
            className="
                fixed top-0 left-0 right-0 z-50 pointer-events-none
                bg-slate-950/80
                backdrop-blur-xl
                border-b border-white/5
                shadow-2xl shadow-black/40
                rounded-b-3xl
            "
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                height: 'auto'
            }}
        >
            <div className="
                relative mx-auto max-w-2xl
                px-4 py-2
                pointer-events-auto
            ">
                {/* Ambient glow effect (Full Height) */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none rounded-b-3xl" />

                <div className="relative z-10 flex items-center justify-between gap-2">
                    {/* Left side - Back button */}
                    <TopBarButton
                        icon={<ArrowLeft />}
                        label="Voltar"
                        variant="primary"
                        onClick={onBack}
                        iconOnly
                    />

                    {/* Right side - Action buttons */}
                    <div className="flex items-center gap-1.5 py-1 flex-1 justify-end min-w-0 pl-2">
                        <TopBarButton
                            icon={<Trash2 />}
                            label="Cancelar treino"
                            variant="danger"
                            onClick={onDiscard}
                            iconOnly
                        />

                        <TopBarButton
                            icon={<Calculator />}
                            label="CALC"
                            active={showGymTools}
                            prominence="large"
                            onClick={onOpenGymTools}
                        />

                        <TopBarButton
                            icon={<Timer />}
                            label="TIMER"
                            active={showTimer}
                            prominence="large"
                            onClick={onToggleTimer}
                        />

                        <TopBarButton
                            icon={<Eye />}
                            label="FOCO"
                            active={focusMode}
                            prominence="large"
                            onClick={onToggleFocus}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
