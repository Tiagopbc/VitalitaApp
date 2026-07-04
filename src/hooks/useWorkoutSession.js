import { useState, useEffect, useRef, useCallback } from 'react';
import { getFirestoreDeps } from '../firebaseDb';
import { activeSessionService } from '../services/sessions/activeSessionService';
import {
    chooseSessionRecoverySource,
    createSessionBackupKey,
    createSessionFingerprint,
    readSessionBackup,
    removeSessionBackup,
    SESSION_SYNC_STATES,
    writeSessionBackup
} from '../services/sessions/sessionRecoveryService';

// Auxiliar para gerar IDs
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
    const [syncState, setSyncState] = useState(SESSION_SYNC_STATES.idle);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const profileId = user?.uid;
    const lastSyncedRef = useRef('');
    const syncInFlightRef = useRef(false);
    const backupKey = createSessionBackupKey(profileId, workoutId);

    // --- BUSCA DE DADOS ---
    useEffect(() => {
        if (!workoutId || !profileId) return;

        async function fetchData() {
            setLoading(true);
            setSyncState(SESSION_SYNC_STATES.loading);
            try {
                const { db, doc, getDoc, getDocs, query, collection, where, limit, getDocFromServer } = await getFirestoreDeps();
                let activeData = null;

                // 1. Verificar sessão ativa remota.
                try {
                    const activeRef = doc(db, 'active_workouts', profileId);
                    const activeSnap = await getDocFromServer(activeRef);
                    if (activeSnap.exists()) {
                        const data = activeSnap.data();
                        if (data.templateId === workoutId) {
                            activeData = data;
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch active remote session (Server)", e);
                    // Fallback para cache se offline
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

                // 2. Verificar Backup Local
                const localBackupData = readSessionBackup(backupKey);
                const recovery = chooseSessionRecoverySource({ cloudData: activeData, localBackupData });

                if (recovery) {
                    // Carregar dados do template (apenas metadados)
                    const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
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
                    setLoading(false);
                    return;
                }

                // 3. Nova Sessão / Carregar Template (FRESCO)
                const templateRef = doc(db, 'workout_templates', workoutId);
                let templateDoc;
                try {
                    // Forçar busca no servidor para obter últimas edições
                    templateDoc = await getDocFromServer(templateRef);
                } catch (e) {
                    console.warn("Template server fetch failed, falling back to cache", e);
                    templateDoc = await getDoc(templateRef);
                }

                if (templateDoc.exists()) {
                    const tmplData = templateDoc.data();
                    setTemplate({ id: templateDoc.id, ...tmplData });

                    // Buscar último histórico do treino para preencher sugestões de carga/reps.
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

                    // Mapear Exercícios
                    if (tmplData.exercises) {
                        const mapped = tmplData.exercises.map(ex => {
                            const exId = ex.id || generateId();

                            // Encontrar Correspondência no Histórico
                            const lastEx = lastSessionExercises.find(le => le.id === exId) ||
                                lastSessionExercises.find(le => le.name && ex.name && le.name.trim().toLowerCase() === ex.name.trim().toLowerCase());

                            const sets = normalizeSets(ex.sets, ex.reps, ex.target).map((s, idx) => {
                                let lastSet = null;
                                // Propagar histórico
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
                                    lastReps: lastSet?.reps || null,
                                    weightMode: lastSet?.weightMode || s.weightMode || 'total',
                                    baseWeight: lastSet?.baseWeight || null,
                                    drops: lastSet?.drops ? lastSet.drops.map(d => ({ 
                                        ...d, 
                                        id: generateId(), 
                                        completed: false // Ensures drops from history are copied fresh
                                    })) : null
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
                        setInitialElapsed(0);
                        setSyncState(SESSION_SYNC_STATES.active);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Falha ao carregar treino.");
                setSyncState(SESSION_SYNC_STATES.error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [workoutId, profileId, backupKey, sessionVersion]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const updateOnlineState = () => {
            if (!navigator.onLine) {
                setSyncState(SESSION_SYNC_STATES.offline);
            } else {
                setSyncState((current) => (
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
    }, []);

    // --- SINCRONIZAÇÃO ---
    const syncSession = useCallback((currentExercises, currentElapsed) => {
        if (typeof window === 'undefined') return;

        // Backup Local
        const backupData = {
            timestamp: Date.now(),
            elapsedSeconds: currentElapsed,
            exercises: currentExercises
        };
        writeSessionBackup(backupKey, backupData);

        // Sincronização na Nuvem
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
                .catch((err) => {
                    console.error(err);
                    setSyncState(SESSION_SYNC_STATES.syncFailed);
                })
                .finally(() => {
                    syncInFlightRef.current = false;
                });
        }
    }, [backupKey, profileId, workoutId]);


    // --- AÇÕES ---
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

    const updateSetMultiple = useCallback((exId, setId, updates) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
        } : ex));
    }, []);

    const completeSetAutoFill = useCallback((exId, setNumber, weight, actualReps, weightMode = 'total', baseWeight = null, drops = null) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentSetIdx = setNumber - 1;
            const nextSetIdx = currentSetIdx + 1;

            return {
                ...ex,
                sets: ex.sets.map((s, idx) => {
                    // Atualizar Série Atual
                    if (idx === currentSetIdx) {
                        return {
                            ...s,
                            completed: true,
                            weight,
                            reps: actualReps,
                            weightMode,
                            baseWeight
                        };
                    }
                    // Auto-preencher Próxima Série
                    if (idx === nextSetIdx) {
                        // FIX: Sempre sobrescrever com os dados da série anterior,
                        // priorizando o input recente do usuário sobre o histórico.
                        return {
                            ...s,
                            weight: weight,
                            reps: actualReps,
                            weightMode: weightMode,
                            baseWeight: baseWeight,
                            drops: drops ? drops.map(d => ({ ...d, id: generateId(), reps: d.reps })) : null
                        };
                    }
                    return s;
                })
            };
        }));
    }, []);

    const toggleExerciseWeightMode = useCallback((exId) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            // Determinar modo alvo baseado na primeira série (ou maioria, mas a primeira é previsível)
            // Se atualmente for 'total' (padrão), mudar para 'per_side' (por lado).
            // Se 'per_side', mudar para 'total'.
            const currentMode = ex.sets[0]?.weightMode || 'total';
            const targetMode = currentMode === 'total' ? 'per_side' : 'total';

            const newSets = ex.sets.map(s => {
                const currentWeight = parseFloat(s.weight) || 0;

                if (targetMode === 'per_side') {
                    // Alternando para POR LADO
                    // Peso atual é Total. PesoBase torna-se Metade.
                    const newBase = currentWeight > 0 ? (currentWeight / 2) : 0;
                    return {
                        ...s,
                        weightMode: 'per_side',
                        baseWeight: newBase.toString(),
                        // O peso permanece o valor total (fonte da verdade padrão)
                    };
                } else {
                    // Alternando para TOTAL
                    // Apenas limpar a flag de modo e o peso base.
                    return {
                        ...s,
                        weightMode: 'total',
                        baseWeight: null
                    };
                }
            });

            return { ...ex, sets: newSets };
        }));
    }, []);

    const finishSession = async (finalElapsed) => {
        setSaving(true);
        setSyncState(SESSION_SYNC_STATES.finishing);
        try {
            const { db, collection, addDoc, serverTimestamp, doc, setDoc } = await getFirestoreDeps();
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
                completedAt: serverTimestamp(), // Usar tempo do servidor para consistência
                completedAtClient: now, // Backup para atualizações otimistas imediatas na UI
                exercises: exercises.map(ex => ({
                    id: ex.id || generateId(),
                    name: ex.name || 'Exercício sem nome',
                    sets: ex.sets.map(s => ({
                        id: s.id || generateId(),
                        weight: s.weight || '',
                        reps: s.reps || '',
                        completed: !!s.completed,
                        weightMode: s.weightMode || 'total',
                        baseWeight: s.baseWeight || null,
                        drops: s.drops || null
                    })),
                    notes: ex.notes || ''
                }))
            });

            // Limpeza
            removeSessionBackup(backupKey);
            if (profileId) {
                await activeSessionService.remove(profileId);
            }

            // Atualizar Metadados do Template
            const templateRef = doc(db, 'workout_templates', workoutId);
            await setDoc(templateRef, { lastPerformed: serverTimestamp() }, { merge: true });

            setSyncState(SESSION_SYNC_STATES.finished);
            return true; // Sucesso
        } catch (e) {
            console.error(e);
            setError('Erro ao salvar treino.');
            setSyncState(SESSION_SYNC_STATES.syncFailed);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const discardSession = useCallback(async () => {
        setLoading(true);
        setSyncState(SESSION_SYNC_STATES.discarding);
        try {
            // Limpeza
            removeSessionBackup(backupKey);
            if (profileId) {
                await activeSessionService.remove(profileId);
            }

            // Aguardar um pouco para garantir propagação
            await new Promise(r => setTimeout(r, 600));

            // Acionar nova busca
            setSessionVersion(v => v + 1);
            setSyncState(SESSION_SYNC_STATES.discarded);
            return true;
        } catch (e) {
            console.error("Error discarding session:", e);
            setError('Erro ao descartar treino. Seu backup local foi mantido.');
            setSyncState(SESSION_SYNC_STATES.syncFailed);
            return false;
        } finally {
            setLoading(false);
        }
    }, [backupKey, profileId]);

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


// Auxiliar Compartilhado
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
