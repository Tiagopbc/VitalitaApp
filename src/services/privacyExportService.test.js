import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFirestoreDeps } from '../firebaseDb';
import { privacyExportService } from './privacyExportService';

vi.mock('../firebaseDb', () => ({
    getFirestoreDeps: vi.fn()
}));

function makeDoc(id, data, exists = true) {
    return {
        id,
        exists: () => exists,
        data: () => data
    };
}

function makeTimestamp(dateString) {
    return {
        toDate: () => new Date(dateString)
    };
}

describe('privacyExportService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('builds a serializable user data export payload', async () => {
        const docsByPath = {
            'users/user-1': makeDoc('user-1', {
                displayName: 'Tiago',
                privacyConsent: {
                    acceptedAt: makeTimestamp('2026-07-07T10:00:00.000Z')
                }
            }),
            'active_workouts/user-1': makeDoc('user-1', {
                userId: 'user-1',
                updatedAt: makeTimestamp('2026-07-07T11:00:00.000Z')
            }),
            'user_stats/user-1': makeDoc('user-1', {
                totalWorkouts: 2,
                updatedAt: makeTimestamp('2026-07-07T12:00:00.000Z')
            })
        };

        const docsByCollection = {
            workout_templates: [
                makeDoc('template-1', {
                    userId: 'user-1',
                    name: 'Treino A',
                    updatedAt: makeTimestamp('2026-07-06T12:00:00.000Z')
                })
            ],
            workout_sessions: [
                makeDoc('session-old', {
                    userId: 'user-1',
                    completedAt: makeTimestamp('2026-07-01T12:00:00.000Z')
                }),
                makeDoc('session-new', {
                    userId: 'user-1',
                    completedAt: makeTimestamp('2026-07-07T12:00:00.000Z')
                })
            ],
            trainer_students: [
                makeDoc('user-1_trainer-1', {
                    studentId: 'user-1',
                    trainerId: 'trainer-1',
                    linkedAt: makeTimestamp('2026-07-05T12:00:00.000Z')
                })
            ],
            trainer_invites: [
                makeDoc('invite-1', {
                    trainerId: 'user-1',
                    createdAt: makeTimestamp('2026-07-04T12:00:00.000Z')
                })
            ]
        };

        getFirestoreDeps.mockResolvedValue({
            db: {},
            doc: (_db, collectionName, docId) => `${collectionName}/${docId}`,
            getDoc: vi.fn(async (path) => docsByPath[path] || makeDoc(path, {}, false)),
            collection: (_db, collectionName) => collectionName,
            where: (fieldName, _operator, value) => ({ fieldName, value }),
            query: (collectionName, constraint) => ({ collectionName, constraint }),
            getDocs: vi.fn(async ({ collectionName, constraint }) => {
                const docs = (docsByCollection[collectionName] || []).filter((docSnap) => {
                    const data = docSnap.data();
                    return data[constraint.fieldName] === constraint.value;
                });
                return { docs };
            })
        });

        const payload = await privacyExportService.buildUserDataExport({
            uid: 'user-1',
            email: 'tiago@example.com',
            displayName: 'Tiago'
        });

        expect(payload.schemaVersion).toBe(1);
        expect(payload.user).toMatchObject({
            uid: 'user-1',
            email: 'tiago@example.com',
            displayName: 'Tiago'
        });
        expect(payload.data.profile.privacyConsent.acceptedAt).toBe('2026-07-07T10:00:00.000Z');
        expect(payload.data.workoutTemplates).toHaveLength(1);
        expect(payload.data.workoutSessions.map(session => session.id)).toEqual(['session-new', 'session-old']);
        expect(payload.data.trainerStudentLinks.asStudent).toHaveLength(1);
        expect(payload.data.trainerInvites).toHaveLength(1);
        expect(payload.data.userStats.totalWorkouts).toBe(2);
    });

    it('requires an authenticated user', async () => {
        await expect(privacyExportService.buildUserDataExport(null)).rejects.toThrow('EXPORT_REQUIRES_USER');
    });
});
