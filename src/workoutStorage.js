// src/workoutStorage.js

import { db } from './firebaseConfig';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
} from 'firebase/firestore';

// ID fixo por enquanto, depois você pode trocar por auth real
const USER_ID = 'tiago';

// SALVAR SESSÃO
export async function saveWorkoutSessionToFirestore(sessionData) {
    const payload = {
        ...sessionData,
        userId: USER_ID,
        createdAt: sessionData.createdAt || new Date().toISOString()
    };

    await addDoc(collection(db, 'workout_sessions'), payload);
}

// BUSCAR HISTÓRICO COMPLETO
export async function fetchWorkoutSessions() {
    const q = query(
        collection(db, 'workout_sessions'),
        where('userId', '==', USER_ID),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
}