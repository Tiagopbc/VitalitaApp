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
                width: '400px', // Largura padrão de Story
                height: '711px', // proporção 9:16
                backgroundColor: '#020617',
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0', // Sem preenchimento, sangria total
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* --- CAMADA DE FUNDO --- */}
            {/* 1. Imagem de Renderização 3D */}
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

            {/* 2. Scrims de Gradiente para Legibilidade */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    linear-gradient(to bottom, #020617 0%, transparent 20%, transparent 50%, #020617 90%),
                    radial-gradient(circle at center, transparent 0%, rgba(2, 6, 23, 0.6) 100%)
                `,
                zIndex: 1
            }} />

            {/* --- CAMADA DE CONTEÚDO --- */}
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

                {/* 1. CABEÇALHO */}
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

                {/* 2. CENTRO: ESTATÍSTICAS MACIÇAS */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: '10px' // Mais próximos
                }}>
                    {/* O Número */}
                    <div style={{ position: 'relative' }}>
                        <h1 style={{
                            fontSize: '140px', // Maciço
                            lineHeight: '0.9',
                            fontWeight: '900',
                            margin: 0,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${colors.cyan}`, // Efeito de contorno como na referência
                            textShadow: `0 0 30px ${colors.cyanGlow}`,
                            letterSpacing: '-5px',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {(session.volumeLoad / 1000).toFixed(1)}
                        </h1>

                        {/* Camada de Brilho por baixo para intensidade */}
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

                    {/* O Rótulo "KILOS" / "TONS" */}
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '900',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '8px',
                        marginTop: '-10px',
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                        {/* Kilos soa mais "fisiculturismo", TON soa "powerlifting". 
                           Vamos usar "KILOS" como solicitado na imagem de referência se couber? 
                           Na verdade a imagem de referência tinha contorno "KILOS". 
                           No entanto, usuários geralmente veem Volume em KG. 
                           4.5 TON é legal mas vamos manter o que calculamos.
                           Se val > 1000, talvez exibir TON? Ou apenas KG?
                           Prompt do usuário disse: "408 KG" em uma imagem e "4.5 KILOS" (o que significava toneladas provavelmente) em outra.
                           Vamos exibir "TONELADAS" se > 1000kg para impacto? Ou apenas VOLUME EM KG.
                           Vamos manter "KILOS" se exibirmos o número em KG.
                           Espere, código anterior dividiu por 1000. 
                           Se exibirmos "4.5", isso é Toneladas. 
                           Se exibirmos "4500", isso é KG.
                           A imagem de referência tinha "4.5" e "KILOS" (o que é confuso, provavelmente significava Toneladas).
                           Vamos continuar exibindo o VolumeLoad calculado (que é geralmente em KG, ex: 4500).
                           Mas 4500 é muito longo para fonte de 140px?
                           Vamos usar TONELADAS (ex: 4.5) para aquele visual cinemático maciço. */}
                        TONS
                    </div>
                </div>

                {/* 3. INFO INFERIOR */}
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

                    {/* Simulação de Botão (Apenas visual) */}
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
