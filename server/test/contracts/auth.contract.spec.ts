import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
  getResponseBody,
  getResponseError,
} from '../../src/common/testing/contract-test-harness';
import { AuthResponseSchema, UserSchema } from '../../../client/src/schemas';
import { Role } from '@prisma/client';
import { createMockUser } from '../factories';

describe('Auth API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockUserRecord = createMockUser({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@rekakarbon.id',
    name: 'Super Admin RekaKarbon',
    role: Role.superadmin,
    agency: 'Kementerian Lingkungan Hidup dan Kehutanan',
    walletAddress: '0x8f2a948571029485710294857102948571029485',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      success: true,
      data: {
        accessToken: 'mock-jwt-token-from-contract-test',
        token: 'mock-jwt-token-from-contract-test',
        role: Role.superadmin,
        user: mockUserRecord,
      },
    }),
    register: jest.fn().mockResolvedValue({
      success: true,
      data: mockUserRecord,
    }),
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({
      id: mockUserRecord.id,
      email: mockUserRecord.email,
      fullName: mockUserRecord.name,
      role: mockUserRecord.role,
      agency: mockUserRecord.agency,
      walletAddress: mockUserRecord.walletAddress,
      createdAt: mockUserRecord.createdAt,
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
      currentUser: {
        userId: mockUserRecord.id,
        email: mockUserRecord.email,
        role: mockUserRecord.role,
      },
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  describe('POST /auth/login', () => {
    it('validates response against client AuthResponseSchema', async () => {
      const res = await harness.http
        .post('/auth/login')
        .send({ email: 'admin@rekakarbon.id', password: 'Password123!' })
        .expect(200);

      const validated = expectContract(res.body, AuthResponseSchema);
      expect(validated.token).toBe('mock-jwt-token-from-contract-test');
      expect(validated.user.email).toBe('admin@rekakarbon.id');
      expect(validated.user.role).toBe('superadmin');
    });

    it('rejects invalid email payload with 400 and standard ApiErrorResponse', async () => {
      const res = await harness.http
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);

      const err = getResponseError(res);
      expect(err.success).toBe(false);
      expect(err.error).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('returns standard acknowledgment envelope', async () => {
      const res = await harness.http.post('/auth/logout').expect(200);
      const body = getResponseBody<{ loggedOut: boolean }>(res);
      expect(body.success).toBe(true);
      expect(body.data.loggedOut).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('returns current user profile matching UserSchema', async () => {
      const res = await harness.http.get('/auth/me').expect(200);
      const user = expectContract(res.body, UserSchema);
      expect(user.id).toBe(mockUserRecord.id);
      expect(user.email).toBe(mockUserRecord.email);
    });
  });
});
