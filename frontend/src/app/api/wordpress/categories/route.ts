import { NextRequest, NextResponse } from 'next/server'

// Fetch WordPress categories
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const wpUrl = searchParams.get('wpUrl')
    const username = searchParams.get('username')
    const appPassword = searchParams.get('appPassword')

    if (!wpUrl || !username || !appPassword) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    try {
        // Remove spaces from application password
        const cleanPassword = appPassword.replace(/\s/g, '')
        const auth = Buffer.from(`${username}:${cleanPassword}`).toString('base64')

        const response = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`)
        }

        const categories = await response.json()

        return NextResponse.json({
            success: true,
            categories: categories.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                count: cat.count
            }))
        })
    } catch (error: any) {
        console.error('WordPress categories error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
