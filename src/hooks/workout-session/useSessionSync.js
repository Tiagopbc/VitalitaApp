import { useCallback, useEffect } from 'react';
import { activeSessionService } from '../../services/sessions/activeSessionService';
import {
    createSessionFingerprint,
    SESSION_SYNC_STATES,
    writeSessionBackup
} from '../../services/sessions/sessionRecoveryService';
import { captureTechnicalError } from '../../services/observabilityService';

export function useSessionConnectivity(setSyncState) {
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const updateOnlineState = () => {
            if (!navigator.onLine) {
                setSyncState(SESSION_SYNC_STATES.offline);
            } else {
                setSyncState(current => (
                    current === SESSION_SYNC_STATES.offline ? SESSION_SYNC_STATES.saved : current
                ));
            }
        };

        window.addEventListener('online', updateOnlineState);
        window.addEventListener('offline', updateOnlineState);
        updateOnlineState();

        return () => {
            window.removeEventListener('online', updateOnlineState);
            window.removeEventListener('offline', updateOnlineState);
        };
    }, [setSyncState]);
}

export function useSessionSync({
    backupKey,
    profileId,
    workoutId,
    lastSyncedRef,
    syncInFlightRef,
    setSyncState,
    setLastSavedAt
}) {
    return useCallback((currentExercises, currentElapsed) => {
        if (typeof window === 'undefined') return;

        writeSessionBackup(backupKey, {
            elapsedSeconds: currentElapsed,
            exercises: currentExercises
        });

        const currentFingerprint = createSessionFingerprint(currentExercises, currentElapsed);
        if (!navigator.onLine) {
            setSyncState(SESSION_SYNC_STATES.offline);
            return;
        }

        if (
            profileId &&
            currentFingerprint !== lastSyncedRef.current &&
            !syncInFlightRef.current
        ) {
            syncInFlightRef.current = true;
            setSyncState(SESSION_SYNC_STATES.syncing);
            activeSessionService
                .update(profileId, {
                    templateId: workoutId,
                    elapsedSeconds: currentElapsed,
                    exercises: currentExercises
                })
                .then(() => {
                    lastSyncedRef.current = currentFingerprint;
                    setLastSavedAt(new Date());
                    setSyncState(SESSION_SYNC_STATES.saved);
                })
                .catch(err => {
                    console.error(err);
                    captureTechnicalError(err, {
                        operation: 'session_sync_failed',
                        source: 'active_workout'
                    });
                    setSyncState(SESSION_SYNC_STATES.syncFailed);
                })
                .finally(() => {
                    syncInFlightRef.current = false;
                });
        }
    }, [backupKey, profileId, workoutId, lastSyncedRef, syncInFlightRef, setSyncState, setLastSavedAt]);
}
