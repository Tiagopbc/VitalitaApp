import React, { forwardRef } from 'react';
import { Activity } from 'lucide-react';

import bgShareDumbbells from '../../assets/bg-share-dumbbells.png';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {
    if (!session) return null;

    // Use a high-quality shiny text color to simulate the reference without risky gradients
    // Reference has a white/cyan metallic look.
    const metallicColor = '#e0f2fe'; // Sky-100 (very light blue/white)
    const cyanAccent = '#22d3ee'; // Cyan-400
    const volumeValue = Number(session.volumeLoad || 0).toLocaleString('pt-BR');
    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';

    const baseStyles = isVisible ? {
        position: 'relative',
        boxShadow: '0 30px 70px -30px rgba(0, 0, 0, 0.7)'
    } : {
        position: 'fixed',
        left: '-9999px',
        top: 0
    };

    return (
        <div
            ref={ref}
            id="share-card"
            style={{
                ...baseStyles,
                width: '400px',
                height: '711px', // 9:16 aspect ratio
                backgroundColor: '#020617',
                // fontFamily: "'Inter', sans-serif", // Removed to use global defaults
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '32px 22px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderRadius: isVisible ? '24px' : '0',
                border: '1px solid rgba(148, 163, 184, 0.15)'
            }}
        >
            {/* --- BACKGROUND IMAGE --- */}
            <img
                src={bgShareDumbbells}
                alt="Background"
                crossOrigin="anonymous"
                loading="eager"
                decoding="sync"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    opacity: 0.65
                }}
            />

            {/* --- VIGNETTE OVERLAY --- */}
            {/* Subtle darkening at top/bottom for readability without a full box */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    linear-gradient(to bottom, 
                        rgba(2,6,23,0.85) 0%, 
                        rgba(2,6,23,0.25) 30%, 
                        rgba(2,6,23,0.25) 65%, 
                        rgba(2,6,23,0.92) 100%
                    )
                `,
                zIndex: 1
            }} />

            {/* --- SOFT GLOW LAYERS --- */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    radial-gradient(circle at 50% 20%, rgba(34,211,238,0.18), transparent 55%),
                    radial-gradient(circle at 50% 85%, rgba(56,189,248,0.12), transparent 60%)
                `,
                zIndex: 2
            }} />

            {/* --- CONTENT CONTAINER --- */}
            <div style={{
                zIndex: 5,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative' // For zIndex
            }}>

                {/* 1. TOP BAR */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '6px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '999px',
                            background: 'rgba(34,211,238,0.12)',
                            border: '1px solid rgba(34,211,238,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 18px rgba(34,211,238,0.35)'
                        }}>
                            <Activity size={20} color={cyanAccent} strokeWidth={2.5} />
                        </div>
                        <span style={{
                            fontSize: '16px',
                            fontWeight: '800',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            color: cyanAccent,
                            textShadow: `0 0 15px ${cyanAccent}`,
                            fontFamily: 'var(--font-heading)'
                        }}>Vitalità</span>
                    </div>

                    <div style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: 'rgba(2,6,23,0.65)',
                        border: '1px solid rgba(148,163,184,0.35)',
                        color: '#e2e8f0',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-sans)'
                    }}>
                        Treino Concluído
                    </div>
                </div>

                {/* 2. HERO STATS (CENTERED) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1, // Takes available space
                    gap: '6px',
                    marginTop: '-10px' // Visual offset to center over dumbbells
                }}>
                    <div style={{
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        color: '#7dd3fc',
                        fontWeight: '700',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        {displayName}
                    </div>
                    <h1 style={{
                        fontSize: '152px',
                        fontWeight: '900',
                        lineHeight: '0.9',
                        margin: 0,
                        color: '#ffffff',
                        letterSpacing: '-8px',
                        // Strong dual shadow for "pop" against busy background
                        textShadow: `
                            0 10px 30px rgba(0,0,0,0.5),
                            0 0 20px rgba(34,211,238,0.4)
                        `,
                        fontFamily: 'var(--font-heading)'
                    }}>
                        {volumeValue}
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '10px',
                        marginTop: '6px'
                    }}>
                        <h2 style={{
                            fontSize: '60px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            margin: 0,
                            color: 'transparent',
                            // Outline effect simulation
                            WebkitTextStroke: `2px ${metallicColor}`,
                            textShadow: '0 0 20px rgba(0,0,0,0.5)',
                            letterSpacing: '2px',
                            opacity: 0.95,
                            fontFamily: 'var(--font-heading)'
                        }}>
                            KILOS
                        </h2>
                        <span style={{
                            fontSize: '14px',
                            color: '#cbd5e1',
                            textTransform: 'uppercase',
                            letterSpacing: '2.5px',
                            fontWeight: '600'
                        }}>
                            Volume Empilhado
                        </span>
                    </div>
                </div>

                {/* 3. FOOTER INFO */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '6px',
                    gap: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            color: cyanAccent,
                            letterSpacing: '1px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {session.templateName}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginTop: '6px'
                        }}>
                            <span style={{
                                fontSize: '13px',
                                color: '#e2e8f0',
                                fontWeight: '700',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                background: 'rgba(15,23,42,0.7)',
                                border: '1px solid rgba(148,163,184,0.25)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {session.duration}
                            </span>
                            <span style={{
                                fontSize: '13px',
                                color: '#e2e8f0',
                                fontWeight: '700',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                background: 'rgba(15,23,42,0.7)',
                                border: '1px solid rgba(148,163,184,0.25)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {session.exercisesCount} Exercícios
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
});

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';
