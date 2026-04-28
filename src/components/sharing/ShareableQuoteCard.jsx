import React, { forwardRef, useEffect } from 'react';

const shareCardBgSrc = '/bg-share-template.jpg';

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
            // Desenha a imagem cobrindo o canvas
            const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const dx = (canvasWidth / 2) - (img.width / 2) * scale;
            const dy = (canvasHeight / 2) - (img.height / 2) * scale;
            if (img.width > 0) {
                ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
            }

            // Escurecer um pouco mais para focar na frase
            ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
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

            // 1. LOGO DO APP
            const logoSize = 130;
            const logoY = 180;
            if (logoImg.width > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect((canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize, 30);
                ctx.clip();
                ctx.drawImage(logoImg, (canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize);
                ctx.restore();
            }

            // 2. PENSAMENTO DO DIA (Cápsula)
            const labelY = 400;
            ctx.font = '700 28px "Inter", sans-serif';
            const labelText = 'PENSAMENTO DO DIA';
            
            const labelMetrics = ctx.measureText(labelText);
            const labelWidth = labelMetrics.width + 80; 
            const labelHeight = 54;

            ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'; // Borda cyan
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect((canvasWidth / 2) - (labelWidth / 2), labelY - (labelHeight / 2), labelWidth, labelHeight, 27);
            ctx.stroke();

            applyGlow(cyanAccent, 'rgba(0,0,0,0.5)', { blur: 4, y: 2 });
            ctx.fillText(labelText, canvasWidth / 2, labelY);
            resetShadow();

            // 3. FRASE COM QUEBRA DE LINHA
            const textY = 850;
            ctx.font = '800 68px "Outfit", "Inter", sans-serif'; 
            applyGlow('#ffffff', 'rgba(0,0,0,0.8)', { blur: 15, y: 6 });
            
            // Função para quebrar texto em múltiplas linhas
            const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
                const words = text.split(' ');
                let line = '';
                let lines = [];
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                
                // Desenhar as linhas centralizadas verticalmente em torno de textY
                const totalHeight = lines.length * lineHeight;
                let currentY = y - (totalHeight / 2) + (lineHeight / 2);
                
                for(let i = 0; i < lines.length; i++) {
                    context.fillText(lines[i], x, currentY);
                    currentY += lineHeight;
                }
                return currentY + 20; // Retorna Y onde termina para desenhar autor
            };

            const nextY = wrapText(ctx, text, canvasWidth / 2, textY, canvasWidth - 160, 95);
            resetShadow();

            // 4. AUTOR
            if (author) {
                applyGlow('#94a3b8', 'rgba(0,0,0,0.6)', { blur: 4, y: 2 });
                ctx.font = '600 42px "Inter", sans-serif';
                ctx.fillText(author, canvasWidth / 2, nextY);
                resetShadow();
            }

            // 5. NOME DO ATLETA NO RODAPÉ
            const footerY = 1750;
            applyGlow('#f8fafc', 'rgba(0,0,0,0.7)', { blur: 8, y: 4 });
            ctx.font = '700 36px "Inter", sans-serif'; 
            ctx.fillText(`Compartilhado por ${displayName}`, canvasWidth / 2, footerY);
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
