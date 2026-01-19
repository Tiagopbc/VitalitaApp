import { db } from '../firebaseConfig';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    getCountFromServer
} from 'firebase/firestore';

export const userService = {
    /**
     * Verificar se usuário é um treinador
     * @param {string} userId 
     * @returns {Promise<boolean>}
     */
    async checkTrainerStatus(userId) {
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
        const docRef = doc(db, 'users', userId);
        // Apenas atualizar, assumindo que doc existe. Se não, setDoc com merge?
        // Geralmente perfil existe.
        await updateDoc(docRef, data);
    },

    /**
     * Vincular estudante ao treinador
     * @param {string} studentId 
     * @param {string} trainerCode (trainerId)
     * @returns {Promise<void>}
     */
    async linkTrainer(studentId, trainerCode) {
        // Verificar se treinador existe
        const trainerRef = doc(db, 'users', trainerCode);
        const trainerSnap = await getDoc(trainerRef);

        if (!trainerSnap.exists()) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        // Verificar se vínculo já existe? (Validação opcional)
        const q = query(
            collection(db, 'trainer_students'),
            where('studentId', '==', studentId),
            where('trainerId', '==', trainerCode)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error("ALREADY_LINKED");
        }

        // Criar Vínculo
        await addDoc(collection(db, 'trainer_students'), {
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
        const q = query(
            collection(db, 'trainer_students'),
            where('trainerId', '==', trainerId),
            where('studentId', '==', studentId)
        );
        const snap = await getDocs(q);

        // Deletar todos os links correspondentes (deve haver um)
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    },

    /**
     * Definir treino ativo do usuário
     * @param {string} userId 
     * @param {string} workoutId 
     */
    async setActiveWorkout(userId, workoutId) {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            activeWorkoutId: workoutId,
            lastActiveAt: serverTimestamp()
        });
    },

    /**
     * Limpar treino ativo do usuário
     * @param {string} userId 
     */
    async clearActiveWorkout(userId) {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            activeWorkoutId: null,
            lastActiveAt: serverTimestamp()
        });
    },

    /**
     * Atualizar dados da sessão ativa (Deep Sync)
     * @param {string} userId
     * @param {Object} sessionData - { exercises, elapsedSeconds, templateId }
     */
    async updateActiveSession(userId, sessionData) {
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
        const docRef = doc(db, 'active_workouts', userId);
        await deleteDoc(docRef);

        // Também limpar a flag no perfil do usuário para parar redirects
        await this.clearActiveWorkout(userId);
    }
};
