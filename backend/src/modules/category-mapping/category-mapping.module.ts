import { Module } from '@nestjs/common';
import { CategoryMappingController } from './category-mapping.controller';
import { CategoryMappingService } from './category-mapping.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [CategoryMappingController],
    providers: [CategoryMappingService],
    exports: [CategoryMappingService],
})
export class CategoryMappingModule { }
