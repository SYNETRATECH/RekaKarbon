import { z } from 'zod';
import { UuidSchema, EmailSchema, WalletAddressSchema } from './common.schema';

export const AdminUserRoleSchema = z.enum([
  'superadmin',
  'admin',
  'regulator',
  'auditor',
  'ministry',
  'emitter',
  'kth',
  'buyer',
]);

export const AdminUserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']);

export const AdminUserItemSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  fullName: z.string().nullable().optional(),
  role: AdminUserRoleSchema,
  status: AdminUserStatusSchema,
  agency: z.string().nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AdminStatsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  suspendedUsers: z.number(),
  pendingVerificationUsers: z.number(),
  roleCounts: z.record(z.string(), z.number()),
  pendingKybCount: z.number(),
});

export const AdminKybItemSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  entityName: z.string(),
  category: z.enum(['CORPORATE', 'KTH_COOPERATIVE', 'VERIFIER_INSTITUTION', 'GOVERNMENT_AGENCY']),
  npwp: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  signatoryName: z.string().nullable().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  verifiedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  userEmail: EmailSchema,
  userFullName: z.string().nullable().optional(),
});

export const CreateUserFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter.' }),
  fullName: z.string().min(1, { message: 'Nama lengkap wajib diisi.' }),
  role: AdminUserRoleSchema,
  agency: z.string().optional(),
  walletAddress: WalletAddressSchema.optional().or(z.literal('')),
});

export type AdminUserItemType = z.infer<typeof AdminUserItemSchema>;
export type AdminStatsType = z.infer<typeof AdminStatsSchema>;
export type AdminKybItemType = z.infer<typeof AdminKybItemSchema>;
export type CreateUserFormType = z.infer<typeof CreateUserFormSchema>;
