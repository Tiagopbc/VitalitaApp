
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function ProtectedRoute({ children }) {
    const { user, authLoading } = useAuth();
    const location = useLocation();

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">
                <div className="animate-pulse">Carregando...</div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, saving the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
