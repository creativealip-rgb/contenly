'use client'

import { useEffect, useRef } from 'react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { useUpdateArticle } from '@/hooks/use-articles'

/**
 * Debounced auto-save: when content/title/meta change AND we have an articleId,
 * persist updates to /articles/:id.
 */
export function useAutoSaveDraft(debounceMs = 1500) {
  const articleId = useContentLabStore((s) => s.generatedArticleId)
  const generatedContent = useContentLabStore((s) => s.generatedContent)
  const generatedTitle = useContentLabStore((s) => s.generatedTitle)
  const metaTitle = useContentLabStore((s) => s.metaTitle)
  const metaDescription = useContentLabStore((s) => s.metaDescription)
  const slug = useContentLabStore((s) => s.slug)
  const featuredImage = useContentLabStore((s) => s.featuredImage)

  const updateMutation = useUpdateArticle()
  const lastSavedRef = useRef<string>('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    if (!articleId) return
    // Skip first effect run after articleId set (the data was just inserted)
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      lastSavedRef.current = JSON.stringify({ generatedContent, generatedTitle, metaTitle, metaDescription, slug, featuredImage })
      return
    }

    const snapshot = JSON.stringify({ generatedContent, generatedTitle, metaTitle, metaDescription, slug, featuredImage })
    if (snapshot === lastSavedRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const data: Record<string, unknown> = {
        generatedContent,
        title: generatedTitle,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        slug: slug || undefined,
      }
      if (featuredImage) data.featuredImageUrl = featuredImage
      updateMutation.mutate(
        { id: articleId, data: data as never },
        {
          onSuccess: () => {
            lastSavedRef.current = snapshot
          },
        },
      )
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, generatedContent, generatedTitle, metaTitle, metaDescription, slug, featuredImage, debounceMs])

  // Reset first-run flag when articleId changes
  useEffect(() => {
    isFirstRunRef.current = true
  }, [articleId])

  return { isSaving: updateMutation.isPending }
}
