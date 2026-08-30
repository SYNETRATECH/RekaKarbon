import { api } from '../lib/api';
import type { StoredFile, UploadFileDto } from '../types/storage';
import { StoredFileSchema } from '../schemas';
import { z } from 'zod';

export interface StorageRepository {
  getFiles(): Promise<StoredFile[]>;
  getFileById(id: string): Promise<StoredFile | null>;
  uploadFile(data: UploadFileDto): Promise<StoredFile>;
}

export class ApiStorageRepository implements StorageRepository {
  async getFiles(): Promise<StoredFile[]> {
    return api.get<StoredFile[]>('/storage/files', z.array(StoredFileSchema));
  }

  async getFileById(id: string): Promise<StoredFile | null> {
    return api.get<StoredFile | null>(`/storage/files/${id}`, StoredFileSchema.nullable());
  }

  async uploadFile(data: UploadFileDto): Promise<StoredFile> {
    return api.post<StoredFile>('/storage/upload', data, StoredFileSchema);
  }
}

import { MockStorageRepository } from './storage.mock.repository';

export const storageRepository: StorageRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockStorageRepository()
    : new ApiStorageRepository();
