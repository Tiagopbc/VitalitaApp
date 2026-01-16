// src/WorkoutSession.jsx
/**
 * WorkoutSession.jsx
 * Interface legada de execução de treino.
 * Gerencia o estado da sessão, inputs de peso/reps, timer e salvamento de rascunhos.
 */
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
    setDoc,
    deleteDoc
} from 'firebase/firestore';

const DRAFT_COLLECTION = 'workout_session_drafts';

function WorkoutSession({
    workoutId,
    onBack,
    onOpenMethod,
    onOpenHistory,
    user
}) {
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    const [weights, setWeights] = useState({});
    const [reps, setReps] = useState({});
    const [notes, setNotes] = useState({});
    const [checkedExercises, setCheckedExercises] = useState({});
    const [progressionSuggestions, setProgressionSuggestions] = useState({});
    const [personalRecords, setPersonalRecords] = useState({});

    const [saving, setSaving] = useState(false);

    const profileId = user.uid;

    const toNumber = (value) => {
        if (typeof value === 'number') return value;
        const n = Number(value);
        if (Number.isNaN(n)) return 0;
        return n;
    };

    // carregar template, últimos treinos e rascunho
    useEffect(() => {
        async function fetchWorkoutData() {
            setLoading(true);

            try {
                // template do treino
                const templateRef = doc(db, 'workout_templates', workoutId);
                const templateSnap = await getDoc(templateRef);

                if (!templateSnap.exists()) {
                    console.error('Template não encontrado');
                    setLoading(false);
                    return;
                }

                const templateData = templateSnap.data();
                setTemplate(templateData);

                // estados iniciais
                const newWeights = {};
                const newReps = {};
                const newNotes = {};
                const newChecked = {};

                // rascunho salvo
                const draftRef = doc(
                    db,
                    DRAFT_COLLECTION,
                    `${profileId}_${workoutId}`
                );
                const draftSnap = await getDoc(draftRef);
                const draftData = draftSnap.exists() ? draftSnap.data() : null;

                const draftWeights = draftData?.weights || {};
                const draftReps = draftData?.reps || {};
                const draftNotes = draftData?.notes || {};
                const draftChecked = draftData?.checkedExercises || {};

                // últimas sessões desse usuário
                const sessionsQuery = query(
                    collection(db, 'workout_sessions'),
                    orderBy('completedAt', 'desc'),
                    limit(50)
                );
                const sessionsSnap = await getDocs(sessionsQuery);

                const recentSessions = sessionsSnap.docs
                    .map((d) => d.data())
                    .filter(
                        (s) =>
                            s.templateId === workoutId &&
                            s.userId === user.uid
                    );

                // última sessão deste treino
                let lastSessionResults = {};
                if (recentSessions.length > 0) {
                    const last = recentSessions[0];
                    lastSessionResults = last.results || {};
                }

                // PR histórico por exercício
                const records = {};
                recentSessions.forEach((session) => {
                    const results = session.results || {};
                    Object.entries(results).forEach(([exerciseName, r]) => {
                        const w = toNumber(r.weight);
                        const rep = toNumber(r.reps);
                        if (!w && !rep) return;

                        const current = records[exerciseName];
                        if (!current) {
                            records[exerciseName] = { weight: w, reps: rep };
                            return;
                        }

                        if (w > current.weight) {
                            records[exerciseName] = { weight: w, reps: rep };
                        } else if (w === current.weight && rep > current.reps) {
                            records[exerciseName] = { weight: w, reps: rep };
                        }
                    });
                });
                setPersonalRecords(records);

                // preencher valores iniciais peso, reps, notas, checkbox
                templateData.exercises.forEach((ex) => {
                    const lastForExercise = lastSessionResults[ex.name];

                    newWeights[ex.name] =
                        draftWeights[ex.name] ??
                        (lastForExercise ? lastForExercise.weight : '') ??
                        '';

                    newReps[ex.name] =
                        draftReps[ex.name] ??
                        (lastForExercise ? lastForExercise.reps : '') ??
                        '';

                    newNotes[ex.name] = draftNotes[ex.name] ?? '';
                    newChecked[ex.name] = draftChecked[ex.name] ?? false;
                });

                setWeights(newWeights);
                setReps(newReps);
                setNotes(newNotes);
                setCheckedExercises(newChecked);

                // sugestões de progressão
                const progression = {};

                if (recentSessions.length >= 2) {
                    templateData.exercises.forEach((ex) => {
                        const entries = recentSessions
                            .map((session) => {
                                const results = session.results || {};
                                const r = results[ex.name];
                                if (!r) return null;

                                const w = toNumber(r.weight);
                                const rep = toNumber(r.reps);

                                const min =
                                    ex.minReps ??
                                    (typeof r.minReps === 'number'
                                        ? r.minReps
                                        : null);
                                const max =
                                    ex.maxReps ??
                                    (typeof r.maxReps === 'number'
                                        ? r.maxReps
                                        : null);

                                if (!w || w <= 0) return null;

                                return {
                                    weight: w,
                                    reps: rep,
                                    minReps: min,
                                    maxReps: max
                                };
                            })
                            .filter(Boolean)
                            .slice(0, 3);

                        if (entries.length < 2) return;

                        const last = entries[0];
                        const prev = entries[1];

                        const minReps = last.minReps ?? prev.minReps ?? null;
                        const maxReps = last.maxReps ?? prev.maxReps ?? null;

                        // sem faixa alvo, sugere subir quando repetir o mesmo peso em duas sessões
                        if (!maxReps) {
                            const lastW = last.weight;
                            const prevW = prev.weight;
                            if (lastW && prevW && lastW === prevW) {
                                const increment = lastW < 40 ? 2.5 : 5;
                                progression[ex.name] = {
                                    direction: 'up',
                                    weight: lastW + increment
                                };
                            }
                            return;
                        }

                        const lastWeight = last.weight;

                        const recentSameWeightEntries = entries.filter(
                            (e) => e.weight === lastWeight
                        );

                        const reachedTopCount =
                            recentSameWeightEntries.filter(
                                (e) => e.reps && e.reps >= maxReps
                            ).length;

                        if (reachedTopCount >= 2 && lastWeight > 0) {
                            const increment = lastWeight < 40 ? 2.5 : 5;
                            progression[ex.name] = {
                                direction: 'up',
                                weight: lastWeight + increment
                            };
                            return;
                        }

                        const limitForLow = minReps ?? maxReps;

                        const belowMinCount =
                            recentSameWeightEntries.filter(
                                (e) => e.reps > 0 && e.reps < limitForLow
                            ).length;

                        if (belowMinCount >= 2 && lastWeight > 0) {
                            const decrement = lastWeight <= 20 ? 2.5 : 5;
                            const newWeight = Math.max(0, lastWeight - decrement);
                            if (newWeight !== lastWeight) {
                                progression[ex.name] = {
                                    direction: 'down',
                                    weight: newWeight
                                };
                            }
                        }
                    });
                }

                setProgressionSuggestions(progression);
            } catch (error) {
                console.error('Erro ao carregar treino', error);
            } finally {
                setLoading(false);
            }
        }

        fetchWorkoutData();
    }, [workoutId, profileId, user.uid]);

    // salvar rascunho automático
    useEffect(() => {
        if (!template) return;

        const hasAnyData =
            Object.values(weights).some((w) => w && w !== '') ||
            Object.values(reps).some((r) => r && r !== '') ||
            Object.values(notes).some((n) => n && n.trim() !== '') ||
            Object.values(checkedExercises).some((c) => !!c);

        if (!hasAnyData) return;

        const persistDraft = async () => {
            try {
                const draftRef = doc(
                    db,
                    DRAFT_COLLECTION,
                    `${profileId}_${workoutId}`
                );

                await setDoc(
                    draftRef,
                    {
                        userId: user.uid,
                        profileId,
                        templateId: workoutId,
                        templateName: template.name,
                        weights,
                        reps,
                        notes,
                        checkedExercises,
                        updatedAt: serverTimestamp()
                    },
                    { merge: true }
                );
            } catch (error) {
                console.error('Erro ao salvar rascunho da sessão', error);
            }
        };

        persistDraft();
    }, [
        weights,
        reps,
        notes,
        checkedExercises,
        template,
        workoutId,
        profileId,
        user.uid
    ]);

    // handlers simples
    const handleWeightChange = (exerciseName, value) => {
        setWeights((prev) => ({
            ...prev,
            [exerciseName]: value
        }));
    };

    const handleRepsChange = (exerciseName, value) => {
        setReps((prev) => ({
            ...prev,
            [exerciseName]: value
        }));
    };

    const handleNoteChange = (exerciseName, value) => {
        setNotes((prev) => ({
            ...prev,
            [exerciseName]: value
        }));
    };

    const handleCheckToggle = (exerciseName) => {
        setCheckedExercises((prev) => ({
            ...prev,
            [exerciseName]: !prev[exerciseName]
        }));
    };

    const handleApplySuggestion = (exerciseName, suggestedWeight) => {
        setWeights((prev) => ({
            ...prev,
            [exerciseName]: String(suggestedWeight)
        }));
    };

    const adjustWeight = (exerciseName, delta) => {
        setWeights((prev) => {
            const current = toNumber(prev[exerciseName]) || 0;
            let next = current + delta;
            if (next < 0) next = 0;
            next = Math.round(next * 2) / 2;
            return {
                ...prev,
                [exerciseName]: next === 0 ? '' : String(next)
            };
        });
    };

    const adjustReps = (exerciseName, delta) => {
        setReps((prev) => {
            const current = toNumber(prev[exerciseName]) || 0;
            let next = current + delta;
            if (next < 0) next = 0;
            return {
                ...prev,
                [exerciseName]: next === 0 ? '' : String(next)
            };
        });
    };

    const handleSaveSession = async () => {
        if (!template) return;

        setSaving(true);

        const sessionResults = {};
        template.exercises.forEach((ex) => {
            sessionResults[ex.name] = {
                weight: toNumber(weights[ex.name]) || 0,
                reps: toNumber(reps[ex.name]) || 0,
                target: ex.target,
                minReps: ex.minReps ?? null,
                maxReps: ex.maxReps ?? null,
                notes: notes[ex.name] || '',
                method: ex.method || '',
                completed: !!checkedExercises[ex.name]
            };
        });

        try {
            const sessionRef = await addDoc(collection(db, 'workout_sessions'), {
                templateId: workoutId,
                templateName: template.name,
                userId: user.uid,
                profileId,
                userEmail: user.email || null,
                userDisplayName: user.displayName || null,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                results: sessionResults
            });

            const userProfileRef = doc(db, 'user_profile', profileId);
            await setDoc(
                userProfileRef,
                {
                    email: user.email || null,
                    displayName: user.displayName || null,
                    lastWorkoutId: workoutId,
                    lastWorkoutName: template.name,
                    lastSessionId: sessionRef.id,
                    lastCompletedAt: serverTimestamp()
                },
                { merge: true }
            );

            try {
                const draftRef = doc(
                    db,
                    DRAFT_COLLECTION,
                    `${profileId}_${workoutId}`
                );
                await deleteDoc(draftRef);
            } catch (error) {
                console.error('Erro ao apagar rascunho da sessão', error);
            }

            alert('Treino salvo com sucesso');
            onBack();
        } catch (error) {
            console.error('Erro ao salvar sessão', error);
            alert('Erro ao salvar treino');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenMethodClick = (methodName) => {
        if (!methodName) return;
        if (onOpenMethod) onOpenMethod(methodName);
    };

    if (loading || !template) {
        return (
            <div className="workout-session">
                <button
                    type="button"
                    className="btn-back-primary"
                    onClick={onBack}
                >
                    Voltar
                </button>
                <p>Carregando sessão de treino...</p>
            </div>
        );
    }

    // ordena exercícios abertos primeiro e concluídos depois
    const orderedExercises = [...template.exercises].sort((a, b) => {
        const aChecked = !!checkedExercises[a.name];
        const bChecked = !!checkedExercises[b.name];

        if (aChecked === bChecked) return 0;
        return aChecked ? 1 : -1;
    });

    return (
        <div className="workout-session">
            <button
                type="button"
                className="btn-back-primary"
                onClick={onBack}
            >
                Voltar
            </button>

            <h2>{template.name}</h2>

            <div className="session-exercises">
                {orderedExercises.map((ex) => {
                    const completed = checkedExercises[ex.name];
                    const suggestion = progressionSuggestions[ex.name];
                    const suggestionWeight = suggestion?.weight;
                    const currentWeight = toNumber(weights[ex.name]) || 0;

                    const shouldShowSuggestion =
                        suggestionWeight &&
                        suggestionWeight !== currentWeight;

                    // PR de hoje comparado ao histórico
                    const record = personalRecords[ex.name];
                    const currentReps = toNumber(reps[ex.name]) || 0;
                    let isPr = false;

                    if (record) {
                        if (currentWeight > record.weight) {
                            isPr = true;
                        } else if (
                            currentWeight === record.weight &&
                            currentReps > record.reps
                        ) {
                            isPr = true;
                        }
                    }

                    const cardClassName =
                        'session-exercise-item' +
                        (completed ? ' completed' : '') +
                        (isPr ? ' pr-achieved' : '');

                    return (
                        <div
                            key={ex.name}
                            className={cardClassName}
                        >
                            <div className="exercise-checkbox">
                                <input
                                    id={`chk-${ex.name}`}
                                    type="checkbox"
                                    checked={!!checkedExercises[ex.name]}
                                    onChange={() =>
                                        handleCheckToggle(ex.name)
                                    }
                                />
                                <label htmlFor={`chk-${ex.name}`} />
                            </div>

                            <div className="exercise-info">
                                <span className="exercise-group">
                                    {ex.group}
                                </span>

                                <div className="exercise-name-row">
                                    <span className="exercise-name">
                                        {ex.name}
                                    </span>
                                    {isPr && (
                                        <span className="pr-badge">
                                            PR
                                        </span>
                                    )}
                                </div>

                                <span className="exercise-target">
                                    Série: {ex.target}
                                    {ex.method ? ` (${ex.method})` : ''}
                                </span>

                                <div className="exercise-actions-row">
                                    {ex.method && (
                                        <button
                                            type="button"
                                            className="exercise-method-button"
                                            onClick={() =>
                                                handleOpenMethodClick(ex.method)
                                            }
                                        >
                                            Ver método →
                                        </button>
                                    )}

                                    {onOpenHistory && (
                                        <button
                                            type="button"
                                            className="exercise-history-button"
                                            onClick={() =>
                                                onOpenHistory(template.name, ex.name)
                                            }
                                        >
                                            Ver histórico
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="exercise-input">
                                {/* Peso */}
                                <div>
                                    <label>
                                        Peso em kg
                                        <div className="exercise-input-row">
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustWeight(ex.name, -0.5)
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className={`exercise-weight-input exercise-number-input ${weights[ex.name] ? 'filled' : ''
                                                    }`}
                                                type="number"
                                                step="0.5"
                                                inputMode="decimal"
                                                value={weights[ex.name] || ''}
                                                onChange={(e) =>
                                                    handleWeightChange(
                                                        ex.name,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustWeight(ex.name, 0.5)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </label>
                                </div>

                                {/* Repetições */}
                                <div>
                                    <label>
                                        Repetições
                                        <div className="exercise-input-row">
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustReps(ex.name, -1)
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className={`exercise-weight-input exercise-number-input ${reps[ex.name] ? 'filled' : ''
                                                    }`}
                                                type="number"
                                                step="1"
                                                inputMode="numeric"
                                                value={reps[ex.name] || ''}
                                                onChange={(e) =>
                                                    handleRepsChange(
                                                        ex.name,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustReps(ex.name, 1)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </label>
                                </div>

                                {/* Observações */}
                                <div className="exercise-note-wrapper">
                                    <label>
                                        Observações
                                        <input
                                            className="exercise-note-input"
                                            type="text"
                                            value={notes[ex.name] || ''}
                                            onChange={(e) =>
                                                handleNoteChange(
                                                    ex.name,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            {shouldShowSuggestion && (
                                <div className="exercise-suggestion">
                                    <span className="exercise-suggestion-text">
                                        Sugestão,{' '}
                                        {suggestion?.direction === 'down'
                                            ? 'reduzir para '
                                            : 'aumentar para '}
                                        <strong>{suggestionWeight} kg</strong>
                                    </span>
                                    <button
                                        type="button"
                                        className="exercise-suggestion-apply"
                                        onClick={() =>
                                            handleApplySuggestion(
                                                ex.name,
                                                suggestionWeight
                                            )
                                        }
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                className="btn-save-session"
                onClick={handleSaveSession}
                disabled={saving}
            >
                {saving ? 'Salvando...' : 'Salvar sessão'}
            </button>
        </div>
    );
}

export default WorkoutSession;
