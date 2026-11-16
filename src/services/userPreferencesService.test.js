import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFirestoreDeps } from '../firebaseDb';
import { userPreferencesService } from './userPreferencesService';

vi.mock('../firebaseDb', () => ({
    getFirestoreDeps: vi.fn()
}));

function mockProfile(data) {
    const setDoc = vi.fn().mockResolvedValue();
    getFirestoreDeps.mockResolvedValue({
        db: {},
        doc: (_db, col, id) => `${col}/${id}`,
        getDoc: vi.fn().mockResolvedValue({ exists: () => data !== null, data: () => data }),
        setDoc
    });
    return setDoc;
}

describe('userPreferencesService — modo de execução', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lê o modo de execução salvo no perfil', async () => {
        mockProfile({ executionMode: 'foco', autoStartTimer: true });

        const prefs = await userPreferencesService.getWorkoutPreferences('u1');

        expect(prefs.executionMode).toBe('foco');
    });

    it('ignora um modo de execução inválido no perfil', async () => {
        mockProfile({ executionMode: 'turbo' });

        const prefs = await userPreferencesService.getWorkoutPreferences('u1');

        expect(prefs.executionMode).toBeUndefined();
    });

    it('grava o modo de execução com merge', async () => {
        const setDoc = mockProfile({});

        await userPreferencesService.updateWorkoutPreferences('u1', { executionMode: 'normal' });

        expect(setDoc).toHaveBeenCalledWith('users/u1', { executionMode: 'normal' }, { merge: true });
    });

    it('não grava modo de execução inválido', async () => {
        const setDoc = mockProfile({});

        await userPreferencesService.updateWorkoutPreferences('u1', { executionMode: 'turbo' });

        expect(setDoc).not.toHaveBeenCalled();
    });
});
