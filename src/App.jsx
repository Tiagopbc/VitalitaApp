/**
 * App.jsx
 * Componente Principal da Aplicação.
 * Gerencia o roteamento do lado do cliente (via estado), layout global, integração da barra lateral/navegação inferior,
 * e estado de alto nível para treinos, histórico e validação de autenticação do usuário.
 */
import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HomeDashboard } from './pages/HomeDashboard';
import { BottomNavEnhanced } from './BottomNavEnhanced';
import { DesktopSidebar } from './DesktopSidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy Load Heavy Pages
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const MethodsPage = React.lazy(() => import('./pages/MethodsPage'));
const CreateWorkoutPage = React.lazy(() => import('./pages/CreateWorkoutPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const WorkoutsPage = React.lazy(() => import('./pages/WorkoutsPage'));
const WorkoutExecutionPage = React.lazy(() => import('./pages/WorkoutExecutionPage').then(module => ({ default: module.WorkoutExecutionPage })));
const TrainerDashboard = React.lazy(() => import('./pages/TrainerDashboard').then(module => ({ default: module.TrainerDashboard })));

import LoginPage from './pages/LoginPage'; // Keep generic login fast (or lazy load too if large)
import { userService } from './services/userService';
import { useAuth } from './AuthContext';
import { db } from './firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore'; // Clean up if specific import not needed
import './style.css';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';


import { ErrorBoundary } from './components/ErrorBoundary';

function getFirstNameFromDisplayName(displayName) {
    const parts = (displayName || '').trim().split(/\s+/).filter(Boolean);
    return parts[0] || '';
}

function App() {
    return (
        <ErrorBoundary>
            <AppContentWithProvider />
        </ErrorBoundary>
    );
}

function AppContentWithProvider() {
    return (
        <WorkoutProvider>
            <AppContent />
        </WorkoutProvider>
    );
}

function AppContent() {
    const { user, authLoading, logout } = useAuth();
    const { startWorkout, finishWorkout } = useWorkout(); // Use context
    const [isTrainer, setIsTrainer] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check Trainer Status
    useEffect(() => {
        if (!user) {
            setIsTrainer(false);
            return;
        }

        async function checkTrainerStatus() {
            try {
                const isTrainer = await userService.checkTrainerStatus(user.uid);
                setIsTrainer(isTrainer);
            } catch (err) {
                console.error("Error checking trainer status:", err);
            }
        }

        checkTrainerStatus();
    }, [user]);

    // --- REAL-TIME SYNC FOR ACTIVE WORKOUT MOVED TO CONTEXT ---

    // Handlers
    function handleLogout() {
        localStorage.removeItem('activeWorkoutId');
        clearWelcomeFlags();
        logout();
        navigate('/login');
    }

    // Welcome Modal Logic
    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [welcomeCanceled, setWelcomeCanceled] = useState(false);
    const [welcomeSeconds, setWelcomeSeconds] = useState(10);
    const welcomeBtnRef = useRef(null);

    const welcomeFirstName = useMemo(() => {
        const stored = localStorage.getItem('welcomeFirstName') || '';
        if (stored.trim()) return stored.trim();
        return getFirstNameFromDisplayName(user?.displayName || '');
    }, [user?.displayName]);

    function clearWelcomeFlags() {
        localStorage.removeItem('welcomePending');
        localStorage.removeItem('welcomeFirstName');
    }

    useEffect(() => {
        if (!user) {
            setWelcomeOpen(false);
            return;
        }
        const pending = localStorage.getItem('welcomePending') === '1';
        if (pending) {
            setWelcomeOpen(true);
            setWelcomeSeconds(10);
        }
    }, [user]);

    // ... (Welcome timer effects kept same/simplified)
    useEffect(() => {
        if (!welcomeOpen || welcomeCanceled) return;
        const id = window.setInterval(() => {
            setWelcomeSeconds((prev) => {
                if (prev <= 1) {
                    setWelcomeOpen(false);
                    clearWelcomeFlags();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(id);
    }, [welcomeOpen, welcomeCanceled]);


    function handleWelcomeGo() {
        setWelcomeOpen(false);
        clearWelcomeFlags();
    }
    function handleWelcomeCancel() { setWelcomeCanceled(true); }
    function handleWelcomeOverlayClick(e) { if (e.target === e.currentTarget) handleWelcomeGo(); }


    // Navigation Helpers
    function handleCreateWorkout(workoutToEdit = null, context = null) {
        navigate('/create', { state: { initialData: workoutToEdit, creationContext: context } });
    }

    function handleOpenHistory(templateName = null, exerciseName = null) {
        navigate('/history', { state: { initialTemplate: templateName, initialExercise: exerciseName } });
    }

    function handleTabChange(tabId) {
        if (tabId === 'home') navigate('/');
        if (tabId === 'workouts') navigate('/workouts');
        if (tabId === 'new') handleCreateWorkout();
        if (tabId === 'history') handleOpenHistory();
        if (tabId === 'profile') navigate('/profile');
        if (tabId === 'partners') navigate('/trainer');
    }

    function getActiveTab() {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/workouts')) return 'workouts';
        if (path.startsWith('/create')) return 'new';
        if (path.startsWith('/history')) return 'history';
        if (path.startsWith('/profile')) return 'profile';
        if (path.startsWith('/trainer')) return 'partners';
        return 'home';
    }

    if (authLoading) {
        return (
            <div className="app-shell">
                <div className="app-inner"><p>Carregando autenticação...</p></div>
            </div>
        );
    }

    // Header Logic
    const showHeader = location.pathname !== '/login' && location.pathname !== '/' && !location.pathname.startsWith('/execute');

    return (
        <div className="min-h-screen relative bg-transparent">
            {/* Background Layers */}
            <div className="fixed inset-0 bg-slate-950 z-[-2]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)] z-[-1]" />

            {/* Layout Components (Sidebar/BottomNav) */}
            {user && !location.pathname.startsWith('/execute') && location.pathname !== '/login' && (
                <>
                    <DesktopSidebar
                        activeTab={getActiveTab()}
                        onTabChange={handleTabChange}
                        user={user}
                        isTrainer={isTrainer}
                    />
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
                        <BottomNavEnhanced
                            activeTab={getActiveTab()}
                            onTabChange={handleTabChange}
                            isTrainer={isTrainer}
                        />
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className={`w-full min-h-screen transition-all duration-300 relative flex flex-col ${user && !location.pathname.startsWith('/execute') && location.pathname !== '/login'
                ? 'pt-[calc(2rem+env(safe-area-inset-top))] pb-32 lg:pb-8 lg:pt-8 lg:pl-64'
                : ''
                }`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
                    {showHeader && (
                        <header className="app-header mb-8">
                            <h1 className="app-logo-name text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Vitalità</h1>
                        </header>
                    )}

                    <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        </div>
                    }>
                        <Routes>
                            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <HomeDashboard
                                        onNavigateToMethods={() => navigate('/methods', { state: { from: 'home' } })}
                                        onNavigateToCreateWorkout={handleCreateWorkout}
                                        onNavigateToWorkout={startWorkout}
                                        onNavigateToHistory={handleOpenHistory}
                                        onNavigateToAchievements={() => navigate('/profile')}
                                        onNavigateToVolumeAnalysis={() => navigate('/profile')} // TODO: separate route
                                        onNavigateToMyWorkouts={() => navigate('/workouts')}
                                        user={user}
                                    />
                                </ProtectedRoute>
                            } />

                            <Route path="/workouts" element={
                                <ProtectedRoute>
                                    <WorkoutsPage
                                        onNavigateToCreate={handleCreateWorkout}
                                        onNavigateToWorkout={startWorkout}
                                        user={user}
                                    />
                                </ProtectedRoute>
                            } />

                            <Route path="/create" element={
                                <ProtectedRoute>
                                    <CreateWorkoutWrapper user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="/history" element={
                                <ProtectedRoute>
                                    <HistoryPageWrapper user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <ProfilePage
                                        user={user}
                                        onLogout={handleLogout}
                                        onNavigateToHistory={handleOpenHistory}
                                        onNavigateToVolumeAnalysis={() => navigate('/profile')}
                                        onNavigateToTrainer={() => navigate('/trainer')}
                                        isTrainer={isTrainer}
                                    />
                                </ProtectedRoute>
                            } />

                            <Route path="/methods" element={
                                <ProtectedRoute>
                                    <MethodsWrapper />
                                </ProtectedRoute>
                            } />

                            <Route path="/trainer" element={
                                <ProtectedRoute>
                                    <TrainerDashboard
                                        user={user}
                                        onBack={() => navigate('/profile')}
                                        onNavigateToCreateWorkout={handleCreateWorkout}
                                    />
                                </ProtectedRoute>
                            } />

                            <Route path="/execute/:workoutId" element={
                                <ProtectedRoute>
                                    <ExecutionWrapper user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>

            {/* Welcome Modal */}
            {welcomeOpen && (
                <div className="welcome-overlay" role="presentation" onMouseDown={handleWelcomeOverlayClick}>
                    <div className="welcome-modal" role="dialog">
                        <h3 className="welcome-title">Conta criada com sucesso</h3>
                        <p className="welcome-text">Bem-vindo ao VITALITÀ, {welcomeFirstName || 'bem-vindo'}.</p>
                        <button className="header-history-button" style={{ width: '100%' }} onClick={handleWelcomeGo}>Ir para o app</button>
                        <div className="welcome-footer">
                            {!welcomeCanceled && <span className="welcome-count">Redirecionando em {welcomeSeconds}s.</span>}
                            {!welcomeCanceled && <button className="welcome-cancel" onClick={handleWelcomeCancel}>Cancelar</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Wrappers to handle location state props
function CreateWorkoutWrapper({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { initialData, creationContext } = location.state || {};

    return (
        <CreateWorkoutPage
            onBack={() => navigate(-1)}
            user={user}
            initialData={initialData}
            creationContext={creationContext}
        />
    );
}

function HistoryPageWrapper({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { initialTemplate, initialExercise } = location.state || {};

    return (
        <HistoryPage
            onBack={() => navigate(-1)}
            initialTemplate={initialTemplate}
            initialExercise={initialExercise}
            user={user}
        />
    );
}

function MethodsWrapper() {
    const location = useLocation();
    const navigate = useNavigate();
    const { from, initialMethod } = location.state || {}; // from 'home' or 'workout'

    return (
        <MethodsPage
            onBack={() => navigate(-1)}
            initialMethod={initialMethod || ''}
        />
    );
}

import { useParams } from 'react-router-dom';
function ExecutionWrapper({ user }) {
    const { workoutId } = useParams();
    const navigate = useNavigate();

    return (
        <WorkoutExecutionPage
            workoutId={workoutId}
            user={user}
            onFinish={() => finishWorkout()}
        />
    );
}

export default App;