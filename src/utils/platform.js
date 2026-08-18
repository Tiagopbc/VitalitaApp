/**
 * platform.js
 * Detecção de plataforma compartilhada. Existe porque duas features dependem
 * de reconhecer o iOS — o aviso de push (que só funciona em PWA instalado pelo
 * Safari) e o aviso de reinstalação (cujas três tags são exclusivas do iOS) —
 * e duas cópias de um regex de user agent divergem com o tempo.
 */

/**
 * Reconhece iPhone, iPad e iPod. O iPadOS moderno se apresenta como Mac, e a
 * única pista confiável é o suporte a toque: um Mac de verdade não tem.
 */
export function isIOSDevice() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iP(hone|ad|od)/.test(ua)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
