import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig'; // Adjust path

export const authService = {
    /**
     * Login with Email and Password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<UserCredential>}
     */
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    },

    /**
     * Login with Google
     * @returns {Promise<UserCredential>}
     */
    async loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    },

    /**
     * Register new user
     * Creates Auth user, updates DisplayName, and creates Firestore User document.
     * @param {string} email 
     * @param {string} password 
     * @param {string} fullName 
     * @param {Object} additionalData - { gender, birthDate: {d,m,y}, heightCm, weightKg }
     * @returns {Promise<User>}
     */
    async register(email, password, fullName, additionalData) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        try {
            await updateProfile(user, { displayName: fullName });
        } catch (error) {
            console.error("Error updating Auth profile:", error);
            // Continue execution to save Firestore data
        }

        try {
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email, // Ensure email is saved
                ...additionalData,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error creating User document:", error);
            // Consider if we should throw or just log. 
            // If this fails, user is created but has no profile doc. 
            // In critical apps, we might want to delete the user? 
            // For now, throw so UI knows something went wrong.
            throw error;
        }

        return user;
    },

    /**
     * Logout
     */
    async logout() {
        return signOut(auth);
    },

    /**
     * Subscribe to Auth State Changes
     * @param {function} callback 
     * @returns {function} unsubscribe
     */
    subscribe(callback) {
        // We import onAuthStateChanged inside or top level? 
        // We need to import it at top level. 
        // But since I can't easily add import at top with this tool without strict matching,
        // I will assume I need to add import first or use 'firebase/auth' if available globally? 
        // No, I must import it.
        // I will perform a separate edit for import or use multi_replace.
        // For now, I'll just add the method and assume I'll fix import next step.
        // Wait, I can use auth.onAuthStateChanged? No, it's modular SDK.
        // I'll add the method here.
        return onAuthStateChanged(auth, callback);
    }
};
