import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionGateway } from './discussion.gateway';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '@prisma/client';
import { CreateDiscussionPostDto } from './dto/discussion.dto';

@Controller('inventories/:inventoryId/discussion')
export class DiscussionController {
  constructor(
    private readonly discussionService: DiscussionService,
    private readonly discussionGateway: DiscussionGateway,
  ) {}

  @Public()
  @Get()
  getPosts(@Param('inventoryId') inventoryId: string) {
    return this.discussionService.getPosts(inventoryId);
  }

  @Post()
  async createPost(
    @Param('inventoryId') inventoryId: string,
    @Body() dto: CreateDiscussionPostDto,
    @CurrentUser() user: User,
  ) {
    const post = await this.discussionService.createPost(inventoryId, dto, user);
    this.discussionGateway.broadcastNewPost(inventoryId, post);
    return post;
  }
}
