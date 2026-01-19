
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { userService } from '../services/userService';
import { useAuth } from '../AuthContext';

const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lógica de Treino Ativo (Persistência)
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        return saved || null;
    });

    // --- SINCRONIZAÇÃO EM TEMPO REAL PARA TREINO ATIVO ---
    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const remoteActiveId = data.activeWorkoutId;

                // Sincronizar estado local se diferente
                if (remoteActiveId !== undefined) {
                    // PARADA DE EMERGÊNCIA: Verificar se usuário acabou de sair manualmente
                    const manualExit = sessionStorage.getItem('manual_exit');
                    if (manualExit) {
                        if (remoteActiveId) {
                            await userService.clearActiveWorkout(user.uid);
                        }
                        setActiveWorkoutId(null);
                        localStorage.removeItem('activeWorkoutId');
                        sessionStorage.removeItem('manual_exit'); // Limpar flag após tratamento
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
                                setActiveWorkoutId(remoteActiveId);
                                localStorage.setItem('activeWorkoutId', remoteActiveId);
                                if (!location.pathname.includes('/execute')) {
                                    navigate(`/execute/${remoteActiveId}`);
                                }
                            } else {
                                // É um fantasma! Limpar.
                                console.warn("Ghost active session detected. Clearing...");
                                await userService.clearActiveWorkout(user.uid);
                                setActiveWorkoutId(null);
                                localStorage.removeItem('activeWorkoutId');
                            }
                        } catch (e) {
                            console.error("Error verifying active session:", e);
                        }
                    } else {
                        // Explicitamente nulo no DB
                        setActiveWorkoutId(null);
                        localStorage.removeItem('activeWorkoutId');
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [user, location.pathname, navigate]);

    async function startWorkout(id) {
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
        if (user) {
            await userService.setActiveWorkout(user.uid, id);
        }
        navigate(`/execute/${id}`);
    }

    async function finishWorkout() {
        // Lógica tratada principalmente no WorkoutExecutionPage, mas podemos limpar estado aqui
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
        navigate('/');
    }

    function cancelWorkout() {
        // Lógica para saída manual/cancelamento
        sessionStorage.setItem('manual_exit', '1');
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
        if (user) {
            userService.clearActiveWorkout(user.uid);
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
