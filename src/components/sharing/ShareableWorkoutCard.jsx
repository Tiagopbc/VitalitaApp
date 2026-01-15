import React, { forwardRef } from 'react';
import { Activity, Clock, Dumbbell, Trophy, User } from 'lucide-react';

export const ShareableWorkoutCard = forwardRef(({ session, userName }, ref) => {
    if (!session) return null;

    // Date
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    /**
     * DESIGN SYSTEM: "Midnight Glass"
     * Layout: OPTION 2 - "HYPER-VISUAL POSTER"
     * Focus: Cinematic 3D Background + Massive Typography
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
                width: '400px', // Standard Story width
                height: '711px', // 9:16 aspect ratio
                backgroundColor: '#020617',
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0', // No padding, full bleed
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* --- BACKGROUND LAYER --- */}
            {/* 1. 3D Render Image */}
            <img
                src="/bg-share-dumbbells.png"
                alt="Background"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }}
            />

            {/* 2. Gradient Scrims for Readability */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    linear-gradient(to bottom, #020617 0%, transparent 20%, transparent 50%, #020617 90%),
                    radial-gradient(circle at center, transparent 0%, rgba(2, 6, 23, 0.6) 100%)
                `,
                zIndex: 1
            }} />

            {/* --- CONTENT LAYER --- */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '32px'
            }}>

                {/* 1. HEADER */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Activity size={16} color={colors.cyan} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            VITALITÀ
                        </span>
                    </div>
                </div>

                {/* 2. CENTER: MASSIVE STATS */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: '10px' // Closer together
                }}>
                    {/* The Number */}
                    <div style={{ position: 'relative' }}>
                        <h1 style={{
                            fontSize: '140px', // Massive
                            lineHeight: '0.9',
                            fontWeight: '900',
                            margin: 0,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${colors.cyan}`, // Outline effect like the reference
                            textShadow: `0 0 30px ${colors.cyanGlow}`,
                            letterSpacing: '-5px',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {(session.volumeLoad / 1000).toFixed(1)}
                        </h1>

                        {/* Glow Layer underneath for intensity */}
                        <h1 style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            fontSize: '140px',
                            lineHeight: '0.9',
                            fontWeight: '900',
                            margin: 0,
                            color: colors.cyan,
                            opacity: 0.2,
                            filter: 'blur(10px)',
                            zIndex: -1,
                            letterSpacing: '-5px',
                        }}>
                            {(session.volumeLoad / 1000).toFixed(1)}
                        </h1>
                    </div>

                    {/* The Label "KILOS" / "TONS" */}
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '900',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '8px',
                        marginTop: '-10px',
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                        {/* Kilos sounds more "bodybuilding", TON sounds "powerlifting". 
                           Let's use "KILOS" as requested in the reference image if it fits? 
                           Actually reference image had "KILOS" outline. 
                           However, users usually see Volume in KG. 
                           4.5 TON is cool but let's stick to what we calculated.
                           If val > 1000, maybe display TON? Or just KG?
                           User prompt said: "408 KG" in one image and "4.5 KILOS" (which meant tons probably) in another.
                           Let's show "TONELADAS" if > 1000kg for impact? Or just VOLUME EM KG.
                           Let's stick to "KILOS" if we show the number in KG.
                           Wait, previous code divided by 1000. 
                           If we show "4.5", that is Toneladas. 
                           If we show "4500", that is KG.
                           The reference image had "4.5" and "KILOS" (which is confusing, probably meant Tons).
                           Let's stick to showing the calculated VolumeLoad (which is usually in KG, e.g. 4500).
                           But 4500 is too long for 140px font?
                           Let's use TONELADAS (e.g. 4.5) for that massive cinematic look. */}
                        TONS
                    </div>
                </div>

                {/* 3. BOTTOM INFO */}
                <div style={{
                    textAlign: 'center',
                    paddingBottom: '20px'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '8px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        Volume Empilhado
                    </h2>

                    <h3 style={{
                        fontSize: '16px',
                        color: colors.textMuted,
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        marginBottom: '4px'
                    }}>
                        {session.templateName}
                    </h3>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: colors.cyan,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        <span>{session.duration}</span>
                        <span>|</span>
                        <span>{session.exercisesCount} Exercícios</span>
                    </div>

                    {/* Button Simulation (Visual only) */}
                    <div style={{
                        marginTop: '32px',
                        background: `linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)`,
                        height: '1px',
                        width: '80%',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }} />

                    <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                        {formattedDate} • {userName}
                    </div>
                </div>

            </div>
        </div>
    );
});
