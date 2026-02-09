// src/main.jsx
/**
 * main.jsx
 * Ponto de entrada da aplicação React.
 * Inicializa o elemento raiz e envolve o componente App com StrictMode e AuthProvider.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';
import './index.css';
import { SpeedInsightsLoader } from './components/SpeedInsightsLoader';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (import.meta.env.PROD && sentryDsn && typeof window !== 'undefined') {
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
