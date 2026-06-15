import { getFirestoreDeps } from '../firebaseDb';

export const userService = {
    /**
     * Verificar se usuário é um treinador
     * @param {string} userId 
     * @returns {Promise<boolean>}
     */
    async checkTrainerStatus(userId) {
        const { db, collection, query, where, getCountFromServer } = await getFirestoreDeps();
        const q = query(
            collection(db, 'trainer_students'),
            where('trainerId', '==', userId)
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
        const { db, doc, getDoc, setDoc, serverTimestamp } = await getFirestoreDeps();
        // Verificar se treinador existe
        const trainerRef = doc(db, 'users', trainerCode);
        const trainerSnap = await getDoc(trainerRef);

        if (!trainerSnap.exists()) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        // Verificar se vínculo já existe (Otimizado com ID composto)
        const linkId = `${studentId}_${trainerCode}`;
        const linkRef = doc(db, 'trainer_students', linkId);
        const linkSnap = await getDoc(linkRef);
        if (linkSnap.exists()) {
            throw new Error("ALREADY_LINKED");
        }

        // Criar Vínculo
        await setDoc(linkRef, {
            trainerId: trainerCode,
            studentId,
            status: 'active',
            linkedAt: serverTimestamp()
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
            collection(db, 'trainer_students'),
            where('trainerId', '==', trainerId)
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
        await deleteDoc(doc(db, 'trainer_students', linkId));
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
