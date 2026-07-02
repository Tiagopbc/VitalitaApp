import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import {
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    collection,
    query,
    where,
    limit,

    getCountFromServer,
    getDocs,
    serverTimestamp,
    writeBatch,
    Timestamp,

} from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebaseDb', () => ({
    getFirestoreDeps: () => Promise.resolve({
        db: {},
        doc,
        collection,
        query,
        where,
        getDoc,
        setDoc,
        addDoc,
        updateDoc,
        deleteDoc,
        serverTimestamp,
        getCountFromServer,
        getDocs,
        limit,
        writeBatch,
        Timestamp
    })
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(),
    Timestamp: {
        now: vi.fn(),
        fromDate: vi.fn()
    },
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getCountFromServer: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn()
}));

describe('userService', () => {
    const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        doc.mockReturnValue({ path: 'mock-doc' });
        collection.mockReturnValue({ path: 'mock-collection' });
        addDoc.mockResolvedValue({ id: 'invite-1' });
        updateDoc.mockResolvedValue();
        mockBatch.commit.mockResolvedValue();
        writeBatch.mockReturnValue(mockBatch);
        serverTimestamp.mockReturnValue('ts');
        Timestamp.now.mockReturnValue('now-ts');
        Timestamp.fromDate.mockImplementation(date => ({ toDate: () => date }));
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
        it('should throw PERSONAL_NOT_FOUND if trainer code is empty', async () => {
            await expect(userService.linkTrainer('studentId', '   '))
                .rejects.toThrow('PERSONAL_NOT_FOUND');
        });

        it('should throw PERSONAL_NOT_FOUND if trainer code is the student id', async () => {
            await expect(userService.linkTrainer('studentId', 'studentId'))
                .rejects.toThrow('PERSONAL_NOT_FOUND');
        });

        it('should create link if valid', async () => {
            const inviteDoc = {
                id: 'invite-1',
                ref: { path: 'trainer_invites/invite-1' },
                data: () => ({ trainerId: 'trainerCode', code: 'ABC123', status: 'active' })
            };
            getDocs.mockResolvedValueOnce({ empty: false, docs: [inviteDoc] });
            getDoc.mockResolvedValueOnce({ exists: () => false });

            await userService.linkTrainer('studentId', ' abc123 ');

            expect(doc).toHaveBeenCalledWith(expect.anything(), 'trainer_students', 'studentId_trainerCode');
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), {
                trainerId: 'trainerCode',
                studentId: 'studentId',
                status: 'active',
                inviteId: 'invite-1',
                linkedAt: 'ts'
            });
            expect(mockBatch.update).toHaveBeenCalledWith(inviteDoc.ref, {
                status: 'expired',
                usedBy: 'studentId',
                usedAt: 'ts'
            });
            expect(mockBatch.commit).toHaveBeenCalled();
        });

        it('should throw PERSONAL_NOT_FOUND if invite does not exist', async () => {
            getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

            await expect(userService.linkTrainer('studentId', 'ABC123'))
                .rejects.toThrow('PERSONAL_NOT_FOUND');
        });

        it('should throw ALREADY_LINKED if link exists', async () => {
            getDocs.mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'invite-1',
                    ref: {},
                    data: () => ({ trainerId: 'trainerCode', code: 'ABC123', status: 'active' })
                }]
            });
            getDoc.mockResolvedValueOnce({ exists: () => true });

            await expect(userService.linkTrainer('studentId', 'ABC123'))
                .rejects.toThrow('ALREADY_LINKED');
        });

        it('maps Firestore failures to LINK_TRAINER_FAILED', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            getDocs.mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'invite-1',
                    ref: {},
                    data: () => ({ trainerId: 'trainerCode', code: 'ABC123', status: 'active' })
                }]
            });
            getDoc.mockResolvedValueOnce({ exists: () => false });
            mockBatch.commit.mockRejectedValueOnce(new Error('permission-denied'));

            try {
                await expect(userService.linkTrainer('studentId', 'trainerCode'))
                    .rejects.toThrow('LINK_TRAINER_FAILED');
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('trainer invites', () => {
        it('returns active invite when found', async () => {
            getDocs.mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'invite-1',
                    data: () => ({
                        code: 'ABC123',
                        trainerId: 'trainer-1',
                        expiresAt: { toDate: () => new Date('2026-01-01') }
                    })
                }]
            });

            const result = await userService.getActiveTrainerInvite('trainer-1');

            expect(result).toMatchObject({ id: 'invite-1', code: 'ABC123', trainerId: 'trainer-1' });
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('creates invite and revokes active previous invites', async () => {
            const previousInviteRef = { path: 'trainer_invites/old' };
            getDocs.mockResolvedValueOnce({
                docs: [{ ref: previousInviteRef }]
            });
            getDoc.mockResolvedValueOnce({
                exists: () => true,
                id: 'invite-1',
                data: () => ({
                    code: 'NEWCODE1',
                    trainerId: 'trainer-1',
                    expiresAt: { toDate: () => new Date('2026-01-01') }
                })
            });

            const result = await userService.createTrainerInvite('trainer-1');

            expect(updateDoc).toHaveBeenCalledWith(previousInviteRef, { status: 'revoked' });
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    trainerId: 'trainer-1',
                    status: 'active',
                    createdAt: 'ts'
                })
            );
            expect(result.code).toBe('NEWCODE1');
        });

        it('revokes invite by id', async () => {
            await userService.revokeTrainerInvite('invite-1');

            expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'revoked' });
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
        it('deletes the trainer-student link', async () => {
            await userService.unlinkTrainer('student-1', 'trainer-1');

            expect(deleteDoc).toHaveBeenCalled();
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
