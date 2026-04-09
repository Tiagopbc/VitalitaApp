import React, { forwardRef, useState, useEffect } from 'react';

// Fundo otimizado com elementos fixos assados.
const shareCardBgSrc = '/bg-share-template.jpg';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {

    const [bgImage, setBgImage] = useState(shareCardBgSrc);

    // Converte a imagem de fundo em Base64 assim que o card renderiza invisível, 
    // garantindo que o html-to-image e o Safari sempre renderizem a foto na hora do click.
    useEffect(() => {
        let isMounted = true;
        fetch(shareCardBgSrc)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted) setBgImage(reader.result);
                };
                reader.readAsDataURL(blob);
            })
            .catch(console.error);
        return () => { isMounted = false; };
    }, []);

    if (!session) return null;

    // Resolução visual: 400x610 | Resolução interna (Retina 2x): 800x1220
    const canvasWidth = 800;
    const canvasHeight = 1220;

    React.useEffect(() => {
        const canvas = ref?.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Limpar canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Preenche de preto padrão se demorar
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const img = new Image();
        img.crossOrigin = 'anonymous'; // apenas para sanidade
        img.onload = () => {
            // 1. Desenha Imagem de Fundo (100% de cobertura)
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            // FUNÇÃO AUXILIAR PARA COR E SOMBRA
            const applyGlow = (color, blurClass, offsetClass) => {
                ctx.fillStyle = color;
                ctx.shadowColor = blurClass;
                ctx.shadowBlur = offsetClass.blur || 0;
                ctx.shadowOffsetY = offsetClass.y || 0;
                ctx.shadowOffsetX = 0;
            };

            const resetShadow = () => {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
            };

            ctx.textAlign = 'center';

            // ATENÇÃO: As posições Y abaixo foram traduzidas em escala 2x usando a sua referência!
            // Ex: CSS top 100px -> Canvas Y = 200px.

            // ============================================
            // 1. NOME
            // ============================================
            ctx.textBaseline = 'top';
            applyGlow('#e2f8ff', 'rgba(0,0,0,0.7)', { blur: 12, y: 4 });
            ctx.font = '800 30px "Outfit", "Inter", sans-serif'; 
            // LetterSpacing em canvas é recente, podemos simular adicionando espaços,
            // mas o suporte nativo já é bom via estilo do Javascript moderno:
            canvas.style.letterSpacing = '4px'; // Fallback visual, não afeta fillText em alguns browsers!
            // Para garantir o visual no canvas nativo sem bugs:
            const nameToDraw = displayName.split('').join(String.fromCharCode(8201)); // Thin space hack
            ctx.fillText(nameToDraw, canvasWidth / 2, 200);

            // ============================================
            // 2. VOLUME GIGANTE
            // ============================================
            applyGlow('#ffffff', 'rgba(0,0,0,0.42)', { blur: 18, y: 6 });
            ctx.font = `900 ${volumeFontSize * 2}px "Outfit", "Inter", sans-serif`;
            // Reduzimos o tracking (letterSpacing negativo) um pouquinho na fonte grande.
            ctx.fillText(volumeValue, canvasWidth / 2, 260);

            // ============================================
            // 3. TÍTULO DO TREINO
            // ============================================
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 4, y: 2 });
            ctx.font = '800 36px "Outfit", "Inter", sans-serif';
            ctx.fillText(templateTitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 980);

            // ============================================
            // 4. SUBTÍTULO
            // ============================================
            if (templateSubtitle) {
                applyGlow('#94a3b8', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
                ctx.font = '600 26px "Inter", sans-serif';
                ctx.fillText(templateSubtitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 1030);
            }

            // ============================================
            // 5. CÁPSULAS DE BASE (Exatamente nas Metades Polares: 25% e 75% da largura)
            // ============================================
            ctx.textBaseline = 'middle'; 
            applyGlow('#e2e8f0', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
            ctx.font = '700 26px "Inter", sans-serif';
            
            // X: 200 (25% = Centro da Pílula Esquerda), Y: 1116 (calculado para encaixar)
            ctx.fillText(session.duration.split('').join(String.fromCharCode(8201)), 200, 1111);
            
            // X: 600 (75% = Centro da Pílula Direita)
            const exTxt = `${session.exercisesCount} EXERCÍCIOS`.split('').join(String.fromCharCode(8201));
            ctx.fillText(exTxt, 600, 1111);

            resetShadow(); // Limpeza
        };
        img.src = shareCardBgSrc;

    }, [session, displayName, volumeValue, volumeFontSize, templateTitle, templateSubtitle, cyanAccent, ref]);

    const baseStyles = isVisible ? {
        position: 'relative',
        boxShadow: '0 18px 44px -22px rgba(0, 0, 0, 0.65)',
        width: '400px',
        height: '610px',
        borderRadius: '24px',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        backgroundColor: '#020617',
    } : {
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '400px',
        height: '610px'
    };

    return (
        <canvas
            ref={ref}
            width={canvasWidth}
            height={canvasHeight}
            id="share-card-canvas"
            style={baseStyles}
        />
    );
});

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';
