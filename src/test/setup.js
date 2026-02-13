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

function ensureStorageArea(storageName) {
    const storage = globalThis[storageName];
    if (storage
        && typeof storage.getItem === 'function'
        && typeof storage.setItem === 'function'
        && typeof storage.removeItem === 'function'
        && typeof storage.clear === 'function') {
        return;
    }

    const data = new Map();
    const polyfill = {
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(String(key), String(value)),
        removeItem: (key) => data.delete(String(key)),
        clear: () => data.clear(),
        key: (index) => Array.from(data.keys())[index] ?? null,
        get length() {
            return data.size;
        }
    };

    Object.defineProperty(globalThis, storageName, {
        configurable: true,
        writable: true,
        value: polyfill
    });
}

ensureStorageArea('localStorage');
ensureStorageArea('sessionStorage');
