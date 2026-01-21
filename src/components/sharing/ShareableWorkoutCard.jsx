import React, { forwardRef } from 'react';
import { Activity, Clock, Dumbbell, Trophy, User, Weight } from 'lucide-react';

export const ShareableWorkoutCard = forwardRef(({ session, userName }, ref) => {
    if (!session) return null;

    // Data
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

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
                justifyContent: 'center', // Center everything
                padding: '20px',
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
                }}
            />

            {/* Overall Darkening Overlay (Scrim) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(2, 6, 23, 0.4)', // Slightly darken everything
                zIndex: 1
            }} />

            {/* --- CENTRAL GLASS CARD --- */}
            {/* --- CENTRAL CARD (Simpler for html2canvas) --- */}
            <div style={{
                position: 'relative', // REQUIRED for zIndex to work reliably in html2canvas
                zIndex: 10,
                width: '100%',
                maxWidth: '320px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)', // Solid dark slate, high opacity
                borderRadius: '32px',
                border: '2px solid rgba(255, 255, 255, 0.2)', // Thicker border
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)' // Strong shadow
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#22d3ee', // Cyan
                }}>
                    <Activity size={18} />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>Vitalità</span>
                </div>

                {/* Main Stat: Volume */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    padding: '24px 0',
                    width: '100%'
                }}>
                    <span style={{
                        fontSize: '14px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600',
                        marginBottom: '8px'
                    }}>Peso Total Levantado</span>

                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px'
                    }}>
                        <h1 style={{
                            fontSize: '80px',
                            fontWeight: '900',
                            lineHeight: '1',
                            margin: 0,
                            color: 'white',
                            textShadow: '0 0 20px rgba(34, 211, 238, 0.3)'
                        }}>
                            {session.volumeLoad}
                        </h1>
                        <span style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#22d3ee'
                        }}>KG</span>
                    </div>
                </div>

                {/* Secondary Info */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        {session.templateName}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '4px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <Clock size={14} />
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{session.duration}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <Dumbbell size={14} />
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Treino Concluído</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                zIndex: 10,
                opacity: 0.6
            }}>
                <div style={{
                    height: '4px',
                    width: '40px',
                    borderRadius: '2px',
                    background: 'white',
                }} />
            </div>

        </div>
    );
});
