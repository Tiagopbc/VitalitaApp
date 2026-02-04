import React, { useEffect } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from './services/authService';

vi.mock('./services/authService', () => ({
    authService: {
        subscribe: vi.fn(),
        logout: vi.fn()
    }
}));

function TestConsumer({ onReady }) {
    const { user, authLoading, logout } = useAuth();

    useEffect(() => {
        onReady({ user, authLoading, logout });
    }, [user, authLoading, logout, onReady]);

    return (
        <div>
            <div data-testid="auth-loading">{authLoading ? 'loading' : 'ready'}</div>
            <div data-testid="user-id">{user?.uid || 'NONE'}</div>
        </div>
    );
}

describe('AuthContext', () => {
    let subscribeCallback;
    let unsubscribeSpy;
    let latestContext;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        subscribeCallback = undefined;
        latestContext = undefined;
        unsubscribeSpy = vi.fn();

        authService.subscribe.mockImplementation((cb) => {
            subscribeCallback = cb;
            return unsubscribeSpy;
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('updates user and loading state from subscribe callback', async () => {
        render(
            <AuthProvider>
                <TestConsumer onReady={(ctx) => { latestContext = ctx; }} />
            </AuthProvider>
        );

        expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading');
        expect(screen.getByTestId('user-id')).toHaveTextContent('NONE');

        await waitFor(() => {
            expect(subscribeCallback).toBeTypeOf('function');
        });

        await act(async () => {
            subscribeCallback({ uid: 'user-1' });
        });

        expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready');
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
        expect(latestContext?.user?.uid).toBe('user-1');
    });

    it('cleans up subscription on unmount', async () => {
        const { unmount } = render(
            <AuthProvider>
                <TestConsumer onReady={(ctx) => { latestContext = ctx; }} />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(subscribeCallback).toBeTypeOf('function');
        });

        unmount();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('logout clears localStorage on success', async () => {
        authService.logout.mockResolvedValue();
        localStorage.setItem('activeWorkoutId', 'abc');

        render(
            <AuthProvider>
                <TestConsumer onReady={(ctx) => { latestContext = ctx; }} />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(latestContext?.logout).toBeTypeOf('function');
        });

        await act(async () => {
            await latestContext.logout();
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(localStorage.getItem('activeWorkoutId')).toBeNull();
    });

    it('logout rethrows and keeps localStorage on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        authService.logout.mockRejectedValue(new Error('fail'));
        localStorage.setItem('activeWorkoutId', 'abc');

        render(
            <AuthProvider>
                <TestConsumer onReady={(ctx) => { latestContext = ctx; }} />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(latestContext?.logout).toBeTypeOf('function');
        });

        let error;
        await act(async () => {
            try {
                await latestContext.logout();
            } catch (err) {
                error = err;
            }
        });

        expect(error).toBeInstanceOf(Error);
        expect(localStorage.getItem('activeWorkoutId')).toBe('abc');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
