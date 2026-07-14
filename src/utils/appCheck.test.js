import { describe, expect, it } from 'vitest';
import { getAppCheckRuntimeConfig } from './appCheck';

describe('getAppCheckRuntimeConfig', () => {
    it('keeps App Check disabled when no site key is configured', () => {
        expect(getAppCheckRuntimeConfig({
            siteKey: '',
            isProduction: true,
            hasWindow: true
        })).toEqual({
            enabled: false,
            debugEnabled: false,
            siteKey: ''
        });
    });

    it('enables monitoring in production when a site key is configured', () => {
        expect(getAppCheckRuntimeConfig({
            siteKey: ' site-key ',
            isProduction: true,
            hasWindow: true
        })).toEqual({
            enabled: true,
            debugEnabled: false,
            siteKey: 'site-key'
        });
    });

    it('requires an explicit debug opt-in outside production', () => {
        expect(getAppCheckRuntimeConfig({
            siteKey: 'site-key',
            isProduction: false,
            debugMode: false,
            hasWindow: true
        }).enabled).toBe(false);

        expect(getAppCheckRuntimeConfig({
            siteKey: 'site-key',
            isProduction: false,
            debugMode: 'true',
            hasWindow: true
        })).toEqual({
            enabled: true,
            debugEnabled: true,
            siteKey: 'site-key'
        });
    });

    it('never enables the debug provider in production', () => {
        expect(getAppCheckRuntimeConfig({
            siteKey: 'site-key',
            isProduction: true,
            debugMode: 'true',
            hasWindow: true
        }).debugEnabled).toBe(false);
    });
});
