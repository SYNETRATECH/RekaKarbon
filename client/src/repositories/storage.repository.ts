import { api } from '../lib/api';
import type { StoredFile, UploadFileDto } from '../types/storage';

export interface StorageRepository {
  getFiles(): Promise<StoredFile[]>;
  getFileById(id: string): Promise<StoredFile | null>;
  uploadFile(data: UploadFileDto): Promise<StoredFile>;
}

export class ApiStorageRepository implements StorageRepository {
  async getFiles(): Promise<StoredFile[]> {
    return api.get<StoredFile[]>('/storage/files');
  }

  async getFileById(id: string): Promise<StoredFile | null> {
    return api.get<StoredFile>(`/storage/files/${id}`);
  }

  async uploadFile(data: UploadFileDto): Promise<StoredFile> {
    return api.post<StoredFile>('/storage/upload', data);
  }
}

import { MockStorageRepository } from './storage.mock.repository';

export const storageRepository: StorageRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockStorageRepository()
    : new ApiStorageRepository();
