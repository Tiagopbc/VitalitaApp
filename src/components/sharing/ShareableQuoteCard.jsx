import React, { forwardRef, useEffect } from 'react';

const shareCardBgSrc = '/bg-share-dumbbells.jpg';

export const ShareableQuoteCard = forwardRef(({ quote, isVisible = false, userName = 'Atleta' }, ref) => {
    
    // Processar frase
    const fullQuote = quote || '';
    const parts = fullQuote.split(' — ');
    const text = parts[0] ? `"${parts[0]}"` : '';
    const author = parts[1] ? `— ${parts[1]}` : '';

    const displayName = (userName || 'Atleta').toString().trim() || 'Atleta';
    const cyanAccent = '#22d3ee';

    // Resolução visual: 400x711 | Resolução interna (Instagram Story): 1080x1920
    const canvasWidth = 1080;
    const canvasHeight = 1920;

    useEffect(() => {
        if (!quote) return;
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
            imagesLoaded++;
            if (imagesLoaded === 2) drawCanvas();
        };

        img.onload = checkReady;
        img.onerror = fallbackReady;
        logoImg.onload = checkReady;
        logoImg.onerror = fallbackReady;
        
        img.src = shareCardBgSrc;
        logoImg.src = '/pwa-512x512.png'; 

        const drawCanvas = () => {
            // 1. FUNDO EXTERNO ESCURO
            ctx.fillStyle = '#0a0f1d'; // Azul bem escuro
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

            // 2. O CARD FLUTUANTE CENTRAL
            const cardX = 80;
            const cardY = 120;
            const cardW = canvasWidth - 160;
            const cardH = canvasHeight - 240;
            const cardRadius = 32;

            // Mascarar a área do card para desenhar a imagem dentro dele
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
            ctx.clip();
            
            // Desenha a imagem dos halteres dentro do card
            const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const dx = (canvasWidth / 2) - (img.width / 2) * scale;
            const dy = (canvasHeight / 2) - (img.height / 2) * scale;
            if (img.width > 0) {
                // Clareia um pouco a imagem para o centro
                ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
            }

            // Gradiente para escurecer as pontas do card
            const cardGradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
            cardGradient.addColorStop(0, 'rgba(10, 15, 29, 0.9)');
            cardGradient.addColorStop(0.3, 'rgba(10, 15, 29, 0.65)');
            cardGradient.addColorStop(0.7, 'rgba(10, 15, 29, 0.65)');
            cardGradient.addColorStop(1, 'rgba(10, 15, 29, 0.95)');
            ctx.fillStyle = cardGradient;
            ctx.fillRect(cardX, cardY, cardW, cardH);
            ctx.restore();

            // 3. BORDA NEON DO CARD
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
            ctx.lineWidth = 4;
            ctx.strokeStyle = cyanAccent;
            ctx.shadowColor = cyanAccent;
            ctx.shadowBlur = 30;
            ctx.stroke();
            // Traço interno branco para núcleo do neon
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // 4. HEADER: LOGO E APP
            const logoSize = 110;
            const logoY = cardY + 50;
            if (logoImg.width > 0) {
                ctx.save();
                ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.roundRect((canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize, 26);
                ctx.clip();
                ctx.drawImage(logoImg, (canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize);
                ctx.restore();
            }

            const appNameY = logoY + logoSize + 40;
            applyGlow('#ffffff', 'rgba(0,0,0,0.8)', { blur: 10, y: 4 });
            ctx.font = '900 36px "Outfit", "Inter", sans-serif';
            if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "6px";
            ctx.fillText('VITALITÀ', (canvasWidth / 2) + 3, appNameY);
            if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
            resetShadow();

            // 5. FRASE
            const textY = canvasHeight / 2 - 40;
            ctx.font = 'italic 500 58px "Inter", sans-serif'; 
            applyGlow('#ffffff', 'rgba(0,0,0,0.9)', { blur: 15, y: 4 });
            
            const wrapText = (context, textToWrap, x, y, maxWidth, lineHeight) => {
                const cleanText = textToWrap.replace(/^"|"$/g, '').replace(/^“|”$/g, '');
                const formattedText = `“${cleanText}”`; 
                const words = formattedText.split(' ');
                let line = '';
                let lines = [];
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                
                const totalHeight = lines.length * lineHeight;
                let currentY = y - (totalHeight / 2) + (lineHeight / 2);
                
                for(let i = 0; i < lines.length; i++) {
                    context.fillText(lines[i], x, currentY);
                    currentY += lineHeight;
                }
                return currentY + 30; 
            };

            const nextY = wrapText(ctx, text, canvasWidth / 2, textY, cardW - 140, 80);
            resetShadow();

            // 6. AUTOR
            if (author) {
                const cleanAuthor = author.replace(/^—\s*/, ''); 
                const authorY = nextY + 30;
                applyGlow('#cbd5e1', 'rgba(0,0,0,0.9)', { blur: 10, y: 4 });
                ctx.font = '500 34px "Inter", sans-serif';
                if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "3px";
                ctx.fillText(cleanAuthor.toUpperCase(), canvasWidth / 2, authorY);
                if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
                resetShadow();
            }

            // 7. CÁPSULA "DOSE DE MOTIVAÇÃO" (Movidada para baixo)
            const labelY = cardY + cardH - 240;
            ctx.font = '600 24px "Inter", sans-serif';
            const labelText = 'DOSE DE MOTIVAÇÃO';
            const labelMetrics = ctx.measureText(labelText);
            const labelWidth = labelMetrics.width + 60; 
            const labelHeight = 44;

            ctx.fillStyle = 'rgba(10, 15, 29, 0.7)';
            ctx.beginPath();
            ctx.roundRect((canvasWidth / 2) - (labelWidth / 2), labelY - (labelHeight / 2), labelWidth, labelHeight, 22);
            ctx.fill();
            ctx.strokeStyle = cyanAccent;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            applyGlow('#94a3b8', 'rgba(0,0,0,0)', { blur: 0, y: 0 });
            ctx.fillText(labelText, canvasWidth / 2, labelY + 2);
            resetShadow();

            // 8. RODAPÉ (Sem placa metálica)
            const footerY = cardY + cardH - 120;
            
            // Texto do Rodapé
            applyGlow('#cbd5e1', 'rgba(0,0,0,0.8)', { blur: 10, y: 4 });
            ctx.font = '500 32px "Inter", sans-serif'; 
            ctx.fillText(`Inspirando o treino de`, canvasWidth / 2, footerY - 40);
            
            // Nome do atleta brilhando em ciano 
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 12, y: 4 });
            ctx.font = '800 46px "Outfit", "Inter", sans-serif';
            ctx.fillText(displayName, canvasWidth / 2, footerY + 10);
            resetShadow();
        };

    }, [quote, text, author, displayName, cyanAccent, ref]);

    if (!quote) return null;

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
            id="share-quote-card-canvas"
            style={baseStyles}
        />
    );
});

ShareableQuoteCard.displayName = 'ShareableQuoteCard';
