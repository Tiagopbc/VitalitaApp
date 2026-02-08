import React, { useEffect, useState } from 'react';

export function SpeedInsightsLoader() {
    const [Component, setComponent] = useState(null);

    useEffect(() => {
        if (!import.meta.env.PROD) return;

        const load = () => {
            import('@vercel/speed-insights/react')
                .then((mod) => setComponent(() => mod.SpeedInsights))
                .catch(() => {
                    // Falha ao carregar SpeedInsights não deve quebrar o app
                });
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(load);
        } else {
            setTimeout(load, 2000);
        }
    }, []);

    if (!Component) return null;
    return <Component />;
}
