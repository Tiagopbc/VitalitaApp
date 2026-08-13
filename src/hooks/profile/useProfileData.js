import { useCallback, useEffect, useRef, useState } from 'react';
import { notify } from '../../utils/notifyStore';

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

            // O `id` que o sonner usava aqui para deduplicar saiu junto com o
            // pacote, e a deduplicação do notifyStore não cobre este caso: o
            // early-return dela exige `!action && !current.action`, e este aviso
            // tem ação. O que evita o incômodo de repetição é o `duration`.
            //
            // O `duration: 5000` é o mesmo tempo de antes da migração e precisa
            // ser explícito: sem ele o store não arma timer nenhum quando há
            // ação, e a barra — que vive na raiz autenticada e não tem botão de
            // fechar — acompanharia o usuário por todas as telas. Os 5s dão
            // folga sobre os 3s padrão para o usuário decidir sobre o
            // "Tentar Novamente" antes de a barra sair de cena sozinha.
            notify.error("Erro ao carregar dados. Verifique sua conexão.", {
                duration: 5000,
                action: {
                    label: 'Tentar Novamente',
                    onClick: () => {
                        fetchingRef.current = false; // Allow retry
                        fetchProfileData();
                    }
                }
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
