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
    setDoc
} from 'firebase/firestore';

const USER_PROFILE_ID = 'Tiago';

function WorkoutSession({ workoutId, onBack }) {
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weights, setWeights] = useState({});
    const [checkedExercises, setCheckedExercises] = useState({});
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState(false);

    const saveSessionDraft = (newWeights, newChecked, newNotes) => {
        const draftKey = `session-${workoutId}`;
        const draftData = {
            weights: newWeights,
            checkedExercises: newChecked,
            notes: newNotes
        };
        try {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
        } catch (error) {
            console.error('Erro ao salvar rascunho da sessão: ', error);
        }
    };

    useEffect(() => {
        const fetchWorkoutData = async () => {
            setLoading(true);

            const templateRef = doc(db, 'workout_templates', workoutId);
            const templateSnap = await getDoc(templateRef);

            if (templateSnap.exists()) {
                const templateData = templateSnap.data();
                setTemplate(templateData);

                const draftKey = `session-${workoutId}`;
                const savedDraft = localStorage.getItem(draftKey);

                const newWeights = {};
                const newChecked = {};
                const newNotes = {};
                let lastSessionData = {};

                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        templateData.exercises.forEach(ex => {
                            newWeights[ex.name] = parsed.weights?.[ex.name] ?? '';
                            newChecked[ex.name] = parsed.checkedExercises?.[ex.name] ?? false;
                            newNotes[ex.name] = parsed.notes?.[ex.name] ?? '';
                        });
                    } catch (error) {
                        console.error('Erro ao carregar rascunho da sessão: ', error);
                        templateData.exercises.forEach(ex => {
                            newWeights[ex.name] = '';
                            newChecked[ex.name] = false;
                            newNotes[ex.name] = '';
                        });
                    }
                } else {
                    const lastSessionQuery = query(
                        collection(db, 'workout_sessions'),
                        orderBy('completedAt', 'desc'),
                        limit(1)
                    );
                    const lastSessionSnap = await getDocs(lastSessionQuery);

                    if (!lastSessionSnap.empty) {
                        lastSessionData = lastSessionSnap.docs[0].data().results;
                    }

                    templateData.exercises.forEach(ex => {
                        newWeights[ex.name] = lastSessionData[ex.name]?.weight || '';
                        newChecked[ex.name] = false;
                        newNotes[ex.name] = '';
                    });
                }

                setWeights(newWeights);
                setCheckedExercises(newChecked);
                setNotes(newNotes);
            } else {
                console.error('Template não encontrado!');
            }

            setLoading(false);
        };

        fetchWorkoutData();
    }, [workoutId]);

    const handleWeightChange = (exerciseName, weight) => {
        setWeights(prevWeights => {
            const updated = {
                ...prevWeights,
                [exerciseName]: weight
            };
            saveSessionDraft(updated, checkedExercises, notes);
            return updated;
        });
    };

    const handleCheckToggle = (exerciseName) => {
        setCheckedExercises(prevChecked => {
            const updated = {
                ...prevChecked,
                [exerciseName]: !prevChecked[exerciseName]
            };
            saveSessionDraft(weights, updated, notes);
            return updated;
        });
    };

    const handleNoteChange = (exerciseName, value) => {
        setNotes(prevNotes => {
            const updated = {
                ...prevNotes,
                [exerciseName]: value
            };
            saveSessionDraft(weights, checkedExercises, updated);
            return updated;
        });
    };

    const handleSaveSession = async () => {
        setSaving(true);

        const sessionResults = {};
        template.exercises.forEach(ex => {
            sessionResults[ex.name] = {
                weight: Number(weights[ex.name]) || 0,
                target: ex.target,
                note: notes[ex.name] || ''
            };
        });

        try {
            await addDoc(collection(db, 'workout_sessions'), {
                templateId: workoutId,
                templateName: template.name,
                completedAt: serverTimestamp(),
                results: sessionResults
            });

            const userProfileRef = doc(db, 'user_profile', USER_PROFILE_ID);
            await setDoc(
                userProfileRef,
                { lastWorkoutId: workoutId },
                { merge: true }
            );

            const draftKey = `session-${workoutId}`;
            localStorage.removeItem(draftKey);

            alert('Treino salvo com sucesso!');
            onBack();
        } catch (error) {
            console.error('Erro ao salvar sessão: ', error);
            alert('Erro ao salvar treino.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Carregando sessão de treino...</p>;
    }

    if (!template) {
        return (
            <p>
                Treino não encontrado.{' '}
                <button onClick={onBack}>Voltar</button>
            </p>
        );
    }

    return (
        <div className="workout-session">
            <button onClick={onBack} className="btn-back">
                {'< Voltar'}
            </button>
            <h2>{template.name}</h2>

            <div className="session-exercises">
                {template.exercises.map((ex, index) => (
                    <div
                        key={index}
                        className={`session-exercise-item ${
                            checkedExercises[ex.name] ? 'completed' : ''
                        }`}
                    >
                        <div className="exercise-checkbox">
                            <input
                                type="checkbox"
                                id={`check-${index}`}
                                checked={!!checkedExercises[ex.name]}
                                onChange={() => handleCheckToggle(ex.name)}
                            />
                            <label htmlFor={`check-${index}`}></label>
                        </div>

                        <div className="exercise-info">
                            <span className="exercise-group">{ex.group}</span>
                            <span className="exercise-name">{ex.name}</span>
                            <span className="exercise-target">
                                Série: {ex.target} ({ex.method})
                            </span>
                        </div>

                        <div className="exercise-input">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="Peso (kg)"
                                    className="exercise-weight-input"
                                    value={weights[ex.name] || ''}
                                    onChange={e =>
                                        handleWeightChange(
                                            ex.name,
                                            e.target.value
                                        )
                                    }
                                />
                                <span>kg</span>
                            </div>

                            <input
                                type="text"
                                placeholder="Observações"
                                className="exercise-note-input"
                                value={notes[ex.name] || ''}
                                onChange={e =>
                                    handleNoteChange(ex.name, e.target.value)
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSaveSession}
                disabled={saving}
                className="btn-save-session"
            >
                {saving ? 'Salvando...' : 'Salvar Treino'}
            </button>
        </div>
    );
}

export default WorkoutSession;
