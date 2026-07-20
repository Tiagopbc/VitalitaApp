import { PRIVACY_POLICY_VERSION, TERMS_OF_USE_VERSION } from '../../constants/legal';
import { authFieldLabelClass, signupInputClass } from './authStyles';

export function SignupStepPersonal({
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
}) {
    return (
        <>
            <label className="w-full flex flex-col gap-1.5" htmlFor="signup-gender">
                <span className={authFieldLabelClass}>Gênero</span>
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
                            className={signupInputClass}
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
                            className={signupInputClass}
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
                            className={signupInputClass}
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
                    <span className={authFieldLabelClass}>Altura (cm)</span>
                    <input
                        id="height"
                        type="number"
                        className={signupInputClass}
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
                    <span className={authFieldLabelClass}>Peso (kg)</span>
                    <input
                        id="weight"
                        type="number"
                        className={signupInputClass}
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
    );
}
