import { Eye, EyeOff } from 'lucide-react';

/**
 * Campo de senha controlado com botão de mostrar/ocultar.
 * `inputClassName` recebe a variação de estilo (login vs. cadastro); o `pr-10`
 * necessário para o botão do olho é anexado internamente.
 */
export function PasswordInput({
    id,
    value,
    onChange,
    show,
    onToggleShow,
    inputClassName,
    placeholder,
    autoComplete,
    disabled = false,
    required = false
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                className={`${inputClassName} pr-10`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                disabled={disabled}
            />
            <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                onClick={onToggleShow}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            >
                {show ? <EyeOff size={20} className="opacity-70" /> : <Eye size={20} className="opacity-70" />}
            </button>
        </div>
    );
}
