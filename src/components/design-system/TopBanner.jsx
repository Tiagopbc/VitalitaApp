/**
 * TopBanner.jsx
 * Barra de aviso que desce do topo — o único formato de aviso do app.
 *
 * Ela ocupa a largura inteira a partir do topo do conteúdo do app. O desenho
 * original ia além: pintava até o pixel 0, com a cor cobrindo a área do relógio
 * e o texto na faixa abaixo dele — o oposto do defeito que #51/#53 corrigiram,
 * em que um card curto ancorado a `top-6` sumia dentro da zona da status bar.
 *
 * Desde 15/08/2026 isso não acontece mais: o app passou a declarar
 * `apple-mobile-web-app-status-bar-style: black` (index.html), o conteúdo deixou
 * de correr por baixo da status bar e `env(safe-area-inset-top)` virou 0 em tela
 * cheia. Com `black-translucent` o iOS esfumaçava o que entrava naquela faixa, e
 * isso borrava os botões da barra de execução.
 *
 * O `pt-[env(safe-area-inset-top)]` fica: vira no-op nesse modo e volta a valer
 * sozinho se a tag mudar ou em plataforma onde o inset não seja zero. A lição de
 * #51/#53 continua de pé — o que não pode voltar é ancorar o aviso num card
 * curto no topo.
 *
 * `pointer-events-none` no wrapper: sem botão, a barra não recebe toque nenhum,
 * e por isso pode ficar em z-10000 — acima dos modais de z-9999 (NumericKeypad,
 * PremiumAlert) — sem risco de roubar um toque. Só o botão de ação, quando
 * existe, volta a `pointer-events-auto`.
 *
 * O timer do auto-dismiss mora no `notifyStore`, não aqui: as regras de tempo
 * ficam testáveis sem depender do ciclo de animação dentro do jsdom.
 *
 * `mode="wait"` no `AnimatePresence`: no modo padrão (`sync`) a troca de um
 * aviso por outro deixa as duas barras montadas por ~200ms, ambas em
 * `fixed inset-x-0 top-0 z-[10000]` — uma subindo e a outra descendo pelo mesmo
 * espaço. Acontece de verdade ao salvar ficha ("Treino salvo." → `onBack()` →
 * a lista monta → `getTemplates` falha → erro). O custo é a barra nova esperar
 * a saída da anterior, que é justamente o comportamento desejado.
 */
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { notify, subscribeToNotify, getNotifySnapshot } from '../../utils/notifyStore';

const backgrounds = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
};

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle
};

export function TopBanner() {
    const current = useSyncExternalStore(subscribeToNotify, getNotifySnapshot, () => null);

    const isError = current?.type === 'error';
    const Icon = current ? (icons[current.type] || AlertCircle) : null;

    function handleAction() {
        const onClick = current?.action?.onClick;
        notify.dismiss();
        if (typeof onClick === 'function') onClick();
    }

    return (
        <AnimatePresence mode="wait">
            {current && (
                <motion.div
                    key={current.id}
                    initial={{ y: '-100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%', transition: { duration: 0.2, ease: 'easeIn' } }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                    role={isError ? 'alert' : 'status'}
                    aria-live={isError ? 'assertive' : 'polite'}
                    data-testid="top-banner"
                    data-type={current.type}
                    className={`fixed inset-x-0 top-0 z-[10000] pointer-events-none pt-[env(safe-area-inset-top)] text-white shadow-lg ${backgrounds[current.type] || backgrounds.info}`}
                >
                    <div className="flex items-center gap-3 px-5 py-3">
                        <Icon size={20} className="shrink-0" />
                        {/* Coluna única para message + description: mesma coluna do
                            título, à esquerda do botão de ação. Sem description, o
                            `<span>` sobra sozinho e o layout não muda em nada. */}
                        <div className="flex flex-1 flex-col items-start">
                            <span className="font-bold text-sm">{current.message}</span>
                            {current.description && (
                                <span className="text-xs text-white/90">{current.description}</span>
                            )}
                        </div>
                        {current.action && (
                            <button
                                type="button"
                                onClick={handleAction}
                                className="pointer-events-auto shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-bold hover:bg-white/30 transition-colors"
                            >
                                {current.action.label}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
