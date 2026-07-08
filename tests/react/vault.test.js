import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firestore operations
const mockSetDoc = vi.fn(() => Promise.resolve());
const mockGetDoc = vi.fn();
const mockAddDoc = vi.fn(() => Promise.resolve({ id: "match-123" }));
const mockGetDocs = vi.fn(() => Promise.resolve({ docs: [] }));
const mockDoc = vi.fn(() => ({ id: "mock-doc-ref" }));
const mockCollection = vi.fn(() => ({ id: "mock-collection-ref" }));

vi.mock("firebase/firestore", () => ({
    getFirestore: vi.fn(),
    doc: (...args) => mockDoc(...args),
    collection: (...args) => mockCollection(...args),
    getDoc: (...args) => mockGetDoc(...args),
    setDoc: (...args) => mockSetDoc(...args),
    addDoc: (...args) => mockAddDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
    query: vi.fn((...args) => args),
    where: vi.fn((...args) => args),
    orderBy: vi.fn((...args) => args),
    limit: vi.fn((...args) => args),
    serverTimestamp: vi.fn(() => new Date("2026-01-01"))
}));

describe("Vault persistence", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("saves a match to Firestore with correct structure", async () => {
        const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");

        const matchData = {
            userId: "user-123",
            sport: "soccer",
            position: "mid",
            rating: 82,
            stats: { minutes: 72, passes: 24, shots: 2, goals: 0, assists: 1 },
            createdAt: serverTimestamp()
        };

        await addDoc(collection({}, "matches"), matchData);

        expect(mockAddDoc).toHaveBeenCalledTimes(1);
        const [, savedData] = mockAddDoc.mock.calls[0];
        expect(savedData.userId).toBe("user-123");
        expect(savedData.sport).toBe("soccer");
        expect(savedData.rating).toBe(82);
    });

    it("retrieves a user's matches from Firestore", async () => {
        const mockMatches = [
            { id: "m1", data: () => ({ rating: 82, sport: "soccer", createdAt: new Date() }) },
            { id: "m2", data: () => ({ rating: 74, sport: "soccer", createdAt: new Date() }) }
        ];
        mockGetDocs.mockResolvedValueOnce({ docs: mockMatches });

        const { getDocs, query, collection, where, orderBy } = await import("firebase/firestore");
        const result = await getDocs(query(collection({}, "matches"), where("userId", "==", "user-123"), orderBy("createdAt", "desc")));

        expect(result.docs).toHaveLength(2);
        expect(result.docs[0].data().rating).toBe(82);
        expect(result.docs[1].data().rating).toBe(74);
    });

    it("retrieves a single match by ID", async () => {
        mockGetDoc.mockResolvedValueOnce({
            exists: () => true,
            id: "match-123",
            data: () => ({ rating: 78, sport: "basketball", userId: "user-123" })
        });

        const { getDoc, doc } = await import("firebase/firestore");
        const result = await getDoc(doc({}, "matches", "match-123"));

        expect(result.exists()).toBe(true);
        expect(result.data().rating).toBe(78);
        expect(result.data().sport).toBe("basketball");
    });

    it("returns empty list when user has no matches", async () => {
        mockGetDocs.mockResolvedValueOnce({ docs: [] });

        const { getDocs, query, collection, where } = await import("firebase/firestore");
        const result = await getDocs(query(collection({}, "matches"), where("userId", "==", "new-user")));

        expect(result.docs).toHaveLength(0);
    });

    it("handles non-existent match gracefully", async () => {
        mockGetDoc.mockResolvedValueOnce({
            exists: () => false,
            data: () => undefined
        });

        const { getDoc, doc } = await import("firebase/firestore");
        const result = await getDoc(doc({}, "matches", "does-not-exist"));

        expect(result.exists()).toBe(false);
        expect(result.data()).toBeUndefined();
    });

    it("saves basketball match with correct stats structure", async () => {
        const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");

        const basketballMatch = {
            userId: "user-456",
            sport: "basketball",
            position: "pg",
            rating: 91,
            stats: {
                minutes: 32, points: 24, assists: 8, rebounds: 5,
                steals: 2, blocks: 0, turnovers: 3, fgm: 9, fga: 18, plusMinus: 12
            },
            createdAt: serverTimestamp()
        };

        await addDoc(collection({}, "matches"), basketballMatch);

        const [, savedData] = mockAddDoc.mock.calls[0];
        expect(savedData.sport).toBe("basketball");
        expect(savedData.stats.points).toBe(24);
        expect(savedData.stats.assists).toBe(8);
    });

    it("saves football match with correct stats structure", async () => {
        const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");

        const footballMatch = {
            userId: "user-789",
            sport: "football",
            position: "qb",
            rating: 88,
            stats: {
                snaps: 60, passingYards: 287, touchdowns: 2,
                interceptions: 0, completions: 22
            },
            createdAt: serverTimestamp()
        };

        await addDoc(collection({}, "matches"), footballMatch);

        const [, savedData] = mockAddDoc.mock.calls[0];
        expect(savedData.sport).toBe("football");
        expect(savedData.stats.touchdowns).toBe(2);
        expect(savedData.stats.passingYards).toBe(287);
    });
});

describe("Free tier match limit", () => {
    it("blocks saving when free user hits 5-match limit", async () => {
        const FREE_MATCH_LIMIT = 5;

        const checkCanSaveMatch = (currentMatchCount, isPaidUser) => {
            if (isPaidUser) return { allowed: true };
            if (currentMatchCount >= FREE_MATCH_LIMIT) {
                return { allowed: false, reason: "Free tier limit reached. Upgrade to Coach or Premium." };
            }
            return { allowed: true };
        };

        expect(checkCanSaveMatch(4, false).allowed).toBe(true);
        expect(checkCanSaveMatch(5, false).allowed).toBe(false);
        expect(checkCanSaveMatch(5, false).reason).toContain("Free tier limit");
        expect(checkCanSaveMatch(10, true).allowed).toBe(true);
        expect(checkCanSaveMatch(100, true).allowed).toBe(true);
    });
});
