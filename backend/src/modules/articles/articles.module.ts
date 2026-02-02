import { Module, forwardRef } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { WordpressModule } from '../wordpress/wordpress.module';

@Module({
  imports: [
    forwardRef(() => AiModule),
    AuthModule,
    forwardRef(() => WordpressModule),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
