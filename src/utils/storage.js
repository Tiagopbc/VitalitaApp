/**
 * Utility helper to safely interact with localStorage,
 * preventing crashes in SSR or environments where storage is disabled/unsupported.
 */
export function hasStorage() {
    if (typeof window === 'undefined') return false;
    try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return typeof localStorage !== 'undefined'
            && typeof localStorage.getItem === 'function'
            && typeof localStorage.setItem === 'function';
    }
}

export function safeGetItem(key) {
    if (!hasStorage()) return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(key, value) {
    if (!hasStorage()) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore write failures (e.g. QuotaExceededError or private browsing)
    }
}

export function safeRemoveItem(key) {
    if (!hasStorage()) return;
    try {
        localStorage.removeItem(key);
    } catch {
        // Ignore remove failures
    }
}

export function safeGetJSON(key, fallback = null) {
    const val = safeGetItem(key);
    if (!val) return fallback;
    try {
        const parsed = JSON.parse(val);
        return parsed !== null ? parsed : fallback;
    } catch {
        return fallback;
    }
}

export function safeSetJSON(key, value) {
    try {
        safeSetItem(key, JSON.stringify(value));
    } catch {
        // Ignore JSON stringify/write failures
    }
}
