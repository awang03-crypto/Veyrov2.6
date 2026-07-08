import { describe, it } from "node:test";
import assert from "node:assert";
import {
    applyStripePlanEvent,
    planStatusFromStripeSubscription,
    planTierFromStripePrice,
    userIdFromStripeObject
} from "../lib/billing.js";

describe("Billing plan mapping", () => {
    it("maps Stripe price IDs to Veyro plan tiers", () => {
        const env = {
            STRIPE_COACH_PRICE_ID: "price_coach",
            STRIPE_PREMIUM_PRICE_ID: "price_premium"
        };
        assert.strictEqual(planTierFromStripePrice("price_coach", env), "coach");
        assert.strictEqual(planTierFromStripePrice("price_premium", env), "premium");
        assert.strictEqual(planTierFromStripePrice("price_unknown", env), null);
    });

    it("normalizes Stripe subscription statuses to Firestore plan statuses", () => {
        assert.strictEqual(planStatusFromStripeSubscription("active"), "active");
        assert.strictEqual(planStatusFromStripeSubscription("trialing"), "trialing");
        assert.strictEqual(planStatusFromStripeSubscription("unpaid"), "past_due");
        assert.strictEqual(planStatusFromStripeSubscription("incomplete"), "canceled");
    });

    it("finds the Firebase user ID from supported Stripe metadata locations", () => {
        assert.strictEqual(userIdFromStripeObject({ metadata: { firebaseUid: "u1" } }), "u1");
        assert.strictEqual(userIdFromStripeObject({ client_reference_id: "u2" }), "u2");
        assert.strictEqual(userIdFromStripeObject({ subscription_details: { metadata: { firebaseUid: "u3" } } }), "u3");
    });

    it("applies subscription updates to Firestore user plan fields", async () => {
        const writes = [];
        const firestore = {
            collection(name) {
                assert.strictEqual(name, "users");
                return {
                    doc(userId) {
                        return {
                            async set(data, options) {
                                writes.push({ userId, data, options });
                            }
                        };
                    }
                };
            }
        };
        const result = await applyStripePlanEvent({
            firestore,
            env: { STRIPE_COACH_PRICE_ID: "price_coach" },
            event: {
                type: "customer.subscription.updated",
                data: {
                    object: {
                        id: "sub_123",
                        status: "active",
                        customer: "cus_123",
                        metadata: { firebaseUid: "user_123" },
                        items: { data: [{ price: { id: "price_coach" } }] }
                    }
                }
            }
        });

        assert.strictEqual(result.updated, true);
        assert.strictEqual(writes[0].userId, "user_123");
        assert.strictEqual(writes[0].data.planTier, "coach");
        assert.strictEqual(writes[0].data.planStatus, "active");
        assert.strictEqual(writes[0].options.merge, true);
    });

    it("downgrades deleted subscriptions to free and canceled", async () => {
        const writes = [];
        const firestore = {
            collection() {
                return {
                    doc(userId) {
                        return {
                            async set(data, options) {
                                writes.push({ userId, data, options });
                            }
                        };
                    }
                };
            }
        };

        const result = await applyStripePlanEvent({
            firestore,
            event: {
                type: "customer.subscription.deleted",
                data: {
                    object: {
                        id: "sub_deleted",
                        customer: "cus_deleted",
                        metadata: { firebaseUid: "user_deleted" },
                        status: "canceled"
                    }
                }
            }
        });

        assert.strictEqual(result.updated, true);
        assert.strictEqual(writes[0].data.planTier, "free");
        assert.strictEqual(writes[0].data.planStatus, "canceled");
    });

    it("uses checkout metadata as a fallback plan tier", async () => {
        const writes = [];
        const firestore = {
            collection() {
                return {
                    doc(userId) {
                        return {
                            async set(data) {
                                writes.push({ userId, data });
                            }
                        };
                    }
                };
            }
        };

        const result = await applyStripePlanEvent({
            firestore,
            event: {
                type: "checkout.session.completed",
                data: {
                    object: {
                        client_reference_id: "checkout_user",
                        customer: "cus_checkout",
                        subscription: "sub_checkout",
                        metadata: { planTier: "premium" }
                    }
                }
            }
        });

        assert.strictEqual(result.updated, true);
        assert.strictEqual(writes[0].userId, "checkout_user");
        assert.strictEqual(writes[0].data.planTier, "premium");
        assert.strictEqual(writes[0].data.planStatus, "active");
    });

    it("does not update Firestore when Stripe metadata is missing a Firebase user ID", async () => {
        let wrote = false;
        const firestore = {
            collection() {
                return {
                    doc() {
                        return {
                            async set() {
                                wrote = true;
                            }
                        };
                    }
                };
            }
        };

        const result = await applyStripePlanEvent({
            firestore,
            env: { STRIPE_COACH_PRICE_ID: "price_coach" },
            event: {
                type: "customer.subscription.updated",
                data: {
                    object: {
                        status: "active",
                        items: { data: [{ price: { id: "price_coach" } }] }
                    }
                }
            }
        });

        assert.strictEqual(result.updated, false);
        assert.strictEqual(result.reason, "missing-firebase-uid");
        assert.strictEqual(wrote, false);
    });

    it("does not update Firestore for unknown Stripe price IDs", async () => {
        let wrote = false;
        const firestore = {
            collection() {
                return {
                    doc() {
                        return {
                            async set() {
                                wrote = true;
                            }
                        };
                    }
                };
            }
        };

        const result = await applyStripePlanEvent({
            firestore,
            env: { STRIPE_COACH_PRICE_ID: "price_coach" },
            event: {
                type: "customer.subscription.updated",
                data: {
                    object: {
                        metadata: { firebaseUid: "user_unknown_price" },
                        status: "active",
                        items: { data: [{ price: { id: "price_unknown" } }] }
                    }
                }
            }
        });

        assert.strictEqual(result.updated, false);
        assert.strictEqual(result.reason, "unknown-plan-tier");
        assert.strictEqual(wrote, false);
    });

    it("marks invoice payment failures as past due", async () => {
        const writes = [];
        const firestore = {
            collection() {
                return {
                    doc(userId) {
                        return {
                            async set(data) {
                                writes.push({ userId, data });
                            }
                        };
                    }
                };
            }
        };

        const result = await applyStripePlanEvent({
            firestore,
            event: {
                type: "invoice.payment_failed",
                data: {
                    object: {
                        customer: "cus_failed",
                        subscription: "sub_failed",
                        metadata: {
                            firebaseUid: "failed_user",
                            planTier: "coach"
                        }
                    }
                }
            }
        });

        assert.strictEqual(result.updated, true);
        assert.strictEqual(writes[0].userId, "failed_user");
        assert.strictEqual(writes[0].data.planTier, "coach");
        assert.strictEqual(writes[0].data.planStatus, "past_due");
    });
});
