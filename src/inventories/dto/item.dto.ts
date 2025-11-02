import { IsString, IsOptional, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemFieldValueDto {
  @IsOptional()
  @IsString()
  fieldDefinitionId?: string;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  valueNumber?: number;

  @IsOptional()
  valueBool?: boolean;

  @IsOptional()
  @IsString()
  valueLink?: string;
}

export class CreateItemDto {
  @IsOptional()
  @IsString()
  customId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemFieldValueDto)
  fieldValues: ItemFieldValueDto[];
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  customId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemFieldValueDto)
  fieldValues?: ItemFieldValueDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ItemQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
