import { NextResponse } from 'next/server'
import { getOpenRouterClient } from '@/lib/openrouter'
import { markdownToHtml } from '@/lib/markdown'
import type { AIRewriteRequest, AIRewriteResponse } from '@/types/ai'

export async function POST(request: Request) {
    try {
        const body: AIRewriteRequest = await request.json()

        if (!body.content) {
            return NextResponse.json<AIRewriteResponse>(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        const client = getOpenRouterClient()

        // Build the system prompt based on user preferences
        const systemPrompt = buildSystemPrompt(body)

        // Build the user prompt
        const userPrompt = buildUserPrompt(body)

        // Generate the rewritten content
        const aiResponse = await client.generateCompletion(
            userPrompt,
            systemPrompt,
            {
                temperature: 0.85, // Higher for more creative rewriting
                maxTokens: 3000,
            }
        )

        // Parse the AI response (expecting JSON format)
        const parsedResponse = parseAIResponse(aiResponse)

        return NextResponse.json<AIRewriteResponse>({
            success: true,
            data: parsedResponse,
        })

    } catch (error: any) {
        console.error('AI Rewrite Error:', error)
        return NextResponse.json<AIRewriteResponse>(
            { success: false, error: error.message || 'Failed to rewrite content' },
            { status: 500 }
        )
    }
}

function buildSystemPrompt(request: AIRewriteRequest): string {
    const tone = request.tone || 'professional'
    const style = request.style || 'blog'

    return `You are an expert content writer and SEO specialist. Your PRIMARY TASK is to COMPLETELY REWRITE articles with 100% ORIGINAL wording while preserving the core message.

CRITICAL RULES (MUST FOLLOW):
1. **ZERO PLAGIARISM**: DO NOT copy ANY sentences or phrases from the original. Every sentence MUST be written in your own words.
2. **Maintain Core Information**: Keep all important facts, statistics, dates, and key points, but express them differently.
3. **Tone**: ${getToneDescription(tone)}
4. **Style**: ${getStyleDescription(style)}
5. **Language**: MUST write in BAHASA INDONESIA (Indonesian language). All content, title, excerpt, and meta description must be in Indonesian.
6. **SEO Optimization**: Naturally include relevant keywords throughout the content.
7. **Structure & Formatting**: 
   - Use clear H2 and H3 headings (in markdown: ## and ###)
   - DO NOT repeat the article title as a heading in the content - start directly with the first section
   - Write in short, scannable paragraphs
   - Use bullet points for lists
   - Each paragraph maximum 20 lines
8. **Originality Check**: Before finalizing, ensure NO sentence is identical or too similar to the original text.

REWRITING STRATEGY:
- Change sentence structures completely
- Use synonyms and alternative expressions
- Rearrange the order of information when appropriate
- Add transitional phrases and connectors
- Expand on key points with additional context or examples
- Write as if explaining the topic to someone new

CONTENT EXCLUSIONS (DO NOT INCLUDE):
- "Baca Juga" (related articles) sections
- Author bio or about sections
- Social media sharing prompts
- Newsletter signup prompts
- Advertisement placeholders
- Navigation links
- Comments or discussion prompts
- Copyright notices
Focus ONLY on the main article body content.

OUTPUT FORMAT (JSON):
{
  "title": "Completely rewritten, SEO-optimized title in BAHASA INDONESIA (MUST be different from original)",
  "content": "Full rewritten article in BAHASA INDONESIA with ## headings, bold text, and bullet points",
  "excerpt": "Compelling 150-character summary in BAHASA INDONESIA",
  "metaDescription": "SEO meta description in BAHASA INDONESIA (150-160 chars)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.`
}

function buildUserPrompt(request: AIRewriteRequest): string {
    let prompt = `Please rewrite the following article:\n\n`

    if (request.title) {
        prompt += `**Original Title**: ${request.title}\n\n`
    }

    prompt += `**Content**:\n${request.content}\n\n`

    if (request.targetLength) {
        const lengthInstruction = {
            shorter: 'Make it 30% shorter while keeping key points',
            same: 'Keep approximately the same length',
            longer: 'Expand it by 30-50% with more details and examples',
        }
        prompt += `**Length**: ${lengthInstruction[request.targetLength]}\n\n`
    }

    prompt += `Rewrite this content and return the result in JSON format as specified.`

    return prompt
}

function getToneDescription(tone: string): string {
    const descriptions = {
        professional: 'Professional, authoritative, and formal',
        casual: 'Conversational, friendly, and approachable',
        creative: 'Engaging, imaginative, and expressive',
        technical: 'Precise, detailed, and technical',
    }
    return descriptions[tone as keyof typeof descriptions] || descriptions.professional
}

function getStyleDescription(style: string): string {
    const descriptions = {
        blog: 'Blog post with personal insights and practical tips',
        news: 'News article with factual, objective reporting',
        tutorial: 'Step-by-step guide with clear instructions',
        review: 'In-depth review with pros, cons, and recommendations',
    }
    return descriptions[style as keyof typeof descriptions] || descriptions.blog
}

function parseAIResponse(response: string): AIRewriteResponse['data'] {
    try {
        // Remove markdown code blocks if present
        let cleanResponse = response.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '')
        }

        const parsed = JSON.parse(cleanResponse)

        // Convert markdown content to HTML for WordPress
        const htmlContent = markdownToHtml(parsed.content || '')

        return {
            title: parsed.title || 'Untitled',
            content: htmlContent, // HTML format for WordPress
            excerpt: parsed.excerpt || '',
            metaDescription: parsed.metaDescription || parsed.excerpt || '',
            seoKeywords: parsed.seoKeywords || [],
        }
    } catch (error) {
        console.error('Failed to parse AI response as JSON:', error)
        // Fallback: convert raw response to HTML
        const htmlContent = markdownToHtml(response)
        return {
            title: 'Rewritten Article',
            content: htmlContent,
            excerpt: response.substring(0, 150) + '...',
            metaDescription: response.substring(0, 160),
            seoKeywords: [],
        }
    }
}
