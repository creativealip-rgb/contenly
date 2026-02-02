import { Module, forwardRef } from '@nestjs/common';
import { WordpressController } from './wordpress.controller';
import { WordpressService } from './wordpress.service';
import { AuthModule } from '../auth/auth.module';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [AuthModule, forwardRef(() => ArticlesModule)],
  controllers: [WordpressController],
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule {}
