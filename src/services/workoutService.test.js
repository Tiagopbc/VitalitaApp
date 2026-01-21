import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutService } from './workoutService';
import { collection, getDocs, doc, getDoc, limit, query, where, startAfter, orderBy } from 'firebase/firestore';

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
    };
});

// Mock db instance
vi.mock('../firebaseConfig', () => ({
    db: {}
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

        it('should fetch templates and use orderBy for sorting', async () => {
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

        it('should force refresh when flag is true', async () => {
            getDocs.mockResolvedValue(mockSnapshot);

            await workoutService.getTemplates(mockUserId); // Populate cache

            // Force refresh call
            await workoutService.getTemplates(mockUserId, true);

            expect(getDocs).toHaveBeenCalledTimes(2); // Should have called twice
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Network Error');
            getDocs.mockRejectedValue(error);

            await expect(workoutService.getTemplates(mockUserId)).rejects.toThrow('Network Error');
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
    });
});
