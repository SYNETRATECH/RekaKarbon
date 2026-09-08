import { z } from 'zod';
import { api } from '../lib/api';
import {
  AdminStatsSchema,
  AdminUserItemSchema,
  AdminKybItemSchema,
  RoleDefinitionSchema,
} from '../schemas/admin.schema';
import type {
  AdminStats,
  AdminUserItem,
  AdminKybItem,
  RoleDefinition,
  QueryUsersParams,
  CreateUserPayload,
  ReviewKybPayload,
} from '../types/admin';
import { MockAdminRepository } from './admin.mock.repository';

export interface AdminRepository {
  getStats(): Promise<AdminStats>;
  getRoles(): Promise<RoleDefinition[]>;
  getUsers(params?: QueryUsersParams): Promise<{
    data: AdminUserItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
  createUser(payload: CreateUserPayload): Promise<AdminUserItem>;
  updateUserRole(userId: string, role: string): Promise<AdminUserItem>;
  updateUserStatus(userId: string, status: string): Promise<AdminUserItem>;
  resetPassword(userId: string): Promise<{ temporaryPassword: string; message: string }>;
  getKybSubmissions(): Promise<AdminKybItem[]>;
  reviewKyb(kybId: string, payload: ReviewKybPayload): Promise<AdminKybItem>;
}

export class ApiAdminRepository implements AdminRepository {
  async getStats(): Promise<AdminStats> {
    return api.get<AdminStats>('/admin/stats', AdminStatsSchema);
  }

  async getRoles(): Promise<RoleDefinition[]> {
    return api.get<RoleDefinition[]>('/admin/roles', z.array(RoleDefinitionSchema));
  }

  async getUsers(params?: QueryUsersParams): Promise<{
    data: AdminUserItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString() ? `?${query.toString()}` : '';

    const users = await api.get<AdminUserItem[]>(`/admin/users${qs}`, z.array(AdminUserItemSchema));

    return {
      data: users,
      meta: {
        total: users.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 1,
      },
    };
  }

  async createUser(payload: CreateUserPayload): Promise<AdminUserItem> {
    return api.post<AdminUserItem>('/admin/users', payload, AdminUserItemSchema);
  }

  async updateUserRole(userId: string, role: string): Promise<AdminUserItem> {
    return api.patch<AdminUserItem>(
      `/admin/users/${encodeURIComponent(userId)}/role`,
      { role },
      AdminUserItemSchema
    );
  }

  async updateUserStatus(userId: string, status: string): Promise<AdminUserItem> {
    return api.patch<AdminUserItem>(
      `/admin/users/${encodeURIComponent(userId)}/status`,
      { status },
      AdminUserItemSchema
    );
  }

  async resetPassword(userId: string): Promise<{ temporaryPassword: string; message: string }> {
    return api.post<{ temporaryPassword: string; message: string }>(
      `/admin/users/${encodeURIComponent(userId)}/reset-password`,
      {},
      z.object({
        temporaryPassword: z.string(),
        message: z.string(),
      })
    );
  }

  async getKybSubmissions(): Promise<AdminKybItem[]> {
    return api.get<AdminKybItem[]>('/admin/kyb', z.array(AdminKybItemSchema));
  }

  async reviewKyb(kybId: string, payload: ReviewKybPayload): Promise<AdminKybItem> {
    return api.patch<AdminKybItem>(
      `/admin/kyb/${encodeURIComponent(kybId)}/review`,
      payload,
      AdminKybItemSchema
    );
  }
}

export const adminRepository: AdminRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockAdminRepository()
    : new ApiAdminRepository();
