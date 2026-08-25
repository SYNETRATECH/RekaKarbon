import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './web-push.service';
import {
  CreateNotificationDto,
  SubscribeWebPushDto,
  UnsubscribeWebPushDto,
  TestWebPushDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('System Notifications & Alerts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

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
  async markAsRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
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

  @ApiOperation({
    summary: 'Retrieve VAPID public key for browser PushManager subscription',
  })
  @ApiResponse({
    status: 200,
    description: 'VAPID public key retrieved successfully.',
  })
  @Get('webpush/vapid-public-key')
  getVapidPublicKey() {
    const data = this.webPushService.getVapidPublicKey();
    return { success: true, data };
  }

  @ApiOperation({
    summary:
      'Register and subscribe a browser device endpoint for WebPush notifications',
  })
  @ApiResponse({
    status: 201,
    description: 'WebPush device subscribed successfully.',
  })
  @Post('webpush/subscribe')
  async subscribeWebPush(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubscribeWebPushDto,
  ) {
    const subscription = await this.webPushService.subscribe(
      req.user.userId,
      dto,
    );
    return { success: true, data: subscription };
  }

  @ApiOperation({
    summary:
      'Unregister and unsubscribe a browser device endpoint from WebPush',
  })
  @ApiResponse({
    status: 200,
    description: 'WebPush device unsubscribed successfully.',
  })
  @Post('webpush/unsubscribe')
  async unsubscribeWebPush(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UnsubscribeWebPushDto,
  ) {
    const result = await this.webPushService.unsubscribe(req.user.userId, dto);
    return { success: true, data: result };
  }

  @ApiOperation({
    summary:
      'Send a test WebPush notification to the authenticated user device',
  })
  @ApiResponse({
    status: 200,
    description: 'Test WebPush notification dispatched.',
  })
  @Post('webpush/test-push')
  async sendTestPush(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TestWebPushDto,
  ) {
    const result = await this.webPushService.sendTestNotification(
      req.user.userId,
      dto.title,
      dto.body,
    );
    return { success: true, data: result };
  }
}
