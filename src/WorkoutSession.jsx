// src/WorkoutSession.jsx

import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, orderBy, limit, getDocs, setDoc } from 'firebase/firestore';

const USER_PROFILE_ID = 'Tiago';

function WorkoutSession({ workoutId, onBack }) {
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weights, setWeights] = useState({});
    const [saving, setSaving] = useState(false);
    const [checkedExercises, setCheckedExercises] = useState({});

    useEffect(() => {
        // ... (O useEffect permanece IDÊNTICO ao V4) ...
        const fetchWorkoutData = async () => {
            setLoading(true);

            const templateRef = doc(db, 'workout_templates', workoutId);
            const templateSnap = await getDoc(templateRef);

            if (templateSnap.exists()) {
                const templateData = templateSnap.data();
                setTemplate(templateData);

                const newWeights = {};
                const lastSessionQuery = query(
                    collection(db, 'workout_sessions'),
                    orderBy('completedAt', 'desc'),
                    limit(1)
                );
                const lastSessionSnap = await getDocs(lastSessionQuery);

                let lastSessionData = {};
                if (!lastSessionSnap.empty) {
                    lastSessionData = lastSessionSnap.docs[0].data().results;
                }

                const newChecked = {};
                templateData.exercises.forEach(ex => {
                    newWeights[ex.name] = lastSessionData[ex.name]?.weight || '';
                    newChecked[ex.name] = false;
                });

                setWeights(newWeights);
                setCheckedExercises(newChecked);

            } else {
                console.error("Template não encontrado!");
            }
            setLoading(false);
        };

        fetchWorkoutData();
    }, [workoutId]);

    const handleWeightChange = (exerciseName, weight) => {
        // ... (Esta função permanece IDÊNTICA) ...
        setWeights(prevWeights => ({
            ...prevWeights,
            [exerciseName]: weight
        }));
    };

    const handleCheckToggle = (exerciseName) => {
        // ... (Esta função permanece IDÊNTICA) ...
        setCheckedExercises(prevChecked => ({
            ...prevChecked,
            [exerciseName]: !prevChecked[exerciseName]
        }));
    };

    const handleSaveSession = async () => {
        // ... (Esta função permanece IDÊNTICA) ...
        setSaving(true);

        const sessionResults = {};
        template.exercises.forEach(ex => {
            sessionResults[ex.name] = {
                weight: Number(weights[ex.name]) || 0,
                target: ex.target
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
            await setDoc(userProfileRef, {
                lastWorkoutId: workoutId
            }, { merge: true });

            alert('Treino salvo com sucesso!');
            onBack();

        } catch (error) {
            console.error("Erro ao salvar sessão: ", error);
            alert('Erro ao salvar treino.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Carregando sessão de treino...</p>;
    }

    if (!template) {
        return <p>Treino não encontrado. <button onClick={onBack}>Voltar</button></p>;
    }

    return (
        <div className="workout-session">
            <button onClick={onBack} className="btn-back">{"< Voltar"}</button>
            <h2>{template.name}</h2>

            <div className="session-exercises">
                {template.exercises.map((ex, index) => (
                    <div
                        key={index}
                        className={`session-exercise-item ${checkedExercises[ex.name] ? 'completed' : ''}`}
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

                        {/* A MUDANÇA ESTÁ AQUI DENTRO */}
                        <div className="exercise-info">
                            {/* NOVO: Exibe o grupo muscular */}
                            <span className="exercise-group">{ex.group}</span>

                            <span className="exercise-name">{ex.name}</span>
                            <span className="exercise-target">Série: {ex.target} ({ex.method})</span>
                        </div>
                        {/* FIM DA MUDANÇA */}

                        <div className="exercise-input">
                            <input
                                type="number"
                                inputmode="decimal"
                                placeholder="Peso (kg)"
                                value={weights[ex.name] || ''}
                                onChange={(e) => handleWeightChange(ex.name, e.target.value)}
                            />
                            <span>kg</span>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleSaveSession} disabled={saving} className="btn-save-session">
                {saving ? 'Salvando...' : 'Salvar Treino'}
            </button>
        </div>
    );
}

export default WorkoutSession;