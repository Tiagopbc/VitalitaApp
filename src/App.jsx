// src/App.jsx

import React, { useState } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import HistoryPage from './HistoryPage';
import MethodsPage from './MethodsPage';
import './style.css';

// por enquanto, um usuário fixo
const USER_PROFILE_ID = 'Tiago';

const MOCK_USER = {
    uid: USER_PROFILE_ID,
    email: 'tiago@local'
};

function App() {
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        return saved || null;
    });

    const [currentView, setCurrentView] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        return saved ? 'workout' : 'home';
    });

    const [initialMethod, setInitialMethod] = useState('');
    const [methodsContext, setMethodsContext] = useState({ from: 'home' });

    function handleSelectWorkout(id) {
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
        setCurrentView('workout');
    }

    function handleBackToHome() {
        setCurrentView('home');
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
    }

    function handleOpenHistory() {
        setCurrentView('history');
    }

    function handleOpenMethodsFromHeader() {
        setMethodsContext({ from: 'home' });
        setInitialMethod('');
        setCurrentView('methods');
    }

    function handleOpenMethodsFromWorkout(methodName) {
        setMethodsContext({ from: 'workout' });
        setInitialMethod(methodName || '');
        setCurrentView('methods');
    }

    function handleBackFromMethods() {
        if (methodsContext.from === 'workout' && activeWorkoutId) {
            setCurrentView('workout');
        } else {
            setCurrentView('home');
        }
    }

    function handleBackFromHistory() {
        if (activeWorkoutId) {
            setCurrentView('workout');
        } else {
            setCurrentView('home');
        }
    }

    let content;

    if (currentView === 'methods') {
        content = (
            <MethodsPage
                onBack={handleBackFromMethods}
                initialMethod={initialMethod}
            />
        );
    } else if (currentView === 'history') {
        content = (
            <HistoryPage
                onBack={handleBackFromHistory}
                user={MOCK_USER}
            />
        );
    } else if (currentView === 'workout' && activeWorkoutId) {
        content = (
            <WorkoutSession
                workoutId={activeWorkoutId}
                onBack={handleBackToHome}
                onOpenMethod={handleOpenMethodsFromWorkout}
                user={MOCK_USER}
            />
        );
    } else {
        content = (
            <HomePage
                onSelectWorkout={handleSelectWorkout}
                user={MOCK_USER}
            />
        );
    }

    return (
        <div className="app-shell">
            <div className="app-inner">
                <header className="app-header">
                    <div className="app-logo-name">Vitalità</div>
                    <p className="app-header-subtitle">
                        Seu diário inteligente de treinos
                    </p>

                    <div className="header-actions">
                        <button
                            type="button"
                            className="header-secondary-button"
                            onClick={handleOpenMethodsFromHeader}
                        >
                            Métodos de treino
                        </button>

                        <button
                            type="button"
                            className="header-history-button"
                            onClick={handleOpenHistory}
                        >
                            Ver históricos
                        </button>
                    </div>
                </header>

                <main>{content}</main>
            </div>
        </div>
    );
}

export default App;