import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cassiopeia } from 'cassiopeia-starlighter';

@Injectable()
export class UploadService {
  private cassiopeia: Cassiopeia | null = null;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeCassiopeia();
  }

  private async initializeCassiopeia() {
    const email = this.configService.get('CASSIOPEIA_EMAIL');
    const password = this.configService.get('CASSIOPEIA_PASSWORD');

    if (email && password && email !== 'dummy') {
      try {
        this.cassiopeia = new Cassiopeia(email, password);
        await this.cassiopeia.updateTokens();
        this.isInitialized = true;
        console.log('✅ Cassiopeia file storage initialized');
      } catch (error) {
        console.warn('⚠️ Cassiopeia initialization failed:', error.message);
        this.cassiopeia = null;
      }
    } else {
      console.log('ℹ️ Cassiopeia not configured');
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, isPublic: boolean = true) {
    if (!this.cassiopeia || !this.isInitialized) {
      throw new BadRequestException(
        'File storage not configured. Set CASSIOPEIA_EMAIL and CASSIOPEIA_PASSWORD.',
      );
    }

    try {
      const response: any = await this.cassiopeia.upload(fileBuffer, fileName, isPublic);
      
      if (response instanceof Error) {
        throw response;
      }

      return {
        uuid: response.uuid,
        fileName: response.filename,
        size: response.size,
        isPublic: response.isPublic,
        fileUrl: isPublic
          ? `https://cassiopeia-db.com/public/${response.uuid}`
          : `https://cassiopeia-db.com/files/${response.uuid}`,
        createdAt: response.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async downloadFile(uuid: string, isPublic: boolean = true): Promise<Buffer> {
    if (!this.cassiopeia || !this.isInitialized) {
      throw new BadRequestException('File storage not configured.');
    }

    try {
      let result: any;
      if (isPublic) {
        result = await this.cassiopeia.downloadPublic(uuid);
      } else {
        result = await this.cassiopeia.download(uuid);
      }

      if (result instanceof Error) {
        throw result;
      }

      return result as Buffer;
    } catch (error) {
      throw new BadRequestException(`Download failed: ${error.message}`);
    }
  }

  async getPresignedUploadUrl(fileName: string, contentType: string) {
    if (!this.cassiopeia || !this.isInitialized) {
      return {
        uploadUrl: 'not-configured',
        fileUrl: 'not-configured',
        key: 'not-configured',
        message: 'File storage not configured. Set CASSIOPEIA_EMAIL and CASSIOPEIA_PASSWORD.',
      };
    }

    return {
      uploadUrl: 'use-direct-upload',
      fileUrl: 'generated-after-upload',
      key: fileName,
      message: 'Use POST /upload/file endpoint for direct upload',
    };
  }

  isConfigured(): boolean {
    return this.isInitialized && this.cassiopeia !== null;
  }

  async registerCassiopeia(email: string, password: string) {
    try {
      const cassiopeia = new Cassiopeia(email, password);
      await cassiopeia.register();
      return {
        success: true,
        message: 'Registration successful! Check your email for activation code.',
        email,
      };
    } catch (error) {
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  async activateCassiopeia(email: string, password: string, activationCode: string) {
    try {
      const cassiopeia = new Cassiopeia(email, password);
      await cassiopeia.activate(activationCode);

      // After activation, initialize the service
      this.cassiopeia = cassiopeia;
      await this.cassiopeia.updateTokens();
      this.isInitialized = true;

      return {
        success: true,
        message: 'Account activated successfully! Cassiopeia is now ready to use.',
        email,
        configured: true,
      };
    } catch (error) {
      throw new BadRequestException(`Activation failed: ${error.message}`);
    }
  }
}
