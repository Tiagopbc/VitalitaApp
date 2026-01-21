import React, { forwardRef } from 'react';
import { Activity, Clock, Dumbbell, Trophy, User } from 'lucide-react';

export const ShareableWorkoutCard = forwardRef(({ session, userName }, ref) => {
    if (!session) return null;

    // Data
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    /**
     * SISTEMA DE DESIGN: "Midnight Glass"
     * Layout: OPÇÃO 2 - "PÔSTER SUPER-VISUAL"
     * Foco: Fundo 3D Cinemático + Tipografia Maciça
     */

    const colors = {
        cyan: '#22d3ee',    // Cyan-400
        cyanGlow: 'rgba(34, 211, 238, 0.8)',
        blue: '#3b82f6',    // Blue-500
        textMain: '#ffffff',
        textMuted: '#94a3b8'
    };

    return (
        <div
            ref={ref}
            id="share-card"
            style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: '400px', // Story width
                height: '711px', // 9:16
                backgroundColor: '#020617',
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '40px 20px',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* --- BACKGROUND --- */}
            <img
                src="/bg-share-dumbbells.png"
                alt="Background"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    opacity: 0.6
                }}
            />

            {/* Darker Gradient Scrim for Contrast */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    linear-gradient(to bottom, 
                        rgba(2,6,23,0.9) 0%, 
                        rgba(2,6,23,0.4) 30%, 
                        rgba(2,6,23,0.4) 70%, 
                        rgba(2,6,23,0.95) 100%
                    )
                `,
                zIndex: 1
            }} />

            {/* --- CONTENT Z-INDEX 10 --- */}

            {/* 1. HEADER LOGO */}
            <div style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                    fontWeight: '800',
                    letterSpacing: '4px',
                    color: '#22d3ee',
                    textShadow: '0 0 10px rgba(34,211,238,0.5)'
                }}>
                    <Activity size={20} />
                    <span>VITALITÀ</span>
                </div>
            </div>

            {/* 2. HERO NUMBER (CENTER) */}
            <div style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                marginTop: '-40px' // Visual offset
            }}>
                {/* GLOWING NUMBER (SOLID WHITE) */}
                <h1 style={{
                    fontSize: '140px',
                    lineHeight: '0.85',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '900',
                    margin: 0,
                    color: '#ffffff', // Branco Sólido
                    textShadow: '0 0 40px rgba(34,211,238,0.5)', // Strong Cyan Glow
                    letterSpacing: '-6px',
                    textAlign: 'center'
                }}>
                    {session.volumeLoad}
                </h1>

                {/* LABEL UNDERNEATH */}
                <h2 style={{
                    fontSize: '52px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                    margin: 0,
                    marginTop: '0px',
                    color: 'transparent',
                    WebkitTextStroke: '2px #22d3ee', // Hollow outline effect
                    textShadow: '0 0 20px rgba(34,211,238,0.4)',
                    opacity: 1
                }}>
                    KILOS
                </h2>
            </div>

            {/* 3. FOOTER INFO */}
            <div style={{
                zIndex: 10,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px'
            }}>
                <div style={{
                    fontSize: '24px',
                    fontWeight: '500',
                    color: '#ffffff', // Branco Sólido
                    fontFamily: 'sans-serif',
                    letterSpacing: '1px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                    Volume Empilhado
                </div>

                <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#22d3ee', // Cyan accent
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(2, 6, 23, 0.6)',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    border: '1px solid rgba(34,211,238,0.3)',
                    boxShadow: '0 0 15px rgba(34,211,238,0.1)',
                    backdropFilter: 'blur(4px)'
                }}>
                    {session.templateName}
                    <span style={{ margin: '0 8px', color: '#94a3b8' }}>|</span>
                    {session.duration}
                </div>

                {/* Faux Button / Branding at bottom similar to reference "Share to Story" look but informational */}
                <div style={{
                    marginTop: '20px',
                    height: '4px',
                    width: '60px',
                    borderRadius: '2px',
                    background: '#22d3ee',
                    boxShadow: '0 0 10px #22d3ee'
                }} />
            </div>
        </div>
    );
});
