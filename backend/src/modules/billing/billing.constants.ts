// Resolve the AI model from env so all tiers stay in sync with deployment config.
const DEFAULT_AI_MODEL = (process.env.OPENAI_MODEL || process.env.OPENROUTER_MODEL || 'ag/claude-sonnet-4-6').trim();

export const BILLING_TIERS: Record<string, any> = {
    FREE: {
        monthlyLimits: {
            ARTICLE_GENERATION: 5,
            INSTAGRAM_GENERATION: 30,
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
        monthlyLimits: {
            ARTICLE_GENERATION: 40,
            INSTAGRAM_GENERATION: 100,
            VIDEO_GENERATION: 20,
            IMAGE_GENERATION: 8,
        },
        maxWpSites: 2,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 120,
        canAccessViewBoost: false,
        canAnalyzeTrends: true,
        price: 99000,
    },
    PRO: {
        monthlyLimits: {
            ARTICLE_GENERATION: 150,
            INSTAGRAM_GENERATION: 300,
            VIDEO_GENERATION: 80,
            IMAGE_GENERATION: 15,
        },
        maxWpSites: 5,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 60,
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
        price: 399000,
    },
    BUSINESS: {
        monthlyLimits: {
            ARTICLE_GENERATION: 400,
            INSTAGRAM_GENERATION: 800,
            VIDEO_GENERATION: 200,
            IMAGE_GENERATION: 35,
        },
        maxWpSites: 10,
        aiModel: DEFAULT_AI_MODEL,
        canAutoSync: true,
        minSyncInterval: 15,
        canAccessViewBoost: true,
        canAnalyzeTrends: true,
        price: 999000,
    },
};

/** Feature type to category key */
export const FEATURE_TO_CATEGORY: Record<string, string> = {
    ARTICLE_GENERATION: 'ARTICLE_GENERATION',
    INSTAGRAM_GENERATION: 'INSTAGRAM_GENERATION',
    STORYBOARD_GENERATION: 'INSTAGRAM_GENERATION',
    HASHTAG_GENERATION: 'INSTAGRAM_GENERATION',
    VIDEO_GENERATION: 'VIDEO_GENERATION',
    VIDEO_SCRIPT: 'VIDEO_GENERATION',
    ALTERNATE_HOOKS: 'VIDEO_GENERATION',
    BROLL_KEYWORDS: 'VIDEO_GENERATION',
    AUTO_CUTAWAY: 'VIDEO_GENERATION',
    TTS_PREVIEW: 'VIDEO_GENERATION',
    TTS_VOICEOVER: 'VIDEO_GENERATION',
    REGENERATE_FIELD: 'VIDEO_GENERATION',
    REGENERATE_VOICEOVER: 'VIDEO_GENERATION',
    IMPROVE_VISUAL: 'VIDEO_GENERATION',
    VIDEO_ANALYSIS: 'VIDEO_GENERATION',
    VIDEO_EXPORT: 'VIDEO_GENERATION',
    IMAGE_GENERATION: 'IMAGE_GENERATION',
    SLIDE_IMAGE: 'IMAGE_GENERATION',
    THUMBNAIL_GENERATION: 'IMAGE_GENERATION',
    MOTION_GRAPHICS_RENDER: 'IMAGE_GENERATION',
    TEXT_OVERLAY: 'IMAGE_GENERATION',
};

/** Kredit cost per operation - only charged when category limit exceeded */
export const KREDIT_COSTS: Record<string, number> = {
    ARTICLE_GENERATION: 3,
    STORYBOARD_GENERATION: 3,
    VIDEO_SCRIPT: 3,
    HASHTAG_GENERATION: 2,
    ALTERNATE_HOOKS: 1,
    BROLL_KEYWORDS: 1,
    AUTO_CUTAWAY: 2,
    TTS_PREVIEW: 1,
    TTS_VOICEOVER: 1,
    REGENERATE_FIELD: 1,
    REGENERATE_VOICEOVER: 1,
    IMPROVE_VISUAL: 1,
    IMAGE_GENERATION: 2,
    SLIDE_IMAGE: 2,
    THUMBNAIL_GENERATION: 2,
    MOTION_GRAPHICS_RENDER: 2,
    TEXT_OVERLAY: 2,
    VIDEO_ANALYSIS: 50,
    VIDEO_EXPORT: 30,
};

export const TOKEN_COSTS = KREDIT_COSTS;
