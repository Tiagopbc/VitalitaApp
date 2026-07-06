import { useCallback, useState } from 'react';
import { getFirestoreDeps } from '../../firebaseDb';
import { activeSessionService } from '../../services/sessions/activeSessionService';
import {
    removeSessionBackup,
    SESSION_SYNC_STATES
} from '../../services/sessions/sessionRecoveryService';
import { generateId } from './normalizeSets';

export function useSessionFinish({
    workoutId,
    profileId,
    backupKey,
    template,
    exercises,
    setError,
    setLoading,
    setSessionVersion,
    setSyncState
}) {
    const [saving, setSaving] = useState(false);

    const finishSession = useCallback(async (finalElapsed) => {
        setSaving(true);
        setSyncState(SESSION_SYNC_STATES.finishing);
        try {
            const { db, collection, addDoc, serverTimestamp, doc, setDoc } = await getFirestoreDeps();
            const minutes = Math.floor(finalElapsed / 60);
            const now = new Date();

            await addDoc(collection(db, 'workout_sessions'), {
                duration: `${minutes}min`,
                elapsedSeconds: finalElapsed,
                templateId: workoutId,
                templateName: template?.name || 'Treino Personalizado',
                workoutName: template?.name || 'Treino Personalizado',
                userId: profileId,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                completedAtClient: now,
                exercises: exercises.map(ex => ({
                    id: ex.id || generateId(),
                    name: ex.name || 'Exercício sem nome',
                    sets: ex.sets.map(set => ({
                        id: set.id || generateId(),
                        weight: set.weight || '',
                        reps: set.reps || '',
                        completed: !!set.completed,
                        weightMode: set.weightMode || 'total',
                        baseWeight: set.baseWeight || null,
                        drops: set.drops || null
                    })),
                    notes: ex.notes || ''
                }))
            });

            removeSessionBackup(backupKey);
            if (profileId) {
                await activeSessionService.remove(profileId);
            }

            await setDoc(
                doc(db, 'workout_templates', workoutId),
                { lastPerformed: serverTimestamp() },
                { merge: true }
            );

            setSyncState(SESSION_SYNC_STATES.finished);
            return true;
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar treino.');
            setSyncState(SESSION_SYNC_STATES.syncFailed);
            return false;
        } finally {
            setSaving(false);
        }
    }, [workoutId, profileId, backupKey, template, exercises, setError, setSyncState]);

    const discardSession = useCallback(async () => {
        setLoading(true);
        setSyncState(SESSION_SYNC_STATES.discarding);
        try {
            removeSessionBackup(backupKey);
            if (profileId) {
                await activeSessionService.remove(profileId);
            }

            await new Promise(resolve => setTimeout(resolve, 600));
            setSessionVersion(version => version + 1);
            setSyncState(SESSION_SYNC_STATES.discarded);
            return true;
        } catch (err) {
            console.error('Error discarding session:', err);
            setError('Erro ao descartar treino. Seu backup local foi mantido.');
            setSyncState(SESSION_SYNC_STATES.syncFailed);
            return false;
        } finally {
            setLoading(false);
        }
    }, [backupKey, profileId, setError, setLoading, setSessionVersion, setSyncState]);

    return {
        saving,
        finishSession,
        discardSession
    };
}
