import { isAdminUser } from "../lib/adminConfig.js";
export const PLAN_IDS = Object.freeze({
    FREE: "free",
    COACH: "coach",
    PREMIUM: "premium"
});

export const PLAN_FEATURES = Object.freeze({
    SAVE_MATCH: "saveMatch",
    TEAM_MANAGEMENT: "teamManagement",
    VIDEO_AI: "videoAi",
    EXPORTS: "exports"
});

export const PLAN_LIMITS = Object.freeze({
    free: {
        savedMatches: 5,
        features: [PLAN_FEATURES.SAVE_MATCH]
    },
    coach: {
        savedMatches: Infinity,
        features: [PLAN_FEATURES.SAVE_MATCH, PLAN_FEATURES.TEAM_MANAGEMENT]
    },
    premium: {
        savedMatches: Infinity,
        features: [PLAN_FEATURES.SAVE_MATCH, PLAN_FEATURES.TEAM_MANAGEMENT, PLAN_FEATURES.VIDEO_AI, PLAN_FEATURES.EXPORTS]
    }
});

export function normalizePlanTier(profile) {
    const tier = String(profile?.planTier || profile?.subscriptionTier || PLAN_IDS.FREE).toLowerCase();
    return Object.hasOwn(PLAN_LIMITS, tier) ? tier : PLAN_IDS.FREE;
}

export function isPlanActive(profile) {
    const status = String(profile?.planStatus || "active").toLowerCase();
    return ["active", "trialing"].includes(status);
}

export function isAdminUser(user) {
    return isAdminUser(user);
}

export function canUseFeature(profile, feature, user = null) {
    if (isAdminUser(user)) return true;
    if (!isPlanActive(profile)) return false;
    const tier = normalizePlanTier(profile);
    return PLAN_LIMITS[tier].features.includes(feature);
}

export function canSaveMatch(profile, currentSavedCount = 0, user = null) {
    if (isAdminUser(user)) return true;
    if (!canUseFeature(profile, PLAN_FEATURES.SAVE_MATCH, user)) return false;
    const limit = PLAN_LIMITS[normalizePlanTier(profile)].savedMatches;
    return limit === Infinity || currentSavedCount < limit;
}

export function planGateMessage(feature, currentCount = 0) {
    if (feature === PLAN_FEATURES.SAVE_MATCH) {
        return `You've reached the free -match limit. Upgrade to Coach ($9/mo) or Premium ($19/mo) to save unlimited matches.`;
    }
    if (feature === PLAN_FEATURES.VIDEO_AI) {
        return "Video AI is a Premium feature. Upgrade to Premium when billing is connected, or ask the admin to enable premium access.";
    }
    if (feature === PLAN_FEATURES.TEAM_MANAGEMENT) {
        return "Team management is included in Coach and Premium plans. Upgrade to Coach or Premium to manage your team roster.";
    }
    if (feature === PLAN_FEATURES.EXPORTS) {
        return "Exports are included in Premium.";
    }
    return "This feature is not included in your current plan.";
}
