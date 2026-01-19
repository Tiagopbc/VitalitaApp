/**
 * RippleButton.jsx
 * Componente de botão com efeito de clique ondulado estilo material design.
 * Também suporta feedback háptico em dispositivos móveis.
 */
import React, { useState } from 'react';

export function RippleButton({ children, onClick, className = '', haptic = 'medium', type = 'button', ...props }) {
    const [ripples, setRipples] = useState([]);

    const vibrate = () => {
        if (navigator.vibrate) {
            const HAPTIC_PATTERNS = {
                light: [10],
                medium: [30],
                heavy: [50],
                double: [30, 50, 30],
                success: [50, 100, 50, 100, 50],
                error: [100, 50, 100]
            };
            navigator.vibrate(HAPTIC_PATTERNS[haptic] || [30]);
        }
    };

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = { x, y, id: Date.now() };
        setRipples(prev => [...prev, newRipple]);

        // Feedback Háptico
        vibrate();

        // Remover ondulação após animação
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);

        if (onClick) onClick(e);
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className={`relative overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${className}`}
            {...props}
        >
            {children}

            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute w-0 h-0 rounded-full bg-white/30 animate-ripple pointer-events-none"
                />
            ))}
        </button>
    );
}
