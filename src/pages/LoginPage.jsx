// src/LoginPage.jsx
/**
 * LoginPage.jsx
 * Componente da página de autenticação que gerencia fluxos de Login e Cadastro.
 * Integra com Firebase Auth para provedor de e-mail/senha e Google.
 * Valida a entrada do usuário para registro (força da senha, data de nascimento, dados físicos).
 * Estado e handlers ficam aqui; a UI é composta por componentes em `components/auth/`.
 */
import React, { useMemo, useState } from 'react';
import { ForgotPasswordView } from '../components/auth/ForgotPasswordView';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupWizard } from '../components/auth/SignupWizard';
import {
    canCreateAccount as evaluateCanCreateAccount,
    evaluatePasswordRules,
    getAuthErrorMessage,
    getFirstName,
    validateBirthDate
} from '../utils/authValidation';

export default function LoginPage() {
    const [view, setView] = useState('login'); // login | signup | forgot_password (mantido para lógica interna, mas significado: login | cadastro | esqueci_senha)
    const [step, setStep] = useState(1); // 1 | 2

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Entrar
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Cadastro
    const [fullName, setFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [gender, setGender] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [acceptedLegal, setAcceptedLegal] = useState(false);

    // Esqueci a Senha
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    const canLogin = useMemo(() => {
        return loginEmail.trim().length > 0 && loginPassword.length >= 6 && !loading;
    }, [loginEmail, loginPassword, loading]);

    const passwordRules = useMemo(() => evaluatePasswordRules(signupPassword), [signupPassword]);

    const passwordOk = useMemo(() => Object.values(passwordRules).every(Boolean), [passwordRules]);

    const canGoStep1 = useMemo(() => {
        const okName = fullName.trim().length >= 2;
        const okEmail = signupEmail.trim().length > 0 && signupEmail.includes('@');
        const okConfirm = confirmPassword.length > 0 && confirmPassword === signupPassword;
        return okName && okEmail && passwordOk && okConfirm && !loading;
    }, [fullName, signupEmail, signupPassword, confirmPassword, passwordOk, loading]);

    const birthValidation = useMemo(
        () => validateBirthDate(birthDay, birthMonth, birthYear),
        [birthDay, birthMonth, birthYear]
    );

    const canCreateAccount = useMemo(
        () => evaluateCanCreateAccount({
            gender,
            birthValidDate: birthValidation.validDate,
            heightCm,
            weightKg,
            acceptedLegal,
            loading
        }),
        [gender, birthValidation.validDate, heightCm, weightKg, acceptedLegal, loading]
    );

    function resetSignup() {
        setStep(1);
        setFullName('');
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
        setGender('');
        setBirthDay('');
        setBirthMonth('');
        setBirthYear('');
        setHeightCm('');
        setWeightKg('');
        setAcceptedLegal(false);
    }

    function goSignup() {
        if (loading) return;
        setError('');
        resetSignup();
        setView('signup');
    }

    function backToLogin() {
        if (loading) return;
        setError('');
        resetSignup();
        setLoginEmail('');
        setLoginPassword('');
        setView('login');
    }

    function goForgotPassword() {
        setError('');
        setResetSuccess('');
        setResetEmail(loginEmail); // Preencher se digitado
        setView('forgot_password');
    }

    function backToStep1() {
        if (loading) return;
        setError('');
        setStep(1);
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        if (loading || !resetEmail.trim()) return;

        setError('');
        setResetSuccess('');
        setLoading(true);

        try {
            const { authService } = await import('../services/authService');
            await authService.resetPassword(resetEmail.trim());
            setResetSuccess('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
            setResetEmail('');
        } catch (err) {
            console.error(err);
            let msg = getAuthErrorMessage(err, 'Não foi possível enviar o e-mail. Tente novamente.');
            if (err.code === 'auth/user-not-found') {
                msg = 'E-mail não cadastrado.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'E-mail inválido.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();
        if (!canLogin) return;

        setError('');
        setLoading(true);

        try {
            const { authService } = await import('../services/authService');
            await authService.login(loginEmail.trim(), loginPassword);
        } catch (err) {
            console.error(err);
            let msg = getAuthErrorMessage(err, 'Não foi possível autenticar. Verifique os dados e tente novamente.');

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'E-mail ou senha incorretos.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'O formato do e-mail é inválido.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Muitas tentativas falhas. Tente novamente mais tarde.';
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const { authService } = await import('../services/authService');
            await authService.loginWithGoogle();
        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err, 'Erro ao entrar com Google. Tente novamente.'));
        } finally {
            setLoading(false);
        }
    }

    function nextStep(e) {
        e.preventDefault();

        if (!canGoStep1) {
            setError('Revise os dados e os requisitos da senha antes de continuar.');
            return;
        }

        setError('');
        setStep(2);
    }

    async function createAccount(e) {
        e.preventDefault();

        if (!canCreateAccount) {
            setError('Revise gênero, data de nascimento, altura, peso e aceite dos termos para concluir.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const email = signupEmail.trim();
            const name = fullName.trim();

            const additionalData = {
                gender,
                birthDate: {
                    day: Number(birthDay),
                    month: Number(birthMonth),
                    year: Number(birthYear),
                },
                heightCm: Number(heightCm),
                weightKg: Number(weightKg),
            };

            const { authService } = await import('../services/authService');
            await authService.register(email, signupPassword, name, additionalData);

            // Sinaliza para o App exibir o pop up de boas-vindas após o cadastro
            const firstName = getFirstName(name);
            localStorage.setItem('welcomeFirstName', firstName);
            localStorage.setItem('welcomePending', '1');

        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err, 'Não foi possível criar sua conta. Verifique os dados e tente novamente.'));
            // Em caso de erro, remove o sinal para não abrir pop up indevidamente
            localStorage.removeItem('welcomePending');
            localStorage.removeItem('welcomeFirstName');
        } finally {
            setLoading(false);
        }
    }

    const birthHasAnyError = Boolean(
        birthValidation.yearError ||
        birthValidation.monthError ||
        birthValidation.dayError ||
        birthValidation.dateError
    );

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6 py-8 text-text-primary"
            style={{
                background: 'radial-gradient(circle at top, #020617 0%, #000 55%)'
            }}
        >
            <div className="w-full max-w-[1120px] flex flex-col items-center transform -translate-y-3">
                <header className="text-center mb-8 flex flex-col items-center">
                    <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-1.5">VITALITÀ</h1>
                    <p className="text-[0.95rem] text-text-secondary mb-4">
                        {view === 'signup' ? 'Crie sua conta' : 'Seu diário inteligente de treinos'}
                    </p>
                </header>

                <div className="w-full max-w-[420px] border-[0.75px] border-slate-900/90 rounded-lg shadow-soft p-6 mx-auto box-border"
                    style={{
                        background: `
                            radial-gradient(circle at top left, rgba(59, 130, 246, 0.25), transparent 55%),
                            radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 60%),
                            linear-gradient(135deg, #020617 0%, #000 70%)`
                    }}
                >
                    {view === 'login' ? (
                        <LoginForm
                            loginEmail={loginEmail}
                            setLoginEmail={setLoginEmail}
                            loginPassword={loginPassword}
                            setLoginPassword={setLoginPassword}
                            showLoginPassword={showLoginPassword}
                            setShowLoginPassword={setShowLoginPassword}
                            loading={loading}
                            error={error}
                            canLogin={canLogin}
                            onSubmit={handleLoginSubmit}
                            onForgotPassword={goForgotPassword}
                            onGoogleSignIn={handleGoogleSignIn}
                            onGoSignup={goSignup}
                        />
                    ) : view === 'forgot_password' ? (
                        <ForgotPasswordView
                            resetEmail={resetEmail}
                            setResetEmail={setResetEmail}
                            loading={loading}
                            error={error}
                            resetSuccess={resetSuccess}
                            onSubmit={handleResetPassword}
                            onBack={backToLogin}
                        />
                    ) : (
                        <SignupWizard
                            step={step}
                            loading={loading}
                            error={error}
                            canGoStep1={canGoStep1}
                            canCreateAccount={canCreateAccount}
                            onSubmit={step === 1 ? nextStep : createAccount}
                            onBackToLogin={backToLogin}
                            onBackToStep1={backToStep1}
                            stepAccountProps={{
                                fullName,
                                setFullName,
                                signupEmail,
                                setSignupEmail,
                                signupPassword,
                                setSignupPassword,
                                showSignupPassword,
                                setShowSignupPassword,
                                confirmPassword,
                                setConfirmPassword,
                                showConfirmPassword,
                                setShowConfirmPassword,
                                passwordRules,
                                loading
                            }}
                            stepPersonalProps={{
                                gender,
                                setGender,
                                birthDay,
                                setBirthDay,
                                birthMonth,
                                setBirthMonth,
                                birthYear,
                                setBirthYear,
                                heightCm,
                                setHeightCm,
                                weightKg,
                                setWeightKg,
                                acceptedLegal,
                                setAcceptedLegal,
                                birthValidation,
                                birthHasAnyError,
                                loading
                            }}
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
        </div >
    );
}
