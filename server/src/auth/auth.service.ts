import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, SafeUser, User } from '../types/auth';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<SafeUser | null> {
    if (!email || !pass) {
      this.logger.warn('Validation skipped: missing email or password.');
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    this.logger.log(
      `🔍 Validating credentials for email: "${normalizedEmail}"...`,
    );

    const user = await this.usersService.findOneByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(
        `❌ User not found in database for email: "${normalizedEmail}".`,
      );
      return null;
    }

    this.logger.log(
      `👤 User record found: ID=${user.id}, Role=${user.role}. Verifying bcrypt password hash...`,
    );
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(
        `❌ Password verification failed for: "${normalizedEmail}".`,
      );
      return null;
    }

    this.logger.log(
      `✅ Password verification successful for: "${normalizedEmail}".`,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.fullName || user.email,
      role: user.role,
      agency: user.agency,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`📥 Processing login request for: "${loginDto.email}"...`);
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      this.logger.warn(
        `🚫 Login rejected for "${loginDto.email}": Invalid credentials.`,
      );
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    this.logger.log(
      `🎉 Login successful! Issued JWT for user "${user.email}" (Role: ${user.role}).`,
    );

    return {
      success: true,
      data: {
        accessToken: token,
        token,
        role: user.role,
        user,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    this.logger.log(`📥 Processing registration for: "${normalizedEmail}"...`);

    const existingUser =
      await this.usersService.findOneByEmail(normalizedEmail);
    if (existingUser) {
      this.logger.warn(
        `🚫 Registration rejected: Email "${normalizedEmail}" already exists.`,
      );
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already exists',
        },
      });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const newUser: User = {
      id: randomUUID(),
      email: normalizedEmail,
      fullName: registerDto.fullName,
      passwordHash,
      role: Role.buyer,
      createdAt: new Date().toISOString(),
    };

    const createdUser = await this.usersService.create(newUser);
    const safeUser: SafeUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.fullName || createdUser.email,
      role: createdUser.role,
      agency: createdUser.agency,
      walletAddress: createdUser.walletAddress,
      createdAt: createdUser.createdAt,
    };

    this.logger.log(
      `🎉 User registered successfully: "${createdUser.email}" (ID: ${createdUser.id}, Role: ${createdUser.role}).`,
    );

    return {
      success: true,
      data: safeUser,
    };
  }
}
