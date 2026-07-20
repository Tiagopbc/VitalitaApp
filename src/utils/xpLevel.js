/**
 * xpLevel.js
 * Cálculo puro de XP / nível a partir das estatísticas do usuário.
 *
 * Fórmula (mantida do ProfilePage original):
 *   XP = tonelagemTotalKg / 10 + treinos * 50
 *   Nível = 1 + floor(XP / XP_PER_LEVEL)
 */

export const XP_PER_LEVEL = 3500;

export function computeXpLevel(stats) {
    const currentXP = (stats?.totalTonnageKg || 0) / 10 + (stats?.totalWorkouts || 0) * 50;
    const level = Math.floor(currentXP / XP_PER_LEVEL) + 1;
    const xpInLevel = Math.floor(currentXP % XP_PER_LEVEL);
    const xpProgress = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);
    return { currentXP, level, xpInLevel, xpProgress };
}
