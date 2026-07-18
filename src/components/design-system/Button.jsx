/**
 * Button.jsx
 * Botão único do design system: variantes (primary, secondary, ghost, danger, ...),
 * tamanhos, estado de carregamento, ícones, badges, efeito ripple e feedback háptico.
 * A variante 'unstyled' fornece apenas o comportamento (ripple/háptica) para
 * superfícies com estilo próprio — substitui o antigo RippleButton.
 */
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const HAPTIC_PATTERNS = {
    light: [10],
    medium: [30],
    heavy: [50],
    double: [30, 50, 30],
    success: [50, 100, 50, 100, 50],
    error: [100, 50, 100]
};

export const Button = ({
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    badge,
    ripple = true,
    haptic,
    children,
    onClick,
    type = 'button',
    ...props
}) => {
    const [ripples, setRipples] = useState([]);
    const isUnstyled = variant === 'unstyled';

    // Estilos base combinando com "Anatomia do Botão" e "Transições"
    const baseStyles = 'inline-flex items-center justify-center font-bold font-semibold tracking-widest uppercase transition-all duration-200 ease-out outline-none select-none active:translate-y-0 active:opacity-95 hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    // Estilos de tamanho combinando com "Tamanhos"
    const sizeStyles = {
        xs: 'h-7 px-2 text-[0.65rem] rounded-full gap-1.5', // 28px --btn-xs-height
        sm: 'h-8 px-4 text-[0.68rem] rounded-full gap-1.5', // 32px --btn-sm-height
        md: 'h-10 px-6 text-[0.78rem] rounded-full gap-1.5', // 40px --btn-md-height
        lg: 'h-12 px-8 text-[0.88rem] rounded-full gap-2', // 48px --btn-lg-height
        xl: 'h-14 px-10 text-[1rem] rounded-full gap-2.5', // 56px --btn-xl-height
    };

    // Estilos de variante combinando com "Variantes" e "Design Tokens"
    const variantStyles = {
        // PRIMÁRIO: Gradiente ciano + brilho + borda (reservado à ação principal da tela)
        primary: 'bg-[radial-gradient(circle_at_top_left,#3abff8_0%,#0ea5e9_42%,#1d4ed8_100%)] border border-sky-400/80 text-[#fff] shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.5)]',

        // SECUNDÁRIO: Contorno transparente em slate neutro
        secondary: 'bg-transparent border border-slate-400/30 text-slate-400 hover:border-slate-400/70 hover:text-slate-200',

        // TERCIÁRIO: Fundo preenchido sutil + contorno
        tertiary: 'bg-[#0f172a]/90 border border-slate-400/45 text-slate-400 hover:bg-[#0f172a] hover:text-white',

        // GHOST: Mínimo, sem borda
        ghost: 'bg-transparent border-transparent text-slate-400 hover:bg-slate-700/10 hover:text-slate-300',

        // PERIGO: Gradiente vermelho + brilho + borda
        danger: 'bg-[radial-gradient(circle_at_top_left,#ef4444_0%,#dc2626_42%,#991b1b_100%)] border border-red-500/80 text-[#fff] shadow-[0_8px_20px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_30px_rgba(220,38,38,0.5)]',

        // OUTLINE-PRIMÁRIO: Destaque ciano sem glow (o brilho fica só no primary)
        'outline-primary': 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/60',

        // SUCESSO: Gradiente esmeralda — celebração/conclusão (finalizar treino, PR)
        success: 'bg-[radial-gradient(circle_at_top_left,#34d399_0%,#10b981_42%,#059669_100%)] border border-emerald-500/80 text-[#fff] shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.5)]',
    };

    // Combinar classes
    const combinedClasses = isUnstyled
        ? [
            'relative overflow-hidden cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
            className
        ].join(' ')
        : [
            baseStyles,
            'relative overflow-hidden',
            sizeStyles[size] || sizeStyles.md,
            variantStyles[variant] || variantStyles.primary,
            fullWidth ? 'w-full' : '',
            className
        ].join(' ');

    // Tamanho do ícone baseado no tamanho do botão
    const iconSize = {
        xs: 14,
        sm: 16,
        md: 18,
        lg: 20,
        xl: 24
    }[size] || 18;

    const renderIcon = (icon) => {
        return <span className="flex-shrink-0">{icon}</span>;
    };

    const handleClick = (e) => {
        if (haptic && navigator.vibrate) {
            navigator.vibrate(HAPTIC_PATTERNS[haptic] || HAPTIC_PATTERNS.medium);
        }

        if (ripple && e?.currentTarget?.getBoundingClientRect) {
            const rect = e.currentTarget.getBoundingClientRect();
            const newRipple = {
                x: (e.clientX ?? rect.left + rect.width / 2) - rect.left,
                y: (e.clientY ?? rect.top + rect.height / 2) - rect.top,
                id: `${Date.now()}-${Math.random()}`
            };
            setRipples(prev => [...prev, newRipple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== newRipple.id));
            }, 600);
        }

        if (onClick) onClick(e);
    };

    const rippleElements = ripple ? ripples.map(r => (
        <span
            key={r.id}
            style={{
                left: r.x,
                top: r.y,
                transform: 'translate(-50%, -50%)',
            }}
            className="absolute w-0 h-0 rounded-full bg-white/30 animate-ripple pointer-events-none"
        />
    )) : null;

    if (isUnstyled) {
        return (
            <button
                type={type}
                className={combinedClasses}
                disabled={disabled || loading}
                onClick={handleClick}
                {...props}
            >
                {children}
                {rippleElements}
            </button>
        );
    }

    return (
        <button
            type={type}
            className={combinedClasses}
            disabled={disabled || loading}
            onClick={handleClick}
            {...props}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={iconSize} />
            ) : leftIcon ? (
                renderIcon(leftIcon)
            ) : null}

            <span className="flex items-center gap-1.5">
                {children}
                {badge !== undefined && (
                    <span className="bg-red-500 text-[#fff] px-1.5 rounded-full text-[10px] min-w-[18px] h-[18px] flex items-center justify-center font-bold ml-1">
                        {badge}
                    </span>
                )}
            </span>

            {!loading && rightIcon && (
                renderIcon(rightIcon)
            )}

            {rippleElements}
        </button>
    );
};
