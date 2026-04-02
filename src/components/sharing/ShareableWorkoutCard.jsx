import React, { forwardRef } from 'react';

// Fundo otimizado com elementos fixos assados.
const shareCardBgSrc = '/bg-share-template.jpg';

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
                top: '143px', /* Subido milímetros para alinhar na sua arte */
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10
            }}>
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
                    position: 'relative'
                    /* Removi fundos e bordas CSS daqui, pois a cápsula gráfica já está na sua imagem JPG de fundo */
                }}>
                    {displayName}
                </div>
            </div>

            {/* 2. NÚMERO GIGANTE (VOLUME) */}
            <div style={{
                position: 'absolute',
                top: '170px', /* Movido ainda mais pra cima para desencostar do KILOS */
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
                bottom: '28px', /* Descido para o centro das capsulas do footer */
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                gap: '30px', /* Gap maior para empurrar as palavras para os polos */
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
