import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig'; // Adjust path

export const authService = {
    /**
     * Login com Email e Senha
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<UserCredential>}
     */
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    },

    /**
     * Login com Google
     * @returns {Promise<UserCredential>}
     */
    async loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    },

    /**
     * Registrar novo usuário
     * Cria usuário Auth, atualiza DisplayName e cria documento Firestore User.
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
            // Continuar execução para salvar dados no Firestore
        }

        try {
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email, // Garantir que o email seja salvo
                ...additionalData,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error creating User document:", error);
            // ROLLBACK: Deletar usuário do Auth para evitar conta órfã
            try {
                await user.delete();
                console.info("Rollback: Auth user deleted due to Firestore failure.");
            } catch (deleteErr) {
                console.error("Critical: Failed to rollback auth user:", deleteErr);
            }
            throw new Error("Cadastro falhou. Tente novamente.");
        }

        return user;
    },

    /**
     * Sair (Logout)
     */
    async logout() {
        return signOut(auth);
    },

    /**
     * Enviar Email de Redefinição de Senha
     * @param {string} email
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    },

    /**
     * Inscrever-se em Mudanças de Estado de Auth
     * @param {function} callback 
     * @returns {function} unsubscribe
     */
    subscribe(callback) {
        // Nós importamos onAuthStateChanged dentro ou no top level? 
        // Precisamos importar no top level. 
        // Mas como não posso facilmente adicionar import no topo com esta ferramenta sem correspondência estrita,
        // vou assumir que preciso adicionar import primeiro ou usar 'firebase/auth' se disponível globalmente? 
        // Não, devo importar.
        // Vou adicionar o método aqui.
        return onAuthStateChanged(auth, callback);
    }
};
