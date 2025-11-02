import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, FieldType } from '@prisma/client';
import { CreateInventoryDto, UpdateInventoryDto, InventoryQueryDto } from './dto/inventory.dto';
import { CreateFieldDto, UpdateFieldDto } from './dto/field.dto';
import { CreateItemDto, UpdateItemDto, ItemQueryDto } from './dto/item.dto';
import { AddAccessDto } from './dto/access.dto';
import { CustomIdService, CustomIdTemplate } from '../custom-id/custom-id.service';

@Injectable()
export class InventoriesService {
  constructor(
    private prisma: PrismaService,
    private customIdService: CustomIdService,
  ) {}

  async findAll(query: InventoryQueryDto, user?: User) {
    const { q, category, tags, page = 1, limit = 20, sort } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { isPublic: true },
        user ? { ownerId: user.id } : undefined,
        user ? { access: { some: { userId: user.id } } } : undefined,
      ].filter(Boolean),
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    
    // Note: Prisma doesn't support ordering by relation count directly in orderBy
    // For 'popular' sort, we'll fetch all and sort in memory, or use a different approach
    if (sort === 'name') {
      orderBy = { title: 'asc' };
    }

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip: sort === 'popular' ? undefined : skip,
        take: sort === 'popular' ? undefined : limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    // If sorting by popular, sort in memory and paginate
    if (sort === 'popular') {
      const sorted = inventories.sort((a, b) => b._count.items - a._count.items);
      return {
        data: sorted.slice(skip, skip + limit),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return {
      data: inventories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findLatest(limit: number = 10) {
    return this.prisma.inventory.findMany({
      where: { isPublic: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async findTop(limit: number = 5) {
    return this.prisma.inventory.findMany({
      where: { isPublic: true },
      take: limit,
      orderBy: { items: { _count: 'desc' } },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async findOne(id: string, user?: User) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        fields: { orderBy: { position: 'asc' } },
        tags: { include: { tag: true } },
        access: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { items: true } },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    await this.checkAccess(inventory, user, false);

    return inventory;
  }

  async create(dto: CreateInventoryDto, user: User) {
    const { tags, ...data } = dto;

    const inventory = await this.prisma.inventory.create({
      data: {
        ...data,
        ownerId: user.id,
        tags: tags
          ? {
              create: await Promise.all(
                tags.map(async (tagName) => {
                  let tag = await this.prisma.tag.findUnique({
                    where: { name: tagName },
                  });
                  if (!tag) {
                    tag = await this.prisma.tag.create({
                      data: { name: tagName },
                    });
                  }
                  return { tagId: tag.id };
                }),
              ),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return inventory;
  }

  async update(id: string, dto: UpdateInventoryDto, user: User) {
    const inventory = await this.findOne(id, user);
    await this.checkAccess(inventory, user, true);

    if (dto.version && inventory.version !== dto.version) {
      throw new ConflictException({
        message: 'Version conflict',
        currentVersion: inventory.version,
      });
    }

    const { tags, version, ...data } = dto;

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
        tags: tags
          ? {
              deleteMany: {},
              create: await Promise.all(
                tags.map(async (tagName) => {
                  let tag = await this.prisma.tag.findUnique({
                    where: { name: tagName },
                  });
                  if (!tag) {
                    tag = await this.prisma.tag.create({
                      data: { name: tagName },
                    });
                  }
                  return { tagId: tag.id };
                }),
              ),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return updated;
  }

  async remove(id: string, user: User) {
    const inventory = await this.findOne(id, user);
    await this.checkAccess(inventory, user, true);

    await this.prisma.inventory.delete({ where: { id } });
    return { message: 'Inventory deleted successfully' };
  }

  // Fields
  async getFields(inventoryId: string, user?: User) {
    const inventory = await this.findOne(inventoryId, user);
    return inventory.fields;
  }

  async addField(inventoryId: string, dto: CreateFieldDto, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkAccess(inventory, user, true);

    const fieldCount = await this.prisma.fieldDefinition.count({
      where: { inventoryId, type: dto.type },
    });

    const limits: Record<FieldType, number> = {
      SINGLELINE: 3,
      MULTILINE: 3,
      NUMBER: 3,
      DOCUMENT: 3,
      BOOL: 3,
    };

    if (fieldCount >= limits[dto.type]) {
      throw new BadRequestException(
        `Maximum ${limits[dto.type]} fields of type ${dto.type} allowed`,
      );
    }

    const maxPosition = await this.prisma.fieldDefinition.findFirst({
      where: { inventoryId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const field = await this.prisma.fieldDefinition.create({
      data: {
        ...dto,
        inventoryId,
        position: (maxPosition?.position || 0) + 1,
      },
    });

    return field;
  }

  async updateField(
    inventoryId: string,
    fieldId: string,
    dto: UpdateFieldDto,
    user: User,
  ) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkAccess(inventory, user, true);

    const field = await this.prisma.fieldDefinition.findFirst({
      where: { id: fieldId, inventoryId },
    });

    if (!field) {
      throw new NotFoundException('Field not found');
    }

    return this.prisma.fieldDefinition.update({
      where: { id: fieldId },
      data: dto,
    });
  }

  async removeField(inventoryId: string, fieldId: string, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkAccess(inventory, user, true);

    await this.prisma.fieldDefinition.delete({ where: { id: fieldId } });
    return { message: 'Field deleted successfully' };
  }

  // Access
  async getAccess(inventoryId: string, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    if (inventory.ownerId !== user.id && !user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only owner can view access list');
    }
    return inventory.access;
  }

  async addAccess(inventoryId: string, dto: AddAccessDto, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkAccess(inventory, user, true);

    const existing = await this.prisma.inventoryAccess.findUnique({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User already has access');
    }

    return this.prisma.inventoryAccess.create({
      data: {
        inventoryId,
        userId: dto.userId,
        canWrite: dto.canWrite || false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeAccess(inventoryId: string, userId: string, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkAccess(inventory, user, true);

    await this.prisma.inventoryAccess.delete({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId,
        },
      },
    });

    return { message: 'Access removed successfully' };
  }

  
  async getItems(inventoryId: string, query: ItemQueryDto, user?: User) {
    await this.findOne(inventoryId, user);

    const { q, page = 1, limit = 50, sortBy, sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { inventoryId };

    if (q) {
      where.OR = [
        { customId: { contains: q, mode: 'insensitive' } },
        { fieldValues: { some: { valueText: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy) {
      orderBy = { [sortBy]: sortOrder };
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true } },
          fieldValues: {
            include: {
              fieldDefinition: true,
            },
            where: {
              fieldDefinition: {
                showInTable: true,
              },
            },
          },
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getItem(inventoryId: string, itemId: string, user?: User) {
    await this.findOne(inventoryId, user);

    const item = await this.prisma.item.findFirst({
      where: { id: itemId, inventoryId },
      include: {
        createdBy: { select: { id: true, name: true } },
        fieldValues: {
          include: {
            fieldDefinition: true,
          },
        },
        _count: { select: { likes: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async createItem(inventoryId: string, dto: CreateItemDto, user: User) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        customIdSequence: true,
        access: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    await this.checkWriteAccess(inventory, user);

    let customId = dto.customId;

    if (!customId && inventory.customIdSequence) {
      const template = inventory.customIdSequence.template as unknown as CustomIdTemplate;
      customId = await this.customIdService.generateCustomId(inventoryId, template);
    }

    if (!customId) {
      customId = `ITEM-${Date.now()}`;
    }

    try {
      const item = await this.prisma.item.create({
        data: {
          inventoryId,
          customId,
          createdById: user.id,
          fieldValues: {
            create: dto.fieldValues,
          },
        },
        include: {
          fieldValues: {
            include: {
              fieldDefinition: true,
            },
          },
        },
      });

      return item;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          message: 'Custom ID already exists',
          customId,
        });
      }
      throw error;
    }
  }

  async updateItem(
    inventoryId: string,
    itemId: string,
    dto: UpdateItemDto,
    user: User,
  ) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkWriteAccess(inventory, user);

    const item = await this.prisma.item.findFirst({
      where: { id: itemId, inventoryId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (dto.version && item.version !== dto.version) {
      throw new ConflictException({
        message: 'Version conflict',
        currentVersion: item.version,
      });
    }

    const { fieldValues, version, ...data } = dto;

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        ...data,
        version: { increment: 1 },
        fieldValues: fieldValues
          ? {
              deleteMany: {},
              create: fieldValues,
            }
          : undefined,
      },
      include: {
        fieldValues: {
          include: {
            fieldDefinition: true,
          },
        },
      },
    });

    return updated;
  }

  async removeItem(inventoryId: string, itemId: string, user: User) {
    const inventory = await this.findOne(inventoryId, user);
    await this.checkWriteAccess(inventory, user);

    await this.prisma.item.delete({ where: { id: itemId } });
    return { message: 'Item deleted successfully' };
  }

  async toggleLike(inventoryId: string, itemId: string, user: User) {
    await this.findOne(inventoryId, user);

    const existing = await this.prisma.like.findUnique({
      where: {
        itemId_userId: {
          itemId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    } else {
      await this.prisma.like.create({
        data: {
          itemId,
          userId: user.id,
        },
      });
      return { liked: true };
    }
  }

  async getStats(inventoryId: string, user?: User) {
    await this.findOne(inventoryId, user);

    const itemCount = await this.prisma.item.count({
      where: { inventoryId },
    });

    const fields = await this.prisma.fieldDefinition.findMany({
      where: { inventoryId, type: 'NUMBER' },
    });

    const stats: any = { itemCount, fields: {} };

    for (const field of fields) {
      const aggregates = await this.prisma.itemFieldValue.aggregate({
        where: {
          fieldDefinitionId: field.id,
          valueNumber: { not: null },
        },
        _avg: { valueNumber: true },
        _min: { valueNumber: true },
        _max: { valueNumber: true },
      });

      stats.fields[field.id] = {
        name: field.title,
        avg: aggregates._avg.valueNumber,
        min: aggregates._min.valueNumber,
        max: aggregates._max.valueNumber,
      };
    }

    return stats;
  }

  private async checkAccess(inventory: any, user: User | undefined, requireWrite: boolean) {
    if (!user) {
      if (!inventory.isPublic) {
        throw new ForbiddenException('This inventory is private');
      }
      if (requireWrite) {
        throw new ForbiddenException('Authentication required');
      }
      return;
    }

    if (user.roles.includes(UserRole.ADMIN) || inventory.ownerId === user.id) {
      return;
    }

    if (!inventory.isPublic) {
      const access = inventory.access?.find((a: any) => a.userId === user.id);
      if (!access) {
        throw new ForbiddenException('Access denied');
      }
      if (requireWrite && !access.canWrite) {
        throw new ForbiddenException('Write access required');
      }
    } else if (requireWrite) {
      const access = inventory.access?.find((a: any) => a.userId === user.id);
      if (!access?.canWrite) {
        throw new ForbiddenException('Write access required');
      }
    }
  }

  private async checkWriteAccess(inventory: any, user: User) {
    if (user.roles.includes(UserRole.ADMIN) || inventory.ownerId === user.id) {
      return;
    }

    const access = inventory.access?.find((a: any) => a.userId === user.id);
    if (!access?.canWrite && !inventory.isPublic) {
      throw new ForbiddenException('Write access required');
    }
  }
}
