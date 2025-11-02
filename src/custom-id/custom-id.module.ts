import { Module } from '@nestjs/common';
import { CustomIdService } from './custom-id.service';

@Module({
  providers: [CustomIdService],
  exports: [CustomIdService],
})
export class CustomIdModule {}
