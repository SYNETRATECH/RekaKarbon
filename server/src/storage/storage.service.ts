import { Injectable } from '@nestjs/common';
import type { StoredFile } from '../types/storage';
import { MOCK_STORED_FILES } from './storage.mock';
import type { UploadFileDto } from './dto';

@Injectable()
export class StorageService {
  private readonly files: StoredFile[] = [...MOCK_STORED_FILES];

  listFiles(): Promise<StoredFile[]> {
    return Promise.resolve(this.files);
  }

  findFileById(id: string): Promise<StoredFile | undefined> {
    return Promise.resolve(this.files.find((f) => f.id === id));
  }

  uploadFile(dto: UploadFileDto): Promise<StoredFile> {
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const newFile: StoredFile = {
      id: `f1a2b3c4-0050-4000-8000-${randomHex}000000`,
      originalFileName: dto.fileName,
      mimeType: dto.mimeType,
      fileSizeBytes: dto.fileSizeBytes,
      storageKey: `uploads/${dto.category}/${Date.now()}_${dto.fileName}`,
      accessUrl: `https://storage.rekakarbon.id/uploads/${dto.category}/${dto.fileName}`,
      uploadedBy: 'Current Authenticated Participant',
      category: dto.category,
      uploadedAt: new Date().toISOString(),
    };
    this.files.unshift(newFile);
    return Promise.resolve(newFile);
  }
}
