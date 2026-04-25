import React, { forwardRef, useEffect } from 'react';

// Fundo otimizado com elementos fixos assados.
const shareCardBgSrc = '/bg-share-template.jpg';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {

    // Resolvendo Variáveis (mesmo sem session para evitar hooks quebrando)
    const volumeValue = session ? Number(session.volumeLoad || 0).toLocaleString('pt-BR') : '0';
    const volumeFontSize = session ? Math.max(144, 198 - Math.max(0, volumeValue.length - 6) * 19) : 157;
    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';
    const templateLabel = session ? (session.templateName || 'Treino Personalizado').toString() : '';
    const templateParts = templateLabel.split(/\s[-–—]\s/);
    const templateTitle = (templateParts[0] || templateLabel).trim();
    const templateSubtitle = templateParts.slice(1).join(' - ').trim();
    const cyanAccent = '#22d3ee';

    // Resolução visual: 400x711 | Resolução interna (Instagram Story): 1080x1920
    const canvasWidth = 1080;
    const canvasHeight = 1920;

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
            // Desenha a imagem cobrindo o canvas (object-fit: cover)
            const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const dx = (canvasWidth / 2) - (img.width / 2) * scale;
            const dy = (canvasHeight / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);

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
            ctx.font = '800 47px "Outfit", "Inter", sans-serif'; 
            canvas.style.letterSpacing = '4px'; 
            const nameToDraw = displayName.split('').join(String.fromCharCode(8201)); 
            ctx.fillText(nameToDraw, canvasWidth / 2, 315);

            // 2. VOLUME GIGANTE
            applyGlow('#ffffff', 'rgba(0,0,0,0.42)', { blur: 18, y: 6 });
            ctx.font = `900 ${volumeFontSize * 2}px "Outfit", "Inter", sans-serif`;
            ctx.fillText(volumeValue, canvasWidth / 2, 409);

            // 3. TÍTULO DO TREINO
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 4, y: 2 });
            ctx.font = '800 56px "Outfit", "Inter", sans-serif';
            ctx.fillText(templateTitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 1542);

            // 4. SUBTÍTULO
            if (templateSubtitle) {
                applyGlow('#94a3b8', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
                ctx.font = '600 41px "Inter", sans-serif';
                ctx.fillText(templateSubtitle.split('').join(String.fromCharCode(8201)), canvasWidth / 2, 1621);
            }

            // 5. CÁPSULAS DE BASE
            ctx.textBaseline = 'middle'; 
            applyGlow('#e2e8f0', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
            ctx.font = '700 41px "Inter", sans-serif';
            
            ctx.fillText(session.duration.split('').join(String.fromCharCode(8201)), 220, 1749);
            
            const exTxt = `${session.exercisesCount} EXERCÍCIOS`.split('').join(String.fromCharCode(8201));
            ctx.fillText(exTxt, 860, 1749);

            resetShadow(); 
        };
        img.src = shareCardBgSrc;

    }, [session, displayName, volumeValue, volumeFontSize, templateTitle, templateSubtitle, cyanAccent, ref]);

    if (!session) return null;

    const baseStyles = isVisible ? {
        position: 'relative',
        boxShadow: '0 18px 44px -22px rgba(0, 0, 0, 0.65)',
        width: '400px',
        height: '711px',
        borderRadius: '24px',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        backgroundColor: '#020617',
    } : {
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '400px',
        height: '711px'
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
