// src/firebaseConfig.js
/**
 * firebaseConfig.js
 * Inicialização e configuração dos serviços do Firebase (Firestore, Auth).
 * Exporta instâncias configuradas para uso em toda a aplicação.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
];

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    console.error(
        `%c[CRÍTICO] Variáveis de Ambiente Firebase Ausentes: ${missingKeys.join(', ')}`,
        'background: red; color: white; padding: 4px; font-weight: bold;'
    );
    console.error('Certifique-se de que estão definidas no seu arquivo .env (localmente) ou nas Configurações do Projeto Vercel (produção).');
    // Optional: throw an error to stop execution explicitly if you want to fail fast
    // throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Habilitar Persistência Offline
// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Falha na persistência: Múltiplas abas abertas');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistência não suportada pelo navegador');
    }
});

export const auth = getAuth(app);

// provider do Google pronto para uso
export const googleProvider = new GoogleAuthProvider();
