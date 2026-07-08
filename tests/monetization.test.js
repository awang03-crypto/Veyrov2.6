import { describe, it } from "node:test";
import assert from "node:assert";
import {
    canSaveMatch,
    canUseFeature,
    normalizePlanTier,
    PLAN_FEATURES,
    planGateMessage
} from "../react/src/services/monetization.js";

describe("Monetization gates", () => {
    it("defaults unknown or missing profiles to the free tier", () => {
        assert.strictEqual(normalizePlanTier(null), "free");
        assert.strictEqual(normalizePlanTier({ planTier: "not-real" }), "free");
    });

    it("limits free users to five saved matches", () => {
        assert.strictEqual(canSaveMatch({ planTier: "free" }, 4), true);
        assert.strictEqual(canSaveMatch({ planTier: "free" }, 5), false);
    });

    it("allows coach team management but not Video AI", () => {
        assert.strictEqual(canUseFeature({ planTier: "coach" }, PLAN_FEATURES.TEAM_MANAGEMENT), true);
        assert.strictEqual(canUseFeature({ planTier: "coach" }, PLAN_FEATURES.VIDEO_AI), false);
    });

    it("allows premium Video AI and exports", () => {
        assert.strictEqual(canUseFeature({ planTier: "premium" }, PLAN_FEATURES.VIDEO_AI), true);
        assert.strictEqual(canUseFeature({ planTier: "premium" }, PLAN_FEATURES.EXPORTS), true);
    });

    it("blocks inactive plans unless the user is admin", () => {
        assert.strictEqual(canUseFeature({ planTier: "premium", planStatus: "canceled" }, PLAN_FEATURES.VIDEO_AI), false);
        assert.strictEqual(canUseFeature({ planTier: "free", planStatus: "canceled" }, PLAN_FEATURES.VIDEO_AI, { email: "awang03@dccs.org" }), true);
    });

    it("has a useful Video AI gate message", () => {
        assert.match(planGateMessage(PLAN_FEATURES.VIDEO_AI), /Premium feature/);
    });
});
