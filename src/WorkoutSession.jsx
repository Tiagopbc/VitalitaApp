// src/WorkoutSession.jsx

import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
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

function WorkoutSession({ workoutId, onBack, onOpenMethod, user }) {
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weights, setWeights] = useState({});
    const [reps, setReps] = useState({});
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState(false);
    const [checkedExercises, setCheckedExercises] = useState({});
    const [progressionSuggestions, setProgressionSuggestions] = useState({});
    const [setTypes, setSetTypes] = useState({});
    const [supersets, setSupersets] = useState({});

    const profileId = user.uid;

    const toNumber = (value) => {
        if (typeof value === 'number') return value;
        const n = Number(value);
        if (Number.isNaN(n)) return 0;
        return n;
    };

    useEffect(() => {
        async function fetchWorkoutData() {
            setLoading(true);

            try {
                const templateRef = doc(db, 'workout_templates', workoutId);
                const templateSnap = await getDoc(templateRef);

                if (!templateSnap.exists()) {
                    console.error('Template não encontrado');
                    setLoading(false);
                    return;
                }

                const templateData = templateSnap.data();
                setTemplate(templateData);

                const newWeights = {};
                const newReps = {};
                const newNotes = {};
                const newChecked = {};
                const newSetTypes = {};
                const newSupersets = {};

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
                const draftSetTypes = draftData?.setTypes || {};
                const draftSupersets = draftData?.supersets || {};

                const sessionsQuery = query(
                    collection(db, 'workout_sessions'),
                    orderBy('completedAt', 'desc'),
                    limit(30)
                );
                const sessionsSnap = await getDocs(sessionsQuery);

                const recentSessions = sessionsSnap.docs
                    .map((d) => d.data())
                    .filter(
                        (s) =>
                            s.templateId === workoutId &&
                            s.userId === user.uid
                    );

                let lastSessionResults = {};
                if (recentSessions.length > 0) {
                    const last = recentSessions[0];
                    lastSessionResults = last.results || {};
                }

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

                    newSetTypes[ex.name] =
                        draftSetTypes[ex.name] ??
                        lastForExercise?.setType ??
                        'normal';

                    newSupersets[ex.name] =
                        draftSupersets[ex.name] ??
                        lastForExercise?.supersetWith ??
                        '';
                });

                setWeights(newWeights);
                setReps(newReps);
                setNotes(newNotes);
                setCheckedExercises(newChecked);
                setSetTypes(newSetTypes);
                setSupersets(newSupersets);

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

                        const minReps =
                            last.minReps ?? prev.minReps ?? null;
                        const maxReps =
                            last.maxReps ?? prev.maxReps ?? null;

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
                                (e) =>
                                    e.reps > 0 &&
                                    e.reps < limitForLow
                            ).length;

                        if (belowMinCount >= 2 && lastWeight > 0) {
                            const decrement = lastWeight <= 20 ? 2.5 : 5;
                            const newWeight = Math.max(
                                0,
                                lastWeight - decrement
                            );
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

    useEffect(() => {
        if (!template) return;

        const hasAnyData =
            Object.values(weights).some((w) => w && w !== '') ||
            Object.values(reps).some((r) => r && r !== '') ||
            Object.values(notes).some((n) => n && n.trim() !== '') ||
            Object.values(checkedExercises).some((c) => !!c) ||
            Object.values(setTypes).some((t) => t && t !== 'normal') ||
            Object.values(supersets).some((s) => s && s !== '');

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
                        setTypes,
                        supersets,
                        updatedAt: serverTimestamp()
                    },
                    { merge: true }
                );
            } catch (error) {
                console.error(
                    'Erro ao salvar rascunho da sessão',
                    error
                );
            }
        };

        persistDraft();
    }, [
        weights,
        reps,
        notes,
        checkedExercises,
        setTypes,
        supersets,
        template,
        workoutId,
        profileId,
        user.uid
    ]);

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

    const handleSetTypeChange = (exerciseName, value) => {
        setSetTypes((prev) => ({
            ...prev,
            [exerciseName]: value
        }));
        if (value !== 'superserie') {
            setSupersets((prev) => ({
                ...prev,
                [exerciseName]: ''
            }));
        }
    };

    const handleSupersetChange = (exerciseName, value) => {
        setSupersets((prev) => ({
            ...prev,
            [exerciseName]: value
        }));
    };

    const adjustWeight = (exerciseName, delta) => {
        setWeights((prev) => {
            const current = toNumber(prev[exerciseName]) || 0;
            let next = current + delta;
            if (next < 0) next = 0;
            next = Math.round(next * 2) / 2; // trava em 0,5 em 0,5
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
                note: notes[ex.name] || '',
                method: ex.method || '',
                completed: !!checkedExercises[ex.name],
                setType: setTypes[ex.name] || 'normal',
                supersetWith: supersets[ex.name] || ''
            };
        });

        try {
            await addDoc(collection(db, 'workout_sessions'), {
                templateId: workoutId,
                templateName: template.name,
                userId: user.uid,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                results: sessionResults
            });

            const userProfileRef = doc(db, 'user_profile', profileId);
            await setDoc(
                userProfileRef,
                {
                    lastWorkoutId: workoutId
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
                console.error(
                    'Erro ao apagar rascunho da sessão',
                    error
                );
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
                {template.exercises.map((ex) => {
                    const completed = checkedExercises[ex.name];
                    const suggestion = progressionSuggestions[ex.name];
                    const suggestionWeight = suggestion?.weight;
                    const currentWeight = toNumber(weights[ex.name]) || 0;

                    const shouldShowSuggestion =
                        suggestionWeight &&
                        suggestionWeight !== currentWeight;

                    const direction = suggestion?.direction || 'up';

                    const currentSetType = setTypes[ex.name] || 'normal';
                    const currentSuperset = supersets[ex.name] || '';

                    const otherExercises = template.exercises.filter(
                        (e) => e.name !== ex.name
                    );

                    return (
                        <div
                            key={ex.name}
                            className={
                                'session-exercise-item' +
                                (completed ? ' completed' : '')
                            }
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
                                <span className="exercise-name">
                                    {ex.name}
                                </span>
                                <span className="exercise-target">
                                    Série: {ex.target}
                                    {ex.method ? ` (${ex.method})` : ''}
                                </span>

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
                                                    adjustWeight(
                                                        ex.name,
                                                        -0.5
                                                    )
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className={`exercise-weight-input exercise-number-input ${
                                                    weights[ex.name] ? 'filled' : ''
                                                }`}
                                                type="number"
                                                step="0.5"
                                                inputMode="decimal"
                                                value={weights[ex.name] || ''}
                                                onChange={(e) =>
                                                    handleWeightChange(ex.name, e.target.value)
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustWeight(
                                                        ex.name,
                                                        0.5
                                                    )
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
                                                    adjustReps(
                                                        ex.name,
                                                        -1
                                                    )
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className={`exercise-weight-input exercise-number-input ${
                                                    reps[ex.name] ? 'filled' : ''
                                                }`}
                                                type="number"
                                                step="1"
                                                inputMode="numeric"
                                                value={reps[ex.name] || ''}
                                                onChange={(e) =>
                                                    handleRepsChange(ex.name, e.target.value)
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn-adjust"
                                                onClick={() =>
                                                    adjustReps(
                                                        ex.name,
                                                        1
                                                    )
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

                                {/* Tipo de série e super série */}
                                <div className="exercise-extra-row">
                                    <div className="exercise-set-type">
                                        <label>
                                            Tipo de série
                                            <select
                                                value={currentSetType}
                                                onChange={(e) =>
                                                    handleSetTypeChange(
                                                        ex.name,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="normal">
                                                    Normal
                                                </option>
                                                <option value="dropset">
                                                    Drop set
                                                </option>
                                                <option value="biserie">
                                                    Bi série
                                                </option>
                                                <option value="superserie">
                                                    Super série
                                                </option>
                                            </select>
                                        </label>
                                    </div>

                                    {currentSetType === 'superserie' && (
                                        <div className="exercise-superset">
                                            <label>
                                                Com qual exercício
                                                <select
                                                    value={currentSuperset}
                                                    onChange={(e) =>
                                                        handleSupersetChange(
                                                            ex.name,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Selecionar
                                                    </option>
                                                    {otherExercises.map(
                                                        (other) => (
                                                            <option
                                                                key={
                                                                    other.name
                                                                }
                                                                value={
                                                                    other.name
                                                                }
                                                            >
                                                                {other.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {shouldShowSuggestion && (
                                <div className="exercise-suggestion">
                                    <span className="exercise-suggestion-text">
                                        Sugestão,{' '}
                                        {direction === 'down'
                                            ? 'reduzir para '
                                            : 'aumentar para '}
                                        <strong>
                                            {suggestionWeight} kg
                                        </strong>
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