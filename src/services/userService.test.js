import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import {
    getDoc,
    setDoc,
    addDoc,
    deleteDoc,
    doc,

    getCountFromServer,
    getDocs,
    serverTimestamp,

} from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebaseDb', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getCountFromServer: vi.fn(),
    getDocs: vi.fn()
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        doc.mockReturnValue({ path: 'mock-doc' });
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

    describe('getTrainerStudents', () => {
        it('returns student list and filters missing profiles', async () => {
            const linkedAt = { toDate: () => new Date('2024-01-01') };
            getDocs.mockResolvedValue({
                docs: [
                    { data: () => ({ studentId: 's1', linkedAt }) },
                    { data: () => ({ studentId: 's2' }) }
                ]
            });

            getDoc
                .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Alice' }) })
                .mockResolvedValueOnce({ exists: () => false });

            const result = await userService.getTrainerStudents('trainer-1');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ id: 's1', name: 'Alice' });
            expect(result[0].linkedAt).toBeInstanceOf(Date);
        });
    });

    describe('unlinkTrainer', () => {
        it('deletes all matching trainer-student links', async () => {
            getDocs.mockResolvedValue({
                docs: [
                    { ref: 'ref-1' },
                    { ref: 'ref-2' }
                ]
            });

            await userService.unlinkTrainer('student-1', 'trainer-1');

            expect(deleteDoc).toHaveBeenCalledTimes(2);
            expect(deleteDoc).toHaveBeenCalledWith('ref-1');
            expect(deleteDoc).toHaveBeenCalledWith('ref-2');
        });
    });

    describe('updateActiveSession', () => {
        it('updates active session with merge and userId', async () => {
            serverTimestamp.mockReturnValue('ts');

            await userService.updateActiveSession('user-1', {
                exercises: [],
                elapsedSeconds: 120,
                templateId: 'tmpl-1'
            });

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    exercises: [],
                    elapsedSeconds: 120,
                    templateId: 'tmpl-1',
                    userId: 'user-1',
                    updatedAt: 'ts'
                }),
                { merge: true }
            );
        });
    });

    describe('deleteActiveSession', () => {
        it('deletes active session and clears active workout', async () => {
            const clearSpy = vi.spyOn(userService, 'clearActiveWorkout').mockResolvedValue();

            await userService.deleteActiveSession('user-1');

            expect(deleteDoc).toHaveBeenCalled();
            expect(clearSpy).toHaveBeenCalledWith('user-1');
        });
    });
});
