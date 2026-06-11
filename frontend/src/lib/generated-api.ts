// Auto-generated from docs/openapi.json. Do not edit manually.

export type ApiEndpoint =
  | '/api/v1/articles/{id}'
  | '/api/v1/brand-kit/{id}'
  | '/api/v1/calendar/{id}'
  | '/api/v1/category-mapping/{id}'
  | '/api/v1/content-templates/{id}'
  | '/api/v1/feeds/{id}'
  | '/api/v1/instagram-studio/projects/{id}'
  | '/api/v1/instagram-studio/slides/{id}'
  | '/api/v1/integrations/categories/{id}'
  | '/api/v1/integrations/sites/{id}'
  | '/api/v1/social/instagram/disconnect'
  | '/api/v1/users/admin/{id}'
  | '/api/v1/users/me/api-keys/{id}'
  | '/api/v1/video-clips/{id}'
  | '/api/v1/video-clips/{id}/broll/{itemId}'
  | '/api/v1/video-clips/{id}/segments/{index}'
  | '/api/v1/video-clips/presets/{presetId}'
  | '/api/v1/video-scripts/projects/{id}'
  | '/api/v1/video-scripts/scenes/{id}'
  | '/api/v1/view-boost/jobs/{id}'
  | '/api/v1/wordpress/sites/{id}'
  | '/api/v1'
  | '/api/v1/admin/settings/models/config'
  | '/api/v1/admin/settings/providers/{provider}/models'
  | '/api/v1/admin/settings/providers/status'
  | '/api/v1/ai/assets/{key}'
  | '/api/v1/analytics/content-performance'
  | '/api/v1/analytics/dashboard'
  | '/api/v1/analytics/export'
  | '/api/v1/analytics/platform-breakdown'
  | '/api/v1/analytics/token-usage'
  | '/api/v1/analytics/top-content'
  | '/api/v1/articles'
  | '/api/v1/articles/{id}'
  | '/api/v1/articles/stats/summary'
  | '/api/v1/auth/session'
  | '/api/v1/billing/balance'
  | '/api/v1/billing/subscriptions'
  | '/api/v1/billing/transactions'
  | '/api/v1/billing/usage-breakdown'
  | '/api/v1/brand-kit'
  | '/api/v1/brand-kit/{id}'
  | '/api/v1/brand-kit/default'
  | '/api/v1/calendar'
  | '/api/v1/calendar/{id}'
  | '/api/v1/calendar/month/{year}/{month}'
  | '/api/v1/calendar/stats'
  | '/api/v1/calendar/upcoming'
  | '/api/v1/category-mapping'
  | '/api/v1/content-templates'
  | '/api/v1/feeds'
  | '/api/v1/health'
  | '/api/v1/instagram-studio/fetch-url'
  | '/api/v1/instagram-studio/fonts'
  | '/api/v1/instagram-studio/projects'
  | '/api/v1/instagram-studio/projects/{id}'
  | '/api/v1/instagram-studio/styles'
  | '/api/v1/instagram-studio/templates'
  | '/api/v1/instagram-studio/templates/{id}'
  | '/api/v1/instagram-studio/templates/categories'
  | '/api/v1/integrations/sites'
  | '/api/v1/integrations/sites/{id}'
  | '/api/v1/integrations/sites/{id}/categories'
  | '/api/v1/motion-graphics/health'
  | '/api/v1/motion-graphics/jobs'
  | '/api/v1/motion-graphics/jobs/{id}'
  | '/api/v1/motion-graphics/jobs/{id}/download'
  | '/api/v1/motion-graphics/presets'
  | '/api/v1/motion-graphics/templates'
  | '/api/v1/motion-graphics/templates/{id}'
  | '/api/v1/notifications'
  | '/api/v1/social/accounts'
  | '/api/v1/social/instagram/status'
  | '/api/v1/trend-radar/analyze'
  | '/api/v1/trend-radar/search'
  | '/api/v1/users/admin/list'
  | '/api/v1/users/me'
  | '/api/v1/users/me/api-keys'
  | '/api/v1/users/me/preferences'
  | '/api/v1/video-clips'
  | '/api/v1/video-clips/{id}'
  | '/api/v1/video-clips/{id}/broll'
  | '/api/v1/video-clips/{id}/download/{jobId}'
  | '/api/v1/video-clips/{id}/stream'
  | '/api/v1/video-clips/{id}/thumbnail'
  | '/api/v1/video-clips/presets'
  | '/api/v1/video-scripts/projects'
  | '/api/v1/video-scripts/projects/{id}'
  | '/api/v1/video-scripts/projects/{id}/export'
  | '/api/v1/video-scripts/projects/{id}/export/zip'
  | '/api/v1/view-boost/jobs'
  | '/api/v1/wordpress/sites'
  | '/api/v1/wordpress/sites/{id}/categories'
  | '/api/v1/articles/{id}'
  | '/api/v1/brand-kit/{id}'
  | '/api/v1/calendar/{id}'
  | '/api/v1/content-templates/{id}'
  | '/api/v1/instagram-studio/projects/{id}'
  | '/api/v1/instagram-studio/projects/{id}/apply-style-to-all'
  | '/api/v1/instagram-studio/projects/{id}/slides/reorder'
  | '/api/v1/instagram-studio/slides/{id}'
  | '/api/v1/notifications/{id}/read'
  | '/api/v1/notifications/read-all'
  | '/api/v1/users/admin/{id}/role'
  | '/api/v1/users/admin/{id}/tier'
  | '/api/v1/users/admin/{id}/tokens'
  | '/api/v1/users/me'
  | '/api/v1/users/me/preferences'
  | '/api/v1/video-clips/{id}/broll/{itemId}'
  | '/api/v1/video-clips/{id}/segments/{index}'
  | '/api/v1/video-clips/presets/{presetId}'
  | '/api/v1/video-scripts/projects/{id}'
  | '/api/v1/video-scripts/projects/{id}/generate-script'
  | '/api/v1/video-scripts/projects/{id}/scenes/reorder'
  | '/api/v1/video-scripts/scenes/{id}'
  | '/api/v1/video-scripts/scenes/{id}/select-footage'
  | '/api/v1/admin/settings/models/config'
  | '/api/v1/admin/settings/providers/{provider}/test'
  | '/api/v1/ai/chat'
  | '/api/v1/ai/generate'
  | '/api/v1/ai/generate-image'
  | '/api/v1/ai/generate-seo'
  | '/api/v1/ai/prompt-generator'
  | '/api/v1/analytics/track/engagement'
  | '/api/v1/analytics/track/view'
  | '/api/v1/api/telegram-bot/webhook'
  | '/api/v1/articles'
  | '/api/v1/articles/{id}/restore/{versionIndex}'
  | '/api/v1/articles/bulk/delete'
  | '/api/v1/articles/bulk/status'
  | '/api/v1/auth/forgot-password'
  | '/api/v1/auth/login'
  | '/api/v1/auth/logout'
  | '/api/v1/auth/register'
  | '/api/v1/auth/reset-password'
  | '/api/v1/billing/checkout'
  | '/api/v1/billing/webhooks/stripe'
  | '/api/v1/brand-kit'
  | '/api/v1/brand-kit/{id}/apply/{projectId}'
  | '/api/v1/brand-kit/{id}/set-default'
  | '/api/v1/calendar'
  | '/api/v1/calendar/{id}/publish'
  | '/api/v1/category-mapping'
  | '/api/v1/content-templates'
  | '/api/v1/content-templates/{id}/use'
  | '/api/v1/feeds'
  | '/api/v1/feeds/{id}'
  | '/api/v1/feeds/{id}/poll'
  | '/api/v1/instagram-studio/batch-export'
  | '/api/v1/instagram-studio/projects'
  | '/api/v1/instagram-studio/projects/{id}/export'
  | '/api/v1/instagram-studio/projects/{id}/export/zip'
  | '/api/v1/instagram-studio/projects/{id}/generate-all'
  | '/api/v1/instagram-studio/projects/{id}/generate-storyboard'
  | '/api/v1/instagram-studio/projects/{id}/hashtags'
  | '/api/v1/instagram-studio/projects/{id}/slides'
  | '/api/v1/instagram-studio/slides/{id}/generate-image'
  | '/api/v1/instagram-studio/slides/{id}/generate-text'
  | '/api/v1/instagram-studio/templates/{id}/generate-prompt'
  | '/api/v1/integrations/sites'
  | '/api/v1/integrations/sites/{id}/categories/refresh'
  | '/api/v1/integrations/sites/{id}/test'
  | '/api/v1/motion-graphics/ai-generate'
  | '/api/v1/motion-graphics/batch-render'
  | '/api/v1/motion-graphics/compose-video'
  | '/api/v1/motion-graphics/presets'
  | '/api/v1/motion-graphics/presets/{id}/delete'
  | '/api/v1/motion-graphics/preview'
  | '/api/v1/motion-graphics/render'
  | '/api/v1/motion-graphics/render-caption'
  | '/api/v1/scraper/scrape'
  | '/api/v1/social/instagram/connect'
  | '/api/v1/social/instagram/post'
  | '/api/v1/users/admin/users'
  | '/api/v1/users/me/api-keys'
  | '/api/v1/video-clips'
  | '/api/v1/video-clips/{id}/analyze'
  | '/api/v1/video-clips/{id}/broll'
  | '/api/v1/video-clips/{id}/broll/auto-cutaway'
  | '/api/v1/video-clips/{id}/broll/search'
  | '/api/v1/video-clips/{id}/broll/suggest'
  | '/api/v1/video-clips/{id}/segments'
  | '/api/v1/video-clips/{id}/segments/{index}/alternate-hooks'
  | '/api/v1/video-clips/{id}/segments/{index}/duplicate'
  | '/api/v1/video-clips/{id}/segments/{index}/split'
  | '/api/v1/video-clips/export'
  | '/api/v1/video-clips/export-batch'
  | '/api/v1/video-clips/fetch-metadata'
  | '/api/v1/video-clips/presets'
  | '/api/v1/video-clips/upload'
  | '/api/v1/video-scripts/projects'
  | '/api/v1/video-scripts/projects/{id}/broll-autofill'
  | '/api/v1/video-scripts/projects/{id}/export/audio'
  | '/api/v1/video-scripts/projects/{id}/regenerate'
  | '/api/v1/video-scripts/projects/{id}/scenes'
  | '/api/v1/video-scripts/projects/{id}/thumbnail'
  | '/api/v1/video-scripts/projects/{id}/transcribe'
  | '/api/v1/video-scripts/scenes/{id}/duplicate'
  | '/api/v1/video-scripts/scenes/{id}/fetch-footage'
  | '/api/v1/video-scripts/scenes/{id}/improve-visual'
  | '/api/v1/video-scripts/scenes/{id}/regenerate-voiceover'
  | '/api/v1/video-scripts/scenes/{id}/suggest-keywords'
  | '/api/v1/video-scripts/scenes/{id}/tts-preview'
  | '/api/v1/view-boost/jobs'
  | '/api/v1/view-boost/jobs/{id}/pause'
  | '/api/v1/view-boost/jobs/{id}/start'
  | '/api/v1/wordpress/publish'
  | '/api/v1/wordpress/sites'
  | '/api/v1/wordpress/sites/{id}/test'
  | '/api/v1/wordpress/sync-scheduled'
  | '/api/v1/integrations/categories/{id}'
  | '/api/v1/integrations/sites/{id}'

