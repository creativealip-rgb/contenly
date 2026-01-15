import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const footerLinks = {
    product: [
        { label: 'Features', href: '#features' },
        { label: 'Hubungi Kami', href: '/#contact' },
        { label: 'API', href: '/api-docs' },
    ],
    company: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
    ],
    legal: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
    ],
    social: [
        { label: 'Twitter', href: 'https://twitter.com' },
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'Discord', href: 'https://discord.com' },
    ],
}

export function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">Camedia AI</span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Turn any URL into unique, SEO-optimized WordPress posts with AI.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Product</h4>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Company</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Connect</h4>
                        <ul className="space-y-2">
                            {footerLinks.social.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-border pt-8">
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Camedia AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
