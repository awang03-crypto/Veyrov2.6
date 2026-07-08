import { describe, it } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";

describe("Critical API route contracts", () => {
    it("keeps video routes protected by trusted-origin checks, rate limits, and upload validation", async () => {
        const server = await readFile("server.js", "utf8");
        assert.match(server, /app\.post\("\/api\/analyze-video", requireTrustedOrigin, requireVideoAiEntitlement, videoAiLimiter, upload\.single\("video"\), handleUploadError/);
        assert.match(server, /app\.post\("\/api\/player-lock", requireTrustedOrigin, requireVideoAiEntitlement, videoAiLimiter, upload\.single\("video"\), handleUploadError/);
        assert.match(server, /await assertUploadedVideoLooksSafe\(req\)/);
        assert.match(server, /res\.status\(400\)\.json\(\{ error: "Missing video file\." \}\)/);
        assert.match(server, /res\.status\(413\)\.json/);
    });

    it("requires Firebase plan entitlements before accepting Video AI uploads", async () => {
        const server = await readFile("server.js", "utf8");
        const reactVideoPage = await readFile("react/src/pages/VideoAI.jsx", "utf8");

        assert.match(server, /async function requireVideoAiEntitlement/);
        assert.match(server, /bearerTokenFromHeader/);
        assert.match(server, /canUseVideoAiEntitlement/);
        assert.match(server, /res\.status\(401\)\.json/);
        assert.match(server, /res\.status\(403\)\.json/);
        assert.match(reactVideoPage, /Authorization: `Bearer \$\{token\}`/);
    });

    it("keeps correction memory bounded and behind the correction limiter", async () => {
        const server = await readFile("server.js", "utf8");
        assert.match(server, /app\.post\("\/api\/video-correction", requireTrustedOrigin, correctionLimiter/);
        assert.match(server, /appendJsonLineWithCap\(correctionsPath, record/);
        assert.match(server, /CORRECTIONS_MAX_LINES|correctionsMaxLines/);
    });

    it("exposes billing webhook as raw JSON before the global JSON parser", async () => {
        const server = await readFile("server.js", "utf8");
        const webhookIndex = server.indexOf('app.post("/api/billing/stripe-webhook"');
        const jsonParserIndex = server.indexOf("app.use(express.json");
        assert.ok(webhookIndex > -1, "webhook route should exist");
        assert.ok(webhookIndex < jsonParserIndex, "Stripe webhook must be mounted before express.json");
        assert.match(server, /stripe\.webhooks\.constructEvent/);
        assert.match(server, /applyStripePlanEvent/);
    });

it("exposes basic operational metrics without changing page rendering", async () => {
    const server = await readFile("server.js", "utf8");
    const metrics = await readFile("lib/metrics.js", "utf8");
    assert.match(server, /app\.get\("\/api\/metrics", requireTrustedOrigin/);
    assert.match(server, /formatPrometheusMetrics/);
    assert.match(metrics, /veyro_uptime_seconds/);
    assert.match(metrics, /veyro_memory_heap_used_bytes/);
});
});
