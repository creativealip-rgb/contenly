
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WordpressService } from './src/modules/wordpress/wordpress.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const wpService = app.get(WordpressService);

    const userId = 'wVQNMUVNqXPWjZwXVsw40oebSQMD5C1D';
    const articleId = '49511f4a-e3d8-4f27-b968-cc9b822df4f9'; // The "Bass Speaker" article

    console.log('--- SIMULATING PUBLISH FOR BASS SPEAKER ---');
    try {
        // We simulate calling publishArticle
        // NOTE: This will actually call WordPress! 
        // If we don't want to call WP, we should mock axios, but here we want to see the DB flow.

        // Let's just mock the DB part directly if we want to be safe, 
        // OR we can just try to update it directly to see if it works.

        const mockDto = {
            title: 'Bass Speaker Bluetooth Terasa Lemah? Ini Penyebab Teknis & Cara Mengatasinya (Updated)',
            content: '<p>Updated content</p>',
            status: 'publish', // This should map to PUBLISHED
            articleId: articleId
        };

        const result = await wpService.publishArticle(userId, mockDto);
        console.log('Publish result:', result);
    } catch (e) {
        console.error('Simulation failed:', e.message);
    }

    await app.close();
}
bootstrap();
