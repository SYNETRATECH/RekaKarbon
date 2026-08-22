import type { StoredFile, UploadFileDto } from '../types/storage';
import type { StorageRepository } from './storage.repository';

export class MockStorageRepository implements StorageRepository {
  private files: StoredFile[] = [
    {
      id: 'f1a2b3c4-0050-4000-8000-111111111111',
      originalFileName: 'SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2457600,
      storageKey: 'uploads/legal_sk/SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      accessUrl:
        'https://storage.rekakarbon.id/uploads/legal_sk/SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      uploadedBy: 'Direktorat Jenderal PPI KLHK',
      category: 'legal_sk',
      uploadedAt: '2026-01-15T08:30:00.000Z',
    },
  ];

  async getFiles(): Promise<StoredFile[]> {
    return Promise.resolve([...this.files]);
  }

  async getFileById(id: string): Promise<StoredFile | null> {
    const file = this.files.find((f) => f.id === id);
    return Promise.resolve(file || null);
  }

  async uploadFile(data: UploadFileDto): Promise<StoredFile> {
    const newFile: StoredFile = {
      id: `mock-${Date.now()}`,
      originalFileName: data.fileName,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      storageKey: `uploads/${data.category}/${data.fileName}`,
      accessUrl: `https://storage.rekakarbon.id/uploads/${data.category}/${data.fileName}`,
      uploadedBy: 'Current User',
      category: data.category,
      uploadedAt: new Date().toISOString(),
    };
    this.files.unshift(newFile);
    return Promise.resolve(newFile);
  }
}
