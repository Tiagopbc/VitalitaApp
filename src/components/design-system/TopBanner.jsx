/**
 * TopBanner.jsx
 * Barra de aviso que desce do topo — o único formato de aviso do app.
 *
 * Ela pinta de `top: 0` até abaixo da status bar (`pt-[env(safe-area-inset-top)]`)
 * e põe o conteúdo na faixa sob o relógio. Isso é o oposto do defeito que #51/#53
 * corrigiram: o aviso antigo era um card curto ancorado a `top-6`, inteiramente
 * dentro da zona da status bar, e sumia sem ser lido.
 *
 * Esse full-bleed depende de `apple-mobile-web-app-status-bar-style: black`
 * (index.html), e a razão é contraintuitiva. Com `black-translucent` o iOS não
 * sabe o que há atrás do relógio e aplica dois efeitos por precaução —
 * esfumaçado e escurecimento — que lavavam o topo da barra. Com `black` ele
 * assume fundo escuro e não aplica nada, então a cor chega inteira ao topo.
 * `viewport-fit=cover` mantém o conteúdo ocupando a tela nos dois modos.
 *
 * Ou seja: a status bar opaca é o que faz o full-bleed aparecer de verdade, não
 * o que o impede. Não troque a tag achando que recupera alguma coisa.
 *
 * `pointer-events-none` no wrapper: sem botão, a barra não recebe toque nenhum,
 * e por isso pode ficar em z-10000 — acima do NumericKeypad, que é o modal mais
 * alto do app (z-9999) — sem risco de roubar um toque. Só o botão de ação, quando
 * existe, volta a `pointer-events-auto`.
 *
 * O timer do auto-dismiss mora no `notifyStore`, não aqui: as regras de tempo
 * ficam testáveis sem depender do ciclo de animação dentro do jsdom.
 *
 * A barra nova espera a saída da anterior (antes, `mode="wait"` do
 * AnimatePresence; desde o R06, CSS e o estado abaixo). Sem isso a troca de um
 * aviso por outro deixaria as duas barras montadas por ~200ms, ambas em
 * `fixed inset-x-0 top-0 z-[10000]` — uma subindo e a outra descendo pelo mesmo
 * espaço. Acontece de verdade ao salvar ficha ("Treino salvo." → `onBack()` →
 * a lista monta → `getTemplates` falha → erro).
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { notify, subscribeToNotify, getNotifySnapshot } from '../../utils/notifyStore';

const backgrounds = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
};

// Tempo da animação de saída (.vit-banner-out no index.css).
const EXIT_MS = 200;

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle
};

export function TopBanner() {
    const current = useSyncExternalStore(subscribeToNotify, getNotifySnapshot, () => null);

    // `shown` é o aviso que está na tela; `leavingItem`, o que está saindo.
    // Quando o store muda, o aviso de antes sai primeiro e só depois o novo
    // entra. Ajuste feito durante o render, comparando com o anterior.
    const [shown, setShown] = useState(current);
    const [leavingItem, setLeavingItem] = useState(null);
    if ((current?.id ?? null) !== (shown?.id ?? null)) {
        if (shown && !leavingItem) setLeavingItem(shown);
        setShown(current);
    }

    useEffect(() => {
        if (!leavingItem) return undefined;
        const timer = setTimeout(() => setLeavingItem(null), EXIT_MS);
        return () => clearTimeout(timer);
    }, [leavingItem]);

    const item = leavingItem ?? shown;
    const leaving = Boolean(leavingItem);
    const isError = item?.type === 'error';
    const Icon = item ? (icons[item.type] || AlertCircle) : null;

    function handleAction() {
        const onClick = item?.action?.onClick;
        notify.dismiss();
        if (typeof onClick === 'function') onClick();
    }

    if (!item) return null;

    return (
        <div
            key={item.id}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            data-testid="top-banner"
            data-type={item.type}
            data-phase={leaving ? 'leaving' : 'visible'}
            className={`fixed inset-x-0 top-0 z-[10000] pointer-events-none pt-[env(safe-area-inset-top)] text-on-color shadow-lg ${leaving ? 'vit-banner-out' : 'vit-banner-in'} ${backgrounds[item.type] || backgrounds.info}`}
        >
            <div className="flex items-center gap-3 px-5 py-3">
                <Icon size={20} className="shrink-0" />
                {/* Coluna única para message + description: mesma coluna do
                    título, à esquerda do botão de ação. Sem description, o
                    `<span>` sobra sozinho e o layout não muda em nada. */}
                <div className="flex flex-1 flex-col items-start">
                    <span className="font-bold text-sm">{item.message}</span>
                    {item.description && (
                        <span className="text-xs text-on-color/90">{item.description}</span>
                    )}
                </div>
                {item.action && (
                    <button
                        type="button"
                        onClick={handleAction}
                        className={`${leaving ? '' : 'pointer-events-auto '}shrink-0 rounded-full bg-on-color/20 px-3 py-1 text-sm font-bold hover:bg-on-color/30 transition-colors`}
                    >
                        {item.action.label}
                    </button>
                )}
            </div>
        </div>
    );
}
