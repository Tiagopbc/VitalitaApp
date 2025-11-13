// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIddnotO2FO3R44RiwuN_gAsrqO37GX4M",
    authDomain: "app-treino-17bbf.firebaseapp.com",
    projectId: "app-treino-17bbf",
    storageBucket: "app-treino-17bbf.firebasestorage.app",
    messagingSenderId: "674294174962",
    appId: "1:674294174962:web:f244a6931163815f84ec6b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta o banco de dados (Firestore) para ser usado em outros arquivos
export const db = getFirestore(app);