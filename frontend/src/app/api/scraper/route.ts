import { NextResponse } from 'next/server'

function normalizeScrapeUrl(rawUrl: string) {
    try {
        const parsed = new URL(rawUrl)
        if (parsed.hostname === 'www.selular.id') {
            parsed.hostname = 'selular.id'
        }
        return parsed.toString()
    } catch {
        return rawUrl
    }
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            )
        }

        const normalizedUrl = normalizeScrapeUrl(url)

        // Call the backend NestJS advanced scraper service
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

        // Build headers object with proper typing
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        // Forward cookies from the incoming request to backend
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader
        }

        // Add authorization header if present (fallback)
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
            headers['Authorization'] = authHeader
        }

        const response = await fetch(`${backendUrl}/scraper/scrape`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ url: normalizedUrl }),
        })

        console.log('Backend scraper response:', {
            status: response.status,
            ok: response.ok,
            url: `${backendUrl}/scraper/scrape`
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            console.error('Backend scraper failed:', error)
            throw new Error(error.message || `Backend returned ${response.status}`)
        }

        const responseData = await response.json()
        // Backend returns { success: true, data: { title, content, ... } }
        const data = responseData.data || responseData

        console.log('Backend scraper data:', {
            hasContent: !!data.content,
            contentLength: data.content?.length || 0,
            tier: data.extractionTier
        })

        // Transform backend response to match frontend expectations
        return NextResponse.json({
            success: true,
            data: {
                title: data.title || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                url: normalizedUrl,
                siteName: '',
                image: data.images?.[0] || '',
                publishedAt: data.metadata?.publishedDate || new Date().toISOString(),
                source: 'advanced-scraper',
                extractionTier: data.extractionTier
            }
        })

    } catch (error: unknown) {
        console.error('Scraper API Route Error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to scrape URL' },
            { status: 500 }
        )
    }
}