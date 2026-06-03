import { Injectable } from '@nestjs/common';

export interface CarouselTemplate {
  id: string;
  name: string;
  category: 'education' | 'business' | 'lifestyle' | 'news' | 'promotional';
  description: string;
  preview: string;
  
  // Visual Design
  background: {
    type: 'gradient' | 'solid' | 'image' | 'pattern';
    value: string | string[]; // gradient colors or solid color
    pattern?: string;
  };
  
  // Color Palette
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textShadow?: string;
  };
  
  // Typography
  typography: {
    titleFont: string;
    bodyFont: string;
    titleSize: number;
    bodySize: number;
    titleWeight: number;
    bodyWeight: number;
    lineHeight: number;
  };
  
  // Layout
  layout: {
    type: 'center' | 'left' | 'right' | 'split' | 'overlay';
    titlePosition: { x: number; y: number };
    bodyPosition: { x: number; y: number };
    titleMaxWidth: number;
    bodyMaxWidth: number;
    textAlignment: 'left' | 'center' | 'right';
  };
  
  // Visual Elements
  elements?: {
    shapes?: Array<{
      type: 'circle' | 'rectangle' | 'line' | 'arrow';
      position: { x: number; y: number };
      size: { width: number; height: number };
      color: string;
      opacity: number;
    }>;
    icons?: Array<{
      name: string;
      position: { x: number; y: number };
      size: number;
      color: string;
    }>;
    divider?: {
      position: { x: number; y: number };
      width: number;
      color: string;
    };
  };
  
  // AI Prompt Templates
  aiPrompt: {
    base: string;
    style: string;
    negative: string;
  };
  
  // For Whom
  forAudience: 'individual' | 'agency' | 'all';
  forPlatform: 'instagram' | 'linkedin' | 'twitter' | 'all';
}

