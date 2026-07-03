import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import fs from 'node:fs';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'demo-vitalita-rules';
const futureDate = Timestamp.fromDate(new Date('2099-01-01T00:00:00.000Z'));
const pastDate = Timestamp.fromDate(new Date('2020-01-01T00:00:00.000Z'));

let testEnv;

function authedDb(uid) {
    return testEnv.authenticatedContext(uid).firestore();
}

function guestDb() {
    return testEnv.unauthenticatedContext().firestore();
}

async function seed(path, data) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), path), data);
    });
}

async function seedUser(userId, overrides = {}) {
    await seed(`users/${userId}`, {
        displayName: userId,
        email: `${userId}@example.com`,
        createdAt: Timestamp.now(),
        ...overrides
    });
}

async function seedLink(studentId = 'student-1', trainerId = 'trainer-1') {
    await seed(`trainer_students/${studentId}_${trainerId}`, {
        studentId,
        trainerId,
        status: 'active',
        linkedAt: Timestamp.now(),
        inviteId: 'seeded-invite'
    });
}

function templatePayload(ownerId, createdBy = ownerId) {
    return {
        userId: ownerId,
        createdBy,
        name: 'Treino A',
        exercises: [],
        assignedByTrainer: createdBy !== ownerId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
}

function sessionPayload(userId) {
    return {
        userId,
        templateId: 'template-1',
        templateName: 'Treino A',
        workoutName: 'Treino A',
        duration: '45min',
        elapsedSeconds: 2700,
        exercises: [
            {
                id: 'ex-1',
                name: 'Supino',
                sets: [{ id: 'set-1', weight: '80', reps: '10', completed: true }]
            }
        ],
        createdAt: Timestamp.now(),
        completedAt: Timestamp.now()
    };
}

describe('firestore.rules', () => {
    beforeAll(async () => {
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: {
                rules: fs.readFileSync('firestore.rules', 'utf8')
            }
        });
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();
    });

    afterAll(async () => {
        await testEnv.cleanup();
    });

    it('permite usuario autenticado ler e atualizar o proprio perfil', async () => {
        await seedUser('student-1');
        const db = authedDb('student-1');

        await assertSucceeds(getDoc(doc(db, 'users/student-1')));
        await assertSucceeds(updateDoc(doc(db, 'users/student-1'), {
            displayName: 'Aluno Atualizado'
        }));
    });

    it('bloqueia leitura de perfil de terceiro nao vinculado', async () => {
        await seedUser('student-1');

        await assertFails(getDoc(doc(authedDb('stranger-1'), 'users/student-1')));
        await assertFails(getDoc(doc(guestDb(), 'users/student-1')));
    });

    it('permite personal ler perfil de aluno vinculado', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');
        await seedLink('student-1', 'trainer-1');

        await assertSucceeds(getDoc(doc(authedDb('trainer-1'), 'users/student-1')));
    });

    it('controla criacao de templates para aluno e personal vinculado', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');
        await seedLink('student-1', 'trainer-1');

        await assertSucceeds(setDoc(
            doc(authedDb('student-1'), 'workout_templates/self-template'),
            templatePayload('student-1')
        ));

        await assertSucceeds(setDoc(
            doc(authedDb('trainer-1'), 'workout_templates/assigned-template'),
            templatePayload('student-1', 'trainer-1')
        ));

        await assertFails(setDoc(
            doc(authedDb('stranger-1'), 'workout_templates/bad-template'),
            templatePayload('student-1', 'stranger-1')
        ));

        await assertFails(setDoc(
            doc(authedDb('trainer-1'), 'workout_templates/forged-template'),
            templatePayload('student-1', 'other-user')
        ));
    });

    it('mantem propriedade do template imutavel em update', async () => {
        await seedUser('student-1');
        await seed('workout_templates/template-1', templatePayload('student-1'));

        await assertSucceeds(updateDoc(doc(authedDb('student-1'), 'workout_templates/template-1'), {
            name: 'Treino Editado',
            updatedAt: Timestamp.now()
        }));

        await assertFails(updateDoc(doc(authedDb('student-1'), 'workout_templates/template-1'), {
            userId: 'other-user'
        }));
    });

    it('protege historico: aluno cria, personal vinculado le, personal nao altera nem deleta', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');
        await seedLink('student-1', 'trainer-1');

        await assertSucceeds(setDoc(
            doc(authedDb('student-1'), 'workout_sessions/session-1'),
            sessionPayload('student-1')
        ));

        await assertSucceeds(getDoc(doc(authedDb('trainer-1'), 'workout_sessions/session-1')));

        await assertFails(updateDoc(doc(authedDb('trainer-1'), 'workout_sessions/session-1'), {
            exercises: []
        }));

        await assertFails(deleteDoc(doc(authedDb('trainer-1'), 'workout_sessions/session-1')));
    });

    it('permite leitura de user_stats para dono e personal vinculado, mas bloqueia escrita do cliente', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');
        await seedLink('student-1', 'trainer-1');
        await seed('user_stats/student-1', {
            userId: 'student-1',
            totalWorkouts: 12,
            currentStreak: 2,
            updatedAt: Timestamp.now()
        });

        await assertSucceeds(getDoc(doc(authedDb('student-1'), 'user_stats/student-1')));
        await assertSucceeds(getDoc(doc(authedDb('trainer-1'), 'user_stats/student-1')));
        await assertFails(getDoc(doc(authedDb('stranger-1'), 'user_stats/student-1')));
        await assertFails(setDoc(doc(authedDb('student-1'), 'user_stats/student-1'), {
            userId: 'student-1',
            totalWorkouts: 999
        }));
    });

    it('bloqueia criacao de vinculo sem convite consumido', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');

        await assertFails(setDoc(doc(authedDb('student-1'), 'trainer_students/student-1_trainer-1'), {
            studentId: 'student-1',
            trainerId: 'trainer-1',
            status: 'active',
            linkedAt: Timestamp.now(),
            inviteId: 'missing-invite'
        }));
    });

    it('permite personal criar convite ativo e aluno aceitar em batch atomico', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');

        const trainerDb = authedDb('trainer-1');
        await assertSucceeds(setDoc(doc(trainerDb, 'trainer_invites/invite-1'), {
            trainerId: 'trainer-1',
            code: 'ABC12345',
            status: 'active',
            createdAt: Timestamp.now(),
            expiresAt: futureDate
        }));

        const studentDb = authedDb('student-1');
        await assertSucceeds(getDoc(doc(studentDb, 'trainer_invites/invite-1')));

        const batch = writeBatch(studentDb);
        batch.set(doc(studentDb, 'trainer_students/student-1_trainer-1'), {
            studentId: 'student-1',
            trainerId: 'trainer-1',
            status: 'active',
            linkedAt: Timestamp.now(),
            inviteId: 'invite-1'
        });
        batch.update(doc(studentDb, 'trainer_invites/invite-1'), {
            status: 'expired',
            usedBy: 'student-1',
            usedAt: Timestamp.now()
        });

        await assertSucceeds(batch.commit());
    });

    it('bloqueia consumo de convite sem criar vinculo correspondente', async () => {
        await seedUser('student-1');
        await seedUser('trainer-1');
        await seed('trainer_invites/invite-1', {
            trainerId: 'trainer-1',
            code: 'ABC12345',
            status: 'active',
            createdAt: Timestamp.now(),
            expiresAt: futureDate
        });

        await assertFails(updateDoc(doc(authedDb('student-1'), 'trainer_invites/invite-1'), {
            status: 'expired',
            usedBy: 'student-1',
            usedAt: Timestamp.now()
        }));
    });

    it('bloqueia convite expirado e revogacao por terceiro', async () => {
        await seedUser('trainer-1');
        await seed('trainer_invites/expired-invite', {
            trainerId: 'trainer-1',
            code: 'OLD12345',
            status: 'active',
            createdAt: Timestamp.now(),
            expiresAt: pastDate
        });

        await assertFails(getDoc(doc(authedDb('student-1'), 'trainer_invites/expired-invite')));
        await assertFails(updateDoc(doc(authedDb('student-1'), 'trainer_invites/expired-invite'), {
            status: 'revoked'
        }));
        await assertSucceeds(updateDoc(doc(authedDb('trainer-1'), 'trainer_invites/expired-invite'), {
            status: 'revoked'
        }));
    });

    it('bloqueia criacao de vinculo em nome de outro aluno', async () => {
        await seedUser('student-1');
        await seedUser('student-2');
        await seedUser('trainer-1');
        await seed('trainer_invites/invite-1', {
            trainerId: 'trainer-1',
            code: 'ABC12345',
            status: 'active',
            createdAt: Timestamp.now(),
            expiresAt: futureDate
        });

        const db = authedDb('student-1');
        const batch = writeBatch(db);
        batch.set(doc(db, 'trainer_students/student-2_trainer-1'), {
            studentId: 'student-2',
            trainerId: 'trainer-1',
            status: 'active',
            linkedAt: Timestamp.now(),
            inviteId: 'invite-1'
        });
        batch.update(doc(db, 'trainer_invites/invite-1'), {
            status: 'expired',
            usedBy: 'student-1',
            usedAt: Timestamp.now()
        });

        await assertFails(batch.commit());
    });
});
