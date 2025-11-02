import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '@prisma/client';
import { CreateInventoryDto, UpdateInventoryDto, InventoryQueryDto } from './dto/inventory.dto';
import { CreateFieldDto, UpdateFieldDto } from './dto/field.dto';
import { CreateItemDto, UpdateItemDto, ItemQueryDto } from './dto/item.dto';
import { AddAccessDto } from './dto/access.dto';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Public()
  @Get()
  findAll(@Query() query: InventoryQueryDto, @CurrentUser() user?: User) {
    return this.inventoriesService.findAll(query, user);
  }

  @Public()
  @Get('latest')
  findLatest(@Query('limit') limit?: number) {
    return this.inventoriesService.findLatest(limit);
  }

  @Public()
  @Get('top')
  findTop(@Query('limit') limit?: number) {
    return this.inventoriesService.findTop(limit);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.inventoriesService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateInventoryDto, @CurrentUser() user: User) {
    return this.inventoriesService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.inventoriesService.remove(id, user);
  }

  
  @Public()
  @Get(':id/fields')
  getFields(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.inventoriesService.getFields(id, user);
  }

  @Post(':id/fields')
  addField(
    @Param('id') id: string,
    @Body() dto: CreateFieldDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.addField(id, dto, user);
  }

  @Patch(':id/fields/:fieldId')
  updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFieldDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.updateField(id, fieldId, dto, user);
  }

  @Delete(':id/fields/:fieldId')
  removeField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.removeField(id, fieldId, user);
  }

  
  @Get(':id/access')
  getAccess(@Param('id') id: string, @CurrentUser() user: User) {
    return this.inventoriesService.getAccess(id, user);
  }

  @Post(':id/access')
  addAccess(
    @Param('id') id: string,
    @Body() dto: AddAccessDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.addAccess(id, dto, user);
  }

  @Delete(':id/access/:userId')
  removeAccess(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.removeAccess(id, userId, user);
  }

  
  @Public()
  @Get(':id/items')
  getItems(
    @Param('id') id: string,
    @Query() query: ItemQueryDto,
    @CurrentUser() user?: User,
  ) {
    return this.inventoriesService.getItems(id, query, user);
  }

  @Public()
  @Get(':id/items/:itemId')
  getItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: User,
  ) {
    return this.inventoriesService.getItem(id, itemId, user);
  }

  @Post(':id/items')
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.createItem(id, dto, user);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.updateItem(id, itemId, dto, user);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.removeItem(id, itemId, user);
  }

  @Post(':id/items/:itemId/like')
  toggleLike(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoriesService.toggleLike(id, itemId, user);
  }

  @Public()
  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.inventoriesService.getStats(id, user);
  }
}
