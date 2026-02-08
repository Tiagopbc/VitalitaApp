// src/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext.jsx
 * Fornece um Contexto React para o estado de autenticação do usuário (objeto Usuário, estado de carregamento).
 * Envolve o listener do Firebase Auth para gerenciar sessões globalmente.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let unsubscribe = null;

        const initAuth = async () => {
            try {
                const { authService } = await import('./services/authService');
                if (!isMounted) return;
                unsubscribe = authService.subscribe((firebaseUser) => {
                    setUser(firebaseUser || null);
                    setAuthLoading(false);
                });
            } catch (err) {
                console.error('Erro ao iniciar Auth:', err);
                if (isMounted) setAuthLoading(false);
            }
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(initAuth);
        } else {
            setTimeout(initAuth, 0);
        }

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const logout = async () => {
        try {
            const { authService } = await import('./services/authService');
            await authService.logout();
            localStorage.removeItem('activeWorkoutId');
        } catch (err) {
            console.error('Erro ao fazer logout', err);
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{ user, authLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
