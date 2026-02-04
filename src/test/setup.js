import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks for Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    enableIndexedDbPersistence: vi.fn().mockResolvedValue(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
}));

// JSDOM doesn't implement alert/confirm/prompt reliably; stub for tests that trigger UI dialogs.
globalThis.alert = vi.fn();
globalThis.confirm = vi.fn(() => true);
globalThis.prompt = vi.fn();
