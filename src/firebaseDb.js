// src/firebaseDb.js
/**
 * Inicialização isolada do Firestore + persistência offline.
 */
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { app } from "./firebaseApp";

export const db = getFirestore(app);

// Habilitar Persistência Offline
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Falha na persistência: Múltiplas abas abertas');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistência não suportada pelo navegador');
    }
});
