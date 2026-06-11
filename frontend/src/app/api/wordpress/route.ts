import { NextRequest, NextResponse } from 'next/server'

type WordPressUser = { id: number; name: string }
type WordPressPost = {
    id: number
    title: { rendered: string }
    status: string
    link: string
    date: string
}
type WordPressPostData = {
    title: string
    content: string
    status: string
    categories?: number[]
    date?: string
}

// WordPress API helper
async function wpFetch(endpoint: string, options: {
    method?: string
    body?: object
    wpUrl: string
    username: string
    appPassword: string
}) {
    const { method = 'GET', body, wpUrl, username, appPassword } = options

    // Remove spaces from application password (WordPress format: "xxxx xxxx xxxx xxxx")
    const cleanPassword = appPassword.replace(/\s/g, '')

    const auth = Buffer.from(`${username}:${cleanPassword}`).toString('base64')

    const response = await fetch(`${wpUrl}/wp-json/wp/v2${endpoint}`, {
        method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`WordPress API Error: ${response.status} - ${error}`)
    }

    return response.json()
}

// Test connection
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const wpUrl = searchParams.get('wpUrl')
    const username = searchParams.get('username')
    const appPassword = searchParams.get('appPassword')

    if (!wpUrl || !username || !appPassword) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    try {
        const user = await wpFetch('/users/me', { wpUrl, username, appPassword }) as WordPressUser
        return NextResponse.json({
            success: true,
            user: { id: user.id, name: user.name }
        })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'WordPress connection failed' }, { status: 500 })
    }
}

// Create post
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { wpUrl, username, appPassword, title, content, status, date, categories } = body

        if (!wpUrl || !username || !appPassword) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
        }

        const postData: WordPressPostData = {
            title,
            content,
            status: status || 'draft', // draft, publish, private, future
            categories,
        }

        // For scheduled posts, add date
        if (status === 'future' && date) {
            postData.date = date
            postData.status = 'future'
        }

        const post = await wpFetch('/posts', {
            method: 'POST',
            body: postData,
            wpUrl,
            username,
            appPassword,
        }) as WordPressPost

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                title: post.title.rendered,
                status: post.status,
                link: post.link,
                date: post.date,
            }
        })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create WordPress post' }, { status: 500 })
    }
}
