import { useEffect, useRef, useState } from 'react';
import { preloadImage } from '../../utils/imagePreload';
import { canvasToJpegBlob } from '../../utils/shareWorkoutImage';
import { loadShareableWorkoutCard } from '../../components/execution/shareableWorkoutCardLoader';

const shareCardBgSrc = '/bg-share-dumbbells.jpg';

/**
 * Encapsula o compartilhamento do treino: estado `sharing`, ref do canvas do
 * card, warmup dos recursos pesados (chunk do card, html-to-image, imagens) e
 * o fluxo `handleShare` (Web Share API com fallback de download).
 */
export function useWorkoutShare({ templateName, setError }) {
    const [sharing, setSharing] = useState(false);
    const shareCardRef = useRef(null);

    // Aquece recursos de compartilhamento para evitar atraso no modal final.
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        let cancelled = false;
        let idleId = null;
        let timerId = null;

        const warmupShareResources = () => {
            if (cancelled) return;
            Promise.allSettled([
                loadShareableWorkoutCard(),
                import('html-to-image'),
                preloadImage(shareCardBgSrc),
                preloadImage('/pwa-192x192.png')
            ]).catch(() => undefined);
        };

        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(warmupShareResources, { timeout: 1800 });
        } else {
            timerId = window.setTimeout(warmupShareResources, 900);
        }

        return () => {
            cancelled = true;
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        };
    }, []);

    const handleShare = async () => {
        if (sharing) return;
        if (!shareCardRef.current) {
            setError("Card de compartilhamento indisponível.");
            return;
        }

        // Verificação de Segurança: API Files requer Contexto Seguro (HTTPS ou localhost)
        if (!window.isSecureContext) {
            setError("O compartilhamento requer conexão segura. Use HTTPS ou localhost.");
            return;
        }

        setSharing(true);
        try {
            // Wait for render and font load (with safety timeouts to avoid hangs)
            const waitWithTimeout = async (promise, timeoutMs = 2000) => {
                try {
                    await Promise.race([
                        promise,
                        new Promise(resolve => setTimeout(resolve, timeoutMs))
                    ]);
                } catch {
                    // Ignore font/image load errors and proceed
                }
            };

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            if (document.fonts && document.fonts.ready) {
                await waitWithTimeout(document.fonts.ready, 2000);
            }

            // Pega o Canvas montado (já nativo!) e extrai a imagem.
            const blob = await canvasToJpegBlob(shareCardRef.current, 0.88);

            const file = new File([blob], 'treino_concluido.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Treino Concluído!',
                        text: `Acabei de completar o treino ${templateName || 'Personalizado'}! 💪`,
                        files: [file]
                    });
                    return;
                } catch (err) {
                    if (err?.name === 'AbortError') {
                        return;
                    }
                    console.warn('Share failed, falling back to download:', err);
                }
            }

            // Fallback de download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `treino_${new Date().toISOString().slice(0, 10)}.jpg`;
            link.href = blobUrl;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Error sharing:", err);
            setError("Erro ao gerar imagem de compartilhamento."); // Using existing setError
        } finally {
            setSharing(false);
        }
    };

    return { sharing, shareCardRef, handleShare };
}
