import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy - Session & Role Synchronization', () => {
  let strategy: JwtStrategy;
  let usersServiceMock: {
    findById: jest.Mock;
  };

  beforeEach(() => {
    usersServiceMock = {
      findById: jest.fn(),
    };
    strategy = new JwtStrategy(usersServiceMock as unknown as UsersService);
  });

  it('throws UnauthorizedException if user account no longer exists', async () => {
    usersServiceMock.findById.mockResolvedValue(null);
    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@test.com',
        role: Role.emitter,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException forcing re-login if user role in DB changed', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: Role.auditor, // Changed in database
    });

    // Token payload still has old role 'emitter'
    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@test.com',
        role: Role.emitter,
      }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@test.com',
        role: Role.emitter,
      }),
    ).rejects.toThrow(
      'Hak akses peran akun Anda telah diperbarui oleh administrator. Silakan masuk kembali.',
    );
  });

  it('returns authenticated user payload when valid and matching role', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: Role.auditor,
      walletAddress: '0x123',
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'user@test.com',
      role: Role.auditor,
    });

    expect(result).toEqual({
      userId: 'user-1',
      email: 'user@test.com',
      role: Role.auditor,
      walletAddress: '0x123',
    });
  });
});
