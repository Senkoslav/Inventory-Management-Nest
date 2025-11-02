import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

export class UpdateUserRolesDto {
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
