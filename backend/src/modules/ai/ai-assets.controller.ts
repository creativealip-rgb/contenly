import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiAssetsController {
  constructor(private aiService: AiService) {}

  @Get('assets/:key')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({ summary: 'Serve generated AI image asset from R2' })
  async getGeneratedAsset(@Param('key') key: string, @Res() res: any) {
    const asset = await this.aiService.getGeneratedImageAsset(decodeURIComponent(key));
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(asset.body);
  }
}
