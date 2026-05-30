// Resolve the AI model from env so all tiers stay in sync with deployment config.
// Falls back to a healthy 9Router model (Antigravity) instead of the dead cx/ Codex models.
const DEFAULT_AI_MODEL = (process.env.OPENAI_MODEL || process.env.OPENROUTER_MODEL || 'ag/claude-sonnet-4-6').trim();

export const BILLING_TIERS = {
    FREE: {
        monthlyTokens: 5,
        dailyLimits: {
            ARTICLE_GENERATION: 2,
            INSTAGRAM_GENERATION: 2,
            VIDEO_GENERATION: 2,
        },
        maxWpSites: 1,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: false,
        minSyncInterval: 0,
        canAccessViewBoost: false,
        canAnalyzeTrends: false,
    },
    PRO: {
        monthlyTokens: 500,
        dailyLimits: {
            ARTICLE_GENERATION: 20,
            INSTAGRAM_GENERATION: 20,
            VIDEO_GENERATION: 20,
        },
        maxWpSites: 2,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 60, // 60 minutes
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
    },
    ENTERPRISE: {
        monthlyTokens: 2000,
        dailyLimits: {
            ARTICLE_GENERATION: 70,
            INSTAGRAM_GENERATION: 70,
            VIDEO_GENERATION: 70,
        },
        maxWpSites: 5,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 15, // 15 minutes
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
    },
};
