/**
 * useShareQuote.js
 * Compartilhar o "pensamento do dia" como imagem: desenha no canvas oculto do
 * ShareableQuoteCard, tenta a Web Share API com arquivo e cai para download.
 * Movido de HomeDashboard (D17) sem mudança.
 */
import { useRef, useState } from 'react';
import { notify } from '../../utils/notifyStore';
import { waitWithTimeout } from '../../utils/waitWithTimeout';

export function useShareQuote(dailyQuote) {
    const shareQuoteRef = useRef(null);
    const [sharingQuote, setSharingQuote] = useState(false);

    const shareQuote = async () => {
        if (sharingQuote) return;
        if (!shareQuoteRef.current) {
            notify.error("Card de compartilhamento indisponível.");
            return;
        }

        if (!window.isSecureContext) {
            notify.error("O compartilhamento requer conexão segura. Use HTTPS ou localhost.");
            return;
        }

        setSharingQuote(true);
        try {
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            if (document.fonts && document.fonts.ready) {
                await waitWithTimeout(document.fonts.ready, 2000);
            }

            const canvas = shareQuoteRef.current;
            if (!canvas || !canvas.toBlob) {
                throw new Error('Canvas não disponível para exportação.');
            }

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Falha gerar blob do canvas'));
                }, 'image/jpeg', 0.88);
            });

            const file = new File([blob], 'pensamento_do_dia.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Pensamento do Dia',
                        text: dailyQuote,
                        files: [file]
                    });
                    return;
                } catch (err) {
                    if (err?.name === 'AbortError') return;
                    console.warn('Share failed, falling back to download:', err);
                }
            }

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `pensamento_${new Date().toISOString().slice(0, 10)}.jpg`;
            link.href = blobUrl;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Error sharing:", err);
            notify.error("Erro ao gerar imagem de compartilhamento.");
        } finally {
            setSharingQuote(false);
        }
    };

    return { shareQuoteRef, sharingQuote, shareQuote };
}
