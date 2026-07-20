import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../design-system/Button';
import { authInputClass } from './authStyles';

export function ForgotPasswordView({
    resetEmail,
    setResetEmail,
    loading,
    error,
    resetSuccess,
    onSubmit,
    onBack
}) {
    return (
        <>
            <h2 className="text-center m-0 mb-2 text-[1.45rem] font-bold text-slate-200/95">Redefinir senha</h2>
            <p className="text-center text-[0.9rem] text-slate-400 mb-6">Digite seu e-mail para receber o link de recuperação.</p>

            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={onSubmit}>
                <div className="w-full flex flex-col gap-1.5 text-[0.85rem] text-text-secondary s-6">
                    <label className="block text-left self-start text-inherit font-medium opacity-75" htmlFor="reset-email">E-mail</label>
                    <input
                        id="reset-email"
                        type="email"
                        className={authInputClass}
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
                    onClick={onBack}
                    disabled={loading}
                    leftIcon={<ArrowLeft size={16} />}
                >
                    Voltar
                </Button>
            </form>
        </>
    );
}
