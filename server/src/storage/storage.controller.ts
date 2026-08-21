import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto';

@ApiTags('Storage & Document Ingestion')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({
    summary: 'Retrieve all indexed compliance documents and spatial assets',
  })
  @ApiResponse({ status: 200, description: 'Stored files list retrieved.' })
  @Get('files')
  async listFiles() {
    const files = await this.storageService.listFiles();
    return { success: true, data: files };
  }

  @ApiOperation({ summary: 'Retrieve file metadata by UUID identifier' })
  @ApiParam({ name: 'id', description: 'Stored file UUID identifier' })
  @ApiResponse({ status: 200, description: 'File metadata found.' })
  @ApiResponse({ status: 404, description: 'File not found.' })
  @Get('files/:id')
  async getFileById(@Param('id') id: string) {
    const file = await this.storageService.findFileById(id);
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: `File with ID '${id}' was not found.`,
        },
      });
    }
    return { success: true, data: file };
  }

  @ApiOperation({
    summary: 'Upload and register new compliance PDF or spatial asset',
  })
  @ApiResponse({
    status: 201,
    description: 'File registered and uploaded successfully.',
  })
  @Post('upload')
  async uploadFile(@Body() uploadDto: UploadFileDto) {
    const file = await this.storageService.uploadFile(uploadDto);
    return { success: true, data: file };
  }
}
