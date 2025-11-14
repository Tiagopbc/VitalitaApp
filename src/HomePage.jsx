// src/HomePage.jsx


import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

// A NOVA SEQUÊNCIA DE TREINOS
const WORKOUT_SEQUENCE = ['treino-1', 'treino-2', 'treino-3', 'treino-4', 'treino-5'];
// O SEU PERFIL
const USER_PROFILE_ID = 'Tiago';

function HomePage({ onSelectWorkout }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextWorkoutId, setNextWorkoutId] = useState(null);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                // 1. Busca os templates de treino (como antes)
                const templatesRef = collection(db, 'workout_templates');
                const q = query(templatesRef, orderBy('id'));
                const querySnapshot = await getDocs(q);

                const loadedTemplates = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTemplates(loadedTemplates);

                // 2. Busca o perfil do usuário para saber qual foi o último treino
                const userProfileRef = doc(db, 'user_profile', USER_PROFILE_ID);
                const userProfileSnap = await getDoc(userProfileRef);

                let lastWorkoutId = null;
                if (userProfileSnap.exists()) {
                    lastWorkoutId = userProfileSnap.data().lastWorkoutId;
                }

                // 3. Calcula o próximo treino
                if (!lastWorkoutId) {
                    // Se nunca treinou, o próximo é o primeiro
                    setNextWorkoutId(WORKOUT_SEQUENCE[0]);
                } else {
                    const lastIndex = WORKOUT_SEQUENCE.indexOf(lastWorkoutId);
                    if (lastIndex === -1 || lastIndex === WORKOUT_SEQUENCE.length - 1) {
                        // Se foi o último da lista (ou não achou), volta pro primeiro
                        setNextWorkoutId(WORKOUT_SEQUENCE[0]);
                    } else {
                        // Senão, pega o próximo
                        setNextWorkoutId(WORKOUT_SEQUENCE[lastIndex + 1]);
                    }
                }

            } catch (error) {
                console.error("Erro ao buscar dados: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) {
        return <p>Carregando seu progresso...</p>;
    }

    // Acha o objeto completo do próximo treino
    const nextWorkout = templates.find(t => t.id === nextWorkoutId);
    // Pega os outros treinos
    const otherWorkouts = templates.filter(t => t.id !== nextWorkoutId);

    return (
        <div className="homepage">
            {nextWorkout && (
                <>
                    <h2>Seu próximo treino:</h2>
                    <button
                        className="template-button-next"
                        onClick={() => onSelectWorkout(nextWorkout.id)}
                    >
                        <span className="button-title">🔥 {nextWorkout.name}</span>
                        <span className="button-subtitle">Clique para iniciar</span>
                    </button>
                </>
            )}

            <hr />

            <h2>Outros treinos:</h2>
            <div className="template-list-others">
                {otherWorkouts.map(template => (
                    <button
                        key={template.id}
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