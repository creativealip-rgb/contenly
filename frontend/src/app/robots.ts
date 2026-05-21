import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://contenly.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/content-lab/', '/settings/', '/billing/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
