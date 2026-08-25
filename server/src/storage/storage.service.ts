import { Injectable, NotFoundException } from '@nestjs/common';
import { FileCategory as PrismaFileCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { StoredFile, FileCategory } from './types';
import type { UploadFileDto } from './dto';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async listFiles(): Promise<StoredFile[]> {
    const records = await this.prisma.storedFile.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id,
      originalFileName: r.originalFileName,
      mimeType: r.mimeType,
      fileSizeBytes: Number(r.fileSizeBytes),
      storageKey: r.storageKey,
      accessUrl: r.accessUrl,
      uploadedBy: 'Current Authenticated Participant',
      category: r.category.toLowerCase() as FileCategory,
      uploadedAt: r.createdAt.toISOString(),
    }));
  }

  async findFileById(id: string): Promise<StoredFile> {
    const record = await this.prisma.storedFile.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Stored file with ID '${id}' was not found`);
    }
    return {
      id: record.id,
      originalFileName: record.originalFileName,
      mimeType: record.mimeType,
      fileSizeBytes: Number(record.fileSizeBytes),
      storageKey: record.storageKey,
      accessUrl: record.accessUrl,
      uploadedBy: 'Current Authenticated Participant',
      category: record.category.toLowerCase() as FileCategory,
      uploadedAt: record.createdAt.toISOString(),
    };
  }

  async uploadFile(dto: UploadFileDto): Promise<StoredFile> {
    const storageKey = `uploads/${dto.category}/${Date.now()}_${dto.fileName}`;
    const accessUrl = `https://storage.rekakarbon.id/uploads/${dto.category}/${dto.fileName}`;
    const categoryEnum = dto.category.toUpperCase() as PrismaFileCategory;

    const created = await this.prisma.storedFile.create({
      data: {
        originalFileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSizeBytes: BigInt(dto.fileSizeBytes),
        storageKey,
        accessUrl,
        category: categoryEnum,
      },
    });
    return {
      id: created.id,
      originalFileName: created.originalFileName,
      mimeType: created.mimeType,
      fileSizeBytes: Number(created.fileSizeBytes),
      storageKey: created.storageKey,
      accessUrl: created.accessUrl,
      uploadedBy: 'Current Authenticated Participant',
      category: dto.category,
      uploadedAt: created.createdAt.toISOString(),
    };
  }
}
