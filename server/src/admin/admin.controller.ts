import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  QueryUsersDto,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ReviewKybDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Platform Administration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.superadmin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get core administrative metrics and user stats' })
  @ApiResponse({
    status: 200,
    description: 'Core stats retrieved successfully.',
  })
  @Get('stats')
  async getStats() {
    const data = await this.adminService.getStats();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'List all users with search, role/status filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully.',
  })
  @Get('users')
  async getUsers(@Query() query: QueryUsersDto) {
    const result = await this.adminService.getUsers(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Create or invite a new platform user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    const data = await this.adminService.createUser(dto);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update system role for a specific user' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const data = await this.adminService.updateUserRole(userId, dto.role);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Update active/suspended status for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
  })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const data = await this.adminService.updateUserStatus(userId, dto.status);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Reset user password and issue temporary credentials',
  })
  @ApiResponse({ status: 200, description: 'Temporary password issued.' })
  @HttpCode(HttpStatus.OK)
  @Post('users/:id/reset-password')
  async resetPassword(@Param('id') userId: string) {
    const data = await this.adminService.resetPassword(userId);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'List all submitted KYB institutional verification profiles',
  })
  @ApiResponse({ status: 200, description: 'KYB submissions retrieved.' })
  @Get('kyb')
  async getKybSubmissions() {
    const data = await this.adminService.getKybSubmissions();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Approve or reject a submitted KYB institutional profile',
  })
  @ApiResponse({ status: 200, description: 'KYB verification status updated.' })
  @Patch('kyb/:id/review')
  async reviewKyb(
    @Param('id') kybId: string,
    @Body() dto: ReviewKybDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const data = await this.adminService.reviewKyb(
      kybId,
      dto,
      req.user?.userId,
    );
    return { success: true, data };
  }
}
