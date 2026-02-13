
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestoreDeps } from '../firebaseDb';
import { useAuth } from '../AuthContext';
import { userService } from '../services/userService';

const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Lógica de Treino Ativo (Persistência)
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        return saved || null;
    });

    const setLocalActiveWorkout = (id) => {
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
    };

    const clearLocalActiveWorkout = () => {
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
    };

    const isExecutePath = () => Boolean(window.location?.pathname?.includes('/execute'));

    // --- SINCRONIZAÇÃO EM TEMPO REAL PARA TREINO ATIVO ---
    useEffect(() => {
        if (!user) return;
        let unsubscribe = () => {};
        let active = true;

        (async () => {
            const { db, doc, onSnapshot, getDoc } = await getFirestoreDeps();
            if (!active) return;
            unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const remoteActiveId = data.activeWorkoutId;

                // Sincronizar estado local se diferente
                if (remoteActiveId !== undefined) {
                    // PARADA DE EMERGÊNCIA: Verificar se usuário acabou de sair manualmente
                    const manualExit = sessionStorage.getItem('manual_exit');
                    if (manualExit) {
                        try {
                            if (remoteActiveId) {
                                await userService.clearActiveWorkout(user.uid);
                            }
                        } catch (err) {
                            console.error("Failed to clear active workout after manual exit:", err);
                        } finally {
                            clearLocalActiveWorkout();
                            sessionStorage.removeItem('manual_exit'); // Limpar flag após tratamento
                        }
                        return; // PARE AQUI
                    }

                    // VERIFICAR: Esta sessão realmente existe?
                    // Isso previne "Sessões Fantasmas" de prenderem o usuário em um loop.
                    if (remoteActiveId) {
                        try {
                            const activeRef = doc(db, 'active_workouts', user.uid);
                            // Não podemos usar await dentro de um listener facilmente sem IIFE.
                            // Melhor fazer uma verificação única.
                            const activeSnap = await getDoc(activeRef);

                            if (activeSnap.exists()) {
                                // É real. Redirecionar.
                                setLocalActiveWorkout(remoteActiveId);
                                if (!isExecutePath()) {
                                    navigate(`/execute/${remoteActiveId}`);
                                }
                            } else {
                                // É um fantasma! Limpar.
                                console.warn("Ghost active session detected. Clearing...");
                                await userService.clearActiveWorkout(user.uid);
                                clearLocalActiveWorkout();
                            }
                        } catch (e) {
                            console.error("Error verifying active session:", e);
                        }
                    } else {
                        // Explicitamente nulo no DB
                        // Se estivermos na URL de execução, provavelmente estamos no processo de finalização
                        // ou a limpeza remota aconteceu antes da local. NÃO forçar saída abrupta.
                        // Apenas se NÃO estivermos em execução que limpamos.
                        // FIX: Use window.location directly to avoid stale closue issues
                        if (!isExecutePath()) {
                            console.log("WorkoutContext: Clearing active session because not on execute page.");
                            clearLocalActiveWorkout();
                        } else {
                            console.log("WorkoutContext: PREVENTED clearing active session explicitly on execute page.");
                            // Safety: Do not clear even if logic thinks we should?
                            // No, relying on standard check.
                        }
                    }
                }
            }
            });
        })();

        return () => {
            active = false;
            unsubscribe();
        };
    }, [user, navigate]);

    async function startWorkout(id) {
        setLocalActiveWorkout(id);
        if (user) {
            await userService.setActiveWorkout(user.uid, id);
        }
        navigate(`/execute/${id}`);
    }

    async function finishWorkout() {
        // Lógica tratada principalmente no WorkoutExecutionPage, mas podemos limpar estado aqui
        clearLocalActiveWorkout();
        navigate('/');
    }

    function cancelWorkout() {
        // Lógica para saída manual/cancelamento
        sessionStorage.setItem('manual_exit', '1');
        clearLocalActiveWorkout();
        if (user) {
            userService.clearActiveWorkout(user.uid).catch(console.error);
        }
        navigate('/');
    }

    const value = {
        activeWorkoutId,
        startWorkout,
        finishWorkout,
        cancelWorkout
    };

    return (
        <WorkoutContext.Provider value={value}>
            {children}
        </WorkoutContext.Provider>
    );
}

export function useWorkout() {
    const context = useContext(WorkoutContext);
    if (!context) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
}
