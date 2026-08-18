import { describe, it, expect, afterEach } from 'vitest';
import { isIOSDevice } from './platform';

function setNavigator({ userAgent = '', platform = '', maxTouchPoints = 0 }) {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, get: () => userAgent });
    Object.defineProperty(window.navigator, 'platform', { configurable: true, get: () => platform });
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, get: () => maxTouchPoints });
}

describe('isIOSDevice', () => {
    afterEach(() => {
        setNavigator({});
    });

    it.each([
        ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'],
        ['iPad clássico', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'],
        ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X)']
    ])('reconhece %s pelo user agent', (_nome, userAgent) => {
        setNavigator({ userAgent });

        expect(isIOSDevice()).toBe(true);
    });

    // O iPadOS moderno se apresenta como Mac. O toque é a única pista que
    // sobra — e é o que separa um iPad de um MacBook.
    it('reconhece iPad que se apresenta como Mac, pelo toque', () => {
        setNavigator({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            maxTouchPoints: 5
        });

        expect(isIOSDevice()).toBe(true);
    });

    it('não confunde um Mac de verdade com iPad', () => {
        setNavigator({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            maxTouchPoints: 0
        });

        expect(isIOSDevice()).toBe(false);
    });

    it.each([
        ['Android', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/130'],
        ['Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130']
    ])('não reconhece %s', (_nome, userAgent) => {
        setNavigator({ userAgent });

        expect(isIOSDevice()).toBe(false);
    });
});
