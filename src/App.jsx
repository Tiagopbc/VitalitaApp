// src/App.jsx

import React, { useState } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import HistoryPage from './HistoryPage';
import MethodsPage from './MethodsPage';
import './style.css';

function App() {
    const [activePage, setActivePage] = useState('home'); // 'home' | 'session' | 'history' | 'methods'
    const [activeWorkoutId, setActiveWorkoutId] = useState(null);
    const [focusedMethod, setFocusedMethod] = useState('');

    const handleSelectWorkout = (id) => {
        setActiveWorkoutId(id);
        setActivePage('session');
    };

    const handleBackToHome = () => {
        setActiveWorkoutId(null);
        setActivePage('home');
    };

    const handleOpenHistory = () => {
        setActivePage('history');
    };

    const handleCloseHistory = () => {
        setActivePage('home');
    };

    const handleOpenMethods = (methodName = '') => {
        setFocusedMethod(methodName);
        setActivePage('methods');
    };

    const handleCloseMethods = () => {
        setFocusedMethod('');
        setActivePage('home');
    };

    let content;

    if (activePage === 'history') {
        content = <HistoryPage onBack={handleCloseHistory} />;
    } else if (activePage === 'methods') {
        content = (
            <MethodsPage
                onBack={handleCloseMethods}
                initialMethod={focusedMethod}
            />
        );
    } else if (activePage === 'session' && activeWorkoutId) {
        content = (
            <WorkoutSession
                workoutId={activeWorkoutId}
                onBack={handleBackToHome}
                onOpenMethod={handleOpenMethods}
            />
        );
    } else {
        content = <HomePage onSelectWorkout={handleSelectWorkout} />;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Vitalità</h1>
                <p className="App-subtitle">
                    Seu diário inteligente de treinos
                </p>

                <div className="header-actions">
                    <button
                        className="header-secondary-button"
                        type="button"
                        onClick={() => handleOpenMethods()}
                    >
                        Métodos de treino
                    </button>

                    <button
                        className="header-history-button"
                        type="button"
                        onClick={handleOpenHistory}
                    >
                        Ver históricos
                    </button>
                </div>
            </header>

            <main>{content}</main>
        </div>
    );
}

export default App;