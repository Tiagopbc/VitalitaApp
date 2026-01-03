// src/main.jsx
/**
 * main.jsx
 * Entry point of the React application.
 * Initializes the root element and wraps the App component with StrictMode and AuthProvider.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import './index.css';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
