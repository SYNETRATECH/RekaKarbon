import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUserPayload } from '../types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = AuthenticatedUserPayload>(
    err: unknown,
    user: TUser | false,
  ): TUser {
    if (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing access token',
        },
      });
    }
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing access token',
        },
      });
    }
    return user;
  }
}
