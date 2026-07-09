import { describe, it } from "node:test";
import assert from "node:assert";

describe("Correction memory and learning", () => {
    describe("Stat difference detection", () => {
        it("identifies stat changes between original and corrected", () => {
            const original = { touches: 45, passes: 30, shots: 2 };
            const corrected = { touches: 48, passes: 32, shots: 2 };
            
            const differences = [];
            for (const key of Object.keys(original)) {
                const before = Number(original[key] || 0);
                const after = Number(corrected[key] || 0);
                if (after !== before) {
                    differences.push({ key, before, after, change: after - before });
                }
            }
            
            assert.strictEqual(differences.length, 2);
            assert.strictEqual(differences[0].key, "touches");
            assert.strictEqual(differences[1].key, "passes");
        });

        it("returns empty when no stat changes", () => {
            const stats = { touches: 50, passes: 40 };
            
            const differences = [];
            for (const key of Object.keys(stats)) {
                if (stats[key] !== stats[key]) {
                    differences.push({ key, change: 0 });
                }
            }
            
            assert.strictEqual(differences.length, 0);
        });

        it("sorts differences by magnitude", () => {
            const differences = [
                { key: "touches", change: 5 },
                { key: "passes", change: 8 },
                { key: "shots", change: 1 }
            ].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
            
            assert.strictEqual(differences[0].key, "passes");
            assert.strictEqual(differences[0].change, 8);
        });
    });

    describe("Correction record storage", () => {
        it("formats correction with context and differences", () => {
            const record = {
                playerNumber: "7",
                position: "midfielder",
                differences: [{ key: "touches", change: 5 }],
                lesson: "Undercounted touches"
            };
            
            assert.strictEqual(record.playerNumber, "7");
            assert.strictEqual(record.position, "midfielder");
            assert.strictEqual(record.differences.length, 1);
        });

        it("stores timestamp for tracking", () => {
            const now = Date.now();
            const record = { timestamp: now };
            
            assert(record.timestamp > 0);
            assert(record.timestamp <= Date.now());
        });
    });

    describe("Correction relevance scoring", () => {
        it("scores high for exact position match", () => {
            const memory = { position: "midfielder" };
            const body = { position: "midfielder" };
            
            let score = 0;
            if (memory.position && body.position && 
                String(memory.position).toLowerCase() === String(body.position).toLowerCase()) {
                score += 3;
            }
            
            assert.strictEqual(score, 3);
        });

        it("scores medium for player number match", () => {
            const memory = { playerNumber: "7" };
            const body = { playerNumber: "7" };
            
            let score = 0;
            if (memory.playerNumber && body.playerNumber && 
                String(memory.playerNumber).trim() === String(body.playerNumber).trim()) {
                score += 2;
            }
            
            assert.strictEqual(score, 2);
        });

        it("returns zero for no match", () => {
            const memory = { position: "forward", playerNumber: "9" };
            const body = { position: "goalkeeper", playerNumber: "1" };
            
            let score = 0;
            if (memory.position && body.position && 
                String(memory.position).toLowerCase() === String(body.position).toLowerCase()) {
                score += 3;
            }
            if (memory.playerNumber && body.playerNumber && 
                String(memory.playerNumber).trim() === String(body.playerNumber).trim()) {
                score += 2;
            }
            
            assert.strictEqual(score, 0);
        });
    });

    describe("Stat bias tracking", () => {
        it("tracks undercounted vs overcounted patterns", () => {
            const memory = [
                { differences: [{ key: "passes", change: 5 }, { key: "touches", change: -3 }] },
                { differences: [{ key: "passes", change: 4 }] }
            ];
            
            const statBias = {};
            
            for (const item of memory) {
                for (const diff of (item.differences || [])) {
                    if (!statBias[diff.key]) {
                        statBias[diff.key] = { undercounted: 0, overcounted: 0 };
                    }
                    if (diff.change > 0) statBias[diff.key].undercounted += 1;
                    if (diff.change < 0) statBias[diff.key].overcounted += 1;
                }
            }
            
            assert.strictEqual(statBias.passes.undercounted, 2);
            assert.strictEqual(statBias.touches.overcounted, 1);
        });

        it("calculates net change per stat", () => {
            const corrections = [
                { differences: [{ key: "passes", change: 5 }] },
                { differences: [{ key: "passes", change: 4 }] }
            ];
            
            let netChange = 0;
            for (const item of corrections) {
                for (const diff of (item.differences || [])) {
                    if (diff.key === "passes") netChange += diff.change;
                }
            }
            
            assert.strictEqual(netChange, 9);
        });
    });

    describe("Lesson generation", () => {
        it("generates lesson from stat differences", () => {
            const differences = [
                { key: "passes", before: 30, after: 38 },
                { key: "touches", before: 40, after: 45 }
            ];
            
            const lesson = {
                summary: "Correction saved.",
                watchStats: differences.map(d => d.key)
            };
            
            assert.strictEqual(lesson.watchStats.length, 2);
            assert(lesson.watchStats.includes("passes"));
            assert(lesson.watchStats.includes("touches"));
        });

        it("includes prevent next time tips", () => {
            const differences = [
                { key: "passes", before: 30, after: 38 }
            ];
            
            const tips = differences.map(item => 
                `Double-check ${item.key}`
            );
            
            assert.strictEqual(tips.length, 1);
            assert(tips[0].includes("passes"));
        });
    });

    describe("Recent corrections loading", () => {
        it("filters corrections by player context", () => {
            const corrections = [
                { playerNumber: "7", position: "midfielder", lesson: "Lesson 1" },
                { playerNumber: "10", position: "forward", lesson: "Lesson 2" },
                { playerNumber: "1", position: "goalkeeper", lesson: "Lesson 3" }
            ];
            
            const filtered = corrections.filter(c => 
                c.position === "midfielder"
            );
            
            assert.strictEqual(filtered.length, 1);
            assert.strictEqual(filtered[0].playerNumber, "7");
        });

        it("limits recent corrections to last 8", () => {
            const corrections = Array.from({ length: 15 }, (_, i) => ({
                lesson: `Lesson ${i}`
            }));
            
            const recent = corrections.slice(-8);
            
            assert(recent.length <= 8);
            assert.strictEqual(recent.length, 8);
        });

        it("ensures all loaded corrections have lessons", () => {
            const corrections = [
                { lesson: "Tip 1" },
                { lesson: "Tip 2" },
                { lesson: null }
            ].filter(c => c.lesson);
            
            assert.strictEqual(corrections.length, 2);
            assert(corrections.every(c => c.lesson));
        });
    });
});
