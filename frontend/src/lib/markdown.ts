import { marked } from 'marked'

/**
 * Convert Markdown content to HTML
 * This is used to convert AI-generated markdown content to HTML for WordPress
 */
export function markdownToHtml(markdown: string): string {
    if (!markdown) return ''

    // Convert markdown to HTML with basic options
    const html = marked(markdown, {
        gfm: true,
        breaks: true,
    })

    return html as string
}

/**
 * Strip HTML tags from content
 * Useful for creating plain text excerpts
 */
export function stripHtml(html: string): string {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
}
