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
            // Desenha a imagem cobrindo o canvas
            const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const dx = (canvasWidth / 2) - (img.width / 2) * scale;
            const dy = (canvasHeight / 2) - (img.height / 2) * scale;
            if (img.width > 0) {
                ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
            }

            // Escurecer imagem de fundo com um gradiente linear para dar profundidade e foco ao centro
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            bgGradient.addColorStop(0, 'rgba(2, 6, 23, 0.7)');
            bgGradient.addColorStop(0.5, 'rgba(2, 6, 23, 0.5)');
            bgGradient.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
            ctx.fillStyle = bgGradient;
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

            // 1. LOGO DO APP E NOME
            const logoSize = 150;
            const logoY = 150;
            if (logoImg.width > 0) {
                ctx.save();
                ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.roundRect((canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize, 35);
                ctx.clip();
                ctx.drawImage(logoImg, (canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize);
                ctx.restore();
            }

            const appNameY = logoY + logoSize + 45;
            applyGlow('#ffffff', 'rgba(0,0,0,0.8)', { blur: 15, y: 5 });
            ctx.font = '900 48px "Outfit", "Inter", sans-serif';
            if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "12px";
            ctx.fillText('VITALITÀ', (canvasWidth / 2) + 6, appNameY); // +6 compensa o espaçamento extra na última letra
            if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
            resetShadow();

            // 2. CÁPSULA DE MOTIVAÇÃO
            const labelY = appNameY + 85;
            ctx.font = '800 24px "Inter", sans-serif';
            const labelText = 'DOSE DE MOTIVAÇÃO';
            
            const labelMetrics = ctx.measureText(labelText);
            const labelWidth = labelMetrics.width + 60; 
            const labelHeight = 46;

            // Fundo da cápsula
            ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
            ctx.beginPath();
            ctx.roundRect((canvasWidth / 2) - (labelWidth / 2), labelY - (labelHeight / 2), labelWidth, labelHeight, 23);
            ctx.fill();

            // Borda da cápsula
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            applyGlow(cyanAccent, 'rgba(0,0,0,0)', { blur: 0, y: 0 });
            ctx.fillText(labelText, canvasWidth / 2, labelY + 2);
            resetShadow();

            // 3. PAINEL DE VIDRO (Glassmorphism)
            const panelWidth = 920;
            const panelHeight = 850;
            const panelX = (canvasWidth - panelWidth) / 2;
            const panelY = labelY + 80;

            // Sombra do painel
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 20;

            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 40);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // Fundo escuro semi-transparente
            ctx.fill();
            resetShadow();

            // Borda de vidro sutil
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.stroke();
            
            // Reflexo suave no topo do painel
            const highlight = ctx.createLinearGradient(panelX, panelY, panelX, panelY + 150);
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlight;
            ctx.fill();

            // 4. ASPAS ELEGANTES (Pequenas, centralizadas no topo do painel)
            const quoteIconY = panelY + 120;
            ctx.font = '900 130px "Georgia", serif';
            applyGlow(cyanAccent, 'rgba(34, 211, 238, 0.4)', { blur: 20, y: 0 });
            ctx.fillText('“', canvasWidth / 2, quoteIconY);
            resetShadow();

            // 5. FRASE COM QUEBRA DE LINHA (Editorial)
            const textY = panelY + 420; // Centro óptico do painel
            ctx.font = 'italic 500 54px "Inter", sans-serif'; 
            applyGlow('#ffffff', 'rgba(0,0,0,0.9)', { blur: 20, y: 8 });
            
            const wrapText = (context, textToWrap, x, y, maxWidth, lineHeight) => {
                // Remover as aspas da string original, pois o design agora cuida disso
                const cleanText = textToWrap.replace(/^"|"$/g, '');
                const words = cleanText.split(' ');
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
                
                const totalHeight = lines.length * lineHeight;
                let currentY = y - (totalHeight / 2) + (lineHeight / 2);
                
                for(let i = 0; i < lines.length; i++) {
                    context.fillText(lines[i], x, currentY);
                    currentY += lineHeight;
                }
                return currentY + 40; 
            };

            const nextY = wrapText(ctx, text, canvasWidth / 2, textY, canvasWidth - 220, 82);
            resetShadow();

            // 6. LINHA DIVISÓRIA (Fina e sutil)
            const dividerY = nextY + 40;
            const dividerWidth = 80;
            ctx.beginPath();
            ctx.moveTo((canvasWidth / 2) - (dividerWidth / 2), dividerY);
            ctx.lineTo((canvasWidth / 2) + (dividerWidth / 2), dividerY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();

            // 7. AUTOR
            if (author) {
                const cleanAuthor = author.replace(/^—\s*/, ''); 
                const authorY = dividerY + 70;
                applyGlow('#94a3b8', 'rgba(0,0,0,0.8)', { blur: 10, y: 4 });
                ctx.font = '500 34px "Inter", sans-serif';
                if (ctx.letterSpacing !== undefined) {
                    ctx.letterSpacing = "4px";
                }
                ctx.fillText(cleanAuthor.toUpperCase(), canvasWidth / 2, authorY);
                if (ctx.letterSpacing !== undefined) {
                    ctx.letterSpacing = "0px";
                }
                resetShadow();
            }

            // 7. RODAPÉ
            const footerY = canvasHeight - 120;
            
            // Fundo escurecido suave para o rodapé
            const footerGradient = ctx.createLinearGradient(0, canvasHeight - 250, 0, canvasHeight);
            footerGradient.addColorStop(0, 'rgba(2, 6, 23, 0)');
            footerGradient.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
            ctx.fillStyle = footerGradient;
            ctx.fillRect(0, canvasHeight - 250, canvasWidth, 250);

            applyGlow('#cbd5e1', 'rgba(0,0,0,0.8)', { blur: 10, y: 4 });
            ctx.font = '500 32px "Inter", sans-serif'; 
            ctx.fillText(`Inspirando o treino de`, canvasWidth / 2, footerY - 45);
            
            applyGlow(cyanAccent, 'rgba(0,0,0,0.8)', { blur: 10, y: 4 });
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
