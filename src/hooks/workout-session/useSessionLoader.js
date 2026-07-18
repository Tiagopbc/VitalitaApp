import { useEffect, useState } from 'react';
import { getFirestoreDeps } from '../../firebaseDb';
import {
    chooseSessionRecoverySource,
    createSessionFingerprint,
    readSessionBackup,
    SESSION_SYNC_STATES
} from '../../services/sessions/sessionRecoveryService';
import { mapTemplateExercises } from './normalizeSets';
import { buildProgressionMap } from '../../utils/progressionSuggestions';
import { captureTechnicalError } from '../../services/observabilityService';

async function getActiveSession({ db, doc, getDoc, getDocFromServer }, profileId, workoutId) {
    const activeRef = doc(db, 'active_workouts', profileId);

    try {
        const activeSnap = await getDocFromServer(activeRef);
        if (!activeSnap.exists()) return null;
        const data = activeSnap.data();
        return data.templateId === workoutId ? data : null;
    } catch (serverErr) {
        console.warn('Could not fetch active remote session (Server)', serverErr);
    }

    try {
        const activeSnap = await getDoc(activeRef);
        if (!activeSnap.exists()) return null;
        const data = activeSnap.data();
        return data.templateId === workoutId ? data : null;
    } catch (cacheErr) {
        console.warn('Could not fetch active remote session (Cache)', cacheErr);
        return null;
    }
}

async function getTemplate(deps, workoutId) {
    const { db, doc, getDoc, getDocFromServer } = deps;
    const templateRef = doc(db, 'workout_templates', workoutId);

    try {
        return await getDocFromServer(templateRef);
    } catch (err) {
        console.warn('Template server fetch failed, falling back to cache', err);
        return getDoc(templateRef);
    }
}

async function getRecentSessions(deps, profileId, workoutId, count = 3) {
    const { db, getDocs, query, collection, where, limit } = deps;
    try {
        const historyQuery = query(
            collection(db, 'workout_sessions'),
            where('userId', '==', profileId),
            where('templateId', '==', workoutId),
            limit(20)
        );
        const historySnap = await getDocs(historyQuery);
        const validDocs = historySnap.docs.filter(docSnap => docSnap.data().completedAt);
        if (validDocs.length === 0) return [];

        const sortedDocs = validDocs.sort((a, b) => {
            const dateA = a.data().completedAt?.toDate?.() || 0;
            const dateB = b.data().completedAt?.toDate?.() || 0;
            return dateB - dateA;
        });

        return sortedDocs.slice(0, count).map(docSnap => docSnap.data());
    } catch (err) {
        console.error('Error fetching history:', err);
        return [];
    }
}

export function useSessionLoader({
    workoutId,
    profileId,
    backupKey,
    sessionVersion,
    setTemplate,
    setExercises,
    setInitialElapsed,
    setError,
    setSyncState,
    setSessionConflict,
    setProgression,
    lastSyncedRef
}) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workoutId || !profileId) return undefined;

        let cancelled = false;

        async function fetchSession() {
            setLoading(true);
            setSyncState(SESSION_SYNC_STATES.loading);

            try {
                setSessionConflict(null);
                const deps = await getFirestoreDeps();
                const activeData = await getActiveSession(deps, profileId, workoutId);
                const localBackupData = readSessionBackup(backupKey);
                const recovery = chooseSessionRecoverySource({ cloudData: activeData, localBackupData });

                if (cancelled) return;

                if (recovery) {
                    const templateDoc = await deps.getDoc(deps.doc(deps.db, 'workout_templates', workoutId));
                    if (cancelled) return;

                    if (templateDoc.exists()) {
                        setTemplate({ id: templateDoc.id, ...templateDoc.data() });
                    }

                    setExercises(recovery.exercises);
                    setInitialElapsed(recovery.elapsedSeconds);
                    lastSyncedRef.current = recovery.source === 'cloud'
                        ? createSessionFingerprint(recovery.exercises, recovery.elapsedSeconds)
                        : '';
                    setSyncState(recovery.conflict
                        ? SESSION_SYNC_STATES.conflict
                        : SESSION_SYNC_STATES.active);
                    if (recovery.conflict) {
                        setSessionConflict(recovery);
                    }
                    return;
                }

                const templateDoc = await getTemplate(deps, workoutId);
                if (cancelled) return;

                if (templateDoc.exists()) {
                    const tmplData = templateDoc.data();
                    setTemplate({ id: templateDoc.id, ...tmplData });
                    const recentSessions = await getRecentSessions(deps, profileId, workoutId);
                    if (cancelled) return;

                    const mappedExercises = mapTemplateExercises(tmplData, recentSessions[0]?.exercises || []);
                    setExercises(mappedExercises);
                    if (setProgression) {
                        setProgression(buildProgressionMap(recentSessions, mappedExercises));
                    }
                    setInitialElapsed(0);
                    setSyncState(SESSION_SYNC_STATES.active);
                }
            } catch (err) {
                if (cancelled) return;
                console.error(err);
                captureTechnicalError(err, {
                    operation: 'workout_load_failed',
                    source: 'workout_session'
                });
                setError('Falha ao carregar treino.');
                setSyncState(SESSION_SYNC_STATES.error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchSession();

        return () => {
            cancelled = true;
        };
    }, [
        workoutId,
        profileId,
        backupKey,
        sessionVersion,
        setTemplate,
        setExercises,
        setInitialElapsed,
        setError,
        setSyncState,
        setSessionConflict,
        setProgression,
        lastSyncedRef
    ]);

    return { loading, setLoading };
}
