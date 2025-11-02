import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  provider: string;
}

export class TokenResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    roles: string[];
  };
}
