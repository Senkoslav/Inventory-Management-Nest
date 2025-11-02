import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateDiscussionPostDto } from './dto/discussion.dto';

@Injectable()
export class DiscussionService {
  constructor(private prisma: PrismaService) {}

  async getPosts(inventoryId: string) {
    return this.prisma.discussionPost.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createPost(inventoryId: string, dto: CreateDiscussionPostDto, user: User) {
    const post = await this.prisma.discussionPost.create({
      data: {
        inventoryId,
        authorId: user.id,
        markdownText: dto.markdownText,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return post;
  }
}
