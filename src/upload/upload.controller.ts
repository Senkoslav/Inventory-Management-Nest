import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';
import { IsString } from 'class-validator';

class PresignRequestDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async getPresignedUrl(@Body() dto: PresignRequestDto) {
    return this.uploadService.getPresignedUploadUrl(dto.fileName, dto.contentType);
  }
}
