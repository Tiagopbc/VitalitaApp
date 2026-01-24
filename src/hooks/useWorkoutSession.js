import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, setDoc, query, collection, where, limit, serverTimestamp, addDoc, getDocFromServer } from 'firebase/firestore';
import { userService } from '../services/userService';

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

    const profileId = user?.uid;
    const lastSyncedRef = useRef('');
    const backupKey = `workout_backup_${profileId}_${workoutId}`;

    // --- BUSCA DE DADOS ---


    // --- BUSCA DE DADOS ---
    useEffect(() => {
        if (!workoutId || !profileId) return;

        async function fetchData() {
            setLoading(true);
            try {
                let activeData = null;

                // 1. Verificar Sessão Ativa (Remota) - Apenas se não descartada explicitamente (assumimos que sessionVersion > 0 significa que podemos querer dados frescos)
                // Na verdade, verificar remotamente de forma consistente é bom, SE confiarmos que o delete funcionou.
                try {
                    const activeRef = doc(db, 'active_workouts', profileId);
                    // FORÇAR BUSCA NO SERVIDOR para evitar cache obsoleto após descarte
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

                // Se encontrar sessão ativa, usá-la
                if (activeData) {
                    // Carregar dados do template (apenas metadados)
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

                // 2. Verificar Backup Local
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

                    // ... (Lógica de Normalização e Histórico) ...
                    // buscar Histórico
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
                        // Limpar tempo decorrido para nova sessão
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


    // --- SINCRONIZAÇÃO ---
    const syncSession = useCallback((currentExercises, currentElapsed) => {
        if (typeof window === 'undefined') return;

        // Backup Local
        const backupData = {
            timestamp: Date.now(),
            elapsedSeconds: currentElapsed,
            exercises: currentExercises
        };
        localStorage.setItem(backupKey, JSON.stringify(backupData));

        // Sincronização na Nuvem
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

    const completeSetAutoFill = useCallback((exId, setNumber, weight, actualReps) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentSetIdx = setNumber - 1;
            const nextSetIdx = currentSetIdx + 1;

            return {
                ...ex,
                sets: ex.sets.map((s, idx) => {
                    // Atualizar Série Atual
                    if (idx === currentSetIdx) {
                        return { ...s, completed: true, weight, reps: actualReps };
                    }
                    // Auto-preencher Próxima Série
                    if (idx === nextSetIdx) {
                        return {
                            ...s,
                            weight: s.weight || weight,
                            reps: actualReps // Copiar reps também
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

            // Determine target mode based on the first set (or majority, but first set is predictable)
            // If currently 'total' (default), switch to 'per_side'.
            // If 'per_side', switch to 'total'.
            const currentMode = ex.sets[0]?.weightMode || 'total';
            const targetMode = currentMode === 'total' ? 'per_side' : 'total';

            const newSets = ex.sets.map(s => {
                const currentWeight = parseFloat(s.weight) || 0;

                if (targetMode === 'per_side') {
                    // Switching to PER SIDE
                    // Current weight is Total. BaseWeight becomes Half.
                    const newBase = currentWeight > 0 ? (currentWeight / 2) : 0;
                    return {
                        ...s,
                        weightMode: 'per_side',
                        baseWeight: newBase.toString(),
                        // Weight remains the total value (standard source of truth)
                    };
                } else {
                    // Switching to TOTAL
                    // Just clear the mode flag and baseWeight.
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
                completedAt: serverTimestamp(), // Usar tempo do servidor para consistência
                completedAtClient: now, // Backup para atualizações otimistas imediatas na UI
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

            // Limpeza
            localStorage.removeItem(backupKey);
            if (profileId) {
                await userService.deleteActiveSession(profileId);
            }

            // Atualizar Metadados do Template
            const templateRef = doc(db, 'workout_templates', workoutId);
            await setDoc(templateRef, { lastPerformed: serverTimestamp() }, { merge: true });

            return true; // Sucesso
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
            // Limpeza
            localStorage.removeItem(backupKey);
            if (profileId) {
                await userService.deleteActiveSession(profileId);
            }

            // Aguardar um pouco para garantir propagação
            await new Promise(r => setTimeout(r, 600));

            // Acionar nova busca
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
