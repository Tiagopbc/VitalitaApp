import { ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '../design-system/Button';
import { SignupStepAccount } from './SignupStepAccount';
import { SignupStepPersonal } from './SignupStepPersonal';

/**
 * Wizard de cadastro em dois passos. Todo o estado permanece na LoginPage;
 * este componente apenas compõe indicador de passos, formulário e rodapé,
 * delegando os campos para SignupStepAccount / SignupStepPersonal.
 */
export function SignupWizard({
    step,
    loading,
    error,
    canGoStep1,
    canCreateAccount,
    onSubmit,
    onBackToLogin,
    onBackToStep1,
    stepAccountProps,
    stepPersonalProps
}) {
    return (
        <>
            <div className="flex justify-center gap-3 my-2.5 mb-3.5" aria-hidden="true">
                <span className={`w-11 h-1 rounded-full ${step === 1 ? 'bg-sky-400/95 shadow-[0_10px_20px_rgba(56,189,248,0.22)]' : 'bg-sky-400/55'} `} />
                <span className={`w-11 h-1 rounded-full ${step === 2 ? 'bg-sky-400/95 shadow-[0_10px_20px_rgba(56,189,248,0.22)]' : 'bg-slate-400/20'} `} />
            </div>

            <h2 className="text-center m-0 mb-4 text-[1.45rem] font-bold text-slate-200/95">{step === 1 ? 'Dados básicos' : 'Dados pessoais'}</h2>

            <form className="w-full text-left flex flex-col gap-3 my-4 mb-[18px]" onSubmit={onSubmit}>
                {step === 1 ? (
                    <SignupStepAccount {...stepAccountProps} />
                ) : (
                    <SignupStepPersonal {...stepPersonalProps} />
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
                            onClick={onBackToLogin}
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
                            onClick={onBackToStep1}
                            disabled={loading}
                            leftIcon={<ArrowLeft size={16} />}
                        >
                            Voltar
                        </Button>
                    )}
                </div>
            </form>
        </>
    );
}
