import { describe, it } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { PLAN_TIERS, publicPlans } from "../lib/plans.js";

describe("Phase 1 foundation", () => {
    it("serves React as the public root via express.static", async () => {
        const server = await readFile("server.js", "utf8");
        assert.match(server, /app\.use\(express\.static\(reactDistDir/);
    });

    it("builds React for the public root with direct React routes — no legacy system", async () => {
        const vite = await readFile("vite.config.js", "utf8");
        const app = await readFile("react/src/App.jsx", "utf8");
        assert.match(vite, /base:\s*"\//);
        assert.match(app, /<BrowserRouter>/);
        assert.doesNotMatch(app, /basename="\/app"/);
        // Real React components for all three sports
        assert.match(app, /<Route path="\/" element=\{<Calculator/);
        assert.match(app, /<Route path="\/vault" element=\{<Vault/);
        assert.match(app, /<Route path="\/basketball" element=\{<BasketballCalculator/);
        assert.match(app, /<Route path="\/football" element=\{<FootballCalculator/);
        // No legacy system
        assert.doesNotMatch(app, /ExactVeyroPage|ExactLegacyPage|legacyPageLoaders|srcDoc|iframe/);
    });

    it("does not contain legacy HTML-string template files", async () => {
        const { access } = await import("node:fs/promises");
        // These files should not exist in the clean codebase
        await assert.rejects(() => access("react/src/pages/ExactVeyroPage.jsx"), "ExactVeyroPage.jsx should not exist");
        await assert.rejects(() => access("react/src/exactTemplates"), "exactTemplates/ should not exist");
        await assert.rejects(() => access("react/src/legacy"), "legacy/ should not exist");
    });

    it("defines clear launch monetization tiers", () => {
        assert.deepStrictEqual(PLAN_TIERS.map(plan => plan.id), ["free", "coach", "premium"]);
        assert.strictEqual(PLAN_TIERS[0].priceMonthlyUsd, 0);
        assert.strictEqual(PLAN_TIERS[1].priceMonthlyUsd, 9);
        assert.strictEqual(PLAN_TIERS[2].priceMonthlyUsd, 19);
        assert.strictEqual(publicPlans()[0].features.includes("Soccer rating calculator"), true);
    });

    it("shows pricing on the Calculator homepage via React component", async () => {
        const calculator = await readFile("react/src/pages/Calculator.jsx", "utf8");
        assert.match(calculator, /Simple plans for launch/);
        assert.match(calculator, /Free/);
        assert.match(calculator, /Coach/);
        assert.match(calculator, /Premium/);
    });
});
