import { describe, expect, it } from 'vitest';
import {
    getObservabilityBuildMetadata,
    getRuntimeObservabilityTags,
    normalizeRoutePath,
    sanitizeObservabilityContext,
    sanitizeSentryBreadcrumb,
    sanitizeSentryEvent,
    sanitizeUrl
} from './observability';

describe('observability privacy helpers', () => {
    it('uses Vercel Preview metadata and shortens the commit SHA', () => {
        expect(getObservabilityBuildMetadata({
            VITE_APP_ENV: 'preview',
            VITE_APP_VERSION: '5cbd22cf0b97c868ceb9a868f7fbe6f5ad0c8ff5'
        })).toEqual({
            environment: 'preview',
            appVersion: '5cbd22c'
        });
    });

    it('keeps manually configured release names', () => {
        expect(getObservabilityBuildMetadata({
            VITE_APP_ENV: 'staging',
            VITE_APP_VERSION: 'portfolio-2026.07'
        })).toEqual({
            environment: 'staging',
            appVersion: 'portfolio-2026.07'
        });
    });

    it('falls back to local development metadata', () => {
        expect(getObservabilityBuildMetadata()).toEqual({
            environment: 'development',
            appVersion: 'local'
        });
    });

    it('normalizes entity identifiers in routes', () => {
        expect(normalizeRoutePath('/execute/6vH7CU517m4YBGvoSK56?tab=sets'))
            .toBe('/execute/:workoutId');
        expect(normalizeRoutePath('/resource/abcdefghijklmnopqrst/details'))
            .toBe('/resource/:id/details');
    });

    it('removes query strings and hashes from URLs', () => {
        expect(sanitizeUrl('https://vitalita.vercel.app/login?code=secret#callback'))
            .toBe('https://vitalita.vercel.app/login');
        expect(sanitizeUrl('/history?routine=private-value')).toBe('/history');
    });

    it('keeps only allowlisted diagnostic context', () => {
        expect(sanitizeObservabilityContext({
            operation: 'session_sync_failed',
            source: 'active_workout',
            email: 'person@example.com',
            token: 'secret',
            route: '/execute/6vH7CU517m4YBGvoSK56'
        })).toEqual({
            operation: 'session_sync_failed',
            source: 'active_workout',
            route: '/execute/:workoutId'
        });
    });

    it('builds runtime tags without user identity', () => {
        const tags = getRuntimeObservabilityTags({
            pathname: '/history',
            appVersion: 'abc1234',
            navigatorObject: { onLine: false, standalone: false },
            windowObject: {
                innerWidth: 390,
                matchMedia: () => ({ matches: true })
            }
        });

        expect(tags).toEqual({
            route: '/history',
            appVersion: 'abc1234',
            isPwa: true,
            isOffline: true,
            deviceType: 'mobile'
        });
        expect(tags).not.toHaveProperty('userId');
    });

    it('drops console and click breadcrumbs', () => {
        expect(sanitizeSentryBreadcrumb({ category: 'console', message: 'private' })).toBeNull();
        expect(sanitizeSentryBreadcrumb({ category: 'ui.click', message: 'email field' })).toBeNull();
    });

    it('normalizes route data in technical breadcrumbs', () => {
        expect(sanitizeSentryBreadcrumb({
            category: 'technical',
            message: 'route_change',
            data: { route: '/execute/6vH7CU517m4YBGvoSK56' }
        })).toEqual({
            category: 'technical',
            message: 'route_change',
            data: { route: '/execute/:workoutId' }
        });
    });

    it('removes identity and request secrets from Sentry events', () => {
        const event = sanitizeSentryEvent({
            user: { id: 'user-1', email: 'person@example.com' },
            request: {
                method: 'GET',
                url: 'https://vitalita.vercel.app/callback?token=secret',
                headers: { authorization: 'Bearer secret' },
                cookies: 'session=secret'
            },
            extra: {
                operation: 'workout_load_failed',
                userId: 'user-1'
            }
        });

        expect(event.user).toBeUndefined();
        expect(event.request).toEqual({
            method: 'GET',
            url: 'https://vitalita.vercel.app/callback'
        });
        expect(event.extra).toEqual({ operation: 'workout_load_failed' });
    });
});
