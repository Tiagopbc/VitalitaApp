import React, { forwardRef, useEffect } from 'react';

// Fundo limpo sem elementos pré-renderizados
const shareCardBgSrc = '/bg-share-dumbbells.jpg';

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
        if (!ctx) return;

        // Limpar canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const img = new Image();
        const logoImg = new Image();
        img.crossOrigin = 'anonymous'; 
        logoImg.crossOrigin = 'anonymous'; 

        let imagesLoaded = 0;
        const checkReady = () => {
            imagesLoaded++;
            if (imagesLoaded === 2) drawCanvas();
        };

        const fallbackReady = () => {
            // Em caso de erro numa imagem, ainda tentamos desenhar para não travar no fundo preto
            imagesLoaded++;
            if (imagesLoaded === 2) drawCanvas();
        };

        img.onload = checkReady;
        img.onerror = fallbackReady;
        logoImg.onload = checkReady;
        logoImg.onerror = fallbackReady;
        
        img.src = shareCardBgSrc;
        logoImg.src = '/pwa-512x512.png'; // Usando o icone do PWA que normalmente tem fundo transparente

        const drawCanvas = () => {
            // Desenha a imagem cobrindo o canvas
            const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const dx = (canvasWidth / 2) - (img.width / 2) * scale;
            const dy = (canvasHeight / 2) - (img.height / 2) * scale;
            if (img.width > 0) {
                ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
            }

            // Escurecer sutilmente o fundo para os textos destacarem mais
            ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // 1. LOGO DO APP (Com clip path arredondado para evitar bordas pretas do PNG)
            const logoSize = 130;
            const logoY = 130;
            if (logoImg.width > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect((canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize, 30);
                ctx.clip();
                ctx.drawImage(logoImg, (canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize);
                ctx.restore();
            }

            // 2. TREINO CONCLUÍDO (Cápsula)
            const labelY = 340;
            ctx.font = '700 28px "Inter", sans-serif';
            const labelText = 'TREINO CONCLUÍDO';
            
            const labelMetrics = ctx.measureText(labelText);
            const labelWidth = labelMetrics.width + 80; // Padding horizontal seguro
            const labelHeight = 54;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect((canvasWidth / 2) - (labelWidth / 2), labelY - (labelHeight / 2), labelWidth, labelHeight, 27);
            ctx.stroke();

            applyGlow('#e2f8ff', 'rgba(0,0,0,0.5)', { blur: 4, y: 2 });
            ctx.fillText(labelText, canvasWidth / 2, labelY);
            resetShadow();

            // 3. NOME DO ATLETA
            const nameY = 415;
            applyGlow('#ffffff', 'rgba(0,0,0,0.7)', { blur: 12, y: 4 });
            ctx.font = '800 48px "Outfit", "Inter", sans-serif'; 
            ctx.fillText(displayName, canvasWidth / 2, nameY);
            resetShadow();

            // 4. VOLUME GIGANTE
            const volumeY = 800;
            applyGlow('#ffffff', 'rgba(0,0,0,0.6)', { blur: 20, y: 8 });
            ctx.font = `900 ${volumeFontSize * 2}px "Outfit", "Inter", sans-serif`;
            ctx.fillText(volumeValue, canvasWidth / 2, volumeY);
            resetShadow();

            // 5. KILOS (Texto Vazado)
            const kilosY = 1040;
            ctx.font = '900 130px "Outfit", "Inter", sans-serif';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 6;
            ctx.strokeText('KILOS', canvasWidth / 2, kilosY);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillText('KILOS', canvasWidth / 2, kilosY);
            resetShadow();

            // 6. VOLUME EMPILHADO
            const subtitleVolY = 1250;
            applyGlow('#94a3b8', 'rgba(0,0,0,0.6)', { blur: 4, y: 2 });
            ctx.font = '600 38px "Inter", sans-serif';
            ctx.fillText('VOLUME EMPILHADO', canvasWidth / 2, subtitleVolY);
            resetShadow();

            // 7. TÍTULO DO TREINO
            const titleY = 1520;
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 8, y: 4 });
            ctx.font = '800 56px "Outfit", "Inter", sans-serif';
            ctx.fillText(templateTitle, canvasWidth / 2, titleY);
            resetShadow();

            // 8. SUBTÍTULO DO TREINO
            if (templateSubtitle) {
                const subTitleY = 1600;
                applyGlow('#94a3b8', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
                ctx.font = '600 41px "Inter", sans-serif';
                ctx.fillText(templateSubtitle, canvasWidth / 2, subTitleY);
                resetShadow();
            }

            // 9. CÁPSULAS DE TEMPO E EXERCÍCIOS
            const capsY = 1750;
            const capsHeight = 74;
            
            const leftX = canvasWidth / 2 - 210;
            const rightX = canvasWidth / 2 + 210;

            const drawPill = (x, y, text) => {
                ctx.font = '700 34px "Inter", sans-serif';
                const metrics = ctx.measureText(text);
                const capsWidth = Math.max(160, metrics.width + 70); // Mais justo ao texto
                
                ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; 
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.roundRect(x - (capsWidth / 2), y - (capsHeight / 2), capsWidth, capsHeight, capsHeight / 2);
                ctx.fill();
                ctx.stroke();

                applyGlow('#f8fafc', 'rgba(0,0,0,0.65)', { blur: 4, y: 2 });
                ctx.fillText(text, x, y);
                resetShadow();
            };

            drawPill(leftX, capsY, session.duration);
            drawPill(rightX, capsY, `${session.exercisesCount} EXERCÍCIOS`);
        };

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
