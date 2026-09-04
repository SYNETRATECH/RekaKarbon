import { faker } from '@faker-js/faker';
import { fakeUuid, fakeWalletAddress, fakeDateTimeString } from './domain-generators';
export type UserRole = 'superadmin' | 'regulator' | 'auditor' | 'emitter' | 'project_developer';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agency?: string;
  walletAddress?: string;
  createdAt: string;
}

export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: overrides?.id ?? fakeUuid(),
    email: overrides?.email ?? faker.internet.email().toLowerCase(),
    name: overrides?.name ?? faker.person.fullName(),
    role: overrides?.role ?? 'superadmin',
    agency: overrides?.agency ?? 'Kementerian Lingkungan Hidup dan Kehutanan',
    walletAddress: overrides?.walletAddress ?? fakeWalletAddress(),
    createdAt: overrides?.createdAt ?? fakeDateTimeString(),
    ...overrides,
  };
}

export function createMockAuthResponse(overrides?: {
  token?: string;
  accessToken?: string;
  role?: UserRole;
  user?: Partial<MockUser>;
}) {
  const user = createMockUser(overrides?.user);
  const token = overrides?.token ?? overrides?.accessToken ?? 'mock-jwt-token';

  return {
    success: true,
    data: {
      accessToken: token,
      token,
      role: overrides?.role ?? user.role,
      user,
    },
  };
}
