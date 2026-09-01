import { getFirestoreDeps } from '../firebaseDb';

const INVITES_COLLECTION = 'trainer_invites';
const TRAINER_STUDENTS_COLLECTION = 'trainer_students';
const INVITE_TTL_DAYS = 7;
// O codigo do convite e o ID do documento, entao precisa ser um ID valido.
const INVITE_CODE_PATTERN = /^[A-Z0-9]{8}$/;
// Colisao de codigo cai em `create` negado pelas rules; sorteia outro e tenta de novo.
const INVITE_CODE_MAX_ATTEMPTS = 3;

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

function normalizeInviteCode(rawCode) {
    const normalized = rawCode?.trim().toUpperCase();
    return normalized && INVITE_CODE_PATTERN.test(normalized) ? normalized : null;
}

/**
 * Convite so vale se estiver ativo, dentro do prazo e com o codigo no ID do
 * documento. Convites antigos, criados com ID automatico, caem fora daqui.
 */
function isRedeemableInvite(docSnap) {
    const data = docSnap.data();
    if (!data || docSnap.id !== data.code) return false;
    if (data.status !== 'active') return false;
    const expiresAt = toDate(data.expiresAt);
    return Boolean(expiresAt) && expiresAt.getTime() > Date.now();
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
        const normalizedCode = normalizeInviteCode(trainerCode);
        if (!normalizedCode || normalizedCode === studentId) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        const {
            db,
            getDoc,
            doc,
            writeBatch,
            serverTimestamp
        } = await getFirestoreDeps();

        // Busca por ID, nao por consulta: o codigo e o proprio ID do documento.
        // Uma consulta aqui obrigaria as rules a liberar `list` da colecao, o que
        // deixaria qualquer autenticado enumerar os convites ativos de todo mundo.
        const inviteDoc = doc(db, INVITES_COLLECTION, normalizedCode);
        let inviteSnap;
        try {
            inviteSnap = await getDoc(inviteDoc);
        } catch (error) {
            // As rules negam a leitura de convite inexistente, revogado ou expirado.
            // Falha de rede continua subindo, para nao virar "convite invalido".
            if (error?.code !== 'permission-denied') throw error;
            throw new Error("PERSONAL_NOT_FOUND");
        }

        if (!inviteSnap.exists() || !isRedeemableInvite(inviteSnap)) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        const invite = inviteSnap.data();

        if (!invite.trainerId || invite.trainerId === studentId) {
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
                inviteId: normalizedCode,
                linkedAt: serverTimestamp()
            });
            batch.update(inviteDoc, {
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
        const { db, collection, query, where, getDocs, Timestamp } = await getFirestoreDeps();
        const q = query(
            collection(db, INVITES_COLLECTION),
            where('trainerId', '==', trainerId),
            where('status', '==', 'active'),
            where('expiresAt', '>', Timestamp.now())
        );
        const snap = await getDocs(q);
        // Convite antigo, com ID automatico, nao pode mais ser resgatado: ignorar
        // aqui faz `ensureActiveTrainerInvite` emitir um substituto e revogar o velho.
        const redeemable = snap.docs.find(isRedeemableInvite);
        return redeemable ? mapInviteDoc(redeemable) : null;
    },

    /**
     * Cria um novo convite, revogando convites ativos anteriores do treinador.
     * @param {string} trainerId
     * @returns {Promise<Object>}
     */
    async createTrainerInvite(trainerId) {
        const { db, collection, query, where, getDocs, updateDoc, setDoc, doc, serverTimestamp, Timestamp } = await getFirestoreDeps();
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
        let lastError;

        // O codigo e o ID do documento. Se o sorteio bater num codigo ja usado, a
        // escrita vira `update` e as rules negam — basta sortear outro.
        for (let attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt += 1) {
            const code = generateInviteCode();
            try {
                await setDoc(doc(db, INVITES_COLLECTION, code), {
                    trainerId,
                    code,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    expiresAt
                });
                return this.getTrainerInviteById(code);
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError;
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
