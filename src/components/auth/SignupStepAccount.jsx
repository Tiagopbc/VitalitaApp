import { PasswordInput } from './PasswordInput';
import { authFieldLabelClass, signupInputClass } from './authStyles';

const PASSWORD_RULES = [
    { key: 'minLen', label: 'Pelo menos 6 caracteres' },
    { key: 'hasUpper', label: 'Contém letra maiúscula' },
    { key: 'hasLower', label: 'Contém letra minúscula' },
    { key: 'hasNumber', label: 'Contém número' },
    { key: 'hasSpecial', label: 'Contém caractere especial' }
];

export function SignupStepAccount({
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
}) {
    return (
        <>
            <label className="w-full flex flex-col gap-1.5" htmlFor="signup-name">
                <span className={authFieldLabelClass}>Nome completo</span>
                <input
                    id="signup-name"
                    type="text"
                    className={signupInputClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                    disabled={loading}
                />
            </label>

            <label className="w-full flex flex-col gap-1.5" htmlFor="signup-email">
                <span className={authFieldLabelClass}>E-mail</span>
                <input
                    id="signup-email"
                    type="email"
                    className={signupInputClass}
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
                <span className={authFieldLabelClass}>Senha</span>
                <PasswordInput
                    id="signup-pass"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    show={showSignupPassword}
                    onToggleShow={() => setShowSignupPassword(!showSignupPassword)}
                    inputClassName={signupInputClass}
                    placeholder="Sua senha"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                />
            </label>

            <div className="my-2.5 mb-1.5 p-3 px-3 rounded-xl border border-slate-400/20 bg-[#02061740]" aria-live="polite">
                <p className="mb-2 text-[0.82rem] text-slate-200/80">Requisitos da senha</p>
                <ul className="m-0 pl-4 grid gap-1.5 text-[0.82rem]">
                    {PASSWORD_RULES.map(({ key, label }) => (
                        <li key={key} className={passwordRules[key] ? 'text-green-500/90' : 'text-slate-400/70'}>
                            {label}
                        </li>
                    ))}
                </ul>
            </div>

            <label className="w-full flex flex-col gap-1.5" htmlFor="signup-pass2">
                <span className={authFieldLabelClass}>Confirmar senha</span>
                <PasswordInput
                    id="signup-pass2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    show={showConfirmPassword}
                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                    inputClassName={signupInputClass}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                />
            </label>
        </>
    );
}
