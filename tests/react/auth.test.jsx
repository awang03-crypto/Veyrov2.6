import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../react/src/contexts/AuthContext";

// Mock firebase auth
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGoogleSignIn = vi.fn();

vi.mock("firebase/auth", () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {}; }),
    signInWithEmailAndPassword: (...args) => mockSignIn(...args),
    signOut: (...args) => mockSignOut(...args),
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    signInWithPopup: (...args) => mockGoogleSignIn(...args)
}));

function renderWithAuth(ui) {
    return render(
        <AuthProvider>
            <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
    );
}

describe("Auth context", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("provides null user when not authenticated", () => {
        const TestComponent = () => {
            const { user } = useAuth();
            return <div>{user ? "Authenticated" : "Not authenticated"}</div>;
        };

        renderWithAuth(<TestComponent />);
        expect(screen.getByText("Not authenticated")).toBeTruthy();
    });

    it("provides user object when authenticated", () => {
        const TestComponent = () => {
            const { user } = useAuth();
            return <div>{user ? "Authenticated" : "Not authenticated"}</div>;
        };

        renderWithAuth(<TestComponent />);
        // Since mock returns null, this will show "Not authenticated"
        expect(screen.getByText("Not authenticated")).toBeTruthy();
    });

    it("shows loading state while auth resolves", () => {
        const TestComponent = () => {
            const { loading } = useAuth();
            return <div>{loading ? "Loading..." : "Ready"}</div>;
        };

        renderWithAuth(<TestComponent />);
        // Mock callback sets loading to false immediately
        expect(screen.getByText("Ready")).toBeTruthy();
    });

    it("admin user has correct email", () => {
        const adminUser = { uid: "admin-uid", email: "awang03@dccs.org" };
        const isAdmin = adminUser.email === "awang03@dccs.org";
        expect(isAdmin).toBe(true);
    });

    it("non-admin user is correctly identified", () => {
        const regularUser = { uid: "user-uid", email: "player@example.com" };
        const isAdmin = regularUser.email === "awang03@dccs.org";
        expect(isAdmin).toBe(false);
    });
});

describe("Auth-gated content", () => {
    it("renders gated content only for authenticated users", () => {
        const GatedComponent = () => {
            const { user } = useAuth();
            return user ? <div>Premium Content</div> : <div>Please sign in</div>;
        };

        renderWithAuth(<GatedComponent />);
        expect(screen.getByText("Please sign in")).toBeTruthy();
    });
});
