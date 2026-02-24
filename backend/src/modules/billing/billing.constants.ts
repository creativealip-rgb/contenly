export const BILLING_TIERS = {
    FREE: {
        monthlyTokens: 5,
        dailyLimits: {
            ARTICLE_GENERATION: 2,
            INSTAGRAM_GENERATION: 2,
        },
    },
    PRO: {
        monthlyTokens: 500, // or whatever the stripe metadata says, this is a fallback
        dailyLimits: {
            ARTICLE_GENERATION: 50,
            INSTAGRAM_GENERATION: 50,
        },
    },
    ENTERPRISE: {
        monthlyTokens: 5000,
        dailyLimits: {
            ARTICLE_GENERATION: 500,
            INSTAGRAM_GENERATION: 500,
        },
    },
};
