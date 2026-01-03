// src/AuthContext.jsx
/**
 * AuthContext.jsx
 * Provides a React Context for user authentication state (User object, loading state).
 * Wraps Firebase Auth listener to manage sessions globally.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebaseConfig';
import {
    onAuthStateChanged,
    signOut
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser || null);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('activeWorkoutId');
        } catch (err) {
            console.error('Erro ao fazer logout', err);
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