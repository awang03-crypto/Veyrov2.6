export const PLAN_TIERS = Object.freeze([
    {
        id: "free",
        name: "Free",
        priceMonthlyUsd: 0,
        audience: "Players trying Veyro",
        features: [
            "Soccer rating calculator",
            "5 saved matches",
            "Basic vault and match notes"
        ],
        limits: {
            savedMatches: 5,
            videoAiAnalysesMonthly: 0,
            teamManagement: false,
            exports: false
        }
    },
    {
        id: "coach",
        name: "Coach",
        priceMonthlyUsd: 9,
        audience: "Coaches and small teams",
        features: [
            "Unlimited saved matches",
            "Team code and roster management",
            "Coach dashboard and team trends"
        ],
        limits: {
            savedMatches: "unlimited",
            videoAiAnalysesMonthly: 0,
            teamManagement: true,
            exports: false
        }
    },
    {
        id: "premium",
        name: "Premium",
        priceMonthlyUsd: 19,
        audience: "Players and coaches using Video AI",
        features: [
            "Everything in Coach",
            "Video AI analysis",
            "Exports and premium reports"
        ],
        limits: {
            savedMatches: "unlimited",
            videoAiAnalysesMonthly: "included",
            teamManagement: true,
            exports: true
        }
    }
]);

export function publicPlans() {
    return PLAN_TIERS.map(plan => ({
        id: plan.id,
        name: plan.name,
        priceMonthlyUsd: plan.priceMonthlyUsd,
        audience: plan.audience,
        features: [...plan.features],
        limits: { ...plan.limits }
    }));
}
