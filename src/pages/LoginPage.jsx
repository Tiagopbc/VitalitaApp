// src/LoginPage.jsx
/**
 * LoginPage.jsx
 * Componente da página de autenticação que gerencia fluxos de Login e Cadastro.
 * Integra com Firebase Auth para provedor de e-mail/senha e Google.
 * Valida a entrada do usuário para registro (força da senha, data de nascimento, dados físicos).
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn, Mail, UserPlus } from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { PRIVACY_POLICY_VERSION, TERMS_OF_USE_VERSION } from '../constants/legal';

function GoogleIcon() {
    return (
        <svg
            className="w-[18px] h-[18px] shrink-0 block"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            focusable="false"
        >
            <path
                fill="#EA4335"
                d="M9 3.48c1.69 0 2.84.73 3.49 1.34l2.38-2.38C13.41 1.09 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l2.77 2.15C4.45 4.91 6.5 3.48 9 3.48z"
            />
            <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
            />
            <path
                fill="#FBBC05"
                d="M3.73 10.07A5.39 5.39 0 0 1 3.43 9c0-.37.06-.72.16-1.07V5.78H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l2.77-2.15z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.5 0-4.55-1.69-5.29-3.98L.96 13.05C2.44 15.98 5.48 18 9 18z"
            />
            <path fill="none" d="M0 0h18v18H0z" />
        </svg>
    );
}

function getFirstName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    return parts[0] || '';
}

function daysInMonth(year, month) {
    if (!Number.isFinite(year) || !Number.isFinite(month)) return 31;
    return new Date(year, month, 0).getDate();
}

function getAuthErrorMessage(err, fallback) {
    if (err?.code === 'auth/invalid-api-key') {
        return 'Configuração local do Firebase ausente ou inválida. Confira o arquivo .env.local.';
    }
    if (err?.code === 'auth/network-request-failed') {
        return 'Erro de conexão/rede. Verifique sua internet.';
    }
    return fallback;
}

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

    const passwordRules = useMemo(() => {
        const pwd = signupPassword || '';


        const minLen = pwd.length >= 6;
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

        return { minLen, hasUpper, hasLower, hasNumber, hasSpecial };
    }, [signupPassword]);

    const passwordOk = useMemo(() => Object.values(passwordRules).every(Boolean), [passwordRules]);

    const canGoStep1 = useMemo(() => {
        const okName = fullName.trim().length >= 2;
        const okEmail = signupEmail.trim().length > 0 && signupEmail.includes('@');
        const okConfirm = confirmPassword.length > 0 && confirmPassword === signupPassword;
        return okName && okEmail && passwordOk && okConfirm && !loading;
    }, [fullName, signupEmail, signupPassword, confirmPassword, passwordOk, loading]);

    const birthValidation = useMemo(() => {
        const nowYear = new Date().getFullYear();

        const y = Number(birthYear);
        const m = Number(birthMonth);
        const d = Number(birthDay);

        const hasY = birthYear !== '';
        const hasM = birthMonth !== '';
        const hasD = birthDay !== '';

        let yearError = '';
        let monthError = '';
        let dayError = '';
        let dateError = '';

        if (hasY) {
            if (!Number.isFinite(y)) yearError = 'Ano inválido.';
            else if (y < 1950) yearError = 'Ano inválido. Use 1950 ou maior.';
            else if (y > nowYear) yearError = `Ano inválido. Use ${nowYear} ou menor.`;
        }

        if (hasM) {
            if (!Number.isFinite(m)) monthError = 'Mês inválido.';
            else if (m < 1 || m > 12) monthError = 'Mês inválido. Use 1 a 12.';
        }

        if (hasD) {
            if (!Number.isFinite(d)) dayError = 'Dia inválido.';
            else {
                const effectiveYear = Number.isFinite(y) ? y : 2000;
                const effectiveMonth = Number.isFinite(m) ? m : 1;
                const maxDay = daysInMonth(effectiveYear, effectiveMonth);

                if (d < 1) dayError = 'Dia inválido. Use 1 ou maior.';
                else if (Number.isFinite(m) && Number.isFinite(y) && d > maxDay) {
                    dayError = `Dia inválido para este mês. Máximo: ${maxDay}.`;
                } else if (!Number.isFinite(m) && d > 31) {
                    dayError = 'Dia inválido. Use 1 a 31.';
                } else if (Number.isFinite(m) && !Number.isFinite(y) && d > 31) {
                    dayError = 'Dia inválido. Use 1 a 31.';
                }
            }
        }

        const canCheckFull =
            Number.isFinite(y) &&
            Number.isFinite(m) &&
            Number.isFinite(d) &&
            !yearError &&
            !monthError &&
            !dayError;

        const validDate = (() => {
            if (!canCheckFull) return false;
            const dt = new Date(y, m - 1, d);
            return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
        })();

        if (birthDay || birthMonth || birthYear) {
            if (!validDate && canCheckFull) {
                dateError = 'Data inválida.';
            }
        }

        return {
            y,
            m,
            d,
            yearError,
            monthError,
            dayError,
            dateError,
            validDate,
            nowYear,
        };
    }, [birthDay, birthMonth, birthYear]);

    const canCreateAccount = useMemo(() => {
        const h = Number(heightCm);
        const w = Number(weightKg);

        const okHeight = Number.isFinite(h) && h > 0;
        const okWeight = Number.isFinite(w) && w > 0;

        return (
            gender.length > 0 &&
            birthValidation.validDate &&
            okHeight &&
            okWeight &&
            acceptedLegal &&
            !loading
        );
    }, [gender, birthValidation.validDate, heightCm, weightKg, acceptedLegal, loading]);

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
                        <>
                            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={handleLoginSubmit}>
                                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary s-6">
                                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="login-email">E-mail</label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        className="w-full box-border rounded-[10px] border border-blue-800/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-blue-500/95 focus:shadow-glow-input-focus placeholder:text-slate-200/40"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary">
                                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="login-password">Senha</label>
                                    <div className="relative">
                                        <input
                                            id="login-password"
                                            type={showLoginPassword ? "text" : "password"}
                                            className="w-full box-border rounded-[10px] border border-blue-800/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-blue-500/95 focus:shadow-glow-input-focus placeholder:text-slate-200/40 pr-10"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            autoComplete="current-password"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showLoginPassword ? <EyeOff size={20} className="opacity-70" /> : <Eye size={20} className="opacity-70" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full flex justify-end mt-1">
                                    <button
                                        type="button"
                                        className="text-[0.8rem] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setError('');
                                            setResetSuccess('');
                                            setResetEmail(loginEmail); // Preencher se digitado
                                            setView('forgot_password');
                                        }}
                                        disabled={loading}
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>

                                {error && <p className="text-[0.8rem] text-red-300 text-center mt-2">{error}</p>}

                                <Button
                                    type="submit"
                                    fullWidth
                                    className="mt-2 rounded-full"
                                    leftIcon={<LogIn size={16} />}
                                    disabled={!canLogin}
                                >
                                    {loading ? 'Enviando...' : 'Entrar'}
                                </Button>
                            </form>

                            <div className="flex items-center justify-center gap-3 text-center my-4 mb-2 before:flex-1 before:h-px before:bg-slate-400/25 after:flex-1 after:h-px after:bg-slate-400/25">
                                <span className="text-xs tracking-[0.08em] uppercase opacity-70">ou</span>
                            </div>

                            <div className="flex flex-col gap-2 items-center">
                                <button
                                    type="button"
                                    className="w-full rounded-full inline-flex items-center justify-center gap-3 px-6 py-[10px] bg-white border border-[#747775] font-medium text-sm text-[#1f1f1f] cursor-pointer transition-all hover:bg-[#f7f8f8] hover:shadow-google-hover hover:-translate-y-px disabled:opacity-70"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    <GoogleIcon />
                                    <span className="whitespace-nowrap block">Continue with Google</span>
                                </button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    className="mt-1 rounded-full"
                                    onClick={goSignup}
                                    disabled={loading}
                                    leftIcon={<UserPlus size={15} />}
                                >
                                    Criar uma conta com e-mail
                                </Button>
                            </div>
                        </>
                    ) : view === 'forgot_password' ? (
                        <>
                            <h2 className="text-center m-0 mb-2 text-[1.45rem] font-bold text-slate-200/95">Redefinir senha</h2>
                            <p className="text-center text-[0.9rem] text-slate-400 mb-6">Digite seu e-mail para receber o link de recuperação.</p>

                            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={handleResetPassword}>
                                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary s-6">
                                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="reset-email">E-mail</label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        className="w-full box-border rounded-[10px] border border-blue-800/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-blue-500/95 focus:shadow-glow-input-focus placeholder:text-slate-200/40"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {error && <p className="text-[0.8rem] text-red-300 text-center mt-2">{error}</p>}
                                {resetSuccess && <p className="text-[0.8rem] text-green-400 text-center mt-2">{resetSuccess}</p>}

                                <Button
                                    type="submit"
                                    fullWidth
                                    className="mt-4 rounded-full"
                                    disabled={loading || !resetEmail.trim()}
                                    leftIcon={<Mail size={16} />}
                                >
                                    {loading ? 'Enviando...' : 'Enviar link'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    fullWidth
                                    className="mt-2 rounded-full"
                                    onClick={backToLogin}
                                    disabled={loading}
                                    leftIcon={<ArrowLeft size={16} />}
                                >
                                    Voltar
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center gap-3 my-2.5 mb-3.5" aria-hidden="true">
                                <span className={`w-11 h-1 rounded-full ${step === 1 ? 'bg-sky-400/95 shadow-[0_10px_20px_rgba(56,189,248,0.22)]' : 'bg-sky-400/55'} `} />
                                <span className={`w-11 h-1 rounded-full ${step === 2 ? 'bg-sky-400/95 shadow-[0_10px_20px_rgba(56,189,248,0.22)]' : 'bg-slate-400/20'} `} />
                            </div>

                            <h2 className="text-center m-0 mb-4 text-[1.45rem] font-bold text-slate-200/95">{step === 1 ? 'Dados básicos' : 'Dados pessoais'}</h2>

                            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={step === 1 ? nextStep : createAccount}>
                                {step === 1 ? (
                                    <>
                                        <label className="w-full flex flex-col gap-1.5" htmlFor="signup-name">
                                            <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Nome completo</span>
                                            <input
                                                id="signup-name"
                                                type="text"
                                                className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Seu nome"
                                                autoComplete="name"
                                                required
                                                disabled={loading}
                                            />
                                        </label>

                                        <label className="w-full flex flex-col gap-1.5" htmlFor="signup-email">
                                            <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">E-mail</span>
                                            <input
                                                id="signup-email"
                                                type="email"
                                                className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                autoComplete="email"
                                                inputMode="email"
                                                required
                                                disabled={loading}
                                            />
                                        </label>

                                        <label className="w-full flex flex-col gap-1.5" htmlFor="signup-pass">
                                            <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Senha</span>
                                            <div className="relative">
                                                <input
                                                    id="signup-pass"
                                                    type={showSignupPassword ? "text" : "password"}
                                                    className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40 pr-10"
                                                    value={signupPassword}
                                                    onChange={(e) => setSignupPassword(e.target.value)}
                                                    placeholder="Sua senha"
                                                    autoComplete="new-password"
                                                    required
                                                    disabled={loading}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                                                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                    aria-label={showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                                                >
                                                    {showSignupPassword ? <EyeOff size={20} className="opacity-70" /> : <Eye size={20} className="opacity-70" />}
                                                </button>
                                            </div>
                                        </label>

                                        <div className="my-2.5 mb-1.5 p-3 px-3 rounded-xl border border-slate-400/20 bg-[#02061740]" aria-live="polite">
                                            <p className="mb-2 text-[0.82rem] text-slate-200/80">Requisitos da senha</p>
                                            <ul className="m-0 pl-4 grid gap-1.5 text-[0.82rem]">
                                                <li className={passwordRules.minLen ? 'text-green-500/90' : 'text-slate-400/70'}>
                                                    Pelo menos 6 caracteres
                                                </li>
                                                <li className={passwordRules.hasUpper ? 'text-green-500/90' : 'text-slate-400/70'}>
                                                    Contém letra maiúscula
                                                </li>
                                                <li className={passwordRules.hasLower ? 'text-green-500/90' : 'text-slate-400/70'}>
                                                    Contém letra minúscula
                                                </li>
                                                <li className={passwordRules.hasNumber ? 'text-green-500/90' : 'text-slate-400/70'}>
                                                    Contém número
                                                </li>
                                                <li className={passwordRules.hasSpecial ? 'text-green-500/90' : 'text-slate-400/70'}>
                                                    Contém caractere especial
                                                </li>
                                            </ul>
                                        </div>

                                        <label className="w-full flex flex-col gap-1.5" htmlFor="signup-pass2">
                                            <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Confirmar senha</span>
                                            <div className="relative">
                                                <input
                                                    id="signup-pass2"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40 pr-10"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Repita a senha"
                                                    autoComplete="new-password"
                                                    required
                                                    disabled={loading}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                                                >
                                                    {showConfirmPassword ? <EyeOff size={20} className="opacity-70" /> : <Eye size={20} className="opacity-70" />}
                                                </button>
                                            </div>
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <label className="w-full flex flex-col gap-1.5" htmlFor="signup-gender">
                                            <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Gênero</span>
                                            <select
                                                id="signup-gender"
                                                className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-3 py-2.5 text-[0.95rem] outline-none transition-all focus:border-accent-strong/95 focus:ring-1 focus:ring-blue-600/70 shadow-[0_18px_40px_rgba(2,6,23,0.35)] appearance-none"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                disabled={loading}
                                                required
                                            >
                                                <option value="" className="bg-bg-card">Selecione</option>
                                                <option value="masculino" className="bg-bg-card">Masculino</option>
                                                <option value="feminino" className="bg-bg-card">Feminino</option>
                                                <option value="outro" className="bg-bg-card">Outro</option>
                                                <option value="prefiro_nao_informar" className="bg-bg-card">Prefiro não informar</option>
                                            </select>
                                        </label>

                                        <div className="grid gap-1.5">
                                            <span className="block text-left self-start text-[inherit] text-slate-200/75 font-medium">Data de nascimento</span>

                                            <div className="grid grid-cols-3 gap-3">
                                                <label className="w-full flex flex-col gap-1.5" htmlFor="birth-day">
                                                    <input
                                                        id="birth-day"
                                                        type="number"
                                                        className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                        value={birthDay}
                                                        onChange={(e) => setBirthDay(e.target.value)}
                                                        placeholder="Dia"
                                                        min="1"
                                                        max="31"
                                                        inputMode="numeric"
                                                        disabled={loading}
                                                        required
                                                        aria-invalid={birthHasAnyError ? 'true' : 'false'}
                                                    />
                                                </label>

                                                <label className="w-full flex flex-col gap-1.5" htmlFor="birth-month">
                                                    <input
                                                        id="birth-month"
                                                        type="number"
                                                        className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                        value={birthMonth}
                                                        onChange={(e) => setBirthMonth(e.target.value)}
                                                        placeholder="Mês"
                                                        min="1"
                                                        max="12"
                                                        inputMode="numeric"
                                                        disabled={loading}
                                                        required
                                                        aria-invalid={birthHasAnyError ? 'true' : 'false'}
                                                    />
                                                </label>

                                                <label className="w-full flex flex-col gap-1.5" htmlFor="birth-year">
                                                    <input
                                                        id="birth-year"
                                                        type="number"
                                                        className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                        value={birthYear}
                                                        onChange={(e) => setBirthYear(e.target.value)}
                                                        placeholder="Ano"
                                                        min="1950"
                                                        max={new Date().getFullYear()}
                                                        inputMode="numeric"
                                                        disabled={loading}
                                                        required
                                                        aria-invalid={birthHasAnyError ? 'true' : 'false'}
                                                    />
                                                </label>
                                            </div>

                                            {birthValidation.dayError ? (
                                                <p className="mt-2 text-[0.78rem] text-red-200" role="status">{birthValidation.dayError}</p>
                                            ) : null}
                                            {!birthValidation.dayError && birthValidation.monthError ? (
                                                <p className="mt-2 text-[0.78rem] text-red-200" role="status">{birthValidation.monthError}</p>
                                            ) : null}
                                            {!birthValidation.dayError && !birthValidation.monthError && birthValidation.yearError ? (
                                                <p className="mt-2 text-[0.78rem] text-red-200" role="status">{birthValidation.yearError}</p>
                                            ) : null}
                                            {!birthValidation.dayError && !birthValidation.monthError && !birthValidation.yearError && birthValidation.dateError ? (
                                                <p className="mt-2 text-[0.78rem] text-red-200" role="status">{birthValidation.dateError}</p>
                                            ) : null}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                                            <label className="w-full flex flex-col gap-1.5" htmlFor="height">
                                                <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Altura (cm)</span>
                                                <input
                                                    id="height"
                                                    type="number"
                                                    className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                    value={heightCm}
                                                    onChange={(e) => setHeightCm(e.target.value)}
                                                    placeholder="170"
                                                    min="1"
                                                    inputMode="numeric"
                                                    disabled={loading}
                                                    required
                                                />
                                            </label>

                                            <label className="w-full flex flex-col gap-1.5" htmlFor="weight">
                                                <span className="block text-left self-start text-[0.85rem] text-text-secondary font-medium">Peso (kg)</span>
                                                <input
                                                    id="weight"
                                                    type="number"
                                                    className="w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40"
                                                    value={weightKg}
                                                    onChange={(e) => setWeightKg(e.target.value)}
                                                    placeholder="70"
                                                    min="1"
                                                    inputMode="numeric"
                                                    disabled={loading}
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="mt-2 flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3 text-[0.78rem] leading-relaxed text-slate-300" htmlFor="accepted-legal">
                                            <input
                                                id="accepted-legal"
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-500 bg-slate-950 accent-cyan-400"
                                                checked={acceptedLegal}
                                                onChange={(e) => setAcceptedLegal(e.target.checked)}
                                                disabled={loading}
                                                required
                                            />
                                            <span>
                                                Li e aceito a{' '}
                                                <a className="text-cyan-300 underline-offset-4 hover:underline" href="/privacy">
                                                    Política de Privacidade
                                                </a>{' '}
                                                v{PRIVACY_POLICY_VERSION} e os{' '}
                                                <a className="text-cyan-300 underline-offset-4 hover:underline" href="/terms">
                                                    Termos de Uso
                                                </a>{' '}
                                                v{TERMS_OF_USE_VERSION}.
                                            </span>
                                        </label>
                                    </>
                                )}

                                {error ? (
                                    <p className="text-[0.8rem] text-red-200" role="alert" aria-live="polite">
                                        {error}
                                    </p>
                                ) : null}

                                <div className="flex flex-col gap-3.5 mt-6">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        fullWidth
                                        className="rounded-full"
                                        disabled={step === 1 ? !canGoStep1 : !canCreateAccount}
                                        rightIcon={step === 1 ? <ArrowRight size={16} /> : <UserPlus size={16} />}
                                    >
                                        {loading ? 'Enviando...' : step === 1 ? 'Próximo' : 'Criar conta'}
                                    </Button>

                                    {step === 1 ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="lg"
                                            fullWidth
                                            className="rounded-full"
                                            onClick={backToLogin}
                                            disabled={loading}
                                            leftIcon={<ArrowLeft size={16} />}
                                        >
                                            Voltar ao login
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="lg"
                                            fullWidth
                                            className="rounded-full"
                                            onClick={() => {
                                                if (loading) return;
                                                setError('');
                                                setStep(1);
                                            }}
                                            disabled={loading}
                                            leftIcon={<ArrowLeft size={16} />}
                                        >
                                            Voltar
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </>
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
