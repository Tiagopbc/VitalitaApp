const CONTEXT_KEYS = new Set([
    'operation',
    'source',
    'code',
    'status',
    'route',
    'componentStack',
    'syncState',
    'entityType'
]);

const LONG_VALUE_KEYS = new Set(['componentStack']);

export function normalizeRoutePath(pathname = '/') {
    if (typeof pathname !== 'string') return '/';

    const cleanPath = pathname.split(/[?#]/)[0] || '/';
    return cleanPath
        .replace(/^\/execute\/[^/]+/, '/execute/:workoutId')
        .replace(/\/[A-Za-z0-9_-]{18,}(?=\/|$)/g, '/:id');
}

export function sanitizeUrl(value) {
    if (typeof value !== 'string' || !value) return undefined;

    try {
        const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(value);
        const url = new URL(value, 'https://vitalita.local');
        const path = normalizeRoutePath(url.pathname);
        return isAbsolute ? `${url.origin}${path}` : path;
    } catch {
        return normalizeRoutePath(value);
    }
}

export function getObservabilityBuildMetadata(env = {}) {
    const environment = env.VITE_APP_ENV || env.VITE_VERCEL_ENV || env.MODE || 'development';
    const configuredVersion = env.VITE_APP_VERSION || env.VITE_VERCEL_GIT_COMMIT_SHA || 'local';
    const appVersion = /^[a-f\d]{8,40}$/i.test(configuredVersion)
        ? configuredVersion.slice(0, 7)
        : configuredVersion;

    return { environment, appVersion };
}

export function sanitizeObservabilityContext(context = {}) {
    return Object.entries(context).reduce((safeContext, [key, value]) => {
        if (!CONTEXT_KEYS.has(key) || value === undefined || value === null) {
            return safeContext;
        }

        if (key === 'route') {
            safeContext[key] = normalizeRoutePath(String(value));
            return safeContext;
        }

        if (['string', 'number', 'boolean'].includes(typeof value)) {
            const maxLength = LONG_VALUE_KEYS.has(key) ? 2000 : 250;
            safeContext[key] = typeof value === 'string' ? value.slice(0, maxLength) : value;
        }

        return safeContext;
    }, {});
}

export function getRuntimeObservabilityTags({
    pathname,
    appVersion = 'local',
    navigatorObject = globalThis.navigator,
    windowObject = globalThis.window
} = {}) {
    const route = normalizeRoutePath(pathname || windowObject?.location?.pathname || '/');
    const standaloneDisplay = windowObject?.matchMedia?.('(display-mode: standalone)')?.matches === true;
    const isPwa = standaloneDisplay || navigatorObject?.standalone === true;
    const width = windowObject?.innerWidth;

    return {
        route,
        appVersion,
        isPwa,
        isOffline: navigatorObject?.onLine === false,
        deviceType: typeof width === 'number' && width < 768 ? 'mobile' : 'desktop'
    };
}

export function sanitizeSentryBreadcrumb(breadcrumb) {
    if (!breadcrumb || ['console', 'ui.click'].includes(breadcrumb.category)) return null;

    const data = breadcrumb.data || {};
    const safeData = {};

    ['from', 'to', 'url'].forEach((key) => {
        const safeUrl = sanitizeUrl(data[key]);
        if (safeUrl) safeData[key] = safeUrl;
    });

    ['method', 'status_code'].forEach((key) => {
        if (['string', 'number'].includes(typeof data[key])) safeData[key] = data[key];
    });

    if (typeof data.route === 'string') {
        safeData.route = normalizeRoutePath(data.route);
    }

    const controlledCategory = ['technical', 'connectivity'].includes(breadcrumb.category);

    return {
        ...breadcrumb,
        message: controlledCategory
            ? String(breadcrumb.message || '').slice(0, 250)
            : breadcrumb.category === 'navigation' ? 'route_change' : 'network_request',
        data: safeData
    };
}

export function sanitizeSentryEvent(event) {
    const safeEvent = { ...event };
    delete safeEvent.user;

    if (event.request) {
        safeEvent.request = {
            method: event.request.method,
            url: sanitizeUrl(event.request.url)
        };
    }

    if (event.transaction) {
        safeEvent.transaction = normalizeRoutePath(event.transaction);
    }

    if (event.extra) {
        safeEvent.extra = sanitizeObservabilityContext(event.extra);
    }

    if (event.breadcrumbs) {
        safeEvent.breadcrumbs = event.breadcrumbs
            .map(sanitizeSentryBreadcrumb)
            .filter(Boolean);
    }

    return safeEvent;
}
