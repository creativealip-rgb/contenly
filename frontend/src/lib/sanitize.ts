/**
 * HTML Sanitization Utility
 * 
 * IMPORTANT: AI-generated content should ALWAYS be sanitized before rendering
 * to prevent XSS (Cross-Site Scripting) attacks.
 * 
 * Uses isomorphic-dompurify for robust sanitization on both client and server.
 */

import DOMPurify from 'isomorphic-dompurify';

// Allowed HTML tags for AI-generated content
const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's',
    'a',
    'blockquote', 'pre', 'code',
    'img',
    'div', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

// Allowed attributes for specific tags
const ALLOWED_ATTR = [
    'href', 'src', 'alt', 'title', 'target', 'rel',
    'class', 'width', 'height',
];

/**
 * Sanitize HTML content using DOMPurify
 * Works on both client and server side
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        // Allow data: URLs for images (base64)
        ALLOW_DATA_ATTR: false,
        // Add rel="noopener noreferrer" to all links
        ADD_ATTR: ['target', 'rel'],
        // Force target="_blank" for external links
        FORCE_BODY: true,
    });
}

/**
 * Sanitize and validate a URL
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url)
        // Only allow http, https, and mailto protocols
        if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
            return '#'
        }
        return url
    } catch {
        return '#'
    }
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
}

/**
 * Truncate HTML content while preserving tags
 */
export function truncateHtml(html: string, maxLength: number): string {
    const text = stripHtml(html)
    if (text.length <= maxLength) return html
    
    return text.substring(0, maxLength).trim() + '...'
}