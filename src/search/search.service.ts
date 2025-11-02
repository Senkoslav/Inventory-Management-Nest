import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, limit: number = 20) {
    if (!query || query.trim().length === 0) {
      return { inventories: [], items: [] };
    }

    const searchTerm = query.trim();

    const [inventories, items] = await Promise.all([
      this.prisma.inventory.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.item.findMany({
        where: {
          inventory: { isPublic: true },
          OR: [
            { customId: { contains: searchTerm, mode: 'insensitive' } },
            {
              fieldValues: {
                some: {
                  valueText: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        take: limit,
        include: {
          inventory: {
            select: {
              id: true,
              title: true,
            },
          },
          createdBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { inventories, items };
  }

  async getTags(prefix?: string, limit: number = 10) {
    const where = prefix
      ? {
          name: {
            startsWith: prefix,
            mode: 'insensitive' as const,
          },
        }
      : {};

    return this.prisma.tag.findMany({
      where,
      take: limit,
      orderBy: {
        inventories: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            inventories: true,
          },
        },
      },
    });
  }
}
