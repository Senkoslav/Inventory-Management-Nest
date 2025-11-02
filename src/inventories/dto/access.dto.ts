import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AddAccessDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsBoolean()
  canWrite?: boolean;
}

export class UpdateAccessDto {
  @IsBoolean()
  canWrite: boolean;
}
