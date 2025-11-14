import React, { useState, useEffect } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import HistoryPage from './HistoryPage';
import './style.css';

function App() {
    const [activeWorkoutId, setActiveWorkoutId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const savedWorkoutId = localStorage.getItem('activeWorkoutId');
        if (savedWorkoutId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveWorkoutId(savedWorkoutId);
        }
    }, []);

    const handleSelectWorkout = (id) => {
        setShowHistory(false);
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
    };

    const handleBackToHome = () => {
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
        setShowHistory(false);
    };

    const handleOpenHistory = () => {
        setShowHistory(true);
    };

    const handleCloseHistory = () => {
        setShowHistory(false);
    };

    let content;

    if (showHistory) {
        content = <HistoryPage onBack={handleCloseHistory} />;
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
