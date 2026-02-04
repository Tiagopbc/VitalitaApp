// src/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext.jsx
 * Fornece um Contexto React para o estado de autenticação do usuário (objeto Usuário, estado de carregamento).
 * Envolve o listener do Firebase Auth para gerenciar sessões globalmente.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from './services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.subscribe((firebaseUser) => {
            setUser(firebaseUser || null);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
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
