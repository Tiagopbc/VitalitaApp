import React, { forwardRef } from 'react';

// Fundo otimizado com elementos fixos assados.
const shareCardBgSrc = '/bg-share-template.png';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {

    if (!session) return null;

    const volumeValue = Number(session.volumeLoad || 0).toLocaleString('pt-BR');
    const volumeFontSize = Math.max(92, 126 - Math.max(0, volumeValue.length - 6) * 12);
    const volumeLetterSpacing = volumeValue.length >= 7 ? '-4px' : '-6px';
    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';
    const templateLabel = (session.templateName || 'Treino Personalizado').toString();
    const templateParts = templateLabel.split(/\s[-–—]\s/);
    const templateTitle = (templateParts[0] || templateLabel).trim();
    const templateSubtitle = templateParts.slice(1).join(' - ').trim();

    const cyanAccent = '#22d3ee';

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
                height: '711px', // Proporção 9:16 controlada
                backgroundColor: '#020617',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: isVisible ? '24px' : '0',
                border: '1px solid rgba(148, 163, 184, 0.15)'
            }}
        >
            {/* LADO FIXO (TEMPLATE ASSADO DA IMAGEM) */}
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
                    opacity: 1 // Degradês e brilhos removidos daqui, pois estão na imagem!
                }}
            />

            {/* LADO DINÂMICO (DADOS QUE FLUTUAM) */}
            
            {/* 1. NOME DO USUÁRIO */}
            <div style={{
                position: 'absolute',
                top: '160px', /* IMPORTANTE: Ajuste essa distância se a pílula não cair acima do número */
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10
            }}>
                <div style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '-32px',
                        right: '-32px',
                        height: '26px',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.32) 40%, rgba(34,211,238,0) 100%)',
                        boxShadow: '0 0 16px 8px rgba(34,211,238,0.2)',
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
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(2,6,23,0.35)',
                        border: '1px solid rgba(34,211,238,0.25)',
                        position: 'relative'
                    }}>
                        {displayName}
                    </div>
                </div>
            </div>

            {/* 2. NÚMERO GIGANTE (VOLUME) */}
            <div style={{
                position: 'absolute',
                top: '210px', /* IMPORTANTE: Ajuste se o número não cair no exato centro antes da palavra KILOS */
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10
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

            {/* 3. TÍTULO E SUBTÍTULO DO TREINO */}
            <div style={{
                position: 'absolute',
                bottom: '120px', /* IMPORTANTE: Ajuste se as palavras Costas e Bíceps ficarem ruins */
                left: '0',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 10
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
            </div>

            {/* 4. TEMPO E EXERCÍCIOS (TENTANDO DENTRO DAS CAPSULAS) */}
            <div style={{
                position: 'absolute',
                bottom: '38px', /* IMPORTANTE: Ajuste vertical (Top/Bottom) para cair centro na linha contornada da capsula */
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                gap: '24px', /* IMPORTANTE: Largura separando as duas informações. Aumente se não encaixar na caixinha */
                zIndex: 10
            }}>
                {/* Duração */}
                <div style={{
                    width: '130px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.65)',
                }}>
                    {session.duration}
                </div>

                {/* Quantidade */}
                <div style={{
                    width: '130px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.65)',
                }}>
                    {session.exercisesCount} Exercícios
                </div>
            </div>
        </div>
    );
});

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';
