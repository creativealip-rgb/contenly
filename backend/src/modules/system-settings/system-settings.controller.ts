import { Controller, Get, Post, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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
  async validate(@Body() body: { provider: string; apiKey: string; baseUrl?: string }) {
    return this.service.validateKey(body.provider, body.apiKey, body.baseUrl);
  }

  // --- Custom Providers (OpenAI-compatible endpoints) ---
  @Get('custom-providers')
  async getCustomProviders() {
    return this.service.getCustomProviders();
  }

  @Post('custom-provider')
  async saveCustomProvider(
    @Body()
    body: { id?: string; label: string; baseUrl: string; models?: string[] | string; apiKey?: string },
  ) {
    return this.service.saveCustomProvider(body);
  }

  @Delete('custom-provider/:id')
  async deleteCustomProvider(@Param('id') id: string) {
    return this.service.deleteCustomProvider(id);
  }

  // --- Cookie-based auth for Codex & Antigravity ---
  @Post('cookie/:provider/save')
  async saveCookie(@Param('provider') provider: string, @Body() body: { cookies: string }) {
    return this.service.saveCookies(provider, body.cookies);
  }

  @Get('cookie/:provider/status')
  async getCookieStatus(@Param('provider') provider: string) {
    return this.service.getCookieStatus(provider);
  }

  @Post('cookie/:provider/test')
  async testCookie(@Param('provider') provider: string) {
    return this.service.testCookies(provider);
  }

  @Delete('cookie/:provider')
  async deleteCookie(@Param('provider') provider: string) {
    return this.service.deleteCookies(provider);
  }

  // --- Test ---
  @Post('test/chat')
  async testChat(@Body() body: { provider: string; model: string; prompt: string }) {
    return this.service.testChat(body.provider, body.model, body.prompt);
  }

  @Post('test/image')
  async testImage(@Body() body: { provider: string; model: string; prompt: string }) {
    return this.service.testImage(body.provider, body.model, body.prompt);
  }

  @Get('providers/status')
  async getProvidersStatus() {
    return this.service.getProvidersStatus();
  }

  @Post('providers/test-connection')
  async testProviderConnection(@Body() body: { provider: string; model?: string }) {
    return this.service.testProviderConnection(body.provider, body.model);
  }

  // --- Model Configuration ---
  @Get('models/config')
  async getModelConfig() {
    return this.service.getModelConfig();
  }

  @Post('models/config')
  async saveModelConfig(@Body() body: { textModel?: string; imageModel?: string }) {
    return this.service.saveModelConfig(body);
  }
}
