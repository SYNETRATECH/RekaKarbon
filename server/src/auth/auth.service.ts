import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, SafeUser, User } from '../types/auth';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<SafeUser | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      };
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      success: true,
      data: {
        accessToken: this.jwtService.sign(payload),
        user,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
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
      email: registerDto.email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    const createdUser = await this.usersService.create(newUser);
    const safeUser: SafeUser = {
      id: createdUser.id,
      email: createdUser.email,
      createdAt: createdUser.createdAt,
    };

    return {
      success: true,
      data: safeUser,
    };
  }
}
