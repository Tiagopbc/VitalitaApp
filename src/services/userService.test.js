import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import {
    getDoc,
    updateDoc,
    setDoc,
    addDoc,

    getCountFromServer,
    getDocs,

} from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebaseConfig', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getCountFromServer: vi.fn(),
    getDocs: vi.fn()
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkTrainerStatus', () => {
        it('should return true if count > 0', async () => {
            getCountFromServer.mockResolvedValue({
                data: () => ({ count: 1 })
            });

            const isTrainer = await userService.checkTrainerStatus('userId123');
            expect(isTrainer).toBe(true);
        });

        it('should return false if count is 0', async () => {
            getCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 })
            });

            const isTrainer = await userService.checkTrainerStatus('userId123');
            expect(isTrainer).toBe(false);
        });
    });

    describe('getUserProfile', () => {
        it('should return user data if doc exists', async () => {
            const mockData = { displayName: 'Test User' };
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => mockData
            });

            const result = await userService.getUserProfile('userId123');
            expect(result).toEqual(mockData);
        });

        it('should return null if doc does not exist', async () => {
            getDoc.mockResolvedValue({
                exists: () => false
            });

            const result = await userService.getUserProfile('userId123');
            expect(result).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('should call updateDoc with correct args', async () => {
            const userId = 'userId123';
            const data = { displayName: 'New Name' };

            await userService.updateUserProfile(userId, data);

            expect(setDoc).toHaveBeenCalled();
        });
    });

    describe('linkTrainer', () => {
        it('should throw PERSONAL_NOT_FOUND if trainer does not exist', async () => {
            getDoc.mockResolvedValueOnce({ exists: () => false }); // Trainer check

            await expect(userService.linkTrainer('studentId', 'invalidTrainerCode'))
                .rejects.toThrow('PERSONAL_NOT_FOUND');
        });

        it('should throw ALREADY_LINKED if link exists', async () => {
            getDoc.mockResolvedValueOnce({ exists: () => true }); // Trainer check
            getDocs.mockResolvedValueOnce({ empty: false }); // Link check

            await expect(userService.linkTrainer('studentId', 'trainerCode'))
                .rejects.toThrow('ALREADY_LINKED');
        });

        it('should create link if valid', async () => {
            getDoc.mockResolvedValueOnce({ exists: () => true }); // Trainer check
            getDocs.mockResolvedValueOnce({ empty: true }); // Link check

            await userService.linkTrainer('studentId', 'trainerCode');

            expect(addDoc).toHaveBeenCalled();
        });
    });

    describe('setActiveWorkout', () => {
        it('should update user doc with activeWorkoutId', async () => {
            await userService.setActiveWorkout('uid', 'wid');
            expect(setDoc).toHaveBeenCalled();
        });
    });

    describe('clearActiveWorkout', () => {
        it('should update user doc setting activeWorkoutId to null', async () => {
            await userService.clearActiveWorkout('uid');
            expect(setDoc).toHaveBeenCalled();
        });
    });
});
