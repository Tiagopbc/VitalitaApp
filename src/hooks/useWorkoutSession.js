import { useRef, useState } from 'react';
import { createSessionBackupKey, SESSION_SYNC_STATES } from '../services/sessions/sessionRecoveryService';
import { useSessionExerciseActions } from './workout-session/useSessionExerciseActions';
import { useSessionFinish } from './workout-session/useSessionFinish';
import { useSessionLoader } from './workout-session/useSessionLoader';
import { useSessionConnectivity, useSessionSync } from './workout-session/useSessionSync';

export function useWorkoutSession(workoutId, user) {
    const [template, setTemplate] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [initialElapsed, setInitialElapsed] = useState(0);
    const [error, setError] = useState(null);
    const [sessionVersion, setSessionVersion] = useState(0);
    const [syncState, setSyncState] = useState(SESSION_SYNC_STATES.idle);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const profileId = user?.uid;
    const lastSyncedRef = useRef('');
    const syncInFlightRef = useRef(false);
    const backupKey = createSessionBackupKey(profileId, workoutId);

    const { loading, setLoading } = useSessionLoader({
        workoutId,
        profileId,
        backupKey,
        sessionVersion,
        setTemplate,
        setExercises,
        setInitialElapsed,
        setError,
        setSyncState,
        lastSyncedRef
    });

    useSessionConnectivity(setSyncState);

    const syncSession = useSessionSync({
        backupKey,
        profileId,
        workoutId,
        lastSyncedRef,
        syncInFlightRef,
        setSyncState,
        setLastSavedAt
    });

    const {
        updateExerciseSet,
        toggleSet,
        updateNotes,
        updateSetMultiple,
        completeSetAutoFill,
        toggleExerciseWeightMode
    } = useSessionExerciseActions(setExercises);

    const {
        saving,
        finishSession,
        discardSession
    } = useSessionFinish({
        workoutId,
        profileId,
        backupKey,
        template,
        exercises,
        setError,
        setLoading,
        setSessionVersion,
        setSyncState
    });

    return {
        loading,
        saving,
        error,
        setError,
        syncState,
        lastSavedAt,
        template,
        exercises,
        initialElapsed,
        updateExerciseSet,
        toggleSet,
        updateNotes,
        completeSetAutoFill,
        finishSession,
        syncSession,
        discardSession,
        updateSetMultiple,
        toggleExerciseWeightMode
    };
}
