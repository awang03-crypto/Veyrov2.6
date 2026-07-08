export const STRIPE_PLAN_PRICE_ENV = Object.freeze({
    free: null,
    coach: "STRIPE_COACH_PRICE_ID",
    premium: "STRIPE_PREMIUM_PRICE_ID"
});

export function planTierFromStripePrice(priceId, env = process.env) {
    if (!priceId) return null;
    if (env.STRIPE_COACH_PRICE_ID && priceId === env.STRIPE_COACH_PRICE_ID) return "coach";
    if (env.STRIPE_PREMIUM_PRICE_ID && priceId === env.STRIPE_PREMIUM_PRICE_ID) return "premium";
    return null;
}

export function planStatusFromStripeSubscription(status) {
    if (["active", "trialing", "past_due", "canceled"].includes(status)) return status;
    if (status === "unpaid" || status === "incomplete_expired") return "past_due";
    if (status === "incomplete" || status === "paused") return "canceled";
    return "canceled";
}

export function userIdFromStripeObject(object) {
    return object?.metadata?.firebaseUid
        || object?.client_reference_id
        || object?.subscription_details?.metadata?.firebaseUid
        || null;
}

export async function applyStripePlanEvent({ firestore, event, env = process.env }) {
    const object = event?.data?.object || {};
    const type = event?.type || "";
    const userId = userIdFromStripeObject(object);
    if (!userId) return { updated: false, reason: "missing-firebase-uid" };

    let priceId = object?.items?.data?.[0]?.price?.id || object?.lines?.data?.[0]?.price?.id || null;
    let planTier = planTierFromStripePrice(priceId, env);
    let planStatus = planStatusFromStripeSubscription(object?.status || "active");

    if (type === "checkout.session.completed") {
        planStatus = "active";
        if (!planTier) {
            planTier = object?.metadata?.planTier || null;
        }
    }

    if (type === "customer.subscription.deleted") {
        planTier = "free";
        planStatus = "canceled";
    }

    if (type === "invoice.payment_failed") {
        planStatus = "past_due";
        if (!planTier) {
            planTier = object?.metadata?.planTier || null;
        }
    }

    if (!["free", "coach", "premium"].includes(planTier)) {
        return { updated: false, reason: "unknown-plan-tier", priceId };
    }

    await firestore.collection("users").doc(userId).set({
        planTier,
        planStatus,
        planUpdatedAt: Date.now(),
        stripeCustomerId: object.customer || null,
        stripeSubscriptionId: object.subscription || object.id || null
    }, { merge: true });

    return { updated: true, userId, planTier, planStatus };
}
