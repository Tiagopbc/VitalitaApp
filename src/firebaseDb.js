// src/firebaseDb.js
/**
 * Inicialização isolada do Firestore + persistência offline.
 * Carregado sob demanda para reduzir JS inicial.
 */
import { app } from "./firebaseApp";

let firestorePromise;
let dbPromise;

export function loadFirestore() {
    if (!firestorePromise) {
        firestorePromise = import('firebase/firestore');
    }
    return firestorePromise;
}

export async function getDb() {
    if (!dbPromise) {
        dbPromise = (async () => {
            const firestore = await loadFirestore();
            const {
                getFirestore,
                initializeFirestore,
                persistentLocalCache,
                persistentMultipleTabManager
            } = firestore;

            if (typeof initializeFirestore !== 'function' || typeof persistentLocalCache !== 'function') {
                return getFirestore(app);
            }

            try {
                const localCache =
                    typeof persistentMultipleTabManager === 'function'
                        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
                        : persistentLocalCache();

                return initializeFirestore(app, { localCache });
            } catch (err) {
                if (err?.code === 'unimplemented') {
                    console.warn('Persistência não suportada pelo navegador, usando cache em memória.');
                } else if (err?.code === 'failed-precondition') {
                    console.warn('Falha na persistência local do Firestore; usando cache em memória.');
                } else {
                    console.warn('Falha ao configurar cache persistente do Firestore; usando cache em memória.', err);
                }
                return getFirestore(app);
            }
        })();
    }
    return dbPromise;
}

export async function getFirestoreDeps() {
    const [db, firestore] = await Promise.all([getDb(), loadFirestore()]);
    return { db, ...firestore };
}
