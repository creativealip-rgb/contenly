import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { MotionGraphicsService } from './motion-graphics.service';
import { RenderTemplateDto } from './motion-graphics.dto';

@ApiTags('Motion Graphics')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('motion-graphics')
export class MotionGraphicsController {
  constructor(private readonly service: MotionGraphicsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available motion graphics templates' })
  getTemplates(@Query('category') category?: string) {
    return this.service.getTemplates(category);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template details' })
  getTemplate(@Query('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Post('render')
  @ApiOperation({ summary: 'Render a motion graphics template to video/image' })
  async renderTemplate(
    @CurrentUser() user: User,
    @Body() dto: RenderTemplateDto,
    @Res() res: Response,
  ) {
    const result = await this.service.renderTemplate(dto.templateId, dto.props, {
      format: dto.format,
      durationFrames: dto.durationFrames,
      width: dto.width,
      height: dto.height,
    });

    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      png: 'image/png',
    };

    const stream = fs.createReadStream(result.outputPath);
    res.setHeader('Content-Type', mimeTypes[result.format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.templateId}.${result.format}"`);
    stream.pipe(res);

    // Cleanup after send
    stream.on('end', () => {
      fs.unlink(result.outputPath, () => {});
    });
  }
}
