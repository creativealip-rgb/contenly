
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WordpressService } from './src/modules/wordpress/wordpress.service';
import axios from 'axios';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const wpService = app.get(WordpressService);

    const userId = 'wVQNMUVNqXPWjZwXVsw40oebSQMD5C1D';
    const articleId = '49511f4a-e3d8-4f27-b968-cc9b822df4f9';

    console.log('--- SIMULATING PUBLISH FLOW (DATABASE ONLY) ---');

    // Monkey patch axios.post to simulate WP success
    const originalPost = axios.post;
    axios.post = (async () => ({
        data: {
            id: 12345,
            link: 'https://mock-wp.com/post-123',
            slug: 'mock-slug',
            title: { rendered: 'Mock Title' },
            status: 'publish'
        }
    })) as any;

    try {
        const mockDto = {
            title: 'Bass Speaker Bluetooth Terasa Lemah? Ini Penyebab Teknis & Cara Mengatasinya (SIMULATED)',
            content: '<p>Simulated content</p>',
            status: 'publish',
            articleId: articleId,
            featuredImageUrl: 'https://images.unsplash.com/photo-1589003077984-894e133dabab'
        };

        const result = await wpService.publishArticle(userId, mockDto);
        console.log('Simulation result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Simulation failed:', e);
    } finally {
        axios.post = originalPost;
    }

    await app.close();
}
bootstrap();
