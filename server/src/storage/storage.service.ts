import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private logger = new Logger(StorageService.name);
  private bucketName = process.env.STORAGE_BUCKET || 'rekakarbon-documents';

  constructor() {
    const endPointRaw = process.env.STORAGE_ENDPOINT || 'http://127.0.0.1:9000';
    const isHttps = endPointRaw.startsWith('https://');
    let endPoint = endPointRaw.replace('https://', '').replace('http://', '');
    let port = isHttps ? 443 : 80;

    if (endPoint.includes(':')) {
      const parts = endPoint.split(':');
      endPoint = parts[0];
      port = parseInt(parts[1], 10);
    } else if (endPointRaw === 'http://127.0.0.1:9000' || endPoint === '127.0.0.1') {
      port = 9000;
    }

    this.minioClient = new Minio.Client({
      endPoint: endPoint,
      port: port,
      useSSL: isHttps,
      accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin'
    });
  }

  // --- For MinIO Upload (used by ReportsService) ---
  async uploadFileToMinio(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    
    try {
      if (this.minioClient['port'] === 9000) {
        const exists = await this.minioClient.bucketExists(this.bucketName).catch(() => false);
        if (!exists) {
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1').catch(e => this.logger.warn('Could not create bucket', e));
        }
      }

      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );
      
      this.logger.log(`File uploaded successfully to MinIO: ${fileName}`);
      return fileName;
    } catch (error) {
      this.logger.error(`Failed to upload file to MinIO: ${fileName}`, error);
      throw error;
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, fileName, 24 * 60 * 60);
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for: ${fileName}`, error);
      return '';
    }
  }

  // --- Legacy Mocks for StorageController ---
  async listFiles() {
    return [];
  }

  async findFileById(id: string) {
    return {
      id,
      originalFileName: 'mock_file.pdf',
      accessUrl: 'https://example.com/mock_file.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 12345,
      createdAt: new Date(),
    };
  }

  async uploadFile(uploadDto: any) {
    return {
      id: 'mock-uuid',
      ...uploadDto,
      accessUrl: 'https://example.com/uploaded.pdf',
      createdAt: new Date(),
    };
  }
}
