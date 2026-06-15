import { safeGetJSON, safeSetJSON } from './storage';

const JOURNAL_RENDER_METRICS_KEY = 'vitalita_journal_render_metrics_v1';
const MAX_JOURNAL_METRICS = 24;

function safeReadArray(key) {
    const parsed = safeGetJSON(key);
    return Array.isArray(parsed) ? parsed : [];
}

function safeWriteArray(key, value) {
    safeSetJSON(key, value);
}

function getDeviceTier() {
    if (typeof navigator === 'undefined') return 'mid';

    const cores = Number(navigator.hardwareConcurrency) || 4;
    const memory = Number(navigator.deviceMemory) || 4;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const effectiveType = typeof connection?.effectiveType === 'string'
        ? connection.effectiveType.toLowerCase()
        : '';
    const slowNetwork = /(slow-2g|2g|3g)/i.test(effectiveType);

    if (saveData || slowNetwork || cores <= 3 || memory <= 2) return 'low';
    if (cores >= 8 && memory >= 6) return 'high';
    return 'mid';
}

function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
    return sorted[index];
}

export function getJournalWindowConfig() {
    const deviceTier = getDeviceTier();
    const baseByTier = {
        low: { initial: 10, step: 10 },
        mid: { initial: 16, step: 14 },
        high: { initial: 24, step: 20 }
    };

    const base = baseByTier[deviceTier] || baseByTier.mid;
    const metrics = safeReadArray(JOURNAL_RENDER_METRICS_KEY)
        .map((entry) => Number(entry?.ms))
        .filter((ms) => Number.isFinite(ms) && ms > 0);

    if (metrics.length < 5) {
        return base;
    }

    const p75 = percentile(metrics, 0.75);

    if (p75 >= 70) {
        return {
            initial: Math.max(8, base.initial - 8),
            step: Math.max(8, base.step - 6)
        };
    }

    if (p75 >= 45) {
        return {
            initial: Math.max(8, base.initial - 4),
            step: Math.max(8, base.step - 4)
        };
    }

    if (p75 <= 20) {
        return {
            initial: Math.min(28, base.initial + 4),
            step: Math.min(24, base.step + 4)
        };
    }

    return base;
}

export function recordJournalRenderMetric(durationMs) {
    const ms = Number(durationMs);
    if (!Number.isFinite(ms) || ms <= 0) return;

    const existing = safeReadArray(JOURNAL_RENDER_METRICS_KEY);
    const next = [
        ...existing.slice(-(MAX_JOURNAL_METRICS - 1)),
        { ms: Number(ms.toFixed(2)), at: Date.now() }
    ];

    safeWriteArray(JOURNAL_RENDER_METRICS_KEY, next);
}
