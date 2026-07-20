import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../design-system/Button';
import { GoogleIcon } from './GoogleIcon';
import { PasswordInput } from './PasswordInput';
import { authInputClass } from './authStyles';

export function LoginForm({
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showLoginPassword,
    setShowLoginPassword,
    loading,
    error,
    canLogin,
    onSubmit,
    onForgotPassword,
    onGoogleSignIn,
    onGoSignup
}) {
    return (
        <>
            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={onSubmit}>
                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary s-6">
                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="login-email">E-mail</label>
                    <input
                        id="login-email"
                        type="email"
                        className={authInputClass}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        autoComplete="email"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary">
                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="login-password">Senha</label>
                    <PasswordInput
                        id="login-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        show={showLoginPassword}
                        onToggleShow={() => setShowLoginPassword(!showLoginPassword)}
                        inputClassName={authInputClass}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="w-full flex justify-end mt-1">
                    <button
                        type="button"
                        className="text-[0.8rem] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        onClick={onForgotPassword}
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
                    onClick={onGoogleSignIn}
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
                    onClick={onGoSignup}
                    disabled={loading}
                    leftIcon={<UserPlus size={15} />}
                >
                    Criar uma conta com e-mail
                </Button>
            </div>
        </>
    );
}
