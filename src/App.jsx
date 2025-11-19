// src/App.jsx
import React, { useState } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import HistoryPage from './HistoryPage';
import MethodsPage from './MethodsPage';
import './style.css';

// usuário fictício enquanto a autenticação não está ligada
const MOCK_USER = { uid: 'Tiago' };

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

    // estado para histórico
    const [historyTemplate, setHistoryTemplate] = useState(null);
    const [historyExercise, setHistoryExercise] = useState(null);

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

    // abre histórico, com ou sem exercício específico
    function openHistory(templateName = null, exerciseName = null) {
        setHistoryTemplate(templateName);
        setHistoryExercise(exerciseName);
        setCurrentView('history');
    }

    // botão do cabeçalho
    function handleOpenHistoryFromHeader() {
        openHistory(null, null);
    }

    // chamado a partir do treino
    function handleOpenHistoryFromWorkout(templateName, exerciseName) {
        openHistory(templateName, exerciseName);
    }

    // abrir métodos pelo cabeçalho
    function handleOpenMethodsFromHeader() {
        setMethodsContext({ from: 'home' });
        setInitialMethod('');
        setCurrentView('methods');
    }

    // abrir métodos a partir de um exercício do treino
    function handleOpenMethodsFromWorkout(methodName) {
        setMethodsContext({ from: 'workout' });
        setInitialMethod(methodName || '');
        setCurrentView('methods');
    }

    // voltar da tela de métodos
    function handleBackFromMethods() {
        if (methodsContext.from === 'workout' && activeWorkoutId) {
            setCurrentView('workout');
        } else {
            setCurrentView('home');
        }
    }

    // voltar da tela de histórico
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
                initialTemplate={historyTemplate}
                initialExercise={historyExercise}
            />
        );
    } else if (currentView === 'workout' && activeWorkoutId) {
        content = (
            <WorkoutSession
                workoutId={activeWorkoutId}
                onBack={handleBackToHome}
                onOpenMethod={handleOpenMethodsFromWorkout}
                onOpenHistory={handleOpenHistoryFromWorkout}
                user={MOCK_USER}
            />
        );
    } else {
        content = (
            <HomePage
                onSelectWorkout={handleSelectWorkout}
            />
        );
    }

    return (
        <div className="App">
            <header className="app-header">
                <h1>Vitalità</h1>
                <p className="app-subtitle">
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
                        onClick={handleOpenHistoryFromHeader}
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