import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'List notifications' })
    async findAll(@CurrentUser() user: User) {
        return this.notificationsService.findAll(user.id);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark as read' })
    async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
        return this.notificationsService.markAsRead(user.id, id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all as read' })
    async markAllAsRead(@CurrentUser() user: User) {
        return this.notificationsService.markAllAsRead(user.id);
    }
}
