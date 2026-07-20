import { describe, expect, it } from 'vitest';
import {
    canCreateAccount,
    daysInMonth,
    evaluatePasswordRules,
    getAuthErrorMessage,
    getFirstName,
    validateBirthDate
} from './authValidation';

describe('authValidation', () => {
    describe('getFirstName', () => {
        it('returns the first token, trimming extra whitespace', () => {
            expect(getFirstName('  João  Pedro  Silva ')).toBe('João');
            expect(getFirstName('Maria')).toBe('Maria');
        });

        it('returns empty string for empty or nullish input', () => {
            expect(getFirstName('')).toBe('');
            expect(getFirstName('   ')).toBe('');
            expect(getFirstName(undefined)).toBe('');
            expect(getFirstName(null)).toBe('');
        });
    });

    describe('daysInMonth', () => {
        it('returns the real number of days per month', () => {
            expect(daysInMonth(2021, 2)).toBe(28);
            expect(daysInMonth(2024, 2)).toBe(29); // ano bissexto
            expect(daysInMonth(2024, 4)).toBe(30);
            expect(daysInMonth(2024, 1)).toBe(31);
        });

        it('falls back to 31 when year or month is not finite', () => {
            expect(daysInMonth(NaN, 2)).toBe(31);
            expect(daysInMonth(2024, NaN)).toBe(31);
        });
    });

    describe('getAuthErrorMessage', () => {
        it('maps known Firebase Auth error codes', () => {
            expect(getAuthErrorMessage({ code: 'auth/invalid-api-key' }, 'fb')).toContain('.env.local');
            expect(getAuthErrorMessage({ code: 'auth/network-request-failed' }, 'fb')).toContain('conexão');
        });

        it('returns the fallback for unknown or missing codes', () => {
            expect(getAuthErrorMessage({ code: 'auth/other' }, 'fallback')).toBe('fallback');
            expect(getAuthErrorMessage(null, 'fallback')).toBe('fallback');
        });
    });

    describe('evaluatePasswordRules', () => {
        it('flags every satisfied rule for a strong password', () => {
            expect(evaluatePasswordRules('Abc123!')).toEqual({
                minLen: true,
                hasUpper: true,
                hasLower: true,
                hasNumber: true,
                hasSpecial: true
            });
        });

        it('flags missing rules for a weak password', () => {
            expect(evaluatePasswordRules('abc')).toEqual({
                minLen: false,
                hasUpper: false,
                hasLower: true,
                hasNumber: false,
                hasSpecial: false
            });
        });

        it('treats nullish input as an empty password', () => {
            expect(evaluatePasswordRules(undefined).minLen).toBe(false);
        });
    });

    describe('validateBirthDate', () => {
        it('accepts a valid date', () => {
            const result = validateBirthDate('15', '6', '1990');
            expect(result.validDate).toBe(true);
            expect(result.yearError).toBe('');
            expect(result.monthError).toBe('');
            expect(result.dayError).toBe('');
            expect(result.dateError).toBe('');
        });

        it('rejects a year below the lower bound', () => {
            expect(validateBirthDate('1', '1', '1949').yearError).toContain('1950');
        });

        it('rejects a year above the current year', () => {
            const nowYear = new Date().getFullYear();
            expect(validateBirthDate('1', '1', String(nowYear + 1)).yearError).toContain(String(nowYear));
        });

        it('rejects an out-of-range month', () => {
            expect(validateBirthDate('1', '13', '2000').monthError).toContain('1 a 12');
        });

        it('rejects a day beyond the month length', () => {
            const result = validateBirthDate('30', '2', '2021');
            expect(result.dayError).toContain('Máximo');
            expect(result.validDate).toBe(false);
        });

        it('accepts Feb 29 on a leap year', () => {
            expect(validateBirthDate('29', '2', '2024').validDate).toBe(true);
        });

        it('returns no errors when all fields are empty', () => {
            const result = validateBirthDate('', '', '');
            expect(result.dateError).toBe('');
            expect(result.validDate).toBe(false);
        });
    });

    describe('canCreateAccount', () => {
        const base = {
            gender: 'masculino',
            birthValidDate: true,
            heightCm: '175',
            weightKg: '70',
            acceptedLegal: true,
            loading: false
        };

        it('returns true when every requirement is met', () => {
            expect(canCreateAccount(base)).toBe(true);
        });

        it('returns false when the legal terms are not accepted', () => {
            expect(canCreateAccount({ ...base, acceptedLegal: false })).toBe(false);
        });

        it('returns false when the birth date is invalid', () => {
            expect(canCreateAccount({ ...base, birthValidDate: false })).toBe(false);
        });

        it('returns false for non-positive height or weight', () => {
            expect(canCreateAccount({ ...base, heightCm: '0' })).toBe(false);
            expect(canCreateAccount({ ...base, weightKg: '-1' })).toBe(false);
        });

        it('returns false while loading', () => {
            expect(canCreateAccount({ ...base, loading: true })).toBe(false);
        });
    });
});
