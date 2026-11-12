/**
 * LoginPage.jsx
 * Tela de autenticação: entrar (e-mail e senha ou Google), criar conta em dois
 * passos e recuperar a senha.
 *
 * Orquestrador fino: cada fluxo mora num hook em src/hooks/login/ e a UI em
 * components/auth/. Aqui ficam a tela atual, o carregando e o erro que os três
 * compartilham, e a navegação entre as telas.
 */
import React, { useState } from 'react';
import { ForgotPasswordView } from '../components/auth/ForgotPasswordView';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupWizard } from '../components/auth/SignupWizard';
import { useLoginForm } from '../hooks/login/useLoginForm';
import { useSignupForm } from '../hooks/login/useSignupForm';
import { usePasswordReset } from '../hooks/login/usePasswordReset';

export default function LoginPage() {
    const [view, setView] = useState('login'); // login | signup | forgot_password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const shared = { loading, setLoading, setError };
    const login = useLoginForm(shared);
    const signup = useSignupForm(shared);
    const reset = usePasswordReset(shared);

    function goSignup() {
        if (loading) return;
        setError('');
        signup.resetSignup();
        setView('signup');
    }

    function backToLogin() {
        if (loading) return;
        setError('');
        signup.resetSignup();
        login.clearLogin();
        setView('login');
    }

    function goForgotPassword() {
        setError('');
        reset.openReset(login.loginEmail);
        setView('forgot_password');
    }

    return (
        <div className="vit-auth-bg min-h-screen flex flex-col items-center justify-center px-6 py-8 text-text-primary">
            <div className="w-full max-w-[1120px] flex flex-col items-center transform -translate-y-3">
                <header className="text-center mb-8 flex flex-col items-center">
                    <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-1.5">VITALITÀ</h1>
                    <p className="text-[0.95rem] text-text-secondary mb-4">
                        {view === 'signup' ? 'Crie sua conta' : 'Seu diário inteligente de treinos'}
                    </p>
                </header>

                {/* Fundos da página e do cartão: classes vit-auth-* no index.css, com
                    versão clara (antes, gradientes escuros fixos no style). */}
                <div className="vit-auth-card w-full max-w-[420px] border-[0.75px] border-slate-900/90 rounded-lg shadow-soft p-6 mx-auto box-border">
                    {view === 'login' ? (
                        <LoginForm
                            loginEmail={login.loginEmail}
                            setLoginEmail={login.setLoginEmail}
                            loginPassword={login.loginPassword}
                            setLoginPassword={login.setLoginPassword}
                            showLoginPassword={login.showLoginPassword}
                            setShowLoginPassword={login.setShowLoginPassword}
                            loading={loading}
                            error={error}
                            canLogin={login.canLogin}
                            onSubmit={login.handleLoginSubmit}
                            onForgotPassword={goForgotPassword}
                            onGoogleSignIn={login.handleGoogleSignIn}
                            onGoSignup={goSignup}
                        />
                    ) : view === 'forgot_password' ? (
                        <ForgotPasswordView
                            resetEmail={reset.resetEmail}
                            setResetEmail={reset.setResetEmail}
                            loading={loading}
                            error={error}
                            resetSuccess={reset.resetSuccess}
                            onSubmit={reset.handleResetPassword}
                            onBack={backToLogin}
                        />
                    ) : (
                        <SignupWizard
                            step={signup.step}
                            loading={loading}
                            error={error}
                            canGoStep1={signup.canGoStep1}
                            canCreateAccount={signup.canCreateAccount}
                            onSubmit={signup.step === 1 ? signup.nextStep : signup.createAccount}
                            onBackToLogin={backToLogin}
                            onBackToStep1={signup.backToStep1}
                            stepAccountProps={signup.stepAccountProps}
                            stepPersonalProps={signup.stepPersonalProps}
                        />
                    )}
                </div>

                <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.75rem] text-slate-500">
                    <a className="transition-colors hover:text-cyan-300" href="/privacy">
                        Política de Privacidade
                    </a>
                    <span aria-hidden="true">•</span>
                    <a className="transition-colors hover:text-cyan-300" href="/terms">
                        Termos de Uso
                    </a>
                </nav>
            </div>
        </div>
    );
}
