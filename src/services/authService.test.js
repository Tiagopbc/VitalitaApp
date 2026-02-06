import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

vi.mock('../firebaseAuth', () => ({
    auth: { currentUser: null },
    googleProvider: {}
}));

vi.mock('../firebaseDb', () => ({
    db: {}
}));

vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    onAuthStateChanged: vi.fn(),
    sendPasswordResetEmail: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn()
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('creates user, updates profile, and saves Firestore doc', async () => {
            const user = { uid: 'uid-1', delete: vi.fn() };
            createUserWithEmailAndPassword.mockResolvedValue({ user });
            updateProfile.mockResolvedValue();
            doc.mockReturnValue({ path: 'users/uid-1' });
            setDoc.mockResolvedValue();

            const result = await authService.register(
                'test@example.com',
                'secret',
                'Test User',
                { gender: 'male' }
            );

            expect(result).toBe(user);
            expect(createUserWithEmailAndPassword).toHaveBeenCalled();
            expect(updateProfile).toHaveBeenCalledWith(user, { displayName: 'Test User' });
            expect(setDoc).toHaveBeenCalled();
        });

        it('continues when updateProfile fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const user = { uid: 'uid-2', delete: vi.fn() };
            createUserWithEmailAndPassword.mockResolvedValue({ user });
            updateProfile.mockRejectedValue(new Error('fail'));
            doc.mockReturnValue({ path: 'users/uid-2' });
            setDoc.mockResolvedValue();

            try {
                const result = await authService.register(
                    'test@example.com',
                    'secret',
                    'Test User',
                    { gender: 'male' }
                );

                expect(result).toBe(user);
                expect(setDoc).toHaveBeenCalled();
                expect(user.delete).not.toHaveBeenCalled();
            } finally {
                consoleSpy.mockRestore();
            }
        });

        it('rolls back auth user when Firestore write fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const user = { uid: 'uid-3', delete: vi.fn() };
            createUserWithEmailAndPassword.mockResolvedValue({ user });
            updateProfile.mockResolvedValue();
            doc.mockReturnValue({ path: 'users/uid-3' });
            setDoc.mockRejectedValue(new Error('firestore fail'));

            try {
                await expect(
                    authService.register(
                        'test@example.com',
                        'secret',
                        'Test User',
                        { gender: 'male' }
                    )
                ).rejects.toThrow('Cadastro falhou. Tente novamente.');

                expect(user.delete).toHaveBeenCalled();
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('logout', () => {
        it('calls signOut', async () => {
            signOut.mockResolvedValue();
            await authService.logout();
            expect(signOut).toHaveBeenCalled();
        });
    });
});
