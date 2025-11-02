import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { FieldType } from '@prisma/client';

export class CreateFieldDto {
  @IsEnum(FieldType)
  type: FieldType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  showInTable?: boolean;

  @IsOptional()
  @IsObject()
  constraints?: any;
}

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  showInTable?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsObject()
  constraints?: any;
}
