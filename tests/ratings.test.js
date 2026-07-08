import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    calculateBasketballRating,
    calculateFootballRating,
    calculateSoccerRating,
    clampRating
} from "../react/src/services/ratings.js";

describe("Rating calculators", () => {
    it("keeps the default soccer midfielder example at the expected benchmark", () => {
        assert.equal(calculateSoccerRating({
            minutes: 72, passes: 24, shots: 2,
            duels: 6, turnovers: 3, goals: 0, assists: 1
        }, "mid"), 82);
    });

    it("uses position base scores and clamps soccer ratings from 1 to 100", () => {
        assert.equal(calculateSoccerRating({}, "gk"), 62);
        assert.equal(calculateSoccerRating({}, "def"), 64);
        assert.equal(calculateSoccerRating({}, "att"), 65);
        assert.equal(calculateSoccerRating({ minutes: 90, goals: 20, assists: 20 }, "att"), 100);
        assert.equal(calculateSoccerRating({ turnovers: 200 }, "mid"), 1);
    });

    it("scales soccer positive actions by minutes played", () => {
        const fullMatch = calculateSoccerRating({ minutes: 90, passes: 30, shots: 4, duels: 8 }, "mid");
        const shortAppearance = calculateSoccerRating({ minutes: 30, passes: 30, shots: 4, duels: 8 }, "mid");
        assert.ok(fullMatch > shortAppearance);
    });

    it("calculates basketball ratings from per-minute production and efficiency", () => {
        assert.equal(calculateBasketballRating({
            minutes: 30, points: 18, assists: 6, rebounds: 8,
            steals: 2, blocks: 1, turnovers: 3,
            fgm: 7, fga: 14, plusMinus: 8
        }), 100);
    });

    it("caps basketball ratings and handles zero minutes safely", () => {
        assert.equal(calculateBasketballRating({ minutes: 0 }), 60);
        assert.equal(calculateBasketballRating({ minutes: 40, turnovers: 200, plusMinus: -100 }), 0);
        assert.equal(calculateBasketballRating({ minutes: 1, points: 80, assists: 40, fgm: 30, fga: 30 }), 100);
    });

    it("football has its own formula independent of basketball", () => {
        const game = { snaps: 60, touchdowns: 2, passingYards: 200, interceptions: 0 };
        const fbRating = calculateFootballRating(game, "qb");
        const bbRating = calculateBasketballRating(game);
        assert.notEqual(fbRating, bbRating);
    });

    it("football QB touchdowns increase rating", () => {
        const base = calculateFootballRating({ snaps: 60 }, "qb");
        const withTDs = calculateFootballRating({ snaps: 60, touchdowns: 3 }, "qb");
        assert.ok(withTDs > base);
    });

    it("football interceptions decrease rating", () => {
        const clean = calculateFootballRating({ snaps: 60, touchdowns: 2 }, "qb");
        const withInts = calculateFootballRating({ snaps: 60, touchdowns: 2, interceptions: 3 }, "qb");
        assert.ok(withInts < clean);
    });

    it("football rating clamps between 1 and 100", () => {
        assert.equal(calculateFootballRating({ touchdowns: 999 }, "qb"), 100);
        assert.equal(calculateFootballRating({ interceptions: 999 }, "qb"), 1);
    });

    it("clamps arbitrary rating values", () => {
        assert.equal(clampRating(-20), 0);
        assert.equal(clampRating(54), 54);
        assert.equal(clampRating(140), 100);
        assert.equal(clampRating(-12, -10, 10), -10);
    });
});
