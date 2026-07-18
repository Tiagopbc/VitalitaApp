/**
 * motionPreferences.js
 * Consulta imperativa da preferência de movimento reduzido do sistema,
 * para efeitos fora do framer-motion (ex.: confetti).
 */
export function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