@Injectable()
export class TemplateService {
  private templates: CarouselTemplate[] = [
    // =====================
    // EDUCATION / TUTORIAL
    // =====================
    {
      id: 'edu-modern-1',
      name: 'Modern Learning',
      category: 'education',
      description: 'Clean minimalist design perfect for tutorials and how-to content',
      preview: 'gradient-modern-learning',
      background: {
        type: 'gradient',
        value: ['#667eea', '#764ba2'],
      },
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.3)',
      },
      typography: {
        titleFont: 'Inter',
        bodyFont: 'Inter',
        titleSize: 72,
        bodySize: 36,
        titleWeight: 800,
        bodyWeight: 400,
        lineHeight: 1.3,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 400 },
        bodyPosition: { x: 540, y: 550 },
        titleMaxWidth: 900,
        bodyMaxWidth: 900,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'modern minimalist educational slide design',
        style: 'clean white text on purple gradient background, subtle geometric shapes, professional typography',
        negative: 'cluttered, busy, dark, complex, vintage',
      },
      forAudience: 'all',
      forPlatform: 'instagram',
    },
    {
      id: 'edu-notebooklm',
      name: 'NotebookLM Style',
      category: 'education',
      description: 'Clean, professional design inspired by NotebookLM audio overview',
      preview: 'notebooklm-style',
      background: {
        type: 'gradient',
        value: ['#1a1a2e', '#16213e'],
      },
      colors: {
        primary: '#e94560',
        secondary: '#0f3460',
        accent: '#00d9ff',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.5)',
      },
      typography: {
        titleFont: 'Playfair Display',
        bodyFont: 'Source Sans Pro',
        titleSize: 64,
        bodySize: 32,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.4,
      },
      layout: {
        type: 'left',
        titlePosition: { x: 100, y: 300 },
        bodyPosition: { x: 100, y: 480 },
        titleMaxWidth: 800,
        bodyMaxWidth: 700,
        textAlignment: 'left',
      },
      elements: {
        divider: {
          position: { x: 100, y: 420 },
          width: 100,
          color: '#e94560',
        },
      },
      aiPrompt: {
        base: 'professional educational slide in NotebookLM style',
        style: 'dark elegant background with vibrant accent color, clean typography, cinematic lighting, modern minimalist',
        negative: 'bright, cartoon, busy, amateur, clipart',
      },
      forAudience: 'all',
      forPlatform: 'instagram',
    },
    {
      id: 'edu-gradient',
      name: 'Gradient Flow',
      category: 'education',
      description: 'Smooth gradient backgrounds for engaging educational content',
      preview: 'gradient-flow',
      background: {
        type: 'gradient',
        value: ['#00b4db', '#0083b0'],
      },
      colors: {
        primary: '#00b4db',
        secondary: '#0083b0',
        accent: '#ffffff',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.2)',
      },
      typography: {
        titleFont: 'Poppins',
        bodyFont: 'Poppins',
        titleSize: 68,
        bodySize: 34,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.35,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 380 },
        bodyPosition: { x: 540, y: 550 },
        titleMaxWidth: 880,
        bodyMaxWidth: 880,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'beautiful gradient background educational slide',
        style: 'smooth blue gradient, professional, clean, modern, geometric accent elements',
        negative: 'dark, red, orange, busy, text-heavy',
      },
      forAudience: 'individual',
      forPlatform: 'instagram',
    },
    
    // =====================
    // BUSINESS / CORPORATE
    // =====================
    {
      id: 'biz-corporate',
      name: 'Corporate Pro',
      category: 'business',
      description: 'Professional corporate style for business content and presentations',
      preview: 'corporate-pro',
      background: {
        type: 'solid',
        value: '#0f172a',
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#60a5fa',
        text: '#f8fafc',
        textShadow: 'none',
      },
      typography: {
        titleFont: 'Montserrat',
        bodyFont: 'Open Sans',
        titleSize: 60,
        bodySize: 30,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.4,
      },
      layout: {
        type: 'left',
        titlePosition: { x: 80, y: 280 },
        bodyPosition: { x: 80, y: 450 },
        titleMaxWidth: 700,
        bodyMaxWidth: 650,
        textAlignment: 'left',
      },
      elements: {
        shapes: [
          {
            type: 'rectangle',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 1350 },
            color: '#3b82f6',
            opacity: 1,
          },
        ],
      },
      aiPrompt: {
        base: 'professional corporate business slide',
        style: 'dark blue sophisticated background, blue accent lines, corporate professional, minimalist business aesthetic',
        negative: 'colorful, cartoon, playful, informal, gradient-heavy',
      },
      forAudience: 'agency',
      forPlatform: 'linkedin',
    },
    {
      id: 'biz-blueprint',
      name: 'Blueprint',
      category: 'business',
      description: 'Technical, architectural style for data and insights',
      preview: 'blueprint-style',
      background: {
        type: 'pattern',
        value: '#1e3a5f',
      },
      colors: {
        primary: '#38bdf8',
        secondary: '#0ea5e9',
        accent: '#7dd3fc',
        text: '#e0f2fe',
        textShadow: 'rgba(0,0,0,0.3)',
      },
      typography: {
        titleFont: 'JetBrains Mono',
        bodyFont: 'Inter',
        titleSize: 56,
        bodySize: 28,
        titleWeight: 600,
        bodyWeight: 400,
        lineHeight: 1.5,
      },
      layout: {
        type: 'split',
        titlePosition: { x: 540, y: 250 },
        bodyPosition: { x: 540, y: 420 },
        titleMaxWidth: 480,
        bodyMaxWidth: 450,
        textAlignment: 'left',
      },
      aiPrompt: {
        base: 'blueprint technical diagram style slide',
        style: 'blueprint aesthetic, technical drawing, grid lines, architectural, data visualization style',
        negative: 'gradient, photo, illustration, colorful, informal',
      },
      forAudience: 'agency',
      forPlatform: 'linkedin',
    },
    {
      id: 'biz-startup',
      name: 'Startup Velocity',
      category: 'business',
      description: 'Dynamic startup style for pitch and growth content',
      preview: 'startup-velocity',
      background: {
        type: 'gradient',
        value: ['#f97316', '#ea580c'],
      },
      colors: {
        primary: '#f97316',
        secondary: '#c2410c',
        accent: '#fed7aa',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.4)',
      },
      typography: {
        titleFont: 'Clash Display',
        bodyFont: 'Satoshi',
        titleSize: 70,
        bodySize: 35,
        titleWeight: 700,
        bodyWeight: 500,
        lineHeight: 1.2,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 500 },
        bodyPosition: { x: 540, y: 700 },
        titleMaxWidth: 900,
        bodyMaxWidth: 800,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'dynamic startup pitch slide',
        style: 'bold orange energetic, modern startup, growth, momentum, dynamic composition',
        negative: 'blue, green, corporate, formal, static',
      },
      forAudience: 'all',
      forPlatform: 'all',
    },
    
    // =====================
    // LIFESTYLE / PERSONAL
    // =====================
    {
      id: 'life-aesthetic',
      name: 'Aesthetic Mood',
      category: 'lifestyle',
      description: 'Soft, aesthetic design for lifestyle and personal branding',
      preview: 'aesthetic-mood',
      background: {
        type: 'gradient',
        value: ['#fbc2eb', '#a6c1ee'],
      },
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#f472b6',
        text: '#1f2937',
        textShadow: 'none',
      },
      typography: {
        titleFont: 'Playfair Display',
        bodyFont: 'Lora',
        titleSize: 58,
        bodySize: 30,
        titleWeight: 600,
        bodyWeight: 400,
        lineHeight: 1.45,
      },
      layout: {
        type: 'overlay',
        titlePosition: { x: 540, y: 350 },
        bodyPosition: { x: 540, y: 520 },
        titleMaxWidth: 850,
        bodyMaxWidth: 750,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'aesthetic lifestyle content slide',
        style: 'soft pastel gradient, dreamy, elegant, minimalist, fashion magazine style',
        negative: 'dark, neon, corporate, busy, tech',
      },
      forAudience: 'individual',
      forPlatform: 'instagram',
    },
    {
      id: 'life-soft',
      name: 'Soft Minimal',
      category: 'lifestyle',
      description: 'Clean and soft design for personal development content',
      preview: 'soft-minimal',
      background: {
        type: 'gradient',
        value: ['#fdf4ff', '#f0abfc'],
      },
      colors: {
        primary: '#c026d3',
        secondary: '#a21caf',
        accent: '#f0abfc',
        text: '#831843',
        textShadow: 'none',
      },
      typography: {
        titleFont: 'Outfit',
        bodyFont: 'Inter',
        titleSize: 64,
        bodySize: 32,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.3,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 420 },
        bodyPosition: { x: 540, y: 580 },
        titleMaxWidth: 880,
        bodyMaxWidth: 780,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'soft minimal personal development slide',
        style: 'soft pink lavender gradient, clean, peaceful, wellness, personal growth aesthetic',
        negative: 'dark, neon, aggressive, corporate, cluttered',
      },
      forAudience: 'individual',
      forPlatform: 'instagram',
    },
    {
      id: 'life-warm',
      name: 'Warm Stories',
      category: 'lifestyle',
      description: 'Warm, inviting design for storytelling content',
      preview: 'warm-stories',
      background: {
        type: 'gradient',
        value: ['#fcd34d', '#f59e0b'],
      },
      colors: {
        primary: '#d97706',
        secondary: '#b45309',
        accent: '#fef3c7',
        text: '#451a03',
        textShadow: 'none',
      },
      typography: {
        titleFont: 'Fraunces',
        bodyFont: 'Merriweather',
        titleSize: 56,
        bodySize: 28,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.5,
      },
      layout: {
        type: 'left',
        titlePosition: { x: 80, y: 320 },
        bodyPosition: { x: 80, y: 480 },
        titleMaxWidth: 750,
        bodyMaxWidth: 650,
        textAlignment: 'left',
      },
      aiPrompt: {
        base: 'warm storytelling content slide',
        style: 'warm golden amber tones, inviting, storytelling, personal narrative, magazine editorial',
        negative: 'blue, cold, technical, corporate, sterile',
      },
      forAudience: 'individual',
      forPlatform: 'instagram',
    },
    
    // =====================
    // NEWS / TRENDING
    // =====================
    {
      id: 'news-bold',
      name: 'Breaking News',
      category: 'news',
      description: 'Bold breaking news style for trending content',
      preview: 'breaking-news',
      background: {
        type: 'solid',
        value: '#000000',
      },
      colors: {
        primary: '#ef4444',
        secondary: '#dc2626',
        accent: '#fbbf24',
        text: '#ffffff',
        textShadow: 'none',
      },
      typography: {
        titleFont: 'Oswald',
        bodyFont: 'Roboto',
        titleSize: 76,
        bodySize: 32,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.2,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 500 },
        bodyPosition: { x: 540, y: 700 },
        titleMaxWidth: 950,
        bodyMaxWidth: 850,
        textAlignment: 'center',
      },
      elements: {
        shapes: [
          {
            type: 'rectangle',
            position: { x: 0, y: 0 },
            size: { width: 1080, height: 12 },
            color: '#ef4444',
            opacity: 1,
          },
        ],
      },
      aiPrompt: {
        base: 'breaking news headline slide',
        style: 'bold red black contrast, news ticker style, urgent, breaking news aesthetic, journalistic',
        negative: 'pastel, soft, decorative, casual, friendly',
      },
      forAudience: 'all',
      forPlatform: 'all',
    },
    {
      id: 'news-modern',
      name: 'Tech News',
      category: 'news',
      description: 'Modern tech news style for technology content',
      preview: 'tech-news',
      background: {
        type: 'gradient',
        value: ['#18181b', '#27272a'],
      },
      colors: {
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#4ade80',
        text: '#fafafa',
        textShadow: 'rgba(0,0,0,0.5)',
      },
      typography: {
        titleFont: 'Space Grotesk',
        bodyFont: 'Inter',
        titleSize: 62,
        bodySize: 30,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.3,
      },
      layout: {
        type: 'left',
        titlePosition: { x: 80, y: 280 },
        bodyPosition: { x: 80, y: 450 },
        titleMaxWidth: 750,
        bodyMaxWidth: 680,
        textAlignment: 'left',
      },
      elements: {
        shapes: [
          {
            type: 'rectangle',
            position: { x: 0, y: 0 },
            size: { width: 6, height: 1350 },
            color: '#22c55e',
            opacity: 1,
          },
        ],
      },
      aiPrompt: {
        base: 'tech news modern slide',
        style: 'dark tech aesthetic, green accent, modern news, tech journalism, clean editorial',
        negative: 'warm colors, vintage, playful, colorful, casual',
      },
      forAudience: 'all',
      forPlatform: 'twitter',
    },
    
    // =====================
    // PROMOTIONAL
    // =====================
    {
      id: 'promo-neon',
      name: 'Neon Nights',
      category: 'promotional',
      description: 'Vibrant neon style for promotional and product content',
      preview: 'neon-nights',
      background: {
        type: 'gradient',
        value: ['#7c3aed', '#db2777'],
      },
      colors: {
        primary: '#a855f7',
        secondary: '#ec4899',
        accent: '#f0abfc',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.5)',
      },
      typography: {
        titleFont: 'Syne',
        bodyFont: 'Inter',
        titleSize: 72,
        bodySize: 34,
        titleWeight: 800,
        bodyWeight: 500,
        lineHeight: 1.2,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 480 },
        bodyPosition: { x: 540, y: 680 },
        titleMaxWidth: 900,
        bodyMaxWidth: 800,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'vibrant neon promotional slide',
        style: 'purple pink neon glow, cyberpunk, energetic, promotional, attention-grabbing',
        negative: 'dark blue, muted, corporate, minimalist, simple',
      },
      forAudience: 'all',
      forPlatform: 'instagram',
    },
    {
      id: 'promo-gold',
      name: 'Premium Gold',
      category: 'promotional',
      description: 'Luxurious gold premium style for high-end products',
      preview: 'premium-gold',
      background: {
        type: 'gradient',
        value: ['#1c1917', '#292524'],
      },
      colors: {
        primary: '#fbbf24',
        secondary: '#d97706',
        accent: '#fde68a',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.6)',
      },
      typography: {
        titleFont: 'Playfair Display',
        bodyFont: 'Montserrat',
        titleSize: 64,
        bodySize: 30,
        titleWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.35,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 450 },
        bodyPosition: { x: 540, y: 620 },
        titleMaxWidth: 880,
        bodyMaxWidth: 780,
        textAlignment: 'center',
      },
      elements: {
        shapes: [
          {
            type: 'line',
            position: { x: 340, y: 560 },
            size: { width: 400, height: 4 },
            color: '#fbbf24',
            opacity: 0.8,
          },
        ],
      },
      aiPrompt: {
        base: 'luxury premium promotional slide',
        style: 'gold accent on dark background, luxurious, premium, elegant, high-end product aesthetic',
        negative: 'bright, colorful, casual, playful, budget',
      },
      forAudience: 'agency',
      forPlatform: 'instagram',
    },
    {
      id: 'promo-energy',
      name: 'High Energy',
      category: 'promotional',
      description: 'Dynamic high-energy style for exciting promotions',
      preview: 'high-energy',
      background: {
        type: 'gradient',
        value: ['#f43f5e', '#f97316'],
      },
      colors: {
        primary: '#f43f5e',
        secondary: '#f97316',
        accent: '#fef08a',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.4)',
      },
      typography: {
        titleFont: 'Bebas Neue',
        bodyFont: 'Poppins',
        titleSize: 80,
        bodySize: 36,
        titleWeight: 700,
        bodyWeight: 500,
        lineHeight: 1.1,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 550 },
        bodyPosition: { x: 540, y: 750 },
        titleMaxWidth: 950,
        bodyMaxWidth: 850,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'high energy promotional slide',
        style: 'red orange energetic, dynamic, exciting, promotional, action-packed',
        negative: 'blue, green, calm, peaceful, corporate',
      },
      forAudience: 'all',
      forPlatform: 'instagram',
    },
    {
      id: 'promo-eco',
      name: 'Eco Fresh',
      category: 'promotional',
      description: 'Fresh eco-friendly style for sustainable products',
      preview: 'eco-fresh',
      background: {
        type: 'gradient',
        value: ['#22c55e', '#15803d'],
      },
      colors: {
        primary: '#22c55e',
        secondary: '#15803d',
        accent: '#86efac',
        text: '#ffffff',
        textShadow: 'rgba(0,0,0,0.3)',
      },
      typography: {
        titleFont: 'Nunito',
        bodyFont: 'Nunito',
        titleSize: 66,
        bodySize: 32,
        titleWeight: 700,
        bodyWeight: 500,
        lineHeight: 1.3,
      },
      layout: {
        type: 'center',
        titlePosition: { x: 540, y: 420 },
        bodyPosition: { x: 540, y: 600 },
        titleMaxWidth: 900,
        bodyMaxWidth: 800,
        textAlignment: 'center',
      },
      aiPrompt: {
        base: 'eco friendly natural promotional slide',
        style: 'fresh green nature, eco-friendly, sustainable, organic, natural product aesthetic',
        negative: 'dark, neon, artificial, synthetic, industrial',
      },
      forAudience: 'individual',
      forPlatform: 'instagram',
    },
  ];

  getAllTemplates(): CarouselTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): CarouselTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  getTemplatesByCategory(category: CarouselTemplate['category']): CarouselTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  getTemplatesForAudience(audience: 'individual' | 'agency'): CarouselTemplate[] {
    return this.templates.filter((t) => t.forAudience === audience || t.forAudience === 'all');
  }

  getTemplatesForPlatform(platform: 'instagram' | 'linkedin' | 'twitter'): CarouselTemplate[] {
    return this.templates.filter((t) => t.forPlatform === platform || t.forPlatform === 'all');
  }

  getCategories(): { id: string; name: string; count: number }[] {
    const categories = [
      { id: 'education', name: 'Education & Tutorial', key: 'education' as const },
      { id: 'business', name: 'Business & Corporate', key: 'business' as const },
      { id: 'lifestyle', name: 'Lifestyle & Personal', key: 'lifestyle' as const },
      { id: 'news', name: 'News & Trending', key: 'news' as const },
      { id: 'promotional', name: 'Promotional & Product', key: 'promotional' as const },
    ];

    return categories.map((cat) => ({
      ...cat,
      count: this.templates.filter((t) => t.category === cat.key).length,
    }));
  }

  generateAiPrompt(template: CarouselTemplate, customStyle?: string): string {
    const stylePart = customStyle ? `, ${customStyle}` : '';
    return `${template.aiPrompt.base}, ${template.aiPrompt.style}${stylePart}`;
  }

  generateNegativePrompt(template: CarouselTemplate): string {
    return template.aiPrompt.negative;
  }

  getColorPalette(templateId: string): CarouselTemplate['colors'] | undefined {
    const template = this.getTemplateById(templateId);
    return template?.colors;
  }

  getBackgroundStyle(templateId: string): CarouselTemplate['background'] | undefined {
    const template = this.getTemplateById(templateId);
    return template?.background;
  }
}
