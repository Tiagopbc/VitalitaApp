/**
 * useRestPreferences.js
 * Preferências de execução do usuário: tempo padrão de descanso, "iniciar o
 * timer ao concluir série" e o modo (normal ou Foco). Carrega do perfil ao
 * abrir o treino e salva cada mudança em segundo plano. O modo fica no perfil,
 * não no localStorage, porque o Safari e o app instalado não compartilham
 * armazenamento: o treino abre no último modo escolhido em qualquer um deles.
 */
import { useEffect, useRef, useState } from 'react';
import { userPreferencesService } from '../../services/userPreferencesService';

export function useRestPreferences(user) {
    const [restDuration, setRestDuration] = useState(90);
    const [autoStartTimer, setAutoStartTimer] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    // Troca feita antes de o perfil responder vale mais que o modo salvo.
    const modeChangedByUser = useRef(false);

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
                    if (profile?.executionMode && !modeChangedByUser.current) {
                        setFocusMode(profile.executionMode === 'foco');
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

    const toggleFocusMode = () => {
        const next = !focusMode;
        modeChangedByUser.current = true;
        setFocusMode(next);
        if (user?.uid) {
            userPreferencesService
                .updateWorkoutPreferences(user.uid, { executionMode: next ? 'foco' : 'normal' })
                .catch(err => console.error("Failed to save execution mode:", err));
        }
    };

    return {
        restDuration,
        autoStartTimer,
        focusMode,
        handleRestDurationChange,
        handleAutoStartChange,
        toggleFocusMode
    };
}
