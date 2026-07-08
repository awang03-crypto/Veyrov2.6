const ACTIVE_PLAN_STATUSES = new Set(["active", "trialing"]);
const VALID_PLAN_TIERS = new Set(["free", "coach", "premium"]);

export function normalizeEntitlementProfile(profile = {}) {
    const tier = String(profile.planTier || profile.subscriptionTier || "free").toLowerCase();
    const status = String(profile.planStatus || "active").toLowerCase();

    return {
        planTier: VALID_PLAN_TIERS.has(tier) ? tier : "free",
        planStatus: status
    };
}

export function isAdminEmail(email, adminEmail = process.env.ADMIN_EMAIL || "awang03@dccs.org") {
    return String(email || "").toLowerCase() === String(adminEmail || "").toLowerCase();
}

export function canUseVideoAiEntitlement({ profile = {}, email = "", adminEmail } = {}) {
    if (isAdminEmail(email, adminEmail)) return true;
    const normalized = normalizeEntitlementProfile(profile);
    return normalized.planTier === "premium" && ACTIVE_PLAN_STATUSES.has(normalized.planStatus);
}

export function bearerTokenFromHeader(header = "") {
    const match = String(header || "").match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : "";
}
