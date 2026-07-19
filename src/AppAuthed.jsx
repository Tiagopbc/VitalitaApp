/**
 * AppAuthed.jsx
 * Árvore principal do app após autenticação.
 */
import React, { useEffect, useMemo, useState, Suspense, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { MotionPreferences } from './components/common/MotionPreferences';
import { safeGetItem, safeRemoveItem, safeGetJSON, safeSetJSON } from './utils/storage';

// Carregamento Lazy de Páginas
const loadHomeDashboard = () => import('./pages/HomeDashboard').then(module => ({ default: module.HomeDashboard }));
const loadHistoryPage = () => import('./pages/HistoryPage');
const loadMethodsPage = () => import('./pages/MethodsPage');
const loadCreateWorkoutPage = () => import('./pages/CreateWorkoutPage');
const loadProfilePage = () => import('./pages/ProfilePage');
const loadWorkoutsPage = () => import('./pages/WorkoutsPage');
const loadWorkoutExecutionPage = () => import('./pages/WorkoutExecutionPage').then(module => ({ default: module.WorkoutExecutionPage }));
const loadTrainerDashboard = () => import('./pages/TrainerDashboard').then(module => ({ default: module.TrainerDashboard }));
const loadPrivacyPolicyPage = () => import('./pages/PrivacyPolicyPage');
const loadTermsOfUsePage = () => import('./pages/TermsOfUsePage');
const loadBottomNavEnhanced = () => import('./BottomNavEnhanced').then(module => ({ default: module.BottomNavEnhanced }));
const loadSonnerToaster = () => import('sonner').then(module => ({ default: module.Toaster }));
const loadPwaUpdatePrompt = () => import('./components/PwaUpdatePrompt').then(module => ({ default: module.PwaUpdatePrompt }));

const HomeDashboard = React.lazy(loadHomeDashboard);
const HistoryPage = React.lazy(loadHistoryPage);
const MethodsPage = React.lazy(loadMethodsPage);
const CreateWorkoutPage = React.lazy(loadCreateWorkoutPage);
const ProfilePage = React.lazy(loadProfilePage);
const WorkoutsPage = React.lazy(loadWorkoutsPage);
const WorkoutExecutionPage = React.lazy(loadWorkoutExecutionPage);
const TrainerDashboard = React.lazy(loadTrainerDashboard);
const PrivacyPolicyPage = React.lazy(loadPrivacyPolicyPage);
const TermsOfUsePage = React.lazy(loadTermsOfUsePage);
const BottomNavEnhanced = React.lazy(loadBottomNavEnhanced);
const SonnerToaster = React.lazy(loadSonnerToaster);
const PwaUpdatePrompt = React.lazy(loadPwaUpdatePrompt);

const NAV_TRANSITIONS_STORAGE_KEY = 'vitalita_nav_transitions_v1';

const routePreloadersByTab = {
    home: loadHomeDashboard,
    workouts: loadWorkoutsPage,
    new: loadCreateWorkoutPage,
    history: loadHistoryPage,
    profile: loadProfilePage,
    partners: loadTrainerDashboard
};

const fallbackTabPredictions = {
    home: ['workouts', 'new', 'history', 'profile'],
    workouts: ['new', 'home', 'history', 'profile'],
    new: ['workouts', 'home', 'history', 'profile'],
    history: ['home', 'workouts', 'profile', 'new'],
    profile: ['home', 'history', 'workouts', 'partners'],
    partners: ['profile', 'home', 'workouts'],
    default: ['home', 'workouts', 'history', 'profile']
};

function readNavTransitions() {
    const parsed = safeGetJSON(NAV_TRANSITIONS_STORAGE_KEY);
    return parsed && typeof parsed === 'object' ? parsed : {};
}

function writeNavTransitions(value) {
    safeSetJSON(NAV_TRANSITIONS_STORAGE_KEY, value);
}

function trackTabTransition(fromTab, toTab) {
    if (!fromTab || !toTab || fromTab === toTab) return;

    const transitions = readNavTransitions();
    const fromMap = transitions[fromTab] && typeof transitions[fromTab] === 'object'
        ? transitions[fromTab]
        : {};

    fromMap[toTab] = (Number(fromMap[toTab]) || 0) + 1;
    transitions[fromTab] = fromMap;
    writeNavTransitions(transitions);
}

function predictLikelyNextTab(currentTab, isTrainer) {
    const transitions = readNavTransitions();
    const fallbackOrder = fallbackTabPredictions[currentTab] || fallbackTabPredictions.default;
    const candidates = fallbackOrder.filter((tab) => tab !== currentTab && (isTrainer || tab !== 'partners'));

    const transitionMap = transitions[currentTab] && typeof transitions[currentTab] === 'object'
        ? transitions[currentTab]
        : {};

    let bestTab = null;
    let bestScore = -1;
    candidates.forEach((candidate) => {
        const score = Number(transitionMap[candidate]) || 0;
        if (score > bestScore) {
            bestTab = candidate;
            bestScore = score;
        }
    });

    if (bestTab && bestScore > 0) {
        return bestTab;
    }

    return candidates[0] || null;
}

function getFirstNameFromDisplayName(displayName) {
    const parts = (displayName || '').trim().split(/\s+/).filter(Boolean);
    return parts[0] || '';
}

function AppAuthedContent() {
    const { user, authLoading, logout } = useAuth();
    const { startWorkout } = useWorkout();
    const [isTrainer, setIsTrainer] = useState(false);
    const [shouldRenderToaster, setShouldRenderToaster] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const userId = user?.uid;

    // Verificar Status de Treinador
    useEffect(() => {
        if (!userId) {
            setIsTrainer(false);
            return;
        }

        async function checkTrainerStatus() {
            try {
                const { userService } = await import('./services/userService');
                const isTrainer = await userService.checkTrainerStatus(userId);
                setIsTrainer(isTrainer);
            } catch (err) {
                console.error("Error checking trainer status:", err);
            }
        }

        checkTrainerStatus();
    }, [userId]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const scheduleToaster = () => setShouldRenderToaster(true);

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(scheduleToaster, { timeout: 1500 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(scheduleToaster, 700);
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (!userId || typeof window === 'undefined' || typeof navigator === 'undefined') return undefined;

        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const saveData = Boolean(connection?.saveData);
        const slowNetwork = typeof connection?.effectiveType === 'string' && /(slow-2g|2g)/i.test(connection.effectiveType);
        if (saveData || slowNetwork) return undefined;

        const currentTab = location.pathname === '/'
            ? 'home'
            : location.pathname.startsWith('/workouts')
                ? 'workouts'
                : location.pathname.startsWith('/create')
                    ? 'new'
                    : location.pathname.startsWith('/history')
                        ? 'history'
                        : location.pathname.startsWith('/profile')
                            ? 'profile'
                            : location.pathname.startsWith('/trainer')
                                ? 'partners'
                                : 'home';
        const predictedTab = predictLikelyNextTab(currentTab, isTrainer);
        const preload = predictedTab ? routePreloadersByTab[predictedTab] : null;
        if (!preload) return undefined;

        let cancelled = false;
        const warmup = () => {
            if (cancelled) return;
            preload().catch(() => undefined);
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(warmup, { timeout: 1800 });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(warmup, 900);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [userId, location.pathname, isTrainer]);

    // Manipuladores
    async function handleLogout() {
        try {
            await logout();
            clearWelcomeFlags();
            setIsTrainer(false);
            setWelcomeOpen(false);
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }

    // Lógica do Modal de Boas-vindas
    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [welcomeCanceled, setWelcomeCanceled] = useState(false);
    const [welcomeSeconds, setWelcomeSeconds] = useState(10);

    const welcomeFirstName = useMemo(() => {
        const stored = safeGetItem('welcomeFirstName') || '';
        if (stored.trim()) return stored.trim();
        return getFirstNameFromDisplayName(user?.displayName || '');
    }, [user?.displayName]);

    const clearWelcomeFlags = useCallback(() => {
        safeRemoveItem('welcomePending');
        safeRemoveItem('welcomeFirstName');
    }, []);

    useEffect(() => {
        if (!user) {
            if (welcomeOpen) setWelcomeOpen(false);
            return;
        }
        const pending = safeGetItem('welcomePending') === '1';
        if (pending) {
            setTimeout(() => {
                setWelcomeOpen(true);
                setWelcomeSeconds(10);
            }, 0);
        }
    }, [user, welcomeOpen]);

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
    }, [clearWelcomeFlags, welcomeOpen, welcomeCanceled]);

    function handleWelcomeGo() {
        setWelcomeOpen(false);
        clearWelcomeFlags();
    }
    function handleWelcomeCancel() { setWelcomeCanceled(true); }
    function handleWelcomeOverlayClick(e) { if (e.target === e.currentTarget) handleWelcomeGo(); }

    // Auxiliares de Navegação
    function handleCreateWorkout(workoutToEdit = null, context = null) {
        if (workoutToEdit?.id) {
            navigate(`/create?editId=${workoutToEdit.id}`, { state: { initialData: workoutToEdit, creationContext: context } });
        } else {
            navigate('/create', { state: { initialData: workoutToEdit, creationContext: context } });
        }
    }

    function handleOpenHistory(templateName = null, exerciseName = null) {
        let url = '/history';
        const params = new URLSearchParams();
        if (templateName) params.set('template', templateName);
        if (exerciseName) params.set('exercise', exerciseName);
        const search = params.toString();
        if (search) url += `?${search}`;
        navigate(url);
    }

    function handleTabChange(tabId) {
        const currentTab = getActiveTab();
        trackTabTransition(currentTab, tabId);
        routePreloadersByTab[tabId]?.().catch(() => undefined);

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

    const showHeader = location.pathname !== '/login' && location.pathname !== '/' && !location.pathname.startsWith('/execute');

    return (
        <div className="min-h-screen relative bg-transparent">
            {user && !location.pathname.startsWith('/execute') && location.pathname !== '/login' && (
                <>
                    <DesktopSidebar
                        activeTab={getActiveTab()}
                        onTabChange={handleTabChange}
                        user={user}
                        isTrainer={isTrainer}
                    />
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-center">
                        <Suspense fallback={
                            <div className="h-16 w-full max-w-md rounded-2xl bg-slate-900/50 border border-slate-800/50" />
                        }>
                            <BottomNavEnhanced
                                activeTab={getActiveTab()}
                                onTabChange={handleTabChange}
                                isTrainer={isTrainer}
                            />
                        </Suspense>
                    </div>
                </>
            )}

            <div className={`w-full min-h-screen transition-all duration-300 relative flex flex-col ${user && !location.pathname.startsWith('/execute') && location.pathname !== '/login'
                ? 'pt-[calc(1rem+env(safe-area-inset-top))] pb-24 lg:pb-8 lg:pt-8 lg:pl-64'
                : ''
                }`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
                    {showHeader && (
                        <header className="sr-only">
                            <h1>Vitalità</h1>
                        </header>
                    )}

                    <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        </div>
                    }>
                        <Routes>
                            <Route path="/login" element={!user ? <Navigate to="/login" /> : <Navigate to="/" />} />
                            <Route path="/privacy" element={<PrivacyPolicyPage />} />
                            <Route path="/terms" element={<TermsOfUsePage />} />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <HomeDashboard
                                        onNavigateToMethods={() => navigate('/methods')}
                                        onNavigateToCreateWorkout={handleCreateWorkout}
                                        onNavigateToWorkout={startWorkout}
                                        onNavigateToHistory={handleOpenHistory}
                                        onNavigateToAchievements={() => navigate('/profile')}
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
                                    <CreateWorkoutPage user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="/history" element={
                                <ProtectedRoute>
                                    <HistoryPage user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <ProfilePage
                                        user={user}
                                        onLogout={handleLogout}
                                        onNavigateToHistory={handleOpenHistory}
                                        onNavigateToTrainer={() => navigate('/trainer')}
                                        isTrainer={isTrainer}
                                    />
                                </ProtectedRoute>
                            } />

                            <Route path="/methods" element={
                                <ProtectedRoute>
                                    <MethodsPage />
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
                                    <WorkoutExecutionPage user={user} />
                                </ProtectedRoute>
                            } />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>

            {shouldRenderToaster && (
                <Suspense fallback={null}>
                    <SonnerToaster richColors position="top-center" />
                </Suspense>
            )}

            {user && (
                <Suspense fallback={null}>
                    <PwaUpdatePrompt />
                </Suspense>
            )}

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

export default function AppAuthed() {
    return (
        <MotionPreferences>
            <WorkoutProvider>
                <AppAuthedContent />
            </WorkoutProvider>
        </MotionPreferences>
    );
}
