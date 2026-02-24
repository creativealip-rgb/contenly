/**
 * One-time migration helper to sync localStorage feeds to backend database
 */

const MIGRATION_KEY = 'contently_feeds_migrated'
const LEGACY_STORAGE_KEY = 'contently_rss_feeds'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const migrateLocalStorageFeeds = async (): Promise<void> => {
    // Check if migration already completed
    if (typeof window === 'undefined') return

    const migrated = localStorage.getItem(MIGRATION_KEY)
    if (migrated === 'true') {
        console.log('[Feed Migration] Already migrated, skipping')
        return
    }

    console.log('[Feed Migration] Starting migration...')

    try {
        // Get feeds from localStorage
        const feedsJson = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (!feedsJson) {
            console.log('[Feed Migration] No localStorage feeds found')
            localStorage.setItem(MIGRATION_KEY, 'true')
            return
        }

        const localFeeds = JSON.parse(feedsJson)
        if (!Array.isArray(localFeeds) || localFeeds.length === 0) {
            console.log('[Feed Migration] No feeds to migrate')
            localStorage.setItem(MIGRATION_KEY, 'true')
            return
        }

        console.log(`[Feed Migration] Found ${localFeeds.length} feeds to migrate`)

        // Migrate each feed to backend
        let successCount = 0
        let errorCount = 0

        for (const feed of localFeeds) {
            try {
                const response = await fetch(`${API_BASE}/feeds`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: feed.name,
                        url: feed.url,
                        pollingIntervalMinutes: feed.pollingInterval || 15,
                    }),
                })

                if (response.ok) {
                    successCount++
                    console.log(`[Feed Migration] ✓ Migrated: ${feed.name}`)
                } else {
                    errorCount++
                    console.error(`[Feed Migration] ✗ Failed to migrate: ${feed.name}`, await response.text())
                }
            } catch (error) {
                errorCount++
                console.error(`[Feed Migration] ✗ Error migrating: ${feed.name}`, error)
            }
        }

        console.log(`[Feed Migration] Complete: ${successCount} succeeded, ${errorCount} failed`)

        // Mark migration as complete
        localStorage.setItem(MIGRATION_KEY, 'true')

        // Optionally, remove old localStorage data
        // localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch (error) {
        console.error('[Feed Migration] Migration failed:', error)
        // Don't set migration flag on error, so it can retry next time
    }
}
