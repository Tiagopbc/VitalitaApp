// src/HomePage.jsx
/**
 * HomePage.jsx
 * Página inicial legada.
 * Exibe lista de templates de treino e sugestão do próximo treino na sequência.
 */
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc,
} from 'firebase/firestore';

const WORKOUT_SEQUENCE = ['treino-1', 'treino-2', 'treino-3', 'treino-4', 'treino-5'];

function HomePage({ onSelectWorkout, user }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextWorkoutId, setNextWorkoutId] = useState(null);

    useEffect(() => {
        if (!user) {
            return;
        }

        async function fetchHomeData() {
            setLoading(true);
            try {
                const templatesRef = collection(db, 'workout_templates');
                const templatesQuery = query(templatesRef, orderBy('name'));
                const templatesSnap = await getDocs(templatesQuery);

                const list = templatesSnap.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                setTemplates(list);

                const profileId = user.uid;
                const userProfileRef = doc(db, 'user_profile', profileId);
                const userProfileSnap = await getDoc(userProfileRef);

                let lastWorkoutId = null;
                if (userProfileSnap.exists()) {
                    lastWorkoutId = userProfileSnap.data().lastWorkoutId || null;
                }

                if (!lastWorkoutId) {
                    setNextWorkoutId(WORKOUT_SEQUENCE[0]);
                } else {
                    const lastIndex = WORKOUT_SEQUENCE.indexOf(lastWorkoutId);
                    if (lastIndex === -1 || lastIndex === WORKOUT_SEQUENCE.length - 1) {
                        setNextWorkoutId(WORKOUT_SEQUENCE[0]);
                    } else {
                        setNextWorkoutId(WORKOUT_SEQUENCE[lastIndex + 1]);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados da Home', error);
            } finally {
                setLoading(false);
            }
        }

        fetchHomeData();
    }, [user]);

    if (loading) {
        return (
            <div className="homepage">
                <p>Carregando treinos...</p>
            </div>
        );
    }

    const nextWorkout = templates.find((t) => t.id === nextWorkoutId) || null;
    const otherWorkouts = templates.filter((t) => t.id !== nextWorkoutId);

    return (
        <div className="homepage">
            <h2>Treinos</h2>

            {nextWorkout && (
                <>
                    <h3>Próximo treino sugerido</h3>
                    <button
                        type="button"
                        className="template-button-next"
                        onClick={() => onSelectWorkout(nextWorkout.id)}
                    >
                        <span className="button-title">
                            {nextWorkout.name}
                        </span>
                    </button>

                    <hr />
                </>
            )}

            <h3>Outros treinos</h3>
            <div className="template-list-others">
                {otherWorkouts.map((template) => (
                    <button
                        key={template.id}
                        type="button"
                        className="template-button"
                        onClick={() => onSelectWorkout(template.id)}
                    >
                        {template.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default HomePage;