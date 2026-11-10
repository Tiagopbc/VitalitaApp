/**
 * DebugPanels.jsx
 * Porteiro dos painéis de diagnóstico (`?debug=push`, `?debug=appcheck`).
 *
 * Só a leitura da flag fica no bundle inicial; o código de cada painel é um
 * chunk à parte, pedido apenas quando a flag correspondente está ligada. Quem
 * treina nunca abre esses painéis, então nunca baixa esse código.
 *
 * A flag mora aqui, e não dentro de cada painel, porque é ela que decide se o
 * import dinâmico acontece. O painel recebe `onClose` para desligá-la.
 */
import React, { Suspense } from 'react';
import { useDebugPanelFlag } from '../hooks/useDebugPanelFlag';

const PushDebugPanel = React.lazy(() =>
    import('./PushDebugPanel').then((m) => ({ default: m.PushDebugPanel }))
);
const AppCheckDebugPanel = React.lazy(() =>
    import('./AppCheckDebugPanel').then((m) => ({ default: m.AppCheckDebugPanel }))
);

export function DebugPanels() {
    const [pushEnabled, disablePush] = useDebugPanelFlag('push');
    const [appCheckEnabled, disableAppCheck] = useDebugPanelFlag('appcheck');

    if (!pushEnabled && !appCheckEnabled) return null;

    return (
        <Suspense fallback={null}>
            {pushEnabled && <PushDebugPanel onClose={disablePush} />}
            {appCheckEnabled && <AppCheckDebugPanel onClose={disableAppCheck} />}
        </Suspense>
    );
}
