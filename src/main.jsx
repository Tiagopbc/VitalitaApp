// src/main.jsx
/**
 * main.jsx
 * Ponto de entrada da aplicação React.
 * Inicializa o elemento raiz e envolve o componente App com StrictMode e AuthProvider.
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';
import './index.css';

function SpeedInsightsLoader() {
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

if (import.meta.env.PROD && typeof window !== 'undefined') {
    const loadSentry = () => import('./sentry');
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadSentry);
    } else {
        setTimeout(loadSentry, 2000);
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <App />
                <SpeedInsightsLoader />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
);
