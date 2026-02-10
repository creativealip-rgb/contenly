import { Controller, Get, Patch, Body, Delete, Param, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateApiKeyDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import type { Request } from 'express';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Req() req: Request) {
        const userId = (req as any).user?.id;
        return this.usersService.findById(userId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update profile' })
    async updateProfile(@Req() req: Request, @Body() dto: UpdateUserDto) {
        const userId = (req as any).user?.id;
        return this.usersService.update(userId, dto);
    }

    @Get('me/preferences')
    @ApiOperation({ summary: 'Get notification preferences' })
    async getPreferences(@Req() req: Request) {
        const userId = (req as any).user?.id;
        const userData = await this.usersService.findById(userId);
        return userData?.preferences || {};
    }

    @Patch('me/preferences')
    @ApiOperation({ summary: 'Update preferences' })
    async updatePreferences(
        @Req() req: Request,
        @Body() preferences: Record<string, unknown>,
    ) {
        const userId = (req as any).user?.id;
        return this.usersService.updatePreferences(userId, preferences);
    }

    @Get('me/api-keys')
    @ApiOperation({ summary: 'List API keys' })
    async getApiKeys(@Req() req: Request) {
        const userId = (req as any).user?.id;
        return this.usersService.getApiKeys(userId);
    }

    @Post('me/api-keys')
    @ApiOperation({ summary: 'Generate new API key' })
    async createApiKey(@Req() req: Request, @Body() dto: CreateApiKeyDto) {
        const userId = (req as any).user?.id;
        return this.usersService.createApiKey(userId, dto.name);
    }

    @Delete('me/api-keys/:id')
    @ApiOperation({ summary: 'Revoke API key' })
    async revokeApiKey(@Req() req: Request, @Param('id') keyId: string) {
        const userId = (req as any).user?.id;
        return this.usersService.revokeApiKey(userId, keyId);
    }

    // ==========================================
    // SUPER ADMIN ENDPOINTS
    // ==========================================

    @Get('admin/list')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'List all users (Super Admin only)' })
    async listUsers() {
        console.log('[UsersController] listUsers requested');
        const users = await this.usersService.findAll();
        console.log(`[UsersController] Returning ${users?.length || 0} users`);
        return users;
    }

    @Post('admin/users')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'Create new user (Super Admin only)' })
    async createUser(@Body() dto: { name: string; email: string; role: string; password?: string }) {
        return this.usersService.createUser(dto);
    }

    @Patch('admin/:id/role')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'Update user role (Super Admin only)' })
    async updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.usersService.updateRole(id, role);
    }

    @Patch('admin/:id/tokens')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'Add tokens to user (Super Admin only)' })
    async addTokens(@Param('id') id: string, @Body('amount') amount: number) {
        return this.usersService.addTokens(id, amount);
    }

    @Delete('admin/:id')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'Delete user (Super Admin only)' })
    async deleteUser(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
