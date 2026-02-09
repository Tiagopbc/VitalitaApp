import { useEffect } from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { browserTracingIntegration, init } from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const enableTracing = import.meta.env.VITE_SENTRY_TRACING === 'true';

if (dsn) {
    const integrations = enableTracing
        ? [
            browserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            })
        ]
        : [];

    init({
        dsn,
        integrations,
        tracesSampleRate: enableTracing ? 0.2 : 0.0,
    });
}
