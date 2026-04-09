import React, { forwardRef, useEffect } from 'react';

// Fundo otimizado com elementos fixos assados.
const shareCardBgSrc = '/bg-share-template.jpg';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {

    // Resolvendo Variáveis (mesmo sem session para evitar hooks quebrando)
    const volumeValue = session ? Number(session.volumeLoad || 0).toLocaleString('pt-BR') : '0';
    const volumeFontSize = session ? Math.max(92, 126 - Math.max(0, volumeValue.length - 6) * 12) : 100;
    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';
    const templateLabel = session ? (session.templateName || 'Treino Personalizado').toString() : '';
    const templateParts = templateLabel.split(/\s[-–—]\s/);
    const templateTitle = (templateParts[0] || templateLabel).trim();
    const templateSubtitle = templateParts.slice(1).join(' - ').trim();
    const cyanAccent = '#22d3ee';

    // Resolução visual: 400x610 | Resolução interna (Retina 2x): 800x1220
    const canvasWidth = 800;
    const canvasHeight = 1220;

    useEffect(() => {
        if (!session) return;
        const canvas = ref?.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');

        // Limpar canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => {
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

            // 1. NOME
            ctx.textBaseline = 'top';
            applyGlow('#e2f8ff', 'rgba(0,0,0,0.7)', { blur: 12, y: 4 });
            ctx.font = '800 30px "Outfit", "Inter", sans-serif'; 
            canvas.style.letterSpacing = '4px'; 
            const nameToDraw = displayName.split('').join(String.fromCharCode(8201)); 
            ctx.fillText(nameToDraw, canvasWidth / 2, 200);

            // 2. VOLUME GIGANTE
            applyGlow('#ffffff', 'rgba(0,0,0,0.42)', { blur: 18, y: 6 });
            ctx.font = `900 ${volumeFontSize * 2}px "Outfit", "Inter", sans-serif`;
            ctx.fillText(volumeValue, canvasWidth / 2, 260);

            // 3. TÍTULO DO TREINO
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 4, y: 2 });
            ctx.font = '800 36px "Outfit", "Inter", sans-serif';
            ctx.fillText(templateTitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 980);

            // 4. SUBTÍTULO
            if (templateSubtitle) {
                applyGlow('#94a3b8', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
                ctx.font = '600 26px "Inter", sans-serif';
                ctx.fillText(templateSubtitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 1030);
            }

            // 5. CÁPSULAS DE BASE
            ctx.textBaseline = 'middle'; 
            applyGlow('#e2e8f0', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
            ctx.font = '700 26px "Inter", sans-serif';
            
            ctx.fillText(session.duration.split('').join(String.fromCharCode(8201)), 200, 1111);
            
            const exTxt = `${session.exercisesCount} EXERCÍCIOS`.split('').join(String.fromCharCode(8201));
            ctx.fillText(exTxt, 600, 1111);

            resetShadow(); 
        };
        img.src = shareCardBgSrc;

    }, [session, displayName, volumeValue, volumeFontSize, templateTitle, templateSubtitle, cyanAccent, ref]);

    if (!session) return null;

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
