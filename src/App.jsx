// src/App.jsx

import React, { useState } from 'react';
import HomePage from './HomePage';
import WorkoutSession from './WorkoutSession';
import './style.css';

function App() {
    const [activeWorkoutId, setActiveWorkoutId] = useState(null);

    const handleBackToHome = () => {
        setActiveWorkoutId(null);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Meu Diário de Treino 🏋️</h1>
            </header>
            <main>
                {
                    !activeWorkoutId ? (
                        <HomePage onSelectWorkout={setActiveWorkoutId} />
                    ) : (
                        <WorkoutSession
                            workoutId={activeWorkoutId}
                            onBack={handleBackToHome}
                        />
                    )
                }
            </main>
        </div>
    );
}

export default App;