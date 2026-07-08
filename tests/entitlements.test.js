import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    bearerTokenFromHeader,
    canUseVideoAiEntitlement,
    isAdminEmail,
    normalizeEntitlementProfile
} from "../lib/entitlements.js";

describe("Video AI entitlements", () => {
    it("normalizes unknown or missing plans to free active", () => {
        assert.deepEqual(normalizeEntitlementProfile({}), { planTier: "free", planStatus: "active" });
        assert.deepEqual(normalizeEntitlementProfile({ planTier: "enterprise", planStatus: "active" }), { planTier: "free", planStatus: "active" });
    });

    it("allows Video AI only for active premium users or admins", () => {
        assert.equal(canUseVideoAiEntitlement({ profile: { planTier: "premium", planStatus: "active" } }), true);
        assert.equal(canUseVideoAiEntitlement({ profile: { planTier: "premium", planStatus: "trialing" } }), true);
        assert.equal(canUseVideoAiEntitlement({ profile: { planTier: "premium", planStatus: "past_due" } }), false);
        assert.equal(canUseVideoAiEntitlement({ profile: { planTier: "coach", planStatus: "active" } }), false);
        assert.equal(canUseVideoAiEntitlement({ profile: { planTier: "free", planStatus: "active" }, email: "awang03@dccs.org" }), true);
    });

    it("matches admin email case-insensitively", () => {
        assert.equal(isAdminEmail("AWANG03@DCCS.ORG"), true);
        assert.equal(isAdminEmail("coach@example.com"), false);
    });

    it("extracts bearer tokens safely", () => {
        assert.equal(bearerTokenFromHeader("Bearer abc.123"), "abc.123");
        assert.equal(bearerTokenFromHeader("bearer token"), "token");
        assert.equal(bearerTokenFromHeader("Token nope"), "");
        assert.equal(bearerTokenFromHeader(""), "");
    });
});
