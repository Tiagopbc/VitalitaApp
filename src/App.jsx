/**
 * App.jsx
 * Componente Principal da Aplicação.
 * Gerencia o roteamento do lado do cliente (via estado), layout global, integração da barra lateral/navegação inferior,
 * e estado de alto nível para treinos, histórico e validação de autenticação do usuário.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HomeDashboard } from './HomeDashboard';
import { BottomNavEnhanced } from './BottomNavEnhanced';
import { DesktopSidebar } from './DesktopSidebar';

import HistoryPage from './HistoryPage';
import MethodsPage from './MethodsPage';
import LoginPage from './LoginPage';
import CreateWorkoutPage from './CreateWorkoutPage';
import ProfilePage from './ProfilePage';
import WorkoutsPage from './WorkoutsPage';
import { WorkoutExecutionPage } from './WorkoutExecutionPage';
import { useAuth } from './AuthContext';
import './style.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'white', background: '#111', height: '100vh', overflow: 'auto' }}>
                    <h1>Algo deu errado.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'cyan', color: 'black', fontWeight: 'bold' }}
                    >
                        Tentar Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

function getFirstNameFromDisplayName(displayName) {
    const parts = (displayName || '').trim().split(/\s+/).filter(Boolean);
    return parts[0] || '';
}

function App() {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}

function AppContent() {
    const { user, authLoading, logout } = useAuth();

    const [inWorkout, setInWorkout] = useState(false);

    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        return saved || null;
    });

    const [currentView, setCurrentView] = useState(() => {
        const saved = localStorage.getItem('activeWorkoutId');
        // If we want to restore session on reload, we could handle it here,
        // but for now let's default to home or check if we want persistent 'inWorkout'.
        // For the new page, let's keep it simple: defaults to home if refreshed (or handle persistence later).
        return 'home';
    });

    // ... (rest of state)

    function handleSelectWorkout(id) {
        setActiveWorkoutId(id);
        localStorage.setItem('activeWorkoutId', id);
        setInWorkout(true);
    }

    const [initialMethod, setInitialMethod] = useState('');
    const [methodsContext, setMethodsContext] = useState({ from: 'home' });

    const [historyTemplate, setHistoryTemplate] = useState(null);
    const [historyExercise, setHistoryExercise] = useState(null);

    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [welcomeCanceled, setWelcomeCanceled] = useState(false);
    const [welcomeSeconds, setWelcomeSeconds] = useState(10);

    const welcomeFirstName = useMemo(() => {
        const stored = localStorage.getItem('welcomeFirstName') || '';
        if (stored.trim()) return stored.trim();
        return getFirstNameFromDisplayName(user?.displayName || '');
    }, [user?.displayName]);

    const welcomeBtnRef = useRef(null);

    function clearWelcomeFlags() {
        localStorage.removeItem('welcomePending');
        localStorage.removeItem('welcomeFirstName');
    }

    useEffect(() => {
        if (!user) {
            setWelcomeOpen(false);
            setWelcomeCanceled(false);
            setWelcomeSeconds(10);
            return;
        }

        const pending = localStorage.getItem('welcomePending') === '1';
        if (!pending) return;

        setWelcomeOpen(true);
        setWelcomeCanceled(false);
        setWelcomeSeconds(10);
    }, [user]);

    useEffect(() => {
        if (!welcomeOpen) return;

        if (welcomeBtnRef.current) {
            welcomeBtnRef.current.focus();
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') {
                setWelcomeOpen(false);
                setWelcomeCanceled(false);
                setWelcomeSeconds(10);
                clearWelcomeFlags();
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [welcomeOpen]);

    useEffect(() => {
        if (!welcomeOpen) return;
        if (welcomeCanceled) return;

        const id = window.setInterval(() => {
            setWelcomeSeconds((prev) => {
                const next = prev - 1;
                return next < 0 ? 0 : next;
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [welcomeOpen, welcomeCanceled]);

    useEffect(() => {
        if (!welcomeOpen) return;
        if (welcomeCanceled) return;
        if (welcomeSeconds !== 0) return;

        setWelcomeOpen(false);
        setWelcomeCanceled(false);
        setWelcomeSeconds(10);
        clearWelcomeFlags();
    }, [welcomeOpen, welcomeCanceled, welcomeSeconds]);

    function handleBackToHome() {
        setCurrentView('home');
        setActiveWorkoutId(null);
        localStorage.removeItem('activeWorkoutId');
    }

    function openHistory(templateName = null, exerciseName = null) {
        setHistoryTemplate(templateName);
        setHistoryExercise(exerciseName);
        setCurrentView('history');
    }

    function handleOpenHistoryFromHeader() {
        openHistory(null, null);
    }

    function handleOpenHistoryFromWorkout(templateName, exerciseName) {
        openHistory(templateName, exerciseName);
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
            setInWorkout(true);
        } else {
            setCurrentView('home');
        }
    }

    function handleBackFromHistory() {
        if (activeWorkoutId) {
            setInWorkout(true);
        } else {
            setCurrentView('home');
        }
    }

    function handleLogout() {
        localStorage.removeItem('activeWorkoutId');
        setActiveWorkoutId(null);
        setCurrentView('home');
        clearWelcomeFlags();
        setWelcomeOpen(false);
        setWelcomeCanceled(false);
        setWelcomeSeconds(10);
        logout();
    }

    function handleWelcomeGo() {
        setWelcomeOpen(false);
        setWelcomeCanceled(false);
        setWelcomeSeconds(10);
        clearWelcomeFlags();
    }

    function handleWelcomeCancel() {
        setWelcomeCanceled(true);
    }

    function handleWelcomeOverlayClick(e) {
        if (e.target !== e.currentTarget) return;
        setWelcomeOpen(false);
        setWelcomeCanceled(false);
        setWelcomeSeconds(10);
        clearWelcomeFlags();
    }

    const [editingWorkout, setEditingWorkout] = useState(null);

    function handleCreateWorkout(workoutToEdit = null) {
        if (workoutToEdit?.id) {
            setEditingWorkout(workoutToEdit);
        } else {
            setEditingWorkout(null);
        }
        setCurrentView('create-workout');
    }

    function handleBackFromCreate() {
        setEditingWorkout(null);
        setCurrentView('home');
    }

    function getActiveTab() {
        if (currentView === 'home') return 'home';
        if (currentView === 'workouts') return 'workouts'; // Changed from 'methods' logic
        if (currentView === 'methods') return 'home'; // Methods is now a sub-view, technically part of home or workout or standalone
        if (currentView === 'create-workout') return 'new';
        if (currentView === 'history') return 'history';
        if (currentView === 'profile') return 'profile';
        if (currentView === 'workout') return 'workouts';
        return 'home';
    }

    function handleTabChange(tabId) {
        if (tabId === 'home') {
            handleBackToHome();
        }
        if (tabId === 'workouts') setCurrentView('workouts'); // Open Workouts Page
        if (tabId === 'new') handleCreateWorkout();
        if (tabId === 'history') handleOpenHistoryFromHeader();
        if (tabId === 'profile') setCurrentView('profile');
    }

    if (authLoading) {
        return (
            <div className="app-shell">
                <div className="app-inner">
                    <p>Carregando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    if (inWorkout) {
        return (
            <WorkoutExecutionPage
                workoutId={activeWorkoutId}
                user={user}
                onFinish={() => {
                    setInWorkout(false);
                    setActiveWorkoutId(null);
                    localStorage.removeItem('activeWorkoutId');
                }}
            />
        );
    }

    let content;

    if (currentView === 'create-workout') {
        content = (
            <CreateWorkoutPage
                onBack={handleBackFromCreate}
                user={user}
                initialData={editingWorkout}
            />
        );
    } else if (currentView === 'methods') {
        content = (
            <MethodsPage
                onBack={handleBackFromMethods}
                initialMethod={initialMethod}
            />
        );
    } else if (currentView === 'workouts') {
        content = (
            <WorkoutsPage
                onNavigateToCreate={handleCreateWorkout}
                onNavigateToWorkout={handleSelectWorkout}
                user={user}
            />
        );
    } else if (currentView === 'history') {
        content = (
            <HistoryPage
                onBack={handleBackFromHistory}
                initialTemplate={historyTemplate}
                initialExercise={historyExercise}
                user={user}
            />
        );
    } else if (currentView === 'profile') {
        content = (
            <ProfilePage
                user={user}
                onLogout={handleLogout}
            />
        );
    } else {
        content = (
            <HomeDashboard
                onNavigateToMethods={handleOpenMethodsFromHeader}
                onNavigateToCreateWorkout={handleCreateWorkout}
                onNavigateToWorkout={handleSelectWorkout}
                onNavigateToHistory={handleOpenHistoryFromHeader}
                onNavigateToAchievements={() => setCurrentView('achievements')}
                onNavigateToVolumeAnalysis={() => setCurrentView('volumeAnalysis')}
                onNavigateToMyWorkouts={() => handleTabChange('workouts')}
                user={user}
            />
        );
    }

    return (
        <div className="min-h-screen relative bg-transparent">
            {/* Background Layers that cover safe areas */}
            <div className="fixed inset-0 bg-slate-950 z-[-2]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)] z-[-1]" />

            {/* Desktop Sidebar */}
            <DesktopSidebar
                activeTab={getActiveTab()}
                onTabChange={handleTabChange}
                user={user}
            />

            {/* Main Content Area */}
            {/* Added lg:pl-64 to accommodate wider sidebar width */}
            <div className="app-shell pt-8 pb-32 lg:pb-8 lg:pt-8 lg:pl-64 transition-all duration-300">
                <div className="app-inner mx-auto">
                    {/* Only show simplified header if NOT on home (Home has its own greeting) */}
                    {currentView !== 'home' && (
                        <header className="app-header mb-8">
                            <h1 className="app-logo-name text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Vitalità</h1>
                        </header>
                    )}

                    <main>{content}</main>

                </div>
            </div>

            {/* Mobile Bottom Nav */}
            {currentView !== 'workout' && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
                    <BottomNavEnhanced
                        activeTab={getActiveTab()}
                        onTabChange={handleTabChange}
                    />
                </div>
            )}

            {welcomeOpen ? (
                <div
                    className="welcome-overlay"
                    role="presentation"
                    onMouseDown={handleWelcomeOverlayClick}
                >
                    <div
                        className="welcome-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="welcome-title"
                        aria-describedby="welcome-desc"
                    >
                        <h3 id="welcome-title" className="welcome-title">
                            Conta criada com sucesso
                        </h3>

                        <p id="welcome-desc" className="welcome-text">
                            Bem-vindo ao VITALITÀ, {welcomeFirstName || 'bem-vindo'}. Seu perfil foi criado e você já está logado.
                        </p>

                        <p className="welcome-mini">Seus dados foram salvos com segurança.</p>
                        <p className="welcome-mini">Você pode ajustar seu perfil a qualquer momento nas configurações.</p>

                        <button
                            ref={welcomeBtnRef}
                            type="button"
                            className="header-history-button"
                            style={{ width: '100%' }}
                            onClick={handleWelcomeGo}
                        >
                            Ir para o app
                        </button>

                        <div className="welcome-footer">
                            {!welcomeCanceled ? (
                                <span className="welcome-count">
                                    Redirecionando em {welcomeSeconds}s.
                                </span>
                            ) : (
                                <span className="welcome-count">
                                    Redirecionamento cancelado.
                                </span>
                            )}

                            {!welcomeCanceled ? (
                                <button
                                    type="button"
                                    className="welcome-cancel"
                                    onClick={handleWelcomeCancel}
                                >
                                    Cancelar
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default App;