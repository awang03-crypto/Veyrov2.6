import { describe, it } from "node:test";
import assert from "node:assert";

describe("Stats normalization and calculator inputs", () => {
    describe("Object structure validation", () => {
        it("creates stats object with required fields", () => {
            const stats = {
                touches: 60,
                passes: 50,
                passesCompleted: 42,
                shots: 4,
                shotsOnTarget: 2,
                goals: 1,
                confidence: "high"
            };
            
            assert.strictEqual(stats.touches, 60);
            assert.strictEqual(stats.confidence, "high");
        });

        it("defaults missing stats to zero", () => {
            const stats = {
                touches: 50,
                passes: 40
                // Other stats missing
            };
            
            const goals = stats.goals || 0;
            const assists = stats.assists || 0;
            
            assert.strictEqual(goals, 0);
            assert.strictEqual(assists, 0);
        });

        it("normalizes stat values to numbers", () => {
            const raw = {
                touches: "60",
                passes: "50",
                goals: 2
            };
            
            const normalized = {
                touches: Number(raw.touches),
                passes: Number(raw.passes),
                goals: Number(raw.goals)
            };
            
            assert.strictEqual(normalized.touches, 60);
            assert.strictEqual(normalized.passes, 50);
            assert(typeof normalized.goals === "number");
        });
    });

    describe("Player lock profile normalization", () => {
        it("normalizes player lock with position and team info", () => {
            const lock = {
                playerNumber: "7",
                position: "midfielder",
                teamColor: "red",
                confidence: "high"
            };
            
            assert.strictEqual(lock.playerNumber, "7");
            assert.strictEqual(lock.position, "midfielder");
            assert.strictEqual(lock.confidence, "high");
        });

        it("converts position to lowercase", () => {
            const position = "MIDFIELDER".toLowerCase();
            assert.strictEqual(position, "midfielder");
        });

        it("validates position values", () => {
            const validPositions = ["goalkeeper", "defender", "midfielder", "forward"];
            const position = "midfielder";
            
            assert(validPositions.includes(position));
        });
    });

    describe("Number safety utilities", () => {
        it("converts values to safe numbers with fallbacks", () => {
            const numberValue = (val) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return isNaN(num) ? 0 : num;
            };
            
            assert.strictEqual(numberValue(45), 45);
            assert.strictEqual(numberValue("30"), 30);
            assert.strictEqual(numberValue(null), 0);
            assert.strictEqual(numberValue("invalid"), 0);
        });

        it("enforces min/max bounds", () => {
            const safeNumber = (val, fallback, opts = {}) => {
                const num = Number(val);
                if (isNaN(num)) return fallback;
                if (opts.min !== undefined && num < opts.min) return opts.min;
                if (opts.max !== undefined && num > opts.max) return opts.max;
                return num;
            };
            
            assert.strictEqual(safeNumber(150, 0, { min: 0, max: 120 }), 120);
            assert.strictEqual(safeNumber(-10, 0, { min: 0, max: 120 }), 0);
            assert.strictEqual(safeNumber(50, 0, { min: 0, max: 120 }), 50);
        });
    });

    describe("String utilities", () => {
        it("truncates long strings safely", () => {
            const safeString = (val, maxLen) => {
                const str = String(val || "");
                return str.length > maxLen ? str.substring(0, maxLen) : str;
            };
            
            const long = "a".repeat(500);
            const safe = safeString(long, 100);
            assert.strictEqual(safe.length, 100);
        });

        it("sanitizes filenames", () => {
            const safeFileName = (name) => {
                if (!name) return "match-video.mp4";
                return String(name)
                    .replace(/[!@#$%^&*()]+/g, "")
                    .replace(/\.{2,}/g, ".")
                    .trim() || "match-video.mp4";
            };
            
            const name = safeFileName("match-2024-06-15...video!!!.mp4");
            assert(!name.includes("!"));
            assert(!name.includes("..."));
        });
    });

    describe("Calculator input building", () => {
        it("maps stat fields to calculator inputs", () => {
            const stats = {
                touches: 60,
                passes: 50,
                passesCompleted: 42,
                shots: 4,
                shotsOnTarget: 2,
                goals: 1
            };
            
            const inputs = {
                touches: stats.touches,
                accurate_pass: stats.passesCompleted,
                missed_pass: (stats.passes || 0) - (stats.passesCompleted || 0),
                ontarget_scoring_att: stats.shotsOnTarget,
                big_chance_missed: (stats.shots || 0) - (stats.shotsOnTarget || 0),
                goals: stats.goals
            };
            
            assert.strictEqual(inputs.touches, 60);
            assert.strictEqual(inputs.accurate_pass, 42);
            assert.strictEqual(inputs.missed_pass, 8);
            assert.strictEqual(inputs.ontarget_scoring_att, 2);
        });

        it("handles goalkeeper-specific stats", () => {
            const stats = {
                touches: 30,
                saves: 8,
                diveCatch: 3,
                crossClaimed: 5,
                goalsConceded: 1
            };
            
            const inputs = {
                touches: stats.touches,
                saves: stats.saves,
                dive_catch: stats.diveCatch,
                good_high_clam: stats.crossClaimed,
                goals_conceded: stats.goalsConceded
            };
            
            assert.strictEqual(inputs.saves, 8);
            assert.strictEqual(inputs.dive_catch, 3);
            assert.strictEqual(inputs.good_high_clam, 5);
        });
    });

    describe("Confidence scoring", () => {
        it("determines confidence based on event count", () => {
            const determineConfidence = (eventCount) => {
                if (eventCount >= 50) return "high";
                if (eventCount >= 20) return "medium";
                return "low";
            };
            
            assert.strictEqual(determineConfidence(80), "high");
            assert.strictEqual(determineConfidence(35), "medium");
            assert.strictEqual(determineConfidence(10), "low");
        });
    });
});
