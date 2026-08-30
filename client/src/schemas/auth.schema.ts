import { z } from 'zod';
import { UuidSchema, EmailSchema, WalletAddressSchema } from './common.schema';

export const UserRoleSchema = z.enum([
  'superadmin',
  'regulator',
  'auditor',
  'emitter',
  'kth',
  'buyer',
]);

export const UserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  password: z.string().min(6).optional(),
  name: z.string().min(1, { message: 'Nama lengkap wajib diisi' }),
  role: z.string().min(1),
  roleTitle: z.string().optional(),
  agency: z.string().optional(),
  avatar: z.string().optional(),
  token: z.string().optional(),
  walletAddress: WalletAddressSchema.optional(),
});

export const AuthCredentialsSchema = z.object({
  email: EmailSchema.optional(),
  password: z.string().min(1, { message: 'Kata sandi wajib diisi' }).optional(),
  role: z.string().optional(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string().min(1),
  accessToken: z.string().optional(),
  role: z.string().min(1),
});

export type UserType = z.infer<typeof UserSchema>;
export type AuthCredentialsType = z.infer<typeof AuthCredentialsSchema>;
export type AuthResponseType = z.infer<typeof AuthResponseSchema>;
