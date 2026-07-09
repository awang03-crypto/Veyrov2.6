import { describe, it } from "node:test";
import assert from "node:assert";
import {
    normalizeStats,
    normalizePlayerLock,
    buildCalculatorInputs,
    numberValue,
    safeString,
    safeNumber,
    safeFileName
} from "../server.js";

describe("Stats normalization", () => {
    it("normalizes raw stats with defaults for missing values", () => {
        const raw = { touches: 45, passes: 32, shots: 2 };
        const stats = normalizeStats(raw, 120);
        
        assert.strictEqual(stats.touches, 45);
        assert.strictEqual(stats.passes, 32);
        assert.strictEqual(stats.shots, 2);
        assert.strictEqual(stats.goals, 0);
        assert.strictEqual(stats.confidence, "medium");
        assert(Array.isArray(stats.eventLog));
        assert(Array.isArray(stats.uncertainty));
    });

    it("caps eventLog to maxEvents", () => {
        const raw = {
            touches: 50,
            eventLog: Array(150).fill({ time: "1:00", type: "pass", outcome: "completed" })
        };
        const stats = normalizeStats(raw, 120);
        
        assert.strictEqual(stats.eventLog.length, 120);
    });

    it("calculates calculator inputs from stats", () => {
        const raw = {
            touches: 60,
            passes: 40,
            passesCompleted: 35,
            shots: 3,
            shotsOnTarget: 2,
            duelsWon: 10,
            duelsLost: 5
        };
        const stats = normalizeStats(raw, 120);
        
        assert.strictEqual(stats.calculatorInputs.statInputs.touches, 60);
        assert.strictEqual(stats.calculatorInputs.statInputs.accurate_pass, 35);
        assert.strictEqual(stats.calculatorInputs.statInputs.missed_pass, 5);
        assert.strictEqual(stats.calculatorInputs.statInputs.ontarget_scoring_att, 2);
        assert.strictEqual(stats.calculatorInputs.statInputs.big_chance_missed, 1);
    });
});

describe("Player lock normalization", () => {
    it("normalizes player lock with position and team info", () => {
        const raw = {
            playerNumber: "7",
            position: "midfielder",
            teamColor: "red",
            primaryClues: ["jersey #7", "red kit"],
            confidence: "high"
        };
        const body = { playerNumber: "7", position: "midfielder" };
        const lock = normalizePlayerLock(raw, body);
        
        assert.strictEqual(lock.playerNumber, "7");
        assert.strictEqual(lock.position, "midfielder");
        assert.strictEqual(lock.teamColor, "red");
        assert.strictEqual(lock.confidence, "high");
        assert(Array.isArray(lock.primaryClues));
    });

    it("uses default relock rules if none provided", () => {
        const raw = { primaryClues: [] };
        const body = { playerNumber: "10" };
        const lock = normalizePlayerLock(raw, body);
        
        assert(lock.relockRules.length > 0);
        assert(lock.relockRules[0].includes("camera cut") || lock.relockRules[0].includes("re-check"));
    });

    it("sets source to provided or default value", () => {
        const raw1 = { source: "twelvelabs-player-lock" };
        const lock1 = normalizePlayerLock(raw1, {});
        assert.strictEqual(lock1.source, "twelvelabs-player-lock");
        
        const raw2 = {};
        const lock2 = normalizePlayerLock(raw2, {});
        assert.strictEqual(lock2.source, "gemini-player-lock");
    });
});

describe("Number utilities", () => {
    it("converts values to safe numbers with fallbacks", () => {
        assert.strictEqual(numberValue(45), 45);
        assert.strictEqual(numberValue("30"), 30);
        assert.strictEqual(numberValue(null), 0);
        assert.strictEqual(numberValue(undefined), 0);
        assert.strictEqual(numberValue("invalid"), 0);
    });

    it("enforces min/max bounds with safeNumber", () => {
        assert.strictEqual(safeNumber(150, 0, { min: 0, max: 120 }), 120);
        assert.strictEqual(safeNumber(-10, 0, { min: 0, max: 120 }), 0);
        assert.strictEqual(safeNumber(50, 0, { min: 0, max: 120 }), 50);
    });

    it("returns fallback for invalid safeNumber values", () => {
        assert.strictEqual(safeNumber("invalid", 10, { min: 0, max: 120 }), 10);
        assert.strictEqual(safeNumber(null, 5), 5);
    });
});

describe("String utilities", () => {
    it("truncates strings with safeString", () => {
        const long = "a".repeat(500);
        const safe = safeString(long, 100);
        assert.strictEqual(safe.length, 100);
    });

    it("sanitizes filenames with safeFileName", () => {
        const name = safeFileName("match-2024-06-15...video!!!.mp4");
        assert(!name.includes("!"));
        assert(!name.includes("..."));
        assert(name.includes("match"));
    });

    it("uses fallback for empty or null filenames", () => {
        assert.strictEqual(safeFileName(""), "match-video.mp4");
        assert.strictEqual(safeFileName(null), "match-video.mp4");
    });
});

describe("Calculator inputs", () => {
    it("builds calculator inputs from normalized stats", () => {
        const stats = {
            touches: 60,
            passes: 50,
            passesCompleted: 42,
            shots: 4,
            shotsOnTarget: 2,
            duelsWon: 12,
            duelsLost: 8,
            goals: 1,
            assists: 0
        };
        
        const inputs = buildCalculatorInputs(stats);
        
        assert(inputs.statInputs);
        assert.strictEqual(inputs.statInputs.touches, 60);
        assert.strictEqual(inputs.statInputs.accurate_pass, 42);
        assert.strictEqual(inputs.statInputs.missed_pass, 8);
        assert.strictEqual(inputs.decisiveInputs.dec_goal, 1);
        assert.strictEqual(inputs.decisiveInputs.dec_assist, 0);
    });

    it("handles goalkeeper-specific stats", () => {
        const stats = {
            touches: 30,
            saves: 8,
            diveCatch: 3,
            crossClaimed: 5,
            goalsConceded: 1
        };
        
        const inputs = buildCalculatorInputs(stats);
        
        assert.strictEqual(inputs.statInputs.saves, 8);
        assert.strictEqual(inputs.statInputs.dive_catch, 3);
        assert.strictEqual(inputs.statInputs.good_high_clam, 5);
        assert.strictEqual(inputs.statInputs.goals_conceded, 1);
    });
});
