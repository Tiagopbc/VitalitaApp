import React, { forwardRef, useEffect } from 'react';
import { applyGlow, resetShadow, drawImageCover, loadImagesThenDraw, displayNameOf } from './canvasHelpers';

// Fundo limpo sem elementos pré-renderizados
const shareCardBgSrc = '/bg-share-dumbbells.jpg';

export const ShareableWorkoutCard = forwardRef(({ session, isVisible = false, userName = 'Atleta' }, ref) => {

    // Resolvendo Variáveis (mesmo sem session para evitar hooks quebrando)
    const volumeValue = session ? Number(session.volumeLoad || 0).toLocaleString('pt-BR') : '0';
    let volumeFontSize = 220;
    if (session) {
        const len = volumeValue.length;
        if (len <= 4) {
            volumeFontSize = 280;
        } else if (len === 5) {
            volumeFontSize = 250;
        } else if (len === 6) {
            volumeFontSize = 220;
        } else if (len === 7) {
            volumeFontSize = 190;
        } else if (len === 8) {
            volumeFontSize = 160;
        } else {
            volumeFontSize = 130;
        }
    } else {
        volumeFontSize = 220;
    }
    const displayName = displayNameOf(userName);
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


        

        const drawCanvas = () => {
            // Desenha a imagem cobrindo o canvas
            drawImageCover(ctx, img, canvasWidth, canvasHeight);

            // Véus escuros: a foto continua, mas o texto nunca fica sobre o halter claro
            ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            const fillVerticalGradient = (y0, y1, stops) => {
                const gradient = ctx.createLinearGradient(0, y0, 0, y1);
                stops.forEach(([pos, color]) => gradient.addColorStop(pos, color));
                ctx.fillStyle = gradient;
                ctx.fillRect(0, y0, canvasWidth, y1 - y0);
            };
            fillVerticalGradient(0, 560, [[0, 'rgba(2, 6, 23, 0.95)'], [1, 'rgba(2, 6, 23, 0)']]);
            const centerVeil = ctx.createRadialGradient(canvasWidth / 2, 860, 60, canvasWidth / 2, 860, 560);
            centerVeil.addColorStop(0, 'rgba(2, 6, 23, 0.7)');
            centerVeil.addColorStop(1, 'rgba(2, 6, 23, 0)');
            ctx.fillStyle = centerVeil;
            ctx.fillRect(0, 300, canvasWidth, 1100);
            fillVerticalGradient(1280, canvasHeight, [[0, 'rgba(2, 6, 23, 0)'], [0.35, 'rgba(2, 6, 23, 0.92)'], [1, '#020617']]);

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            const drawPill = (x, y, text, { fill, stroke, color, font, height, padding }) => {
                ctx.font = font;
                const width = ctx.measureText(text).width + padding * 2;
                ctx.beginPath();
                ctx.roundRect(x - width / 2, y - height / 2, width, height, height / 2);
                ctx.fillStyle = fill;
                ctx.fill();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.fillStyle = color;
                ctx.fillText(text, x, y);
            };

            // 1. LOGO DO APP (clip arredondado para evitar bordas pretas do PNG)
            const logoSize = 130;
            const logoY = 120;
            if (logoImg.width > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect((canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize, 30);
                ctx.clip();
                ctx.drawImage(logoImg, (canvasWidth / 2) - (logoSize / 2), logoY, logoSize, logoSize);
                ctx.restore();
            }

            // 2. TREINO CONCLUÍDO (etiqueta ciano preenchida)
            drawPill(canvasWidth / 2, 340, 'TREINO CONCLUÍDO', {
                fill: cyanAccent, color: '#04121a', font: '800 30px "Inter", sans-serif', height: 64, padding: 36
            });

            // 3. NOME DO ATLETA
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 56px "Outfit", "Inter", sans-serif';
            ctx.fillText(displayName, canvasWidth / 2, 440);

            // 4. VOLUME GIGANTE
            applyGlow(ctx, '#ffffff', 'rgba(0, 0, 0, 0.6)', { blur: 30, y: 6 });
            ctx.font = `900 ${volumeFontSize}px "Outfit", "Inter", sans-serif`;
            ctx.fillText(volumeValue, canvasWidth / 2, 840);
            resetShadow(ctx);

            // 5. UNIDADE, em texto sólido (o antigo "KILOS" vazado sumia sobre os halteres)
            ctx.fillStyle = cyanAccent;
            ctx.font = '800 64px "Outfit", "Inter", sans-serif';
            ctx.letterSpacing = '10px';
            ctx.fillText('KG LEVANTADOS', canvasWidth / 2, 1010);
            ctx.letterSpacing = '0px';

            // 6. TÍTULO E SUBTÍTULO DO TREINO
            ctx.fillStyle = cyanAccent;
            ctx.font = '800 72px "Outfit", "Inter", sans-serif';
            ctx.fillText(templateTitle, canvasWidth / 2, 1530);
            if (templateSubtitle) {
                ctx.fillStyle = '#e2e8f0';
                ctx.font = '600 46px "Inter", sans-serif';
                ctx.fillText(templateSubtitle, canvasWidth / 2, 1610);
            }

            // 7. CÁPSULAS DE TEMPO E EXERCÍCIOS
            const pillStyle = {
                fill: 'rgba(15, 23, 42, 0.85)', stroke: 'rgba(255, 255, 255, 0.25)', color: '#ffffff',
                font: '700 36px "Inter", sans-serif', height: 84, padding: 44
            };
            drawPill(canvasWidth / 2 - 200, 1760, String(session.duration).replace(/(\d)min$/, '$1 min'), pillStyle);
            drawPill(canvasWidth / 2 + 180, 1760, `${session.exercisesCount} exercícios`, pillStyle);
        };

        loadImagesThenDraw(
            [[img, shareCardBgSrc], [logoImg, '/pwa-512x512.png']],
            drawCanvas
        );

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