export type ApiOperation =
  | 'DELETE /api/v1/articles/{id}'
  | 'DELETE /api/v1/brand-kit/{id}'
  | 'DELETE /api/v1/calendar/{id}'
  | 'DELETE /api/v1/category-mapping/{id}'
  | 'DELETE /api/v1/content-templates/{id}'
  | 'DELETE /api/v1/feeds/{id}'
  | 'DELETE /api/v1/instagram-studio/projects/{id}'
  | 'DELETE /api/v1/instagram-studio/slides/{id}'
  | 'DELETE /api/v1/integrations/categories/{id}'
  | 'DELETE /api/v1/integrations/sites/{id}'
  | 'DELETE /api/v1/social/instagram/disconnect'
  | 'DELETE /api/v1/users/admin/{id}'
  | 'DELETE /api/v1/users/me/api-keys/{id}'
  | 'DELETE /api/v1/video-clips/{id}'
  | 'DELETE /api/v1/video-clips/{id}/broll/{itemId}'
  | 'DELETE /api/v1/video-clips/{id}/segments/{index}'
  | 'DELETE /api/v1/video-clips/presets/{presetId}'
  | 'DELETE /api/v1/video-scripts/projects/{id}'
  | 'DELETE /api/v1/video-scripts/scenes/{id}'
  | 'DELETE /api/v1/view-boost/jobs/{id}'
  | 'DELETE /api/v1/wordpress/sites/{id}'
  | 'GET /api/v1'
  | 'GET /api/v1/admin/settings/models/config'
  | 'GET /api/v1/admin/settings/providers/{provider}/models'
  | 'GET /api/v1/admin/settings/providers/status'
  | 'GET /api/v1/ai/assets/{key}'
  | 'GET /api/v1/analytics/content-performance'
  | 'GET /api/v1/analytics/dashboard'
  | 'GET /api/v1/analytics/export'
  | 'GET /api/v1/analytics/platform-breakdown'
  | 'GET /api/v1/analytics/token-usage'
  | 'GET /api/v1/analytics/top-content'
  | 'GET /api/v1/articles'
  | 'GET /api/v1/articles/{id}'
  | 'GET /api/v1/articles/stats/summary'
  | 'GET /api/v1/auth/session'
  | 'GET /api/v1/billing/balance'
  | 'GET /api/v1/billing/subscriptions'
  | 'GET /api/v1/billing/transactions'
  | 'GET /api/v1/billing/usage-breakdown'
  | 'GET /api/v1/brand-kit'
  | 'GET /api/v1/brand-kit/{id}'
  | 'GET /api/v1/brand-kit/default'
  | 'GET /api/v1/calendar'
  | 'GET /api/v1/calendar/{id}'
  | 'GET /api/v1/calendar/month/{year}/{month}'
  | 'GET /api/v1/calendar/stats'
  | 'GET /api/v1/calendar/upcoming'
  | 'GET /api/v1/category-mapping'
  | 'GET /api/v1/content-templates'
  | 'GET /api/v1/feeds'
  | 'GET /api/v1/health'
  | 'GET /api/v1/instagram-studio/fetch-url'
  | 'GET /api/v1/instagram-studio/fonts'
  | 'GET /api/v1/instagram-studio/projects'
  | 'GET /api/v1/instagram-studio/projects/{id}'
  | 'GET /api/v1/instagram-studio/styles'
  | 'GET /api/v1/instagram-studio/templates'
  | 'GET /api/v1/instagram-studio/templates/{id}'
  | 'GET /api/v1/instagram-studio/templates/categories'
  | 'GET /api/v1/integrations/sites'
  | 'GET /api/v1/integrations/sites/{id}'
  | 'GET /api/v1/integrations/sites/{id}/categories'
  | 'GET /api/v1/motion-graphics/health'
  | 'GET /api/v1/motion-graphics/jobs'
  | 'GET /api/v1/motion-graphics/jobs/{id}'
  | 'GET /api/v1/motion-graphics/jobs/{id}/download'
  | 'GET /api/v1/motion-graphics/presets'
  | 'GET /api/v1/motion-graphics/templates'
  | 'GET /api/v1/motion-graphics/templates/{id}'
  | 'GET /api/v1/notifications'
  | 'GET /api/v1/social/accounts'
  | 'GET /api/v1/social/instagram/status'
  | 'GET /api/v1/trend-radar/analyze'
  | 'GET /api/v1/trend-radar/search'
  | 'GET /api/v1/users/admin/list'
  | 'GET /api/v1/users/me'
  | 'GET /api/v1/users/me/api-keys'
  | 'GET /api/v1/users/me/preferences'
  | 'GET /api/v1/video-clips'
  | 'GET /api/v1/video-clips/{id}'
  | 'GET /api/v1/video-clips/{id}/broll'
  | 'GET /api/v1/video-clips/{id}/download/{jobId}'
  | 'GET /api/v1/video-clips/{id}/stream'
  | 'GET /api/v1/video-clips/{id}/thumbnail'
  | 'GET /api/v1/video-clips/presets'
  | 'GET /api/v1/video-scripts/projects'
  | 'GET /api/v1/video-scripts/projects/{id}'
  | 'GET /api/v1/video-scripts/projects/{id}/export'
  | 'GET /api/v1/video-scripts/projects/{id}/export/zip'
  | 'GET /api/v1/view-boost/jobs'
  | 'GET /api/v1/wordpress/sites'
  | 'GET /api/v1/wordpress/sites/{id}/categories'
  | 'PATCH /api/v1/articles/{id}'
  | 'PATCH /api/v1/brand-kit/{id}'
  | 'PATCH /api/v1/calendar/{id}'
  | 'PATCH /api/v1/content-templates/{id}'
  | 'PATCH /api/v1/instagram-studio/projects/{id}'
  | 'PATCH /api/v1/instagram-studio/projects/{id}/apply-style-to-all'
  | 'PATCH /api/v1/instagram-studio/projects/{id}/slides/reorder'
  | 'PATCH /api/v1/instagram-studio/slides/{id}'
  | 'PATCH /api/v1/notifications/{id}/read'
  | 'PATCH /api/v1/notifications/read-all'
  | 'PATCH /api/v1/users/admin/{id}/role'
  | 'PATCH /api/v1/users/admin/{id}/tier'
  | 'PATCH /api/v1/users/admin/{id}/tokens'
  | 'PATCH /api/v1/users/me'
  | 'PATCH /api/v1/users/me/preferences'
  | 'PATCH /api/v1/video-clips/{id}/broll/{itemId}'
  | 'PATCH /api/v1/video-clips/{id}/segments/{index}'
  | 'PATCH /api/v1/video-clips/presets/{presetId}'
  | 'PATCH /api/v1/video-scripts/projects/{id}'
  | 'PATCH /api/v1/video-scripts/projects/{id}/generate-script'
  | 'PATCH /api/v1/video-scripts/projects/{id}/scenes/reorder'
  | 'PATCH /api/v1/video-scripts/scenes/{id}'
  | 'PATCH /api/v1/video-scripts/scenes/{id}/select-footage'
  | 'POST /api/v1/admin/settings/models/config'
  | 'POST /api/v1/admin/settings/providers/{provider}/test'
  | 'POST /api/v1/ai/chat'
  | 'POST /api/v1/ai/generate'
  | 'POST /api/v1/ai/generate-image'
  | 'POST /api/v1/ai/generate-seo'
  | 'POST /api/v1/ai/prompt-generator'
  | 'POST /api/v1/analytics/track/engagement'
  | 'POST /api/v1/analytics/track/view'
  | 'POST /api/v1/api/telegram-bot/webhook'
  | 'POST /api/v1/articles'
  | 'POST /api/v1/articles/{id}/restore/{versionIndex}'
  | 'POST /api/v1/articles/bulk/delete'
  | 'POST /api/v1/articles/bulk/status'
  | 'POST /api/v1/auth/forgot-password'
  | 'POST /api/v1/auth/login'
  | 'POST /api/v1/auth/logout'
  | 'POST /api/v1/auth/register'
  | 'POST /api/v1/auth/reset-password'
  | 'POST /api/v1/billing/checkout'
  | 'POST /api/v1/billing/webhooks/stripe'
  | 'POST /api/v1/brand-kit'
  | 'POST /api/v1/brand-kit/{id}/apply/{projectId}'
  | 'POST /api/v1/brand-kit/{id}/set-default'
  | 'POST /api/v1/calendar'
  | 'POST /api/v1/calendar/{id}/publish'
  | 'POST /api/v1/category-mapping'
  | 'POST /api/v1/content-templates'
  | 'POST /api/v1/content-templates/{id}/use'
  | 'POST /api/v1/feeds'
  | 'POST /api/v1/feeds/{id}'
  | 'POST /api/v1/feeds/{id}/poll'
  | 'POST /api/v1/instagram-studio/batch-export'
  | 'POST /api/v1/instagram-studio/projects'
  | 'POST /api/v1/instagram-studio/projects/{id}/export'
  | 'POST /api/v1/instagram-studio/projects/{id}/export/zip'
  | 'POST /api/v1/instagram-studio/projects/{id}/generate-all'
  | 'POST /api/v1/instagram-studio/projects/{id}/generate-storyboard'
  | 'POST /api/v1/instagram-studio/projects/{id}/hashtags'
  | 'POST /api/v1/instagram-studio/projects/{id}/slides'
  | 'POST /api/v1/instagram-studio/slides/{id}/generate-image'
  | 'POST /api/v1/instagram-studio/slides/{id}/generate-text'
  | 'POST /api/v1/instagram-studio/templates/{id}/generate-prompt'
  | 'POST /api/v1/integrations/sites'
  | 'POST /api/v1/integrations/sites/{id}/categories/refresh'
  | 'POST /api/v1/integrations/sites/{id}/test'
  | 'POST /api/v1/motion-graphics/ai-generate'
  | 'POST /api/v1/motion-graphics/batch-render'
  | 'POST /api/v1/motion-graphics/compose-video'
  | 'POST /api/v1/motion-graphics/presets'
  | 'POST /api/v1/motion-graphics/presets/{id}/delete'
  | 'POST /api/v1/motion-graphics/preview'
  | 'POST /api/v1/motion-graphics/render'
  | 'POST /api/v1/motion-graphics/render-caption'
  | 'POST /api/v1/scraper/scrape'
  | 'POST /api/v1/social/instagram/connect'
  | 'POST /api/v1/social/instagram/post'
  | 'POST /api/v1/users/admin/users'
  | 'POST /api/v1/users/me/api-keys'
  | 'POST /api/v1/video-clips'
  | 'POST /api/v1/video-clips/{id}/analyze'
  | 'POST /api/v1/video-clips/{id}/broll'
  | 'POST /api/v1/video-clips/{id}/broll/auto-cutaway'
  | 'POST /api/v1/video-clips/{id}/broll/search'
  | 'POST /api/v1/video-clips/{id}/broll/suggest'
  | 'POST /api/v1/video-clips/{id}/segments'
  | 'POST /api/v1/video-clips/{id}/segments/{index}/alternate-hooks'
  | 'POST /api/v1/video-clips/{id}/segments/{index}/duplicate'
  | 'POST /api/v1/video-clips/{id}/segments/{index}/split'
  | 'POST /api/v1/video-clips/export'
  | 'POST /api/v1/video-clips/export-batch'
  | 'POST /api/v1/video-clips/fetch-metadata'
  | 'POST /api/v1/video-clips/presets'
  | 'POST /api/v1/video-clips/upload'
  | 'POST /api/v1/video-scripts/projects'
  | 'POST /api/v1/video-scripts/projects/{id}/broll-autofill'
  | 'POST /api/v1/video-scripts/projects/{id}/export/audio'
  | 'POST /api/v1/video-scripts/projects/{id}/regenerate'
  | 'POST /api/v1/video-scripts/projects/{id}/scenes'
  | 'POST /api/v1/video-scripts/projects/{id}/thumbnail'
  | 'POST /api/v1/video-scripts/projects/{id}/transcribe'
  | 'POST /api/v1/video-scripts/scenes/{id}/duplicate'
  | 'POST /api/v1/video-scripts/scenes/{id}/fetch-footage'
  | 'POST /api/v1/video-scripts/scenes/{id}/improve-visual'
  | 'POST /api/v1/video-scripts/scenes/{id}/regenerate-voiceover'
  | 'POST /api/v1/video-scripts/scenes/{id}/suggest-keywords'
  | 'POST /api/v1/video-scripts/scenes/{id}/tts-preview'
  | 'POST /api/v1/view-boost/jobs'
  | 'POST /api/v1/view-boost/jobs/{id}/pause'
  | 'POST /api/v1/view-boost/jobs/{id}/start'
  | 'POST /api/v1/wordpress/publish'
  | 'POST /api/v1/wordpress/sites'
  | 'POST /api/v1/wordpress/sites/{id}/test'
  | 'POST /api/v1/wordpress/sync-scheduled'
  | 'PUT /api/v1/integrations/categories/{id}'
  | 'PUT /api/v1/integrations/sites/{id}'

