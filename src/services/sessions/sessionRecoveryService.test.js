import { describe, expect, it, beforeEach } from 'vitest';
import {
    chooseSessionRecoverySource,
    createSessionBackupKey,
    createSessionFingerprint,
    readSessionBackup,
    removeSessionBackup,
    resolveSessionConflict,
    SESSION_SYNC_STATES,
    writeSessionBackup
} from './sessionRecoveryService';

describe('sessionRecoveryService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('creates scoped backup keys only when user and workout are available', () => {
        expect(createSessionBackupKey('user-1', 'workout-1')).toBe('workout_backup_user-1_workout-1');
        expect(createSessionBackupKey('', 'workout-1')).toBeNull();
        expect(createSessionBackupKey('user-1', '')).toBeNull();
    });

    it('persists and removes local backups safely', () => {
        const key = createSessionBackupKey('user-1', 'workout-1');
        writeSessionBackup(key, {
            elapsedSeconds: 42,
            exercises: [{ id: 'ex-1', sets: [] }]
        });

        const backup = readSessionBackup(key);
        expect(backup.elapsedSeconds).toBe(42);
        expect(backup.exercises[0].id).toBe('ex-1');
        expect(backup.timestamp).toEqual(expect.any(Number));

        removeSessionBackup(key);
        expect(readSessionBackup(key)).toBeNull();
    });

    it('prefers a newer local backup when both local and cloud sessions exist', () => {
        const cloudData = {
            updatedAt: new Date('2026-07-04T10:00:00Z'),
            elapsedSeconds: 300,
            exercises: [{ id: 'cloud', sets: [] }]
        };
        const localBackupData = {
            timestamp: new Date('2026-07-04T10:05:00Z').getTime(),
            elapsedSeconds: 330,
            exercises: [{ id: 'local', sets: [] }]
        };

        const recovery = chooseSessionRecoverySource({ cloudData, localBackupData });
        expect(recovery.conflict).toBe(true);
        expect(recovery.source).toBe('local');
        expect(recovery.exercises[0].id).toBe('local');
    });

    it('keeps the sync fingerprint stable inside the elapsed sync bucket', () => {
        const exercises = [{
            id: 'ex-1',
            name: 'Supino',
            sets: [{ id: 'set-1', completed: false, weight: '40', reps: '10' }]
        }];

        expect(createSessionFingerprint(exercises, 1)).toBe(createSessionFingerprint(exercises, 29));
        expect(createSessionFingerprint(exercises, 31)).not.toBe(createSessionFingerprint(exercises, 29));
    });

    it('returns null when the requested conflict source has no candidate', () => {
        const sessionConflict = { candidates: { cloud: { exercises: [], elapsedSeconds: 0 } } };
        expect(resolveSessionConflict({ sessionConflict, source: 'local', backupKey: 'key' })).toBeNull();
        expect(resolveSessionConflict({ sessionConflict: null, source: 'cloud', backupKey: 'key' })).toBeNull();
    });

    it('resolves a local candidate without touching the backup or fingerprint', () => {
        const key = createSessionBackupKey('user-1', 'workout-1');
        writeSessionBackup(key, { elapsedSeconds: 330, exercises: [{ id: 'local', sets: [] }] });
        const localCandidate = { exercises: [{ id: 'local', sets: [] }], elapsedSeconds: 330 };
        const sessionConflict = { candidates: { local: localCandidate } };

        const resolution = resolveSessionConflict({ sessionConflict, source: 'local', backupKey: key });

        expect(resolution.candidate).toBe(localCandidate);
        expect(resolution.exercises).toBe(localCandidate.exercises);
        expect(resolution.elapsedSeconds).toBe(330);
        expect(resolution.fingerprint).toBe('');
        expect(resolution.syncState).toBe(SESSION_SYNC_STATES.active);
        // Backup local permanece intacto ao escolher a sessão local.
        expect(readSessionBackup(key)).not.toBeNull();
    });

    it('resolves a cloud candidate, clears the local backup and seeds the fingerprint', () => {
        const key = createSessionBackupKey('user-1', 'workout-1');
        writeSessionBackup(key, { elapsedSeconds: 300, exercises: [{ id: 'local', sets: [] }] });
        const cloudCandidate = {
            exercises: [{ id: 'cloud', name: 'Supino', sets: [{ id: 'set-1', completed: true, weight: '40', reps: '10' }] }],
            elapsedSeconds: 300
        };
        const sessionConflict = { candidates: { cloud: cloudCandidate } };

        const resolution = resolveSessionConflict({ sessionConflict, source: 'cloud', backupKey: key });

        expect(resolution.candidate).toBe(cloudCandidate);
        expect(resolution.fingerprint).toBe(createSessionFingerprint(cloudCandidate.exercises, 300));
        expect(resolution.syncState).toBe(SESSION_SYNC_STATES.active);
        // Backup local é descartado ao escolher a sessão da nuvem.
        expect(readSessionBackup(key)).toBeNull();
    });
});
