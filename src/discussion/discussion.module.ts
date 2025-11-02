import { Module } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionGateway } from './discussion.gateway';

@Module({
  controllers: [DiscussionController],
  providers: [DiscussionService, DiscussionGateway],
})
export class DiscussionModule {}
