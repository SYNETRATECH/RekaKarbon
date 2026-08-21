import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto';

@ApiTags('System Notifications & Alerts')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: 'Retrieve all high-priority system alerts and push notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
  })
  @Get()
  async getNotifications() {
    const notifications = await this.notificationsService.getNotifications();
    return { success: true, data: notifications };
  }

  @ApiOperation({ summary: 'Mark a notification as read by UUID identifier' })
  @ApiParam({ name: 'id', description: 'Notification UUID identifier' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(id);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: 'Dispatch a new system alert event' })
  @ApiResponse({ status: 201, description: 'Alert event created.' })
  @Post()
  async createNotification(@Body() dto: CreateNotificationDto) {
    const notification =
      await this.notificationsService.createNotification(dto);
    return { success: true, data: notification };
  }
}
