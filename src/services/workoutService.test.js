import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutService } from './workoutService';
import { collection, getDocs, onSnapshot, query, where, startAfter, orderBy, limit, doc, getDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn()
    }
}));

// Mock Firebase Firestore modules
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        startAfter: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn(),
        onSnapshot: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        writeBatch: vi.fn(),
    };
});

// Mock db instance
vi.mock('../firebaseDb', () => ({
    getFirestoreDeps: () => Promise.resolve({
        db: {},
        collection,
        query,
        where,
        startAfter,
        orderBy,
        limit,
        getDocs,
        onSnapshot,
        doc,
        getDoc,
        writeBatch,
    })
}));

describe('workoutService', () => {
    const mockUserId = 'user123';

    // Reset mocks and cache before each test
    beforeEach(() => {
        vi.clearAllMocks();
        workoutService.clearCache();
    });

    describe('getTemplates', () => {
        const mockTemplates = [
            { id: 't2', name: 'A Workout', userId: mockUserId },
            { id: 't1', name: 'Z Workout', userId: mockUserId }
        ];

        const mockSnapshot = {
            docs: mockTemplates.map(t => ({
                id: t.id,
                data: () => t
            }))
        };

        it('should fetch templates and sort them client-side', async () => {
            getDocs.mockResolvedValue(mockSnapshot);

            const result = await workoutService.getTemplates(mockUserId);

            // Expect Firestore calls
            expect(collection).toHaveBeenCalledWith(expect.anything(), 'workout_templates');

            // Check if orderBy was used
            // orderBy is not used in the query, client-side sorting is used instead


            expect(getDocs).toHaveBeenCalled();

            // Expect Result (Mock is already sorted)
            expect(result[0].name).toBe('A Workout');
            expect(result[1].name).toBe('Z Workout');
            expect(result.length).toBe(2);
        });

        it('prioritizes persisted display order over workout name', async () => {
            getDocs.mockResolvedValue({
                docs: [
                    { id: 'a', data: () => ({ name: 'Treino A', displayOrder: 1 }) },
                    { id: 'b', data: () => ({ name: 'Treino B', displayOrder: 0 }) }
                ]
            });

            const result = await workoutService.getTemplates(mockUserId);

            expect(result.map(template => template.id)).toEqual(['b', 'a']);
        });

        it('should return cached data on subsequent calls within duration', async () => {
            getDocs.mockResolvedValue(mockSnapshot);

            // First call - hits network
            await workoutService.getTemplates(mockUserId); // Cache populated
            expect(getDocs).toHaveBeenCalledTimes(1);

            // Second call - should hit cache
            const cachedResult = await workoutService.getTemplates(mockUserId);
            expect(getDocs).toHaveBeenCalledTimes(1); // Call count remains 1
            expect(cachedResult).toHaveLength(2);
        });

        it('should refetch when userId changes', async () => {
            getDocs.mockResolvedValue(mockSnapshot);

            await workoutService.getTemplates(mockUserId);
            await workoutService.getTemplates('other-user');

            expect(getDocs).toHaveBeenCalledTimes(2);
        });

        it('should force refresh when flag is true', async () => {
            getDocs.mockResolvedValue(mockSnapshot);

            await workoutService.getTemplates(mockUserId); // Populate cache

            // Force refresh call
            await workoutService.getTemplates(mockUserId, true);

            expect(getDocs).toHaveBeenCalledTimes(2); // Should have called twice
        });

        it('should handle errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('Network Error');
            getDocs.mockRejectedValue(error);

            try {
                await expect(workoutService.getTemplates(mockUserId)).rejects.toThrow('Network Error');
                expect(toast.error).toHaveBeenCalledWith('Erro ao carregar treinos. Verifique sua conexão.');
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('saveTemplateOrder', () => {
        it('persists contiguous positions in a single batch', async () => {
            const update = vi.fn();
            const commit = vi.fn().mockResolvedValue(undefined);
            doc.mockImplementation((_db, collectionName, documentId) => ({ collectionName, documentId }));
            writeBatch.mockReturnValue({ update, commit });

            await workoutService.saveTemplateOrder([
                { id: 'workout-b' },
                { id: 'workout-a' }
            ]);

            expect(update).toHaveBeenNthCalledWith(1, expect.anything(), { displayOrder: 0 });
            expect(update).toHaveBeenNthCalledWith(2, expect.anything(), { displayOrder: 1 });
            expect(commit).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribeToTemplates', () => {
        it('updates cache and delivers sorted templates', async () => {
            const onUpdate = vi.fn();
            let snapshotCallback;

            onSnapshot.mockImplementation((_q, cb) => {
                snapshotCallback = cb;
                return vi.fn();
            });

            await workoutService.subscribeToTemplates(mockUserId, onUpdate);

            const snapshotTemplates = [
                { id: 'b', name: 'B Workout', userId: mockUserId },
                { id: 'a', name: 'A Workout', userId: mockUserId }
            ];

            snapshotCallback({
                docs: snapshotTemplates.map(t => ({
                    id: t.id,
                    data: () => t
                }))
            });

            expect(onUpdate).toHaveBeenCalledWith([
                { id: 'a', name: 'A Workout', userId: mockUserId },
                { id: 'b', name: 'B Workout', userId: mockUserId }
            ]);

            const cached = await workoutService.getTemplates(mockUserId);
            expect(getDocs).not.toHaveBeenCalled();
            expect(cached[0].name).toBe('A Workout');
        });
    });

    describe('getLatestSession', () => {
        it('should return null if no sessions found', async () => {
            getDocs.mockResolvedValue({ empty: true, docs: [] });

            const result = await workoutService.getLatestSession(mockUserId);
            expect(result).toBeNull();
        });

        it('should return formatted session object if found', async () => {
            const mockDate = { toDate: () => new Date('2023-01-01') };
            const mockDoc = {
                id: 'session1',
                data: () => ({
                    completedAt: mockDate,
                    templateName: 'Leg Day'
                })
            };

            getDocs.mockResolvedValue({
                empty: false,
                docs: [mockDoc]
            });

            const result = await workoutService.getLatestSession(mockUserId);

            expect(result).not.toBeNull();
            expect(result.id).toBe('session1');
            expect(result.date).toBeInstanceOf(Date);
        });

        it('should return null on error', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            getDocs.mockRejectedValue(new Error('fail'));

            try {
                const result = await workoutService.getLatestSession(mockUserId);
                expect(result).toBeNull();
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('getHistory', () => {
        it('throws and shows index error when missing Firestore index', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('missing index');
            error.code = 'failed-precondition';
            getDocs.mockRejectedValue(error);

            try {
                await expect(
                    workoutService.getHistory(mockUserId, 'Template A')
                ).rejects.toThrow('missing index');

                expect(toast.error).toHaveBeenCalledWith('Erro de índice. Verifique o console.');
            } finally {
                consoleSpy.mockRestore();
            }
        });

        it('throws and shows generic error for other failures', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('boom');
            getDocs.mockRejectedValue(error);

            try {
                await expect(
                    workoutService.getHistory(mockUserId, 'Template A')
                ).rejects.toThrow('boom');

                expect(toast.error).toHaveBeenCalledWith('Erro ao carregar histórico.');
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('getRecentSessions', () => {
        it('fetches recent sessions ordered by completion date with an explicit limit', async () => {
            const mockDate = { toDate: () => new Date('2024-01-02') };
            getDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'session-1',
                        data: () => ({
                            userId: mockUserId,
                            completedAt: mockDate,
                            workoutName: 'Treino A'
                        })
                    }
                ]
            });

            const result = await workoutService.getRecentSessions(mockUserId, 25);

            expect(collection).toHaveBeenCalledWith(expect.anything(), 'workout_sessions');
            expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
            expect(orderBy).toHaveBeenCalledWith('completedAt', 'desc');
            expect(limit).toHaveBeenCalledWith(25);
            expect(result).toEqual([
                {
                    id: 'session-1',
                    userId: mockUserId,
                    completedAt: mockDate,
                    workoutName: 'Treino A'
                }
            ]);
        });

        it('clamps very large recent session limits', async () => {
            getDocs.mockResolvedValue({ docs: [] });

            await workoutService.getRecentSessions(mockUserId, 5000);

            expect(limit).toHaveBeenCalledWith(500);
        });

        it('falls back to a bounded legacy query when ordered sessions are empty', async () => {
            getDocs
                .mockResolvedValueOnce({ docs: [] })
                .mockResolvedValueOnce({
                    docs: [
                        {
                            id: 'legacy-old',
                            data: () => ({
                                userId: mockUserId,
                                date: '2024-01-01T12:00:00.000Z',
                                workoutName: 'Treino Antigo'
                            })
                        },
                        {
                            id: 'legacy-new',
                            data: () => ({
                                userId: mockUserId,
                                completedAtClient: '2024-01-03T12:00:00.000Z',
                                workoutName: 'Treino Novo'
                            })
                        }
                    ]
                });

            const result = await workoutService.getRecentSessions(mockUserId, 25);

            expect(getDocs).toHaveBeenCalledTimes(2);
            expect(result.map(session => session.id)).toEqual(['legacy-new', 'legacy-old']);
        });

        it('falls back to legacy sessions when ordered recent query fails', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            getDocs
                .mockRejectedValueOnce(new Error('missing index'))
                .mockResolvedValueOnce({
                    docs: [
                        {
                            id: 'legacy-session',
                            data: () => ({
                                userId: mockUserId,
                                createdAt: { seconds: 1704283200 },
                                workoutName: 'Treino Legado'
                            })
                        }
                    ]
                });

            try {
                const result = await workoutService.getRecentSessions(mockUserId, 25);

                expect(result).toEqual([
                    {
                        id: 'legacy-session',
                        userId: mockUserId,
                        createdAt: { seconds: 1704283200 },
                        workoutName: 'Treino Legado'
                    }
                ]);
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Falling back to legacy recent sessions query.',
                    expect.any(Error)
                );
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('subscribeToRecentSessions', () => {
        it('subscribes only to a bounded recent session window', async () => {
            const onUpdate = vi.fn();
            const unsubscribe = vi.fn();
            let snapshotCallback;

            onSnapshot.mockImplementation((_q, cb) => {
                snapshotCallback = cb;
                return unsubscribe;
            });

            const result = await workoutService.subscribeToRecentSessions(mockUserId, onUpdate, 30);

            expect(result).toBe(unsubscribe);
            expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
            expect(orderBy).toHaveBeenCalledWith('completedAt', 'desc');
            expect(limit).toHaveBeenCalledWith(30);

            snapshotCallback({
                docs: [
                    {
                        id: 'session-2',
                        data: () => ({ userId: mockUserId, workoutName: 'Treino B' })
                    }
                ]
            });

            expect(onUpdate).toHaveBeenCalledWith([
                { id: 'session-2', userId: mockUserId, workoutName: 'Treino B' }
            ]);
        });
    });
});
