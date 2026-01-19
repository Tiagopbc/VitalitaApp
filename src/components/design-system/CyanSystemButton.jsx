/**
 * CyanSystemButton.jsx
 * Botão premium holográfico independente com gradiente animado.
 * Usado para chamadas de ação primárias como "Finalizar Treino".
 */

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function CyanSystemButton({
    onClick,
    loading = false,
    disabled = false,
    text = 'Finalizar Treino',
    showIcon = true
}) {

    // ========== ESTADO ==========
    const [isHovered, setIsHovered] = useState(false);

    // ========== MANIPULADORES ==========
    const handleClick = () => {
        // Vibração háptica (mobile)
        if (navigator.vibrate) {
            navigator.vibrate([10, 5, 10]); // Vibra 10ms, pausa 5ms, vibra 10ms
        }

        // Callback
        if (onClick) {
            onClick();
        }
    };

    // ========== RENDERIZAÇÃO ==========
    return (
        <div style={{ position: 'relative', width: '100%' }}>

            {/* ==================== BRILHO DA BORDA (CAMADA DE FUNDO) ==================== */}
            <div
                style={{
                    // Posicionamento
                    position: 'absolute',
                    inset: -2, // Expande 2px para fora em todas as direções
                    zIndex: -1,
                    pointerEvents: 'none', // Não interfere com cliques

                    // Visual
                    borderRadius: '9999px',
                    backgroundImage: 'linear-gradient(135deg, #3abff8, #0ea5e9, #1d4ed8, #06b6d4)',
                    backgroundSize: '300% 300%', // Maior que 100% para permitir movimento

                    // Substituição do Efeito de Destaque (Sombra respeita melhor o border-radius)
                    boxShadow: '0 0 15px rgba(58, 191, 248, 0.6), inset 0 0 4px rgba(255,255,255,0.2)',
                    opacity: 0.8,

                    // Animação
                    animation: 'gradient-shift 8s ease infinite',
                    transform: 'translateZ(0)', // Forçar camada da GPU
                }}
            />

            {/* ==================== BOTÃO PRINCIPAL ==================== */}
            <button
                disabled={disabled || loading}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    // ===== LAYOUT =====
                    width: '100%',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    position: 'relative',

                    // ===== GRADIENTE HOLOGRÁFICO =====
                    borderRadius: '9999px',
                    backgroundImage: 'linear-gradient(135deg, #3abff8, #0ea5e9, #1d4ed8, #06b6d4)',
                    backgroundSize: '300% 300%',

                    // ===== BORDA =====
                    border: '2px solid transparent',
                    backgroundClip: 'padding-box',

                    // ===== COR DO TEXTO =====
                    color: '#ffffff',

                    // ===== TIPOGRAFIA =====
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',

                    // ===== SOMBRAS E BRILHO =====
                    boxShadow: isHovered
                        ? `0 12px 40px rgba(0, 0, 0, 0.5),
               0 0 30px rgba(58, 191, 248, 0.6),
               0 0 60px rgba(29, 78, 216, 0.4),
               inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                        : `0 8px 32px rgba(0, 0, 0, 0.4),
               0 0 20px rgba(58, 191, 248, 0.4),
               0 0 40px rgba(29, 78, 216, 0.2),
               inset 0 1px 0 rgba(255, 255, 255, 0.3)`,

                    // ===== ANIMAÇÕES =====
                    animation: 'gradient-shift 8s ease infinite, glow-multi 3s ease-in-out infinite',

                    // ===== TRANSFORMAÇÕES =====
                    transform: isHovered
                        ? 'translateY(-3px) scale(1.03)'
                        : 'translateY(0) scale(1)',
                    filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',

                    // ===== INTERAÇÃO =====
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 400ms ease',
                    outline: 'none',

                    // ===== PERFORMANCE =====
                    willChange: 'transform, filter'
                }}
                aria-label={text}
                aria-busy={loading}
                aria-disabled={disabled}
            >
                {/* ÍCONE */}
                {showIcon && (
                    <CheckCircle2
                        size={24}
                        strokeWidth={2.5}
                        style={{
                            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                        }}
                    />
                )}

                {/* TEXTO */}
                {loading ? 'Finalizando...' : text}
            </button>

            {/* ==================== ANIMAÇÕES CSS ==================== */}
            <style>{`
        @keyframes gradient-shift {
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }
        
        @keyframes glow-multi {
          0%, 100% { 
            filter: brightness(1) saturate(1); 
          }
          50% { 
            filter: brightness(1.15) saturate(1.2); 
          }
        }
      `}</style>
        </div>
    );
}

export default CyanSystemButton;
