export function getAppCheckRuntimeConfig({
    siteKey,
    isProduction = false,
    debugMode = false,
    hasWindow = typeof window !== 'undefined'
} = {}) {
    const normalizedSiteKey = typeof siteKey === 'string' ? siteKey.trim() : '';
    const debugEnabled = !isProduction && String(debugMode).toLowerCase() === 'true';

    return {
        enabled: hasWindow && Boolean(normalizedSiteKey) && (isProduction || debugEnabled),
        debugEnabled,
        siteKey: normalizedSiteKey
    };
}
