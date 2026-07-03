import { getFirestoreDeps } from '../firebaseDb';

const INVITES_COLLECTION = 'trainer_invites';
const TRAINER_STUDENTS_COLLECTION = 'trainer_students';
const INVITE_TTL_DAYS = 7;

function getInviteExpiryDate() {
    return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function generateInviteCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    const bytes = new Uint8Array(8);

    if (cryptoObj?.getRandomValues) {
        cryptoObj.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i += 1) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
}

function mapInviteDoc(docSnap) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        expiresAt: toDate(data.expiresAt),
        createdAt: toDate(data.createdAt),
        usedAt: toDate(data.usedAt)
    };
}

export const userService = {
    /**
     * Verificar se usuário é um treinador
     * @param {string} userId 
     * @returns {Promise<boolean>}
     */
    async checkTrainerStatus(userId) {
        const { db, collection, query, where, getCountFromServer } = await getFirestoreDeps();
        const q = query(
            collection(db, TRAINER_STUDENTS_COLLECTION),
            where('trainerId', '==', userId),
            where('status', '==', 'active')
        );
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count > 0;
    },

    /**
     * Obter perfil de usuário por ID
     * @param {string} userId 
     * @returns {Promise<Object>} Dados do usuário ou null se não encontrado
     */
    async getUserProfile(userId) {
        const { db, doc, getDoc } = await getFirestoreDeps();
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },

    /**
     * Atualizar perfil de usuário
     * @param {string} userId 
     * @param {Object} data 
     */
    async updateUserProfile(userId, data) {
        const { db, doc, setDoc } = await getFirestoreDeps();
        const docRef = doc(db, 'users', userId);
        // Usar setDoc com merge para garantir que funcione mesmo se o doc ainda não existir (race condition)
        await setDoc(docRef, data, { merge: true });
    },

    /**
     * Vincular estudante ao treinador
     * @param {string} studentId 
     * @param {string} trainerCode (trainerId)
     * @returns {Promise<void>}
     */
    async linkTrainer(studentId, trainerCode) {
        const normalizedTrainerCode = trainerCode?.trim();
        if (!normalizedTrainerCode || normalizedTrainerCode === studentId) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        const {
            db,
            collection,
            query,
            where,
            limit,
            getDocs,
            getDoc,
            doc,
            writeBatch,
            serverTimestamp,
            Timestamp
        } = await getFirestoreDeps();

        const normalizedCode = normalizedTrainerCode.toUpperCase();
        const inviteQuery = query(
            collection(db, INVITES_COLLECTION),
            where('code', '==', normalizedCode),
            where('status', '==', 'active'),
            where('expiresAt', '>', Timestamp.now()),
            limit(1)
        );
        const inviteSnap = await getDocs(inviteQuery);

        if (inviteSnap.empty) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        const inviteDoc = inviteSnap.docs[0];
        const invite = inviteDoc.data();

        if (invite.trainerId === studentId) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        const linkId = `${studentId}_${invite.trainerId}`;
        const linkRef = doc(db, TRAINER_STUDENTS_COLLECTION, linkId);
        const linkSnap = await getDoc(linkRef);

        if (linkSnap.exists()) {
            throw new Error("ALREADY_LINKED");
        }

        try {
            const batch = writeBatch(db);
            batch.set(linkRef, {
                trainerId: invite.trainerId,
                studentId,
                status: 'active',
                inviteId: inviteDoc.id,
                linkedAt: serverTimestamp()
            });
            batch.update(inviteDoc.ref, {
                status: 'expired',
                usedBy: studentId,
                usedAt: serverTimestamp()
            });
            await batch.commit();
        } catch (error) {
            console.error("Error linking trainer:", error);
            throw new Error("LINK_TRAINER_FAILED");
        }
    },

    /**
     * Busca convite ativo e não expirado do treinador.
     * @param {string} trainerId
     * @returns {Promise<Object|null>}
     */
    async getActiveTrainerInvite(trainerId) {
        const { db, collection, query, where, limit, getDocs, Timestamp } = await getFirestoreDeps();
        const q = query(
            collection(db, INVITES_COLLECTION),
            where('trainerId', '==', trainerId),
            where('status', '==', 'active'),
            where('expiresAt', '>', Timestamp.now()),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return mapInviteDoc(snap.docs[0]);
    },

    /**
     * Cria um novo convite, revogando convites ativos anteriores do treinador.
     * @param {string} trainerId
     * @returns {Promise<Object>}
     */
    async createTrainerInvite(trainerId) {
        const { db, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, Timestamp } = await getFirestoreDeps();
        const activeInvitesQuery = query(
            collection(db, INVITES_COLLECTION),
            where('trainerId', '==', trainerId),
            where('status', '==', 'active')
        );
        const activeInvites = await getDocs(activeInvitesQuery);

        await Promise.all(activeInvites.docs.map(inviteDoc =>
            updateDoc(inviteDoc.ref, { status: 'revoked' })
        ));

        const expiresAt = Timestamp.fromDate(getInviteExpiryDate());
        const docRef = await addDoc(collection(db, INVITES_COLLECTION), {
            trainerId,
            code: generateInviteCode(),
            status: 'active',
            createdAt: serverTimestamp(),
            expiresAt
        });

        return this.getTrainerInviteById(docRef.id);
    },

    /**
     * Busca convite por ID.
     * @param {string} inviteId
     * @returns {Promise<Object|null>}
     */
    async getTrainerInviteById(inviteId) {
        const { db, doc, getDoc } = await getFirestoreDeps();
        const inviteSnap = await getDoc(doc(db, INVITES_COLLECTION, inviteId));
        return inviteSnap.exists() ? mapInviteDoc(inviteSnap) : null;
    },

    /**
     * Garante que o treinador tenha um convite ativo.
     * @param {string} trainerId
     * @returns {Promise<Object>}
     */
    async ensureActiveTrainerInvite(trainerId) {
        const activeInvite = await this.getActiveTrainerInvite(trainerId);
        return activeInvite || this.createTrainerInvite(trainerId);
    },

    /**
     * Revoga convite ativo.
     * @param {string} inviteId
     */
    async revokeTrainerInvite(inviteId) {
        const { db, doc, updateDoc } = await getFirestoreDeps();
        await updateDoc(doc(db, INVITES_COLLECTION, inviteId), {
            status: 'revoked'
        });
    },

    /**
     * Obter lista de estudantes para um treinador
     * @param {string} trainerId 
     * @returns {Promise<Array>}
     */
    async getTrainerStudents(trainerId) {
        const { db, collection, query, where, getDocs, getDoc, doc } = await getFirestoreDeps();
        const q = query(
            collection(db, TRAINER_STUDENTS_COLLECTION),
            where('trainerId', '==', trainerId),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const links = snap.docs.map(d => d.data());

        // Buscar detalhes do estudante
        const students = await Promise.all(links.map(async (link) => {
            const studentDoc = await getDoc(doc(db, 'users', link.studentId));
            if (studentDoc.exists()) {
                return { id: link.studentId, ...studentDoc.data(), linkedAt: link.linkedAt?.toDate() };
            }
            return null;
        }));

        return students.filter(s => s !== null);
    },

    /**
     * Desvincular um estudante de um treinador
     * @param {string} studentId 
     * @param {string} trainerId 
     */
    async unlinkTrainer(studentId, trainerId) {
        const { db, doc, deleteDoc } = await getFirestoreDeps();
        const linkId = `${studentId}_${trainerId}`;
        await deleteDoc(doc(db, TRAINER_STUDENTS_COLLECTION, linkId));
    },

    /**
     * Definir treino ativo do usuário
     * @param {string} userId 
     * @param {string} workoutId 
     */
    async setActiveWorkout(userId, workoutId) {
        const { db, doc, setDoc, serverTimestamp } = await getFirestoreDeps();
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, {
            activeWorkoutId: workoutId,
            lastActiveAt: serverTimestamp()
        }, { merge: true });
    },

    /**
     * Limpar treino ativo do usuário
     * @param {string} userId 
     */
    async clearActiveWorkout(userId) {
        const { db, doc, setDoc, serverTimestamp } = await getFirestoreDeps();
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, {
            activeWorkoutId: null,
            lastActiveAt: serverTimestamp()
        }, { merge: true });
    },

    /**
     * Atualizar dados da sessão ativa (Deep Sync)
     * @param {string} userId
     * @param {Object} sessionData - { exercises, elapsedSeconds, templateId }
     */
    async updateActiveSession(userId, sessionData) {
        const { db, doc, setDoc, serverTimestamp } = await getFirestoreDeps();
        const docRef = doc(db, 'active_workouts', userId);
        // Usar setDoc com merge para garantir que o documento exista
        await setDoc(docRef, {
            ...sessionData,
            updatedAt: serverTimestamp(),
            userId // Garantir propriedade
        }, { merge: true });
    },

    /**
     * Deletar a sessão ativa (Limpeza)
     * @param {string} userId
     */
    async deleteActiveSession(userId) {
        const { db, doc, deleteDoc } = await getFirestoreDeps();
        const docRef = doc(db, 'active_workouts', userId);
        await deleteDoc(docRef);

        // Também limpar a flag no perfil do usuário para parar redirects
        await this.clearActiveWorkout(userId);
    }
};
