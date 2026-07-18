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
import { initTheme } from './utils/theme';
import { SpeedInsightsLoader } from './components/SpeedInsightsLoader';
import { ObservabilityTracker } from './components/ObservabilityTracker';
import {
    initializeAppCheckMonitoring,
    isAppCheckMonitoringEnabled
} from './services/appCheckService';

initTheme();

function renderApplication() {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <AuthProvider>
                <BrowserRouter>
                    <ObservabilityTracker />
                    <App />
                    <SpeedInsightsLoader />
                </BrowserRouter>
            </AuthProvider>
        </React.StrictMode>
    );
}

async function bootstrapApplication() {
    if (!isAppCheckMonitoringEnabled()) {
        renderApplication();
        return;
    }

    try {
        await initializeAppCheckMonitoring();
    } catch {
        // App Check is optional and must never block application startup.
    } finally {
        renderApplication();
    }
}

bootstrapApplication();
