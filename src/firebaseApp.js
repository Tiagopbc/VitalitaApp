// src/firebaseApp.js
/**
 * Inicialização base do Firebase App.
 * Mantém a verificação de variáveis de ambiente separada de serviços específicos.
 */
import { initializeApp } from "firebase/app";

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
}

export const app = initializeApp(firebaseConfig);
