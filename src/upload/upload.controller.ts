import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';

class PresignRequestDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}

class DirectUploadDto {
  @IsString()
  fileName: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async getPresignedUrl(@Body() dto: PresignRequestDto) {
    return this.uploadService.getPresignedUploadUrl(dto.fileName, dto.contentType);
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('isPublic') isPublic?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const isPublicBool = isPublic === 'true' || isPublic === '1';
    return this.uploadService.uploadFile(file.buffer, file.originalname, isPublicBool);
  }

  @Get('file/:uuid')
  async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
    const fileBuffer = await this.uploadService.downloadFile(uuid, true);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="file"`,
    });
    res.send(fileBuffer);
  }

  @Get('status')
  getStatus() {
    return {
      configured: this.uploadService.isConfigured(),
      provider: 'Cassiopeia Database',
      maxFileSize: '15MB',
      message: this.uploadService.isConfigured()
        ? 'File storage is ready'
        : 'File storage not configured',
    };
  }

  @Post('cassiopeia/register')
  async registerCassiopeia(@Body() body: { email: string; password: string }) {
    return this.uploadService.registerCassiopeia(body.email, body.password);
  }

  @Post('cassiopeia/activate')
  async activateCassiopeia(
    @Body() body: { email: string; password: string; activationCode: string },
  ) {
    return this.uploadService.activateCassiopeia(
      body.email,
      body.password,
      body.activationCode,
    );
  }
}
