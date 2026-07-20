import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Carrega o perfil do usuário (com timeout de segurança e retry via toast),
 * expondo `profile`/`setProfile` para a página gerenciar edições locais.
 * Estado de UI (edição, salvamento) continua na página.
 */
export function useProfileData(user) {
    const [profile, setProfile] = useState({
        displayName: user?.displayName || '',
        email: '',
        weight: '',
        height: '',
        age: '',
        gender: 'male',
        goal: 'hypertrophy',
        weeklyGoal: 4,
        achievements: {} // Mapa de conquistas desbloqueadas { id: { unlockedAt: '...' } }
    });
    const [loading, setLoading] = useState(true);

    const fetchingRef = useRef(false);

    const fetchProfileData = useCallback(async () => {
        if (!user?.uid) return;
        if (fetchingRef.current) return; // Prevent duplicate requests

        fetchingRef.current = true;
        setLoading(true);

        try {
            // Timeout de segurança (10 segundos)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout fetching profile")), 10000)
            );

            const { userService } = await import('../../services/userService');
            const docSnapData = await Promise.race([
                userService.getUserProfile(user.uid),
                timeoutPromise
            ]);

            if (docSnapData) {
                setProfile(prev => ({ ...prev, ...docSnapData }));
            } else {
                // Iniciar com dados de autenticação se não houver documento
                setProfile(prev => ({
                    ...prev,
                    displayName: user.displayName || '',
                    email: user.email
                }));
            }
        } catch (err) {
            console.error("Error fetching profile (or timeout):", err);

            // Only show toast if not already showing one (simple check or just replace)
            toast.error("Erro ao carregar dados. Verifique sua conexão.", {
                id: 'profile-fetch-error', // ID prevents duplicates
                action: {
                    label: 'Tentar Novamente',
                    onClick: () => {
                        fetchingRef.current = false; // Allow retry
                        fetchProfileData();
                    }
                },
                duration: 5000
            });

            // Fallback: mostrar o que temos (dados de auth)
            setProfile(prev => ({
                ...prev,
                displayName: user.displayName || '',
                email: user.email
            }));
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [user?.uid, user?.displayName, user?.email]);

    // Carregar Perfil
    useEffect(() => {
        // Simple logic to ensure we fetch once heavily relying on the ref inside the callback
        fetchProfileData();
        // Cleanup not needed for the fetch itself but good practice to allow refetch on unmount/remount
        return () => { fetchingRef.current = false; };
    }, [fetchProfileData]);

    return { profile, setProfile, loading };
}
