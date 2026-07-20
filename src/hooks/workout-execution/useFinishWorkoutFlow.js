import { useState } from 'react';
import { prefersReducedMotion } from '../../utils/motionPreferences';
import { checkNewAchievements } from '../../utils/evaluateAchievements';
import { workoutService } from '../../services/workoutService';

/**
 * Fluxo de finalização do treino: congela a sessão, salva, dispara confetti,
 * checa novas conquistas e decide entre o modal de conquista ou o card final.
 * `setIsFinished` é injetado (estado compartilhado com timer/sync/wake lock).
 * `handleFinishWorkout` recebe exercises/elapsedSeconds vivos para evitar
 * closure obsoleta.
 */
export function useFinishWorkoutFlow({ user, finishSession, setIsFinished }) {
    const [frozenSession, setFrozenSession] = useState(null); // Frozen data for summary
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [isFinishingSession, setIsFinishingSession] = useState(false);
    const [newAchievements, setNewAchievements] = useState([]);
    const [showAchievementModal, setShowAchievementModal] = useState(false);

    const handleFinishWorkout = async ({ exercises, elapsedSeconds }) => {
        setIsFinishingSession(true);

        setFrozenSession({
            exercises: JSON.parse(JSON.stringify(exercises)), // Deep clone
            elapsedSeconds
        });

        setIsFinished(true); // Parar sincronização imediatamente
        const success = await finishSession(elapsedSeconds);

        if (success) {
            if (!prefersReducedMotion()) {
                const { default: confetti } = await import('canvas-confetti');
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 }
                });
            }

            if (user) {
                const sessionPayload = {
                    id: 'temp_current',
                    completedAt: new Date(),
                    exercises: exercises,
                    elapsedSeconds: elapsedSeconds,
                    userId: user.uid
                };

                try {
                    const unlocked = await checkNewAchievements(user.uid, sessionPayload, workoutService);
                    setIsFinishingSession(false);
                    if (unlocked && unlocked.length > 0) {
                        setNewAchievements(unlocked);
                        setShowAchievementModal(true);
                    } else {
                        setShowFinishModal(true);
                    }
                } catch (err) {
                    console.error("checkNewAchievements error", err);
                    setIsFinishingSession(false);
                    setShowFinishModal(true);
                }
            } else {
                setIsFinishingSession(false);
                setShowFinishModal(true);
            }
        } else {
            setIsFinishingSession(false);
            setIsFinished(false); // Reativar se falhar
            setFrozenSession(null);
        }
    };

    return {
        frozenSession,
        showFinishModal,
        setShowFinishModal,
        isFinishingSession,
        newAchievements,
        showAchievementModal,
        setShowAchievementModal,
        handleFinishWorkout
    };
}
