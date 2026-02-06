
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ArticlesService } from './src/modules/articles/articles.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const articlesService = app.get(ArticlesService);

    console.log('--- DIAGNOSTIC: LAST 5 ARTICLES WITH USERID ---');
    const articles = await articlesService.db.query.article.findMany({
        limit: 5,
        orderBy: (article, { desc }) => [desc(article.createdAt)],
    });

    articles.forEach(a => {
        console.log(`ID: ${a.id} | UserID: ${a.userId} | Status: ${a.status} | Title: ${a.title.substring(0, 20)}...`);
    });

    await app.close();
}
bootstrap();
