// src/main.jsx
/**
 * main.jsx
 * Ponto de entrada da aplicação React.
 * Inicializa o elemento raiz e envolve o componente App com StrictMode e AuthProvider.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import './index.css';

import { SpeedInsights } from "@vercel/speed-insights/react"

// GLOBAL ERROR BOUNDARY to catch crashes in Context or initialization
class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Startup Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed', inset: 0, background: '#0f172a', color: 'white',
                    padding: '2rem', fontFamily: 'sans-serif', zIndex: 9999, overflow: 'auto'
                }}>
                    <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Critical System Error</h1>
                    <p>The application failed to start.</p>
                    <pre style={{
                        background: '#1e293b', padding: '1rem', borderRadius: '0.5rem',
                        overflowX: 'auto', marginTop: '1rem', border: '1px solid #dc2626'
                    }}>
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// CHECK FOR MISSING ENV VARS BEFORE RENDER (Fail fast and visibly)
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
];

const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

if (missing.length > 0) {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <div style={{
            position: 'fixed', inset: 0, background: '#020617', color: '#f87171',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px', textAlign: 'center', fontFamily: 'sans-serif'
        }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Configuration Error</h1>
            <p style={{ color: '#e2e8f0', marginBottom: '20px' }}>
                The application is missing required environment variables.<br />
                Please configure them in your Vercel Project Settings.
            </p>
            <div style={{ textAlign: 'left', background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px', color: 'white' }}>Missing Keys:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#fbbf24' }}>
                    {missing.map(key => <li key={key}>{key}</li>)}
                </ul>
            </div>
        </div>
    );
} else {
    // Normal Render
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <GlobalErrorBoundary>
                <AuthProvider>
                    <App />
                    <SpeedInsights />
                </AuthProvider>
            </GlobalErrorBoundary>
        </React.StrictMode>
    );
}
