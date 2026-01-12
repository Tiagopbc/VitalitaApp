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
     * Check if user is a trainer
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
     * Get user profile by ID
     * @param {string} userId 
     * @returns {Promise<Object>} User data or null if not found
     */
    async getUserProfile(userId) {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },

    /**
     * Update user profile
     * @param {string} userId 
     * @param {Object} data 
     */
    async updateUserProfile(userId, data) {
        const docRef = doc(db, 'users', userId);
        // Only update, assuming doc exists. If not, setDoc with merge?
        // Usually profile exists.
        await updateDoc(docRef, data);
    },

    /**
     * Link student to trainer
     * @param {string} studentId 
     * @param {string} trainerCode (trainerId)
     * @returns {Promise<void>}
     */
    async linkTrainer(studentId, trainerCode) {
        // Check if trainer exists
        const trainerRef = doc(db, 'users', trainerCode);
        const trainerSnap = await getDoc(trainerRef);

        if (!trainerSnap.exists()) {
            throw new Error("PERSONAL_NOT_FOUND");
        }

        // Check if link already exists? (Optional validation)
        const q = query(
            collection(db, 'trainer_students'),
            where('studentId', '==', studentId),
            where('trainerId', '==', trainerCode)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error("ALREADY_LINKED");
        }

        // Create Link
        await addDoc(collection(db, 'trainer_students'), {
            trainerId: trainerCode,
            studentId,
            status: 'active',
            linkedAt: serverTimestamp()
        });
    },

    /**
     * Get list of students for a trainer
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

        // Fetch student details
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
     * Unlink a student from a trainer
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

        // Delete all matching links (should be one)
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    }
};
