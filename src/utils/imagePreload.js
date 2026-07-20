/**
 * imagePreload.js
 * Pré-carrega imagens em background, com cache em nível de módulo para
 * evitar recarregar a mesma URL. O Map global preserva o cache entre chamadas.
 */

const preloadedImages = new Map();

export function preloadImage(src) {
    if (!src || typeof window === 'undefined') return Promise.resolve();
    if (preloadedImages.has(src)) return preloadedImages.get(src);

    const preloadPromise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CRITICAL: Match the component's crossOrigin to stop Safari caching conflicts
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            img.onload = null;
            img.onerror = null;
            resolve();
        };

        img.onload = finish;
        img.onerror = finish;
        img.src = src;

        if (img.complete) finish();
    });

    preloadedImages.set(src, preloadPromise);
    return preloadPromise;
}
