import "@testing-library/jest-dom";

// Mock Firebase so tests don't need real credentials
vi.mock("../../react/src/lib/firebase.js", () => ({
    auth: { currentUser: null, onAuthStateChanged: vi.fn(() => () => {}) },
    db: {},
    app: {}
}));

// Mock Firebase auth methods
vi.mock("firebase/auth", () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {}; }),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn()
}));

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => new Date())
}));