export const apiOperations = {
  'ApiOperation': { method: 'DELETE', path: '/api/v1/articles/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/brand-kit/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/calendar/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/category-mapping/{id}' },
  'remove': { method: 'DELETE', path: '/api/v1/content-templates/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/feeds/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/instagram-studio/projects/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/instagram-studio/slides/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/integrations/categories/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/integrations/sites/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/social/instagram/disconnect' },
  'UseGuards': { method: 'DELETE', path: '/api/v1/users/admin/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/users/me/api-keys/{id}' },
  'deleteProject': { method: 'DELETE', path: '/api/v1/video-clips/{id}' },
  'deleteBroll': { method: 'DELETE', path: '/api/v1/video-clips/{id}/broll/{itemId}' },
  'deleteSegment': { method: 'DELETE', path: '/api/v1/video-clips/{id}/segments/{index}' },
  'deletePreset': { method: 'DELETE', path: '/api/v1/video-clips/presets/{presetId}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/video-scripts/projects/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/video-scripts/scenes/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/view-boost/jobs/{id}' },
  'ApiOperation': { method: 'DELETE', path: '/api/v1/wordpress/sites/{id}' },
  'getHello': { method: 'GET', path: '/api/v1' },
  'getModelConfig': { method: 'GET', path: '/api/v1/admin/settings/models/config' },
  'listModels': { method: 'GET', path: '/api/v1/admin/settings/providers/{provider}/models' },
  'getProvidersStatus': { method: 'GET', path: '/api/v1/admin/settings/providers/status' },
  'Throttle': { method: 'GET', path: '/api/v1/ai/assets/{key}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/content-performance' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/dashboard' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/export' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/platform-breakdown' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/token-usage' },
  'ApiOperation': { method: 'GET', path: '/api/v1/analytics/top-content' },
  'ApiOperation': { method: 'GET', path: '/api/v1/articles' },
  'ApiOperation': { method: 'GET', path: '/api/v1/articles/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/articles/stats/summary' },
  'ApiOperation': { method: 'GET', path: '/api/v1/auth/session' },
  'ApiOperation': { method: 'GET', path: '/api/v1/billing/balance' },
  'ApiOperation': { method: 'GET', path: '/api/v1/billing/subscriptions' },
  'ApiOperation': { method: 'GET', path: '/api/v1/billing/transactions' },
  'ApiOperation': { method: 'GET', path: '/api/v1/billing/usage-breakdown' },
  'ApiOperation': { method: 'GET', path: '/api/v1/brand-kit' },
  'ApiOperation': { method: 'GET', path: '/api/v1/brand-kit/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/brand-kit/default' },
  'ApiOperation': { method: 'GET', path: '/api/v1/calendar' },
  'ApiOperation': { method: 'GET', path: '/api/v1/calendar/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/calendar/month/{year}/{month}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/calendar/stats' },
  'ApiOperation': { method: 'GET', path: '/api/v1/calendar/upcoming' },
  'ApiOperation': { method: 'GET', path: '/api/v1/category-mapping' },
  'list': { method: 'GET', path: '/api/v1/content-templates' },
  'ApiOperation': { method: 'GET', path: '/api/v1/feeds' },
  'check': { method: 'GET', path: '/api/v1/health' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/fetch-url' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/fonts' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/projects' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/projects/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/styles' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/templates' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/templates/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/instagram-studio/templates/categories' },
  'ApiOperation': { method: 'GET', path: '/api/v1/integrations/sites' },
  'ApiOperation': { method: 'GET', path: '/api/v1/integrations/sites/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/integrations/sites/{id}/categories' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/health' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/jobs' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/jobs/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/jobs/{id}/download' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/presets' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/templates' },
  'ApiOperation': { method: 'GET', path: '/api/v1/motion-graphics/templates/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/notifications' },
  'ApiOperation': { method: 'GET', path: '/api/v1/social/accounts' },
  'ApiOperation': { method: 'GET', path: '/api/v1/social/instagram/status' },
  'analyze': { method: 'GET', path: '/api/v1/trend-radar/analyze' },
  'search': { method: 'GET', path: '/api/v1/trend-radar/search' },
  'UseGuards': { method: 'GET', path: '/api/v1/users/admin/list' },
  'ApiOperation': { method: 'GET', path: '/api/v1/users/me' },
  'ApiOperation': { method: 'GET', path: '/api/v1/users/me/api-keys' },
  'ApiOperation': { method: 'GET', path: '/api/v1/users/me/preferences' },
  'getProjects': { method: 'GET', path: '/api/v1/video-clips' },
  'getProject': { method: 'GET', path: '/api/v1/video-clips/{id}' },
  'getBroll': { method: 'GET', path: '/api/v1/video-clips/{id}/broll' },
  'downloadClip': { method: 'GET', path: '/api/v1/video-clips/{id}/download/{jobId}' },
  'streamVideo': { method: 'GET', path: '/api/v1/video-clips/{id}/stream' },
  'getThumbnail': { method: 'GET', path: '/api/v1/video-clips/{id}/thumbnail' },
  'listPresets': { method: 'GET', path: '/api/v1/video-clips/presets' },
  'ApiOperation': { method: 'GET', path: '/api/v1/video-scripts/projects' },
  'ApiOperation': { method: 'GET', path: '/api/v1/video-scripts/projects/{id}' },
  'ApiOperation': { method: 'GET', path: '/api/v1/video-scripts/projects/{id}/export' },
  'ApiOperation': { method: 'GET', path: '/api/v1/video-scripts/projects/{id}/export/zip' },
  'ApiOperation': { method: 'GET', path: '/api/v1/view-boost/jobs' },
  'ApiOperation': { method: 'GET', path: '/api/v1/wordpress/sites' },
  'ApiOperation': { method: 'GET', path: '/api/v1/wordpress/sites/{id}/categories' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/articles/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/brand-kit/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/calendar/{id}' },
  'update': { method: 'PATCH', path: '/api/v1/content-templates/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/instagram-studio/projects/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/instagram-studio/projects/{id}/apply-style-to-all' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/instagram-studio/projects/{id}/slides/reorder' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/instagram-studio/slides/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/notifications/{id}/read' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/notifications/read-all' },
  'UseGuards': { method: 'PATCH', path: '/api/v1/users/admin/{id}/role' },
  'UseGuards': { method: 'PATCH', path: '/api/v1/users/admin/{id}/tier' },
  'UseGuards': { method: 'PATCH', path: '/api/v1/users/admin/{id}/tokens' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/users/me' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/users/me/preferences' },
  'updateBroll': { method: 'PATCH', path: '/api/v1/video-clips/{id}/broll/{itemId}' },
  'updateSegment': { method: 'PATCH', path: '/api/v1/video-clips/{id}/segments/{index}' },
  'updatePreset': { method: 'PATCH', path: '/api/v1/video-clips/presets/{presetId}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/video-scripts/projects/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/video-scripts/projects/{id}/generate-script' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/video-scripts/projects/{id}/scenes/reorder' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/video-scripts/scenes/{id}' },
  'ApiOperation': { method: 'PATCH', path: '/api/v1/video-scripts/scenes/{id}/select-footage' },
  'saveModelConfig': { method: 'POST', path: '/api/v1/admin/settings/models/config' },
  'testProvider': { method: 'POST', path: '/api/v1/admin/settings/providers/{provider}/test' },
  'Throttle': { method: 'POST', path: '/api/v1/ai/chat' },
  'Throttle': { method: 'POST', path: '/api/v1/ai/generate' },
  'Throttle': { method: 'POST', path: '/api/v1/ai/generate-image' },
  'Throttle': { method: 'POST', path: '/api/v1/ai/generate-seo' },
  'Throttle': { method: 'POST', path: '/api/v1/ai/prompt-generator' },
  'ApiOperation': { method: 'POST', path: '/api/v1/analytics/track/engagement' },
  'ApiOperation': { method: 'POST', path: '/api/v1/analytics/track/view' },
  'ApiOperation': { method: 'POST', path: '/api/v1/api/telegram-bot/webhook' },
  'ApiOperation': { method: 'POST', path: '/api/v1/articles' },
  'ApiOperation': { method: 'POST', path: '/api/v1/articles/{id}/restore/{versionIndex}' },
  'ApiOperation': { method: 'POST', path: '/api/v1/articles/bulk/delete' },
  'ApiOperation': { method: 'POST', path: '/api/v1/articles/bulk/status' },
  'Throttle': { method: 'POST', path: '/api/v1/auth/forgot-password' },
  'Throttle': { method: 'POST', path: '/api/v1/auth/login' },
  'HttpCode': { method: 'POST', path: '/api/v1/auth/logout' },
  'Throttle': { method: 'POST', path: '/api/v1/auth/register' },
  'Throttle': { method: 'POST', path: '/api/v1/auth/reset-password' },
  'ApiOperation': { method: 'POST', path: '/api/v1/billing/checkout' },
  'SkipThrottle': { method: 'POST', path: '/api/v1/billing/webhooks/stripe' },
  'ApiOperation': { method: 'POST', path: '/api/v1/brand-kit' },
  'ApiOperation': { method: 'POST', path: '/api/v1/brand-kit/{id}/apply/{projectId}' },
  'ApiOperation': { method: 'POST', path: '/api/v1/brand-kit/{id}/set-default' },
  'ApiOperation': { method: 'POST', path: '/api/v1/calendar' },
  'ApiOperation': { method: 'POST', path: '/api/v1/calendar/{id}/publish' },
  'ApiOperation': { method: 'POST', path: '/api/v1/category-mapping' },
  'create': { method: 'POST', path: '/api/v1/content-templates' },
  'incrementUsage': { method: 'POST', path: '/api/v1/content-templates/{id}/use' },
  'ApiOperation': { method: 'POST', path: '/api/v1/feeds' },
  'ApiOperation': { method: 'POST', path: '/api/v1/feeds/{id}' },
  'ApiOperation': { method: 'POST', path: '/api/v1/feeds/{id}/poll' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/batch-export' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/export' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/export/zip' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/generate-all' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/generate-storyboard' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/hashtags' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/projects/{id}/slides' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/slides/{id}/generate-image' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/slides/{id}/generate-text' },
  'ApiOperation': { method: 'POST', path: '/api/v1/instagram-studio/templates/{id}/generate-prompt' },
  'ApiOperation': { method: 'POST', path: '/api/v1/integrations/sites' },
  'ApiOperation': { method: 'POST', path: '/api/v1/integrations/sites/{id}/categories/refresh' },
  'ApiOperation': { method: 'POST', path: '/api/v1/integrations/sites/{id}/test' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/ai-generate' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/batch-render' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/compose-video' },
  'ApiOperation': { method: 'POST', path: '/api/v1/motion-graphics/presets' },
  'ApiOperation': { method: 'POST', path: '/api/v1/motion-graphics/presets/{id}/delete' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/preview' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/render' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/motion-graphics/render-caption' },
  'ApiOperation': { method: 'POST', path: '/api/v1/scraper/scrape' },
  'ApiOperation': { method: 'POST', path: '/api/v1/social/instagram/connect' },
  'ApiOperation': { method: 'POST', path: '/api/v1/social/instagram/post' },
  'UseGuards': { method: 'POST', path: '/api/v1/users/admin/users' },
  'ApiOperation': { method: 'POST', path: '/api/v1/users/me/api-keys' },
  'createProject': { method: 'POST', path: '/api/v1/video-clips' },
  'analyzeVideo': { method: 'POST', path: '/api/v1/video-clips/{id}/analyze' },
  'addBroll': { method: 'POST', path: '/api/v1/video-clips/{id}/broll' },
  'brollAutoCutaway': { method: 'POST', path: '/api/v1/video-clips/{id}/broll/auto-cutaway' },
  'brollSearch': { method: 'POST', path: '/api/v1/video-clips/{id}/broll/search' },
  'brollSuggest': { method: 'POST', path: '/api/v1/video-clips/{id}/broll/suggest' },
  'addSegment': { method: 'POST', path: '/api/v1/video-clips/{id}/segments' },
  'alternateHooks': { method: 'POST', path: '/api/v1/video-clips/{id}/segments/{index}/alternate-hooks' },
  'duplicateSegment': { method: 'POST', path: '/api/v1/video-clips/{id}/segments/{index}/duplicate' },
  'splitSegment': { method: 'POST', path: '/api/v1/video-clips/{id}/segments/{index}/split' },
  'exportClip': { method: 'POST', path: '/api/v1/video-clips/export' },
  'exportBatch': { method: 'POST', path: '/api/v1/video-clips/export-batch' },
  'fetchMetadata': { method: 'POST', path: '/api/v1/video-clips/fetch-metadata' },
  'createPreset': { method: 'POST', path: '/api/v1/video-clips/presets' },
  'UseInterceptors': { method: 'POST', path: '/api/v1/video-clips/upload' },
  'ApiOperation': { method: 'POST', path: '/api/v1/video-scripts/projects' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/broll-autofill' },
  'ApiOperation': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/export/audio' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/regenerate' },
  'ApiOperation': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/scenes' },
  'ApiOperation': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/thumbnail' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/projects/{id}/transcribe' },
  'ApiOperation': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/duplicate' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/fetch-footage' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/improve-visual' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/regenerate-voiceover' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/suggest-keywords' },
  'SetUserRateLimit': { method: 'POST', path: '/api/v1/video-scripts/scenes/{id}/tts-preview' },
  'ApiOperation': { method: 'POST', path: '/api/v1/view-boost/jobs' },
  'ApiOperation': { method: 'POST', path: '/api/v1/view-boost/jobs/{id}/pause' },
  'ApiOperation': { method: 'POST', path: '/api/v1/view-boost/jobs/{id}/start' },
  'ApiOperation': { method: 'POST', path: '/api/v1/wordpress/publish' },
  'ApiOperation': { method: 'POST', path: '/api/v1/wordpress/sites' },
  'ApiOperation': { method: 'POST', path: '/api/v1/wordpress/sites/{id}/test' },
  'ApiOperation': { method: 'POST', path: '/api/v1/wordpress/sync-scheduled' },
  'ApiOperation': { method: 'PUT', path: '/api/v1/integrations/categories/{id}' },
  'ApiOperation': { method: 'PUT', path: '/api/v1/integrations/sites/{id}' },
} as const

export type ApiOperationId = keyof typeof apiOperations
