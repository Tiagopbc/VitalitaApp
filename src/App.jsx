/**
 * App.jsx
 * Componente Principal da Aplicação.
 * Gerencia o roteamento do lado do cliente (via estado), layout global, integração da barra lateral/navegação inferior,
 * e estado de alto nível para treinos, histórico e validação de autenticação do usuário.
 */
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import './style.css';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AppAuthed = React.lazy(() => import('./AppAuthed'));

function App() {

    return (
        <ErrorBoundary>
            <AppContentRoot />
        </ErrorBoundary>
    );
}

export default App;

function AppContentRoot() {
    const { user } = useAuth();

    if (!user) {
        return (
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
            }>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        }>
            <AppAuthed />
        </Suspense>
    );
}
