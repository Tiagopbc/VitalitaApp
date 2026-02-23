import React, { forwardRef, useState } from 'react';
import { Activity } from 'lucide-react';

const shareCardBgSrc = '/bg-share-dumbbells.jpg';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {
    const [logoFailed, setLogoFailed] = useState(false);

    if (!session) return null;

    // Use a high-quality shiny text color to simulate the reference without risky gradients
    // Reference has a white/cyan metallic look.
    const metallicColor = '#e0f2fe'; // Sky-100 (very light blue/white)
    const cyanAccent = '#22d3ee'; // Cyan-400
    const volumeValue = Number(session.volumeLoad || 0).toLocaleString('pt-BR');
    const volumeFontSize = Math.max(92, 126 - Math.max(0, volumeValue.length - 6) * 12);
    const volumeLetterSpacing = volumeValue.length >= 7 ? '-4px' : '-6px';
    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';
    const templateLabel = (session.templateName || 'Treino Personalizado').toString();
    const templateParts = templateLabel.split(/\s[-–—]\s/);
    const templateTitle = (templateParts[0] || templateLabel).trim();
    const templateSubtitle = templateParts.slice(1).join(' - ').trim();

    const baseStyles = isVisible ? {
        position: 'relative',
        boxShadow: '0 18px 44px -22px rgba(0, 0, 0, 0.65)'
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
                src={shareCardBgSrc}
                alt="Background"
                crossOrigin="anonymous"
                loading="eager"
                decoding="async"
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
                    radial-gradient(240px 200px at 14% 6%,
                        rgba(2,6,23,0.98) 0%,
                        rgba(2,6,23,0.85) 40%,
                        rgba(2,6,23,0) 70%
                    ),
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

                {/* 1. TOP BRAND */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '0px'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {!logoFailed && (
                            <img
                                src="/pwa-192x192.png"
                                alt="Vitalità"
                                loading="eager"
                                decoding="async"
                                style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '16px',
                                    objectFit: 'cover',
                                    boxShadow: '0 0 18px rgba(34,211,238,0.35)'
                                }}
                                onError={() => setLogoFailed(true)}
                            />
                        )}
                        {logoFailed && <Activity size={22} color={cyanAccent} strokeWidth={2.5} />}
                    </div>

                    <div style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: 'rgba(2,6,23,0.35)',
                        border: '1px solid rgba(148,163,184,0.35)',
                        color: '#e2e8f0',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-sans)',
                        boxShadow: '0 0 12px rgba(34,211,238,0.2)'
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
                    marginTop: '8px' // More breathing room below brand
                }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            position: 'absolute',
                            left: '-32px',
                            right: '-32px',
                            height: '26px',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.32) 40%, rgba(34,211,238,0) 100%)',
                            filter: 'blur(8px)',
                            opacity: 0.7
                        }} />
                        <div style={{
                            fontSize: '15px',
                            textTransform: 'uppercase',
                            letterSpacing: '4px',
                            color: '#e2f8ff',
                            fontWeight: '800',
                            textShadow: '0 2px 10px rgba(34,211,238,0.35), 0 2px 6px rgba(0,0,0,0.7)',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-heading)',
                            marginTop: '6px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(2,6,23,0.35)',
                            border: '1px solid rgba(34,211,238,0.25)',
                            position: 'relative'
                        }}>
                            {displayName}
                        </div>
                    </div>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <h1 style={{
                            fontSize: `${volumeFontSize}px`,
                            fontWeight: '900',
                            lineHeight: '0.92',
                            margin: 0,
                            color: '#ffffff',
                            letterSpacing: volumeLetterSpacing,
                            textShadow: '0 6px 18px rgba(0,0,0,0.42)',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {volumeValue}
                        </h1>
                    </div>
                    <div style={{
                        width: '140px',
                        height: '2px',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.7) 50%, rgba(34,211,238,0) 100%)',
                        boxShadow: '0 0 14px rgba(34,211,238,0.35)',
                        marginTop: '2px'
                    }} />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '10px'
                    }}>
                        <h2 style={{
                            fontSize: '44px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            margin: 0,
                            color: 'rgba(2,6,23,0.9)',
                            WebkitTextStroke: `2px ${metallicColor}`,
                            textShadow: '0 0 18px rgba(0,0,0,0.45)',
                            letterSpacing: '2px',
                            opacity: 0.95,
                            fontFamily: 'var(--font-heading)'
                        }}>
                            KILOS
                        </h2>
                        <span style={{
                            fontSize: '12px',
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
                            letterSpacing: '1.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {templateTitle}
                        </div>
                        {templateSubtitle && (
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                color: '#94a3b8',
                                letterSpacing: '1.5px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.65)',
                                fontFamily: 'var(--font-sans)'
                            }}>
                                {templateSubtitle}
                            </div>
                        )}
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
                                letterSpacing: '2px'
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
                                letterSpacing: '2px'
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
