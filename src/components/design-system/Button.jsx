/**
 * Button.jsx
 * Reusable button component with multiple variants (primary, ghost, danger, etc.) and sizes.
 * Supports loading state, icons, and badges.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

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
    children,
    onClick,
    type = 'button',
    ...props
}) => {
    // Base styles matching "Anatomia do Botão" and "Transições"
    // transition-all duration-200 ease-out active:translate-y-0 active:opacity-95 hover:-translate-y-[1px]
    const baseStyles = 'inline-flex items-center justify-center font-bold font-semibold tracking-widest uppercase transition-all duration-200 ease-out outline-none select-none active:translate-y-0 active:opacity-95 hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    // Size styles matching "Tamanhos"
    const sizeStyles = {
        xs: 'h-7 px-2 text-[0.65rem] rounded-full gap-1.5', // 28px --btn-xs-height
        sm: 'h-8 px-4 text-[0.68rem] rounded-full gap-1.5', // 32px --btn-sm-height
        md: 'h-10 px-6 text-[0.78rem] rounded-full gap-1.5', // 40px --btn-md-height
        lg: 'h-12 px-8 text-[0.88rem] rounded-full gap-2', // 48px --btn-lg-height
        xl: 'h-14 px-10 text-[1rem] rounded-full gap-2.5', // 56px --btn-xl-height
    };

    // Variant styles matching "Variantes" & "Design Tokens"
    const variantStyles = {
        // PRIMARY: Cyan gradient + glow + border
        primary: 'bg-[radial-gradient(circle_at_top_left,#3abff8_0%,#0ea5e9_42%,#1d4ed8_100%)] border border-sky-400/80 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.5)]',

        // SECONDARY: Transparent outline
        secondary: 'bg-transparent border border-slate-400/30 text-slate-400 hover:border-slate-400/70 hover:text-slate-200',

        // TERTIARY: Subtle filled backdrop + outline
        tertiary: 'bg-[#0f172a]/90 border border-slate-400/45 text-slate-400 hover:bg-[#0f172a] hover:text-white',

        // GHOST: Minimal, no border
        ghost: 'bg-transparent border-transparent text-slate-400 hover:bg-slate-700/10 hover:text-slate-300',

        // DANGER: Red gradient + glow + border
        danger: 'bg-[radial-gradient(circle_at_top_left,#ef4444_0%,#dc2626_42%,#991b1b_100%)] border border-red-500/80 text-white shadow-[0_8px_20px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_30px_rgba(220,38,38,0.5)]',

        // OUTLINE-PRIMARY: Cyan highlight
        'outline-primary': 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',

        // SUCCESS: Emerald gradient (kept for consistency as "Special" variant if needed)
        success: 'bg-[radial-gradient(circle_at_top_left,#34d399_0%,#10b981_42%,#059669_100%)] border border-emerald-500/80 text-white shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.5)]',
    };

    // Combine classes
    const combinedClasses = [
        baseStyles,
        sizeStyles[size] || sizeStyles.md,
        variantStyles[variant] || variantStyles.primary,
        fullWidth ? 'w-full' : '',
        className
    ].join(' ');

    // Icon sizing based on button size
    const iconSize = {
        xs: 14,
        sm: 16,
        md: 18,
        lg: 20,
        xl: 24
    }[size] || 18;

    const renderIcon = (icon) => {
        // If icon is a valid React element, clone it with the correct size if not already set, 
        // or just render it. We can try to enforce size but often icons are passed as <Icon size={...} />
        // If the user passes <Icon />, we could cloneElement to inject size, but for now assuming passed correctly or handled by wrapper.
        // Ideally, the user passes the Icon component itself or an element. 
        // Let's just render it wrapped for flex behavior.
        return <span className="flex-shrink-0">{icon}</span>;
    }

    return (
        <button
            type={type}
            className={combinedClasses}
            disabled={disabled || loading}
            onClick={onClick}
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
                    <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px] min-w-[18px] h-[18px] flex items-center justify-center font-bold ml-1">
                        {badge}
                    </span>
                )}
            </span>

            {!loading && rightIcon && (
                renderIcon(rightIcon)
            )}
        </button>
    );
};
