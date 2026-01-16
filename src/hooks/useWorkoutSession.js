import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, setDoc, query, collection, where, limit, serverTimestamp, addDoc, getDocFromServer } from 'firebase/firestore';
import { userService } from '../services/userService';

// Helper to generate IDs
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export function useWorkoutSession(workoutId, user) {
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [initialElapsed, setInitialElapsed] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [sessionVersion, setSessionVersion] = useState(0);

    const profileId = user?.uid;
    const lastSyncedRef = useRef('');
    const backupKey = `workout_backup_${profileId}_${workoutId}`;

    // --- DATA FETCHING ---


    // --- DATA FETCHING ---
    useEffect(() => {
        if (!workoutId || !profileId) return;

        async function fetchData() {
            setLoading(true);
            try {
                let activeData = null;

                // 1. Check Active Session (Remote) - Only if not explicitly discarded (we assume sessionVersion > 0 means we might want fresh)
                // Actually, consistently checking remote is fine, IF we trust delete worked.
                try {
                    const activeRef = doc(db, 'active_workouts', profileId);
                    // FORCE SERVER FETCH to avoid stale cache after discard
                    const activeSnap = await getDocFromServer(activeRef);
                    if (activeSnap.exists()) {
                        const data = activeSnap.data();
                        if (data.templateId === workoutId) {
                            activeData = data;
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch active remote session (Server)", e);
                    // Fallback to cache if offline
                    try {
                        const activeRef = doc(db, 'active_workouts', profileId);
                        const activeSnap = await getDoc(activeRef);
                        if (activeSnap.exists()) {
                            const data = activeSnap.data();
                            if (data.templateId === workoutId) {
                                activeData = data;
                            }
                        }
                    } catch (cacheErr) {
                        console.warn("Could not fetch active remote session (Cache)", cacheErr);
                    }
                }

                // If found active session, use it
                if (activeData) {
                    console.log("Found active remote session");
                    // Load template data (metadata only)
                    const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
                    if (templateDoc.exists()) {
                        setTemplate({ id: templateDoc.id, ...templateDoc.data() });
                    }

                    if (activeData.exercises) {
                        setExercises(activeData.exercises);
                        setInitialElapsed(activeData.elapsedSeconds || 0);
                        lastSyncedRef.current = JSON.stringify(activeData.exercises);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Check Local Backup
                const savedBackup = localStorage.getItem(backupKey);
                let restored = false;
                if (savedBackup) {
                    try {
                        const parsed = JSON.parse(savedBackup);
                        if (parsed.exercises && Array.isArray(parsed.exercises)) {
                            setExercises(parsed.exercises);
                            setInitialElapsed(parsed.elapsedSeconds || 0);

                            const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
                            if (templateDoc.exists()) {
                                setTemplate({ id: templateDoc.id, ...templateDoc.data() });
                            }
                            restored = true;
                        }
                    } catch (e) {
                        localStorage.removeItem(backupKey);
                    }
                }

                if (restored) {
                    setLoading(false);
                    return;
                }

                // 3. New Session / Load Template (FRESH)
                const templateRef = doc(db, 'workout_templates', workoutId);
                let templateDoc;
                try {
                    // Force server fetch to get latest edits
                    templateDoc = await getDocFromServer(templateRef);
                } catch (e) {
                    console.warn("Template server fetch failed, falling back to cache", e);
                    templateDoc = await getDoc(templateRef);
                }

                if (templateDoc.exists()) {
                    const tmplData = templateDoc.data();
                    setTemplate({ id: templateDoc.id, ...tmplData });

                    // ... (Normalization and History Logic) ...
                    // fetch History
                    let lastSessionExercises = [];
                    try {
                        const historyQuery = query(
                            collection(db, 'workout_sessions'),
                            where('userId', '==', profileId),
                            where('templateId', '==', workoutId),
                            limit(20)
                        );
                        const historySnap = await getDocs(historyQuery);
                        const validDocs = historySnap.docs.filter(d => d.data().completedAt);
                        if (validDocs.length > 0) {
                            const sortedDocs = validDocs.sort((a, b) => {
                                const dateA = a.data().completedAt?.toDate?.() || 0;
                                const dateB = b.data().completedAt?.toDate?.() || 0;
                                return dateB - dateA;
                            });
                            const lastData = sortedDocs[0].data();
                            if (lastData.exercises) lastSessionExercises = lastData.exercises;
                        }
                    } catch (err) {
                        console.error("Error fetching history:", err);
                    }

                    // Map Exercises
                    if (tmplData.exercises) {
                        const mapped = tmplData.exercises.map(ex => {
                            const exId = ex.id || generateId();

                            // Find Match in History
                            const lastEx = lastSessionExercises.find(le => le.id === exId) ||
                                lastSessionExercises.find(le => le.name && ex.name && le.name.trim().toLowerCase() === ex.name.trim().toLowerCase());

                            const sets = normalizeSets(ex.sets, ex.reps, ex.target).map((s, idx) => {
                                let lastSet = null;
                                // Propagate history
                                if (lastEx && lastEx.sets && lastEx.sets.length > 0) {
                                    if (idx < lastEx.sets.length) lastSet = lastEx.sets[idx];
                                    else lastSet = lastEx.sets[lastEx.sets.length - 1];
                                }

                                return {
                                    ...s,
                                    id: s.id || generateId(),
                                    completed: false,
                                    weight: lastSet?.weight || s.weight || '',
                                    reps: lastSet?.reps || s.reps || '',
                                    targetReps: s.reps || ex.reps,
                                    targetWeight: lastSet?.weight || '',
                                    lastWeight: lastSet?.weight || null,
                                    lastReps: lastSet?.reps || null
                                };
                            });

                            return {
                                ...ex,
                                id: exId,
                                sets,
                                notes: lastEx?.notes || ''
                            };
                        });
                        setExercises(mapped);
                        // Clear elapsed for new session
                        setInitialElapsed(0);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Falha ao carregar treino.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [workoutId, profileId, backupKey, sessionVersion]);

    // ... SYNC ...

    // ... ACTIONS ...



    // Re-declare other functions here to be safe or ensure they are present
    // But since we are replacing a chunk, we just need to match correctly.

    // The previous `useEffect` block in file was ~140 lines.
    // The `discardSession` was at the end.
    // We are replacing from start of `useEffect` to the end of `discardSession`?
    // No, `useEffect` starts at line 24. `discardSession` ends at 312.
    // That's too big of a chunk to replace safely without context.

    // Let's replace smaller chunks.
    // Chunk 1: Add sessionVersion state.
    // Chunk 2: Update useEffect dependencies.
    // Chunk 3: Update discardSession.

    // This is safer.

    // ABORTING THIS REPLACE to replace with smaller sequential edits.


    // --- SYNC ---
    const syncSession = useCallback((currentExercises, currentElapsed) => {
        if (typeof window === 'undefined') return;

        // Local Backup
        const backupData = {
            timestamp: Date.now(),
            elapsedSeconds: currentElapsed,
            exercises: currentExercises
        };
        localStorage.setItem(backupKey, JSON.stringify(backupData));

        // Cloud Sync
        const currentString = JSON.stringify(currentExercises);
        if (profileId && currentString !== lastSyncedRef.current) {
            userService.updateActiveSession(profileId, {
                templateId: workoutId,
                elapsedSeconds: currentElapsed,
                exercises: currentExercises
            }).then(() => {
                lastSyncedRef.current = currentString;
            }).catch(console.error);
        }
    }, [backupKey, profileId, workoutId]);


    // --- ACTIONS ---
    const updateExerciseSet = useCallback((exId, setId, field, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: val } : s)
        } : ex));
    }, []);

    const toggleSet = useCallback((exId, setId) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        } : ex));
    }, []);

    const updateNotes = useCallback((exId, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, notes: val } : ex));
    }, []);

    const completeSetAutoFill = useCallback((exId, setNumber, weight, actualReps) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentSetIdx = setNumber - 1;
            const nextSetIdx = currentSetIdx + 1;

            return {
                ...ex,
                sets: ex.sets.map((s, idx) => {
                    // Update Current Set
                    if (idx === currentSetIdx) {
                        return { ...s, completed: true, weight, reps: actualReps };
                    }
                    // Auto-fill Next Set
                    if (idx === nextSetIdx) {
                        return {
                            ...s,
                            weight: s.weight || weight,
                            reps: actualReps // Copy reps too
                        };
                    }
                    return s;
                })
            };
        }));
    }, []);

    const finishSession = async (finalElapsed) => {
        setSaving(true);
        try {
            const minutes = Math.floor(finalElapsed / 60);
            const durationStr = `${minutes}min`;

            const now = new Date();
            await addDoc(collection(db, 'workout_sessions'), {
                duration: durationStr,
                elapsedSeconds: finalElapsed,
                templateId: workoutId,
                templateName: template?.name || 'Treino Personalizado',
                workoutName: template?.name || 'Treino Personalizado',
                userId: profileId,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(), // Use server time for consistency
                completedAtClient: now, // Backup for immediate UI optimistic updates
                exercises: exercises.map(ex => ({
                    id: ex.id || generateId(),
                    name: ex.name || 'Exercício sem nome',
                    sets: ex.sets.map(s => ({
                        id: s.id || generateId(),
                        weight: s.weight || '',
                        reps: s.reps || '',
                        completed: !!s.completed
                    })),
                    notes: ex.notes || ''
                }))
            });

            // Cleanup
            localStorage.removeItem(backupKey);
            if (profileId) {
                await userService.deleteActiveSession(profileId);
            }

            // Update Template Metadata
            const templateRef = doc(db, 'workout_templates', workoutId);
            await setDoc(templateRef, { lastPerformed: serverTimestamp() }, { merge: true });

            return true; // Success
        } catch (e) {
            console.error(e);
            setError('Erro ao salvar treino.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const discardSession = useCallback(async () => {
        setLoading(true);
        try {
            // Cleanup
            localStorage.removeItem(backupKey);
            if (profileId) {
                await userService.deleteActiveSession(profileId);
            }

            // Wait a bit to ensure propagation
            await new Promise(r => setTimeout(r, 600));

            // Trigger re-fetch
            setSessionVersion(v => v + 1);
        } catch (e) {
            console.error("Error discarding session:", e);
            // Fallback
            window.location.reload();
        }
    }, [backupKey, profileId]);

    return {
        loading,
        saving,
        error,
        setError,
        template,
        exercises,
        initialElapsed,
        updateExerciseSet,
        toggleSet,
        updateNotes,
        completeSetAutoFill,
        finishSession,
        syncSession,
        discardSession
    };
}


// Shared Helper
function normalizeSets(exSets, exReps, exTarget) {
    let count = 3;
    if (exSets) {
        const parsed = Number(exSets);
        if (!isNaN(parsed) && parsed > 0) count = parsed;
    } else if (exTarget && typeof exTarget === 'string') {
        const match = exTarget.match(/^(\d+)x/i);
        if (match && match[1]) count = parseInt(match[1], 10);
    }

    let defaultReps = exReps || '8-12';
    if (exTarget && typeof exTarget === 'string') {
        const parts = exTarget.split('x');
        if (parts.length > 1) defaultReps = parts[1].trim();
    }

    return Array.from({ length: count }, () => ({
        id: generateId(),
        reps: defaultReps,
        weight: '',
        completed: false
    }));
}
