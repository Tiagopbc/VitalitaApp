import React, { forwardRef } from 'react';
import { Activity, Share2 } from 'lucide-react';

export const ShareableWorkoutCard = forwardRef(({ session, userName }, ref) => {
    if (!session) return null;

    // Use a high-quality shiny text color to simulate the reference without risky gradients
    // Reference has a white/cyan metallic look.
    const metallicColor = '#e0f2fe'; // Sky-100 (very light blue/white)
    const cyanAccent = '#22d3ee'; // Cyan-400

    return (
        <div
            ref={ref}
            id="share-card"
            style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: '400px',
                height: '711px', // 9:16 aspect ratio
                backgroundColor: '#020617',
                fontFamily: "'Inter', sans-serif",
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
            {/* --- BACKGROUND IMAGE --- */}
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
                    opacity: 0.7 // Increased visibility to 70%
                }}
            />

            {/* --- VIGNETTE OVERLAY --- */}
            {/* Subtle darkening at top/bottom for readability without a full box */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    linear-gradient(to bottom, 
                        rgba(2,6,23,0.8) 0%, 
                        rgba(2,6,23,0.2) 25%, 
                        rgba(2,6,23,0.2) 60%, 
                        rgba(2,6,23,0.9) 100%
                    )
                `,
                zIndex: 1
            }} />

            {/* --- CONTENT CONTAINER --- */}
            <div style={{
                zIndex: 10,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative' // For zIndex
            }}>

                {/* 1. TOP LOGO */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '20px'
                }}>
                    {/* Custom Logo Icon Mockup */}
                    <Activity size={28} color={cyanAccent} strokeWidth={2.5} />
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        color: cyanAccent,
                        textShadow: `0 0 15px ${cyanAccent}`
                    }}>Vitalità</span>
                </div>

                {/* 2. HERO STATS (CENTERED) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1, // Takes available space
                    gap: '0px',
                    marginTop: '-40px' // Visual offset to center over dumbbells
                }}>
                    <h1 style={{
                        fontSize: '150px',
                        fontWeight: '900',
                        lineHeight: '0.9',
                        margin: 0,
                        color: '#ffffff',
                        letterSpacing: '-8px',
                        // Strong dual shadow for "pop" against busy background
                        textShadow: `
                            0 10px 30px rgba(0,0,0,0.5),
                            0 0 20px rgba(34,211,238,0.4)
                        `
                    }}>
                        {session.volumeLoad}
                    </h1>

                    <h2 style={{
                        fontSize: '64px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        margin: 0,
                        color: 'transparent',
                        // Outline effect simulation
                        WebkitTextStroke: `2px ${metallicColor}`,
                        textShadow: '0 0 20px rgba(0,0,0,0.5)',
                        letterSpacing: '2px',
                        opacity: 0.9,
                        marginTop: '-10px'
                    }}>
                        KILOS
                    </h2>
                </div>

                {/* 3. FOOTER INFO */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '20px',
                    gap: '12px'
                }}>
                    <div style={{
                        fontSize: '28px',
                        color: '#f8fafc',
                        fontFamily: 'sans-serif',
                        letterSpacing: '1px',
                        fontWeight: '500',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        Volume Empilhado
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: cyanAccent,
                            letterSpacing: '1px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            {session.templateName}
                        </div>
                        <div style={{
                            fontSize: '16px',
                            color: '#cbd5e1',
                            fontWeight: '400',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            {session.duration} | {session.exercisesCount} Exercícios
                        </div>
                    </div>

                    {/* Faux Button "Share to Story" */}
                    <div style={{
                        marginTop: '24px',
                        padding: '12px 24px',
                        background: 'linear-gradient(90deg, rgba(6,182,212,0.2) 0%, rgba(34,211,238,0.1) 50%, rgba(6,182,212,0.2) 100%)',
                        border: `1px solid ${cyanAccent}`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: `0 0 15px rgba(34,211,238,0.2)`,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Share2 size={16} color={cyanAccent} />
                        <span style={{
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>Share to Story</span>
                    </div>
                </div>

            </div>
        </div>
    );
});
