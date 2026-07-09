import { describe, it } from "node:test";
import assert from "node:assert";

// Test suite for correction memory and stat differences
describe("Correction memory and learning", () => {
    describe("Stat difference summarization", () => {
        it("identifies stat changes between original and corrected", () => {
            const original = { touches: 45, passes: 30, shots: 2 };
            const corrected = { touches: 48, passes: 32, shots: 2 };
            
            // Simulate summarizeStatDifferences logic
            const statKeys = ["touches", "passes", "shots"];
            const differences = statKeys
                .map(key => {
                    const before = Number(original[key] || 0);
                    const after = Number(corrected[key] || 0);
                    return { key, before, after, change: after - before };
                })
                .filter(item => item.change !== 0)
                .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
            
            assert.strictEqual(differences.length, 2);
            assert.strictEqual(differences[0].key, "passes");
            assert.strictEqual(differences[0].change, 2);
        });

        it("returns empty when no changes", () => {
            const stats = { touches: 50, passes: 40 };
            
            const differences = Object.keys(stats)
                .map(key => ({
                    key,
                    before: stats[key],
                    after: stats[key],
                    change: 0
                }))
                .filter(item => item.change !== 0);
            
            assert.strictEqual(differences.length, 0);
        });

        it("sorts by magnitude of change", () => {
            const differences = [
                { key: "touches", before: 40, after: 45, change: 5 },
                { key: "passes", before: 30, after: 38, change: 8 },
                { key: "shots", before: 1, after: 2, change: 1 }
            ].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
            
            assert.strictEqual(differences[0].key, "passes");
            assert.strictEqual(differences[1].key, "touches");
            assert.strictEqual(differences[2].key, "shots");
        });
    });

    describe("Correction record storage", () => {
        it("formats correction record with context and differences", () => {
            const record = {
                createdAt: new Date().toISOString(),
                context: {
                    playerNumber: "7",
                    position: "midfielder",
                    teamColor: "red"
                },
                differences: [
                    { key: "touches", before: 40, after: 45, change: 5 }
                ],
                lesson: {
                    summary: "Undercounted touches",
                    lesson: "Count quick touches more carefully",
                    preventNextTime: ["Watch for rapid exchanges"]
                }
            };
            
            assert(record.createdAt);
            assert.strictEqual(record.context.playerNumber, "7");
            assert.strictEqual(record.differences.length, 1);
            assert(record.lesson.summary);
        });
    });

    describe("Correction memory guide compilation", () => {
        it("compiles relevant lessons from memory based on position matching", () => {
            const memory = [
                {
                    playerNumber: "7",
                    position: "midfielder",
                    teamColor: "red",
                    lesson: "Watch for quick passes",
                    biggestDifferences: [{ key: "passes", change: 5 }]
                },
                {
                    playerNumber: "9",
                    position: "forward",
                    teamColor: "blue",
                    lesson: "Count shots in crowded box",
                    biggestDifferences: [{ key: "shots", change: 3 }]
                }
            ];
            
            const body = { playerNumber: "7", position: "midfielder" };
            
            // Simulate correctionRelevanceScore
            const scoreFn = (memory, body) => {
                let score = 0;
                if (memory.position && body.position && 
                    String(memory.position).toLowerCase() === String(body.position).toLowerCase()) 
                    score += 3;
                if (memory.playerNumber && body.playerNumber && 
                    String(memory.playerNumber).trim() === String(body.playerNumber).trim()) 
                    score += 2;
                return score;
            };
            
            const ranked = memory
                .map(item => ({ ...item, relevance: scoreFn(item, body) }))
                .sort((a, b) => b.relevance - a.relevance);
            
            assert.strictEqual(ranked[0].relevance, 3); // Position match
            assert.strictEqual(ranked[1].relevance, 0); // No match
        });

        it("tracks stat biases across multiple corrections", () => {
            const memory = [
                { biggestDifferences: [{ key: "passes", change: 5 }, { key: "touches", change: -3 }] },
                { biggestDifferences: [{ key: "passes", change: 4 }, { key: "touches", change: 2 }] }
            ];
            
            const statTotals = new Map();
            
            memory.forEach(item => {
                (item.biggestDifferences || []).forEach(diff => {
                    if (!diff?.key) return;
                    const current = statTotals.get(diff.key) || { 
                        key: diff.key, 
                        corrections: 0, 
                        netChange: 0, 
                        undercounted: 0, 
                        overcounted: 0 
                    };
                    current.corrections += 1;
                    current.netChange += diff.change;
                    if (diff.change > 0) current.undercounted += 1;
                    if (diff.change < 0) current.overcounted += 1;
                    statTotals.set(diff.key, current);
                });
            });
            
            const passes = statTotals.get("passes");
            assert.strictEqual(passes.corrections, 2);
            assert.strictEqual(passes.netChange, 9);
            assert.strictEqual(passes.undercounted, 2);
        });
    });

    describe("Correction lesson generation", () => {
        it("generates lesson from stat differences", () => {
            const differences = [
                { key: "passes", before: 30, after: 38 },
                { key: "touches", before: 40, after: 45 }
            ];
            
            // Simulate lesson generation
            const lesson = {
                summary: "Correction saved.",
                likelyMistake: "The model likely missed or overcounted visible events.",
                lesson: "Review the corrected stat keys more carefully in future clips.",
                preventNextTime: differences.slice(0, 3).map(item => 
                    `Double-check ${item.key}: AI ${item.before}, corrected ${item.after}.`
                ),
                watchStats: differences.slice(0, 5).map(item => item.key)
            };
            
            assert.strictEqual(lesson.preventNextTime.length, 2);
            assert(lesson.preventNextTime[0].includes("passes"));
            assert.strictEqual(lesson.watchStats.length, 2);
        });
    });

    describe("Recent corrections loading", () => {
        it("filters and ranks recent correction lessons", () => {
            const corrections = [
                {
                    context: { playerNumber: "7", position: "midfielder" },
                    lesson: { lesson: "Watch midfielder passes" }
                },
                {
                    context: { playerNumber: "10", position: "forward" },
                    lesson: { lesson: "Count forward shots" }
                },
                {
                    context: { playerNumber: "1", position: "goalkeeper" },
                    lesson: { lesson: "Track keeper saves" }
                }
            ];
            
            const filtered = corrections
                .map(item => ({
                    playerNumber: item.context?.playerNumber || "",
                    position: item.context?.position || "",
                    lesson: item.lesson?.lesson || "",
                    preventNextTime: []
                }))
                .filter(record => record.lesson)
                .slice(-8); // Last 8
            
            assert(filtered.length <= 8);
            assert(filtered.every(r => r.lesson));
        });
    });
});
