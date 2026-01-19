import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            )
        }

        let feedUrl = url
        let items: any[] = []
        let lastError = null

        // List of variations to try if the direct URL fails or returns HTML
        const variations = [
            url, // Try exact URL first
            url.endsWith('/') ? `${url}feed/` : `${url}/feed/`,
            url.endsWith('/') ? `${url}rss/` : `${url}/rss/`,
            url.endsWith('/') ? `${url}atom.xml` : `${url}/atom.xml`,
        ]

        // 1. Try to fetch from proper URL
        for (const targetUrl of variations) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

                const response = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                    },
                    signal: controller.signal,
                    next: { revalidate: 300 }
                })
                clearTimeout(timeoutId)

                if (!response.ok) continue

                const text = await response.text()

                // Keep track of errors if we fail
                // Check if it starts with < (ignoring whitespace)
                if (!text.trim().startsWith('<')) {
                    lastError = 'Response was not XML (starts with non-tag characters)'
                    continue
                }

                // Check for RSS/Atom signatures
                if (text.includes('<rss') || text.includes('<feed') || text.includes('<rdf:RDF')) {
                    items = parseXML(text)
                    if (items.length > 0) {
                        feedUrl = targetUrl // Found the working URL
                        break
                    }
                }

            } catch (err: any) {
                console.error(`Attempt failed for ${targetUrl}:`, err.message)
                lastError = err.message
                // Continue to next variation
            }
        }

        if (items.length === 0) {
            return NextResponse.json({
                success: false,
                error: lastError || 'Could not find a valid RSS feed at this URL. Try adding /feed to the end.',
                items: []
            })
        }

        return NextResponse.json({
            success: true,
            items: items.slice(0, 20) // Limit to 20 items
        })

    } catch (error: any) {
        console.error('RSS Fetch Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to parse RSS feed' },
            { status: 500 }
        )
    }
}

import * as cheerio from 'cheerio'

function parseXML(xmlText: string) {
    const $ = cheerio.load(xmlText, { xmlMode: true })
    const items: any[] = []

    // Try finding items (RSS) or entries (Atom)
    const elements = $('item, entry')

    elements.each((_, element) => {
        const el = $(element)

        // Extract Title
        const title = el.find('title').text()

        // Extract Link - specific handling for Atom's <link href="..." /> vs RSS <link>...</link>
        let link = el.find('link').text()
        if (!link) {
            link = el.find('link[rel="alternate"]').attr('href') || el.find('link').attr('href') || ''
        }

        // Extract Description/Content
        // Prioritize content:encoded, then content, then description, then summary
        const description = el.find('content\\:encoded').text() ||
            el.find('content').text() ||
            el.find('description').text() ||
            el.find('summary').text() ||
            ''

        // Extract Date
        const pubDate = el.find('pubDate').text() ||
            el.find('isoDate').text() ||
            el.find('date').text() ||
            el.find('updated').text() ||
            el.find('published').text() ||
            new Date().toISOString()

        if (title && link) {
            items.push({
                title: cleanText(title),
                url: cleanText(link),
                excerpt: cleanText(description).substring(0, 200) + '...',
                publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                id: cleanText(link) || Math.random().toString(36).substring(7)
            })
        }
    })

    return items
}

function cleanText(text: string): string {
    if (!text) return ''
    return text
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Remove CDATA wrappers
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
}
