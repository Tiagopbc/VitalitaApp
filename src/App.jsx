// src/App.jsx
import React, { useState } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import HistoryPage from './HistoryPage';
import MethodsPage from './MethodsPage';
import './style.css';

function App() {
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        return localStorage.getItem('activeWorkoutId');
    });
    const [showHistory, setShowHistory] = useState(false);
    const [showMethods, setShowMethods] = useState(false);

    const handleSelectWorkout = (id) => {
        setShowHistory(false);
        setShowMethods(false);
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
    };

    const handleBackToHome = () => {
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
        setShowHistory(false);
        setShowMethods(false);
    };

    const handleOpenHistory = () => {
        setShowHistory(true);
        setShowMethods(false);
        setActiveWorkoutId(null);
    };

    const handleOpenMethods = () => {
        setShowMethods(true);
        setShowHistory(false);
        setActiveWorkoutId(null);
    };

    const handleCloseHistory = () => {
        setShowHistory(false);
    };

    const handleCloseMethods = () => {
        setShowMethods(false);
    };

    let content;

    if (showHistory) {
        content = <HistoryPage onBack={handleCloseHistory} />;
    } else if (showMethods) {
        content = <MethodsPage onBack={handleCloseMethods} />;
    } else if (!activeWorkoutId) {
        content = <HomePage onSelectWorkout={handleSelectWorkout} />;
    } else {
        content = (
            <WorkoutSession
                workoutId={activeWorkoutId}
                onBack={handleBackToHome}
            />
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Vitalità 🏋️‍♂️</h1>
                <p className="App-subtitle">
                    Seu diário inteligente de evolução nos treinos
                </p>
                <div className="header-actions">
                    <button
                        className="header-secondary-button"
                        onClick={handleOpenMethods}
                    >
                        Métodos de treino
                    </button>
                    <button
                        className="header-history-button"
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