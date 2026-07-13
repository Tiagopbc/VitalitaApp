import { useEffect } from 'react';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
    getRuntimeObservabilityTags,
    normalizeRoutePath,
    sanitizeObservabilityContext,
    sanitizeSentryBreadcrumb,
    sanitizeSentryEvent
} from './utils/observability';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const enableTracing = import.meta.env.VITE_SENTRY_TRACING === 'true';
const appVersion = import.meta.env.VITE_APP_VERSION || 'local';

let initialized = false;

export function initializeSentry() {
    if (initialized || !import.meta.env.PROD || !dsn) return initialized;

    const integrations = enableTracing
        ? [
            Sentry.reactRouterV7BrowserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes
            })
        ]
        : [];

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: appVersion === 'local' ? undefined : `vitalita@${appVersion}`,
        integrations,
        tracesSampleRate: enableTracing ? 0.1 : 0,
        sendDefaultPii: false,
        beforeBreadcrumb: sanitizeSentryBreadcrumb,
        beforeSend: sanitizeSentryEvent
    });

    Sentry.setTags(getRuntimeObservabilityTags({ appVersion }));
    initialized = true;
    return true;
}

export function captureTechnicalError(error, context = {}) {
    if (!initializeSentry()) return null;

    const safeContext = sanitizeObservabilityContext(context);
    const diagnosticTags = ['operation', 'source', 'code', 'status'].reduce((tags, key) => {
        if (safeContext[key] !== undefined) tags[key] = safeContext[key];
        return tags;
    }, {});

    return Sentry.withScope((scope) => {
        scope.setTags({
            ...getRuntimeObservabilityTags({ appVersion }),
            ...diagnosticTags
        });
        scope.setExtras(safeContext);
        return Sentry.captureException(error);
    });
}

export function recordRouteChange(pathname) {
    if (!initializeSentry()) return;

    const route = normalizeRoutePath(pathname);
    Sentry.setTag('route', route);
    Sentry.addBreadcrumb({
        category: 'technical',
        message: 'route_change',
        level: 'info',
        data: { route }
    });
}

export function recordConnectivityChange(isOffline) {
    if (!initializeSentry()) return;

    Sentry.setTag('isOffline', isOffline);
    Sentry.addBreadcrumb({
        category: 'connectivity',
        message: isOffline ? 'offline' : 'online',
        level: isOffline ? 'warning' : 'info'
    });
}
