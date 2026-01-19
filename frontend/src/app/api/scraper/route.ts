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

        // Call the backend NestJS advanced scraper service
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

        const response = await fetch(`${backendUrl}/api/scraper/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward authorization if present
                ...((request.headers.get('authorization')) && {
                    'Authorization': request.headers.get('authorization')
                })
            },
            body: JSON.stringify({ url }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message || `Backend returned ${response.status}`)
        }

        const data = await response.json()

        // Transform backend response to match frontend expectations
        return NextResponse.json({
            success: true,
            data: {
                title: data.title || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                url: url,
                siteName: '',
                image: data.images?.[0] || '',
                publishedAt: data.metadata?.publishedDate || new Date().toISOString(),
                source: 'advanced-scraper',
                extractionTier: data.extractionTier
            }
        })

    } catch (error: any) {
        console.error('Scraper API Route Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to scrape URL' },
            { status: 500 }
        )
    }
}
