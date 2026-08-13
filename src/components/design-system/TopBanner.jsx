/**
 * TopBanner.jsx
 * Barra de aviso que desce do topo — o único formato de aviso do app.
 *
 * Ela pinta de `top: 0` até abaixo da status bar (`pt-[env(safe-area-inset-top)]`)
 * e põe o conteúdo na faixa sob o relógio. Isso é o oposto do defeito que #51/#53
 * corrigiram: o aviso antigo era um card curto ancorado a `top-6`, inteiramente
 * dentro da zona da status bar, e sumia sem ser lido.
 *
 * `pointer-events-none` no wrapper: sem botão, a barra não recebe toque nenhum,
 * e por isso pode ficar em z-10000 — acima dos modais de z-9999 (NumericKeypad,
 * PremiumAlert) — sem risco de roubar um toque. Só o botão de ação, quando
 * existe, volta a `pointer-events-auto`.
 *
 * O timer do auto-dismiss mora no `notifyStore`, não aqui: as regras de tempo
 * ficam testáveis sem depender do ciclo de animação dentro do jsdom.
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
        <AnimatePresence>
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
                        <span className="flex-1 font-bold text-sm">{current.message}</span>
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
