import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      endpoint: this.configService.get('AWS_S3_ENDPOINT'),
      s3ForcePathStyle: this.configService.get('S3_USE_PATH_STYLE') === 'true',
    });
    this.bucket = this.configService.get('AWS_S3_BUCKET') || 'inventory-files';
  }

  async getPresignedUploadUrl(fileName: string, contentType: string) {
    const key = `${uuidv4()}-${fileName}`;
    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Expires: 3600,
    };

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `${this.configService.get('AWS_S3_ENDPOINT')}/${this.bucket}/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }
}
