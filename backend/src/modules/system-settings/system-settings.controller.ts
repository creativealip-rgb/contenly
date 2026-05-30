import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Controller('admin/settings')
@UseGuards(SessionAuthGuard, SuperAdminGuard)
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  async getAll(@Query('category') category?: string) {
    return this.service.getAll(category);
  }

  @Post()
  async set(@Body() body: { key: string; value: string; encrypted?: boolean; category?: string; description?: string }) {
    return this.service.set(body.key, body.value, body);
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    return this.service.delete(key);
  }

  @Post('validate')
  async validate(@Body() body: { provider: string; apiKey: string }) {
    return this.service.validateKey(body.provider, body.apiKey);
  }

  @Post('test/chat')
  async testChat(@Body() body: { provider: string; model: string; prompt: string }) {
    return this.service.testChat(body.provider, body.model, body.prompt);
  }

  @Post('test/image')
  async testImage(@Body() body: { provider: string; model: string; prompt: string }) {
    return this.service.testImage(body.provider, body.model, body.prompt);
  }
}
