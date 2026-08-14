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
     * Painel opaco e sem `backdrop-filter`. Era `bg-slate-950/80` +
     * `backdrop-blur-xl` até 14/08/2026.
     *
     * Tirar o blur se justifica sozinho: os botões também tinham
     * `backdrop-blur-md`, aninhado dentro deste, e desfocar o resultado já
     * desfocado do pai não muda nada — `slate-950` é `#020617`, a mesma cor do
     * fundo da página, então numa área chapada o painel opaco é indistinguível
     * do translúcido. Era GPU gasta à toa. A única diferença real aparece com
     * conteúdo rolando por baixo: antes passava um borrão, agora some limpo.
     *
     * O que ele NÃO era: a causa do texto borrado que motivou a investigação.
     * Isso foi testado no aparelho, com painel de A/B, e três hipóteses caíram —
     * pixel fracionário (a geometria deu tudo inteiro: área segura 62px/186,
     * barra 127px/381, viewport sem escala), a camada de composição (nem
     * tirando o `position: fixed` o texto endurece) e a suavização de fonte.
     *
     * O culpado confirmado foi o "ambient glow" — ver o comentário logo abaixo.
     * Não reintroduza nenhum dos dois achando que resolve nitidez.
     */
    return (
        <div
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
            {/*
              * Sem o "ambient glow" que existia aqui até 14/08/2026: um
              * `absolute inset-0` com `bg-gradient-to-b from-cyan-500/5`.
              *
              * O `inset-0` era relativo a ESTE container, que começa depois do
              * `padding-top` da área segura — então o gradiente não cobria a
              * barra, cobria só a faixa dos botões, com uma borda dura no topo
              * bem onde a linha começa. O efeito no iPhone era um véu ciano
              * lavando as pílulas e um degrau de tom logo acima delas.
              */}
            <div className="
                relative mx-auto max-w-2xl
                px-4 py-1.5
                pointer-events-auto
            ">
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
