// Resolve the AI model from env so all tiers stay in sync with deployment config.
// Falls back to a healthy 9Router model (Antigravity) instead of the dead cx/ Codex models.
const DEFAULT_AI_MODEL = (process.env.OPENAI_MODEL || process.env.OPENROUTER_MODEL || 'ag/claude-sonnet-4-6').trim();

export const BILLING_TIERS = {
    FREE: {
        monthlyQuota: 5,
        monthlyLimits: {
            ARTICLE_GENERATION: 5,
            INSTAGRAM_GENERATION: 150,
            VIDEO_GENERATION: 3,
            IMAGE_GENERATION: 2,
        },
        maxWpSites: 1,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: false,
        minSyncInterval: 0,
        canAccessViewBoost: false,
        canAnalyzeTrends: false,
    },
    STARTER: {
        monthlyQuota: 500,
        monthlyLimits: {
            ARTICLE_GENERATION: 40,
            INSTAGRAM_GENERATION: 900,
            VIDEO_GENERATION: 20,
            IMAGE_GENERATION: 8,
        },
        maxWpSites: 2,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 120, // 2 hours
        canAccessViewBoost: false,
        canAnalyzeTrends: true,
        price: 99000, // Rp 99K
    },
    PRO: {
        monthlyQuota: 2000,
        monthlyLimits: {
            ARTICLE_GENERATION: 150,
            INSTAGRAM_GENERATION: 3000,
            VIDEO_GENERATION: 80,
            IMAGE_GENERATION: 15,
        },
        maxWpSites: 5,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 60, // 1 hour
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
        price: 399000, // Rp 399K
    },
    BUSINESS: {
        monthlyQuota: 5000,
        monthlyLimits: {
            ARTICLE_GENERATION: 400,
            INSTAGRAM_GENERATION: 9000,
            VIDEO_GENERATION: 200,
            IMAGE_GENERATION: 35,
        },
        maxWpSites: 10,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 15, // 15 minutes
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
        price: 999000, // Rp 999K
    },
};

// Token costs per operation (aligned with 3x markup of API costs)
// Text gen (Antigravity): ~Rp 583/request → 17 tokens @ Rp 100/token = Rp 1,700
// Image gen (Codex): ~Rp 2,836/request → 85 tokens @ Rp 100/token = Rp 8,500
export const TOKEN_COSTS = {
    // Text generation operations (Antigravity ~Rp 583)
    ARTICLE_GENERATION: 17,
    STORYBOARD_GENERATION: 17,
    VIDEO_SCRIPT: 17,
    HASHTAG_GENERATION: 10,
    
    // Image generation operations (Codex ~Rp 2,836)
    IMAGE_GENERATION: 85,
    SLIDE_IMAGE: 85,
    THUMBNAIL_GENERATION: 85,
    MOTION_GRAPHICS_RENDER: 85,
    
    // Mixed operations
    VIDEO_ANALYSIS: 17,      // Text heavy
    VIDEO_EXPORT: 85,        // Image/render heavy
    TEXT_OVERLAY: 30,        // Light image processing
};
