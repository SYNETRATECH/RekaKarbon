import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUserPayload, JwtPayload } from '../types';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUserPayload> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Akun pengguna tidak lagi ditemukan.');
    }

    // Force re-login if the user role was modified by an administrator
    if (user.role !== payload.role) {
      throw new UnauthorizedException(
        'Hak akses peran akun Anda telah diperbarui oleh administrator. Silakan masuk kembali.',
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };
  }
}
