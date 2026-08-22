import {
  Controller,
  Post,
  Body,
  Get,
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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import type { AuthenticatedRequest, SafeUser } from '../types/auth';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT bearer token and user profile.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Register a new participant account' })
  @ApiResponse({
    status: 201,
    description: 'Account registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already registered.',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current authenticated user profile (Protected)',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user profile retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT token.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      };
    }
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.fullName || user.email,
      role: user.role,
      agency: user.agency,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    };
    return {
      success: true,
      data: safeUser,
    };
  }
}
