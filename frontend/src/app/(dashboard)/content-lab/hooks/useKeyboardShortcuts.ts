'use client'

import { useEffect } from 'react'

interface ShortcutHandlers {
  onRegenerate?: () => void
  onSave?: () => void
  onPublish?: () => void
  onCopy?: () => void
}

/**
 * Keyboard shortcuts for Content Lab:
 * - Ctrl/Cmd + Enter → Regenerate
 * - Ctrl/Cmd + S → Save (prevent default browser save)
 * - Ctrl/Cmd + Shift + P → Publish
 * - Ctrl/Cmd + Shift + C → Copy content
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handlers.onRegenerate?.()
      } else if (e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        handlers.onSave?.()
      } else if (e.key === 'p' && e.shiftKey) {
        e.preventDefault()
        handlers.onPublish?.()
      } else if (e.key === 'c' && e.shiftKey) {
        e.preventDefault()
        handlers.onCopy?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlers])
}
