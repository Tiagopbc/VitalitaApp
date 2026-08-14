import { ArrowLeft, Calculator, Eye, Timer, Trash2 } from 'lucide-react';
import { TopBarButton } from './TopBarButton';

/**
 * Barra superior fixa da execução: voltar (esquerda) + ações (cancelar,
 * calculadora, timer, foco). Puramente controlada por props.
 *
 * O botão de cancelar só aparece aqui fora do Modo Foco. No Modo Foco ele
 * mora em `FocusModeNav`, pareado com o `SyncStatusBadge` — ver comentário
 * lá para o histórico dessa ida e volta.
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
    /*
     * Painel opaco e sem `backdrop-filter`, de propósito. Era `bg-slate-950/80`
     * + `backdrop-blur-xl` até 14/08/2026, e nessa configuração o texto dos
     * botões saía borrado no iPhone — ícone, rótulo e borda das pílulas, tudo
     * mole, enquanto o card do exercício saía nítido na mesma tela.
     *
     * A suspeita é a combinação `position: fixed` + `backdrop-filter` forte, que
     * no WebKit faz o elemento virar camada de composição e os filhos serem
     * rasterizados abaixo da resolução nativa. **Não está provado**: o card do
     * exercício usa `backdrop-blur-md` (LinearCardCompactV2) e não borra, então
     * `backdrop-filter` sozinho não explica — o que difere aqui é o `fixed` e o
     * raio maior. Reproduzir exige o aparelho; Chrome no desktop não mostra.
     *
     * De todo modo o blur aqui não pagava por si: `slate-950` é `#020617`, a
     * mesma cor do fundo da página, então numa área chapada o painel opaco é
     * indistinguível do translúcido. A diferença aparece só quando o conteúdo
     * rola por baixo — antes passava um borrão, agora some limpo atrás da barra.
     */
    return (
        <div
            data-execution-topbar=""
            className="
                fixed top-0 left-0 right-0 z-50 pointer-events-none
                bg-slate-950
                border-b border-white/5
                shadow-2xl shadow-black/40
                rounded-b-3xl
            "
            style={{
                // +8px sobre a área segura: com `env(safe-area-inset-top)` puro,
                // sobravam só os 6px do `py-1.5` entre o fim da Dynamic Island e
                // o topo dos botões, e a barra parecia colada nela. Quem mexer
                // aqui precisa acertar junto o espaçador de 66px na
                // WorkoutExecutionPage, que reserva esta altura no fluxo.
                paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
                height: 'auto'
            }}
        >
            <div className="
                relative mx-auto max-w-2xl
                px-4 py-1.5
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
                        {!focusMode && (
                            <TopBarButton
                                icon={<Trash2 />}
                                label="Cancelar treino"
                                variant="danger"
                                onClick={onDiscard}
                                iconOnly
                            />
                        )}

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
