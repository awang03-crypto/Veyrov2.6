import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../react/src/contexts/AuthContext";

// Helper to render with auth context and router
function renderWithProviders(ui, { user = null } = {}) {
    return render(
        <AuthContext.Provider value={{ user, loading: false }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </AuthContext.Provider>
    );
}

// ─── Rating formula unit tests ────────────────────────────────────────────────
import {
    calculateSoccerRating,
    calculateBasketballRating,
    calculateFootballRating,
    clampRating
} from "../../react/src/services/ratings.js";

describe("Soccer rating formula", () => {
    it("returns base score for empty stats", () => {
        expect(calculateSoccerRating({}, "mid")).toBe(66);
        expect(calculateSoccerRating({}, "gk")).toBe(62);
        expect(calculateSoccerRating({}, "def")).toBe(64);
        expect(calculateSoccerRating({}, "att")).toBe(65);
    });

    it("goals and assists increase score significantly", () => {
        const base = calculateSoccerRating({ minutes: 90 }, "att");
        const withGoal = calculateSoccerRating({ minutes: 90, goals: 1 }, "att");
        const withAssist = calculateSoccerRating({ minutes: 90, assists: 1 }, "att");
        expect(withGoal).toBeGreaterThan(base);
        expect(withAssist).toBeGreaterThan(base);
    });

    it("turnovers decrease score", () => {
        const clean = calculateSoccerRating({ minutes: 90 }, "mid");
        const withTurnovers = calculateSoccerRating({ minutes: 90, turnovers: 5 }, "mid");
        expect(withTurnovers).toBeLessThan(clean);
    });

    it("clamps score between 1 and 100", () => {
        expect(calculateSoccerRating({ minutes: 90, goals: 999, assists: 999 }, "att")).toBe(100);
        expect(calculateSoccerRating({ minutes: 90, turnovers: 999 }, "mid")).toBe(1);
    });

    it("minutes factor reduces positives for short appearances", () => {
        const full = calculateSoccerRating({ minutes: 90, passes: 30 }, "mid");
        const cameo = calculateSoccerRating({ minutes: 10, passes: 30 }, "mid");
        expect(full).toBeGreaterThan(cameo);
    });
});

describe("Basketball rating formula", () => {
    it("returns 60 for a player with 0 minutes", () => {
        expect(calculateBasketballRating({ minutes: 0 })).toBe(60);
    });

    it("high production gives high rating", () => {
        const rating = calculateBasketballRating({
            minutes: 30, points: 18, assists: 6, rebounds: 8,
            steals: 2, blocks: 1, turnovers: 3, fgm: 7, fga: 14, plusMinus: 8
        });
        expect(rating).toBeGreaterThanOrEqual(90);
    });

    it("many turnovers lower the score", () => {
        const clean = calculateBasketballRating({ minutes: 30, points: 15 });
        const messy = calculateBasketballRating({ minutes: 30, points: 15, turnovers: 10 });
        expect(messy).toBeLessThan(clean);
    });

    it("clamps between 0 and 100", () => {
        expect(calculateBasketballRating({ minutes: 1, points: 999 })).toBe(100);
        expect(calculateBasketballRating({ minutes: 40, turnovers: 200, plusMinus: -100 })).toBe(0);
    });
});

describe("Football rating formula", () => {
    it("returns base score for empty stats", () => {
        const rating = calculateFootballRating({}, "qb");
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(100);
    });

    it("touchdowns increase score", () => {
        const base = calculateFootballRating({ snaps: 60 }, "qb");
        const withTDs = calculateFootballRating({ snaps: 60, touchdowns: 3 }, "qb");
        expect(withTDs).toBeGreaterThan(base);
    });

    it("interceptions decrease score", () => {
        const clean = calculateFootballRating({ snaps: 60, touchdowns: 2 }, "qb");
        const withInts = calculateFootballRating({ snaps: 60, touchdowns: 2, interceptions: 3 }, "qb");
        expect(withInts).toBeLessThan(clean);
    });

    it("defensive stats reward defenders", () => {
        const base = calculateFootballRating({}, "lb");
        const withTackles = calculateFootballRating({ tackles: 10, sacks: 2 }, "lb");
        expect(withTackles).toBeGreaterThan(base);
    });

    it("is independent from basketball formula", () => {
        const game = { snaps: 30, touchdowns: 2, passingYards: 200 };
        const fbRating = calculateFootballRating(game, "qb");
        const bbRating = calculateBasketballRating(game);
        expect(fbRating).not.toBe(bbRating);
    });

    it("clamps between 1 and 100", () => {
        expect(calculateFootballRating({ touchdowns: 999 }, "qb")).toBe(100);
        expect(calculateFootballRating({ interceptions: 999 }, "qb")).toBe(1);
    });
});

describe("clampRating utility", () => {
    it("clamps to default 0-100 range", () => {
        expect(clampRating(-5)).toBe(0);
        expect(clampRating(50)).toBe(50);
        expect(clampRating(150)).toBe(100);
    });

    it("clamps to custom range", () => {
        expect(clampRating(5, -10, 10)).toBe(5);
        expect(clampRating(-15, -10, 10)).toBe(-10);
        expect(clampRating(20, -10, 10)).toBe(10);
    });
});
