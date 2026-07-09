import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
    canUseVideoAiEntitlement,
    isAdminEmail,
    normalizeEntitlementProfile,
    bearerTokenFromHeader
} from "../lib/entitlements.js";

describe("Entitlements and feature gating", () => {
    describe("Admin email detection", () => {
        it("identifies admin users by email", () => {
            assert.strictEqual(isAdminEmail("awang03@dccs.org", "awang03@dccs.org"), true);
            assert.strictEqual(isAdminEmail("other@example.com", "awang03@dccs.org"), false);
        });

        it("is case-insensitive", () => {
            assert.strictEqual(isAdminEmail("AWANG03@DCCS.ORG", "awang03@dccs.org"), true);
        });

        it("handles null/undefined gracefully", () => {
            assert.strictEqual(isAdminEmail(null, "admin@test.com"), false);
            assert.strictEqual(isAdminEmail("test@test.com", null), false);
        });
    });

    describe("Profile normalization", () => {
        it("normalizes plan tier to valid values", () => {
            const profile1 = normalizeEntitlementProfile({ planTier: "premium" });
            assert.strictEqual(profile1.planTier, "premium");

            const profile2 = normalizeEntitlementProfile({ planTier: "COACH" });
            assert.strictEqual(profile2.planTier, "coach");

            const profile3 = normalizeEntitlementProfile({ planTier: "invalid" });
            assert.strictEqual(profile3.planTier, "free");
        });

        it("defaults to free tier if missing", () => {
            const profile = normalizeEntitlementProfile({});
            assert.strictEqual(profile.planTier, "free");
        });

        it("preserves plan status", () => {
            const profile = normalizeEntitlementProfile({ planStatus: "past_due" });
            assert.strictEqual(profile.planStatus, "past_due");
        });
    });

    describe("Video AI entitlement check", () => {
        it("grants access to admin users regardless of plan", () => {
            const result = canUseVideoAiEntitlement({
                email: "admin@test.com",
                profile: { planTier: "free" },
                adminEmail: "admin@test.com"
            });
            assert.strictEqual(result, true);
        });

        it("grants access to premium users with active status", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "premium", planStatus: "active" }
            });
            assert.strictEqual(result, true);
        });

        it("grants access to premium users in trialing status", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "premium", planStatus: "trialing" }
            });
            assert.strictEqual(result, true);
        });

        it("denies access to free users", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "free", planStatus: "active" }
            });
            assert.strictEqual(result, false);
        });

        it("denies access to coach users", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "coach", planStatus: "active" }
            });
            assert.strictEqual(result, false);
        });

        it("denies access to premium users with past_due status", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "premium", planStatus: "past_due" }
            });
            assert.strictEqual(result, false);
        });

        it("denies access to premium users with canceled status", () => {
            const result = canUseVideoAiEntitlement({
                email: "user@test.com",
                profile: { planTier: "premium", planStatus: "canceled" }
            });
            assert.strictEqual(result, false);
        });
    });

    describe("Bearer token extraction", () => {
        it("extracts bearer token from Authorization header", () => {
            const token = bearerTokenFromHeader("Bearer abc123xyz");
            assert.strictEqual(token, "abc123xyz");
        });

        it("handles case-insensitive Bearer prefix", () => {
            const token = bearerTokenFromHeader("bearer xyz789");
            assert.strictEqual(token, "xyz789");
        });

        it("trims whitespace from token", () => {
            const token = bearerTokenFromHeader("Bearer  token123  ");
            assert.strictEqual(token, "token123");
        });

        it("returns empty string for missing header", () => {
            assert.strictEqual(bearerTokenFromHeader(""), "");
            assert.strictEqual(bearerTokenFromHeader(null), "");
            assert.strictEqual(bearerTokenFromHeader(undefined), "");
        });

        it("returns empty string for invalid format", () => {
            assert.strictEqual(bearerTokenFromHeader("Basic abc123"), "");
            assert.strictEqual(bearerTokenFromHeader("abc123"), "");
        });
    });
});
