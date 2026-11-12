/**
 * useRestPreferences.js
 * Preferências do descanso do usuário: tempo padrão e "iniciar o timer ao
 * concluir série". Carrega do perfil ao abrir o treino e salva cada mudança
 * em segundo plano. Lógica movida de WorkoutExecutionPage sem mudança.
 */
import { useEffect, useState } from 'react';
import { userPreferencesService } from '../../services/userPreferencesService';

export function useRestPreferences(user) {
    const [restDuration, setRestDuration] = useState(90);
    const [autoStartTimer, setAutoStartTimer] = useState(false);

    // --- CARREGAR PREFERÊNCIAS DO USUÁRIO ---
    useEffect(() => {
        if (user?.uid) {
            userPreferencesService.getWorkoutPreferences(user.uid)
                .then(profile => {
                    if (profile?.defaultRestTime) {
                        setRestDuration(profile.defaultRestTime);
                    }
                    if (profile?.autoStartTimer !== undefined) {
                        setAutoStartTimer(profile.autoStartTimer);
                    }
                })
                .catch(console.error);
        }
    }, [user?.uid]);

    // --- PERSISTIR PREFERÊNCIA ---
    const handleRestDurationChange = (newDuration) => {
        setRestDuration(newDuration);
        if (user?.uid) {
            // Atualização "fire and forget"
            userPreferencesService
                .updateWorkoutPreferences(user.uid, { defaultRestTime: newDuration })
                .catch(err => console.error("Failed to save rest preference:", err));
        }
    };

    const handleAutoStartChange = (newVal) => {
        setAutoStartTimer(newVal);
        if (user?.uid) {
            userPreferencesService
                .updateWorkoutPreferences(user.uid, { autoStartTimer: newVal })
                .catch(err => console.error("Failed to save auto start preference:", err));
        }
    };

    return { restDuration, autoStartTimer, handleRestDurationChange, handleAutoStartChange };
}
